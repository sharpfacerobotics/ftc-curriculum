import React, {useEffect, useMemo, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import * as Blockly from 'blockly/core';
import * as libraryBlocks from 'blockly/blocks';
import * as En from 'blockly/msg/en';
import {registerTelemarkBlocks, toolboxForUnit} from '@site/src/telemark/blocks/blockDefinitions';
import {blockLessonConfig} from '@site/src/telemark/blocks/blockChallenges';
import {runBlockProgram, type BlockRunResult} from '@site/src/telemark/blocks/blockInterpreter';
import {getBlocksLessonsForUnit} from '@site/src/telemark/blocksCurriculum';
import {useAuth} from '@site/src/telemark/useAuth';
import {useProgress} from '@site/src/telemark/useProgress';
import {trackEvent} from '@site/src/telemark/analytics';
import styles from './BlockPractice.module.css';

interface BlockPracticeProps {
  lessonId: string;
}

interface WorkspaceFile {
  format: 'telemark-block-workspace';
  version: 1;
  lessonId: string;
  workspace: Record<string, unknown>;
}

const initialized = {blocks: false};

function storageKey(lessonId: string): string {
  return `telemark:blocks:workspace:v1:${lessonId}`;
}

function readWorkspace(lessonId: string): Record<string, unknown> | null {
  try {
    const raw = window.localStorage.getItem(storageKey(lessonId));
    return raw ? JSON.parse(raw) as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function saveWorkspace(lessonId: string, workspace: Blockly.WorkspaceSvg): void {
  try {
    const state = Blockly.serialization.workspaces.save(workspace);
    window.localStorage.setItem(storageKey(lessonId), JSON.stringify(state));
  } catch (error) {
    console.warn('Telemark could not save this block workspace:', error);
  }
}

export default function BlockPractice({lessonId}: BlockPracticeProps): React.JSX.Element {
  const config = useMemo(() => blockLessonConfig(lessonId), [lessonId]);
  const hostRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<BlockRunResult | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {user} = useAuth();
  const {isComplete, markManyComplete, markSkipped} = useProgress(user);
  const recorded = isComplete(lessonId);
  const checks = config.checks.map((check) => ({
    label: check.label,
    passed: result ? check.test(result) : false,
  }));
  const allPassed = config.challenge && result !== null && result.error === null
    && checks.every((check) => check.passed);

  useEffect(() => {
    if (!hostRef.current) return undefined;
    const localeModule = En as unknown as {default?: Record<string, string>} & Record<string, string>;
    Blockly.setLocale(localeModule.default ?? localeModule);
    if (!initialized.blocks) {
      Blockly.common.defineBlocks(libraryBlocks);
      registerTelemarkBlocks();
      initialized.blocks = true;
    }
    const workspace = Blockly.inject(hostRef.current, {
      toolbox: toolboxForUnit(config.toolboxUnit),
      trashcan: true,
      sounds: false,
      zoom: {controls: true, wheel: true, startScale: 0.9, minScale: 0.55, maxScale: 1.4},
      move: {scrollbars: true, drag: true, wheel: true},
      renderer: 'zelos',
    });
    workspaceRef.current = workspace;
    Blockly.serialization.workspaces.load(readWorkspace(lessonId) ?? config.starter, workspace);
    const onChange = (event: Blockly.Events.Abstract) => {
      if (event.isUiEvent) return;
      saveWorkspace(lessonId, workspace);
      setResult(null);
      setStepIndex(-1);
    };
    workspace.addChangeListener(onChange);
    const resize = () => Blockly.svgResize(workspace);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      workspace.removeChangeListener(onChange);
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, [config, lessonId]);

  function run(): BlockRunResult | null {
    const workspace = workspaceRef.current;
    if (!workspace) return null;
    workspace.highlightBlock(null);
    const next = runBlockProgram(workspace);
    setResult(next);
    // Run shows the finished program state. Step uses snapshots separately.
    // Pointing Run at the last pre-operation snapshot hid output produced by
    // the final print block even though the interpreter had recorded it.
    setStepIndex(-1);
    const finalStep = next.steps[next.steps.length - 1];
    if (finalStep) workspace.highlightBlock(finalStep.blockId);
    setMessage(next.error ?? `Program finished after ${next.operations} steps.`);
    return next;
  }

  function step() {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const next = result ?? runBlockProgram(workspace);
    if (!result) setResult(next);
    if (!next || next.steps.length === 0) return;
    const target = result ? Math.min(stepIndex + 1, next.steps.length - 1) : 0;
    setStepIndex(target);
    workspaceRef.current?.highlightBlock(next.steps[target].blockId);
    setMessage(`Showing step ${target + 1} of ${next.steps.length}.`);
  }

  function reset() {
    const workspace = workspaceRef.current;
    if (!workspace || !window.confirm('Reset this workspace to the lesson starter blocks?')) return;
    workspace.clear();
    Blockly.serialization.workspaces.load(config.starter, workspace);
    window.localStorage.removeItem(storageKey(lessonId));
    saveWorkspace(lessonId, workspace);
    setResult(null);
    setStepIndex(-1);
    setMessage('Workspace reset.');
  }

  function download() {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const payload: WorkspaceFile = {
      format: 'telemark-block-workspace',
      version: 1,
      lessonId,
      workspace: Blockly.serialization.workspaces.save(workspace),
    };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lessonId.replace('/', '-')}-blocks.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Workspace file downloaded.');
  }

  async function importWorkspace(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !workspaceRef.current) return;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<WorkspaceFile>;
      if (parsed.format !== 'telemark-block-workspace' || parsed.version !== 1 || !parsed.workspace) {
        throw new Error('That file is not a Telemark block workspace.');
      }
      if (workspaceRef.current.getAllBlocks(false).length > 0
        && !window.confirm('Replace the blocks currently in this workspace?')) return;
      workspaceRef.current.clear();
      Blockly.serialization.workspaces.load(parsed.workspace, workspaceRef.current);
      saveWorkspace(lessonId, workspaceRef.current);
      setResult(null);
      setMessage(parsed.lessonId === lessonId
        ? 'Workspace imported.'
        : 'Workspace imported from a different lesson. Check each block before running it.');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Could not import that workspace.');
    }
  }

  async function recordChallenge() {
    if (!allPassed) return;
    setSaving(true);
    try {
      const lessonIds = getBlocksLessonsForUnit(lessonId.split('/')[0]).map((lesson) => lesson.id);
      await markManyComplete(lessonIds);
      trackEvent('blocks_challenge_pass', {lesson_id: lessonId, unit: config.unit});
      setMessage('Unit progress recorded.');
    } finally {
      setSaving(false);
    }
  }

  async function skipChallenge() {
    setSaving(true);
    try {
      await markSkipped(lessonId);
      trackEvent('blocks_challenge_skip', {lesson_id: lessonId, unit: config.unit});
      setMessage('Challenge marked as skipped. You can return at any time.');
    } finally {
      setSaving(false);
    }
  }

  const shown = result && stepIndex >= 0 ? result.steps[stepIndex] : null;
  const displayOutput = shown?.output ?? result?.output ?? [];
  const displayVariables = shown?.variables ?? result?.variables ?? {};
  const displayScene = shown?.scene ?? result?.scene ?? {x: 0, y: 0, direction: 0, moves: 0};

  return (
    <section className={styles.practice} aria-label="Block coding practice">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{config.challenge ? 'Checked coding challenge' : 'Guided practice'}</p>
          <h2>Build and run</h2>
          <p>{config.goal}</p>
          <ul className={styles.objectives}>
            {config.objectives.map((objective) => <li key={objective}>{objective}</li>)}
          </ul>
        </div>
        <button type="button" className={styles.utility} onClick={() => void shellRef.current?.requestFullscreen()}>Fullscreen</button>
      </div>

      <div className={styles.shell} ref={shellRef}>
        <div className={styles.toolbar}>
          <button type="button" className={styles.run} onClick={() => run()}>Run</button>
          <button type="button" className={styles.utility} onClick={step}>Step</button>
          <button type="button" className={styles.utility} onClick={() => workspaceRef.current?.highlightBlock(null)}>Clear highlight</button>
          <button type="button" className={styles.utility} onClick={reset}>Reset</button>
          <button type="button" className={styles.utility} onClick={download}>Download</button>
          <button type="button" className={styles.utility} onClick={() => importRef.current?.click()}>Import</button>
          <input ref={importRef} type="file" accept="application/json,.json" onChange={(event) => void importWorkspace(event)} hidden />
        </div>
        <p className={styles.keyboard}>Keyboard: Tab to the workspace, arrow keys to move, T for the toolbox, and Enter or Space to edit.</p>
        <div className={styles.workspace} ref={hostRef} />
        <div className={styles.results}>
          <div className={styles.scene} role="img" aria-label={`Program position x ${displayScene.x}, y ${displayScene.y}, direction ${displayScene.direction}`}>
            <span className={styles.position}>x {displayScene.x} · y {displayScene.y}</span>
            <span className={styles.arrow} style={{transform: `rotate(${displayScene.direction * 90}deg)`}}>→</span>
            <span>{displayScene.moves} movement steps</span>
          </div>
          <div>
            <h3>Output</h3>
            <pre className={styles.output}>{displayOutput.length ? displayOutput.join('\n') : 'No output yet.'}</pre>
          </div>
          <div>
            <h3>Variables</h3>
            <pre className={styles.output}>{Object.keys(displayVariables).length ? JSON.stringify(displayVariables, null, 2) : 'No variables yet.'}</pre>
          </div>
        </div>
      </div>

      {config.challenge && (
        <div className={styles.checks}>
          <h3>Challenge checks</h3>
          {checks.map((check) => (
            <div key={check.label} className={check.passed ? styles.pass : styles.pending}>
              <span aria-hidden="true">{check.passed ? '✓' : '○'}</span> {check.label}
            </div>
          ))}
          <div className={styles.challengeActions}>
            <button type="button" className={styles.run} disabled={!allPassed || saving || recorded} onClick={() => void recordChallenge()}>
              {recorded ? 'Progress recorded' : saving ? 'Saving...' : 'Record unit complete'}
            </button>
            <button type="button" className={styles.utility} disabled={saving || recorded} onClick={() => void skipChallenge()}>Skip challenge</button>
            {recorded && (
              <Link className={styles.next} to={config.unit === 5 ? '/blocks/next-step' : `/blocks/blocks-unit-${String(config.unit + 1).padStart(2, '0')}`}>
                Continue
              </Link>
            )}
          </div>
        </div>
      )}

      <p className={result?.error ? styles.error : styles.status} role="status" aria-live="polite">
        {message ?? 'Your workspace saves automatically in this browser.'}
      </p>
    </section>
  );
}

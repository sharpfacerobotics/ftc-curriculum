/* Multi-file Java projects for the lightweight simulator editors. */
(function (global) {
  'use strict';
  const LIBRARY_KEY = 'telemark:java-library:v1';
  const TEAM_PACKAGE = 'org.firstinspires.ftc.teamcode';
  const validName = name => typeof name === 'string' && /^[\w$/.-]+\.java$/.test(name) && !name.split('/').includes('..');
  const packageName = source => (source.match(/^\s*package\s+([\w.]+)\s*;/m) || [null, ''])[1];
  const mainFilename = source => ((source.match(/\bpublic\s+(?:final\s+|abstract\s+)?class\s+(\w+)/) || source.match(/\bclass\s+(\w+)/) || [null, 'Main'])[1]) + '.java';
  function inTeamPackage(file) {
    const source = packageName(file.source)
      ? file.source.replace(/^\s*package\s+[\w.]+\s*;/m, 'package ' + TEAM_PACKAGE + ';')
      : 'package ' + TEAM_PACKAGE + ';\n\n' + file.source.replace(/^\s+/, '');
    return {name: file.name.split('/').pop(), source};
  }
  function readLibrary() {
    try { const data = JSON.parse(global.localStorage.getItem(LIBRARY_KEY)); return data && typeof data === 'object' && !Array.isArray(data) ? data : {}; } catch (_) { return {}; }
  }
  function validateFiles(files) {
    if (!Array.isArray(files) || !files.length || files.length > 40 || files.some(f => !f || !validName(f.name) || typeof f.source !== 'string') || JSON.stringify(files).length > 2000000) throw new Error('Choose up to 40 Java files, totaling at most 2 MB.');
    if (new Set(files.map(f => f.name)).size !== files.length) throw new Error('The import contains duplicate filenames.');
    return files.map(f => ({name: f.name, source: f.source}));
  }
  function normalizeProjectFiles(input) {
    const checked = validateFiles(input);
    const movedClasses = checked.map(file => {
      const oldPackage = packageName(file.source);
      const className = file.name.split('/').pop().slice(0, -5);
      return oldPackage && oldPackage !== TEAM_PACKAGE ? oldPackage + '.' + className : '';
    }).filter(Boolean);
    return validateFiles(checked.map(inTeamPackage).map(file => ({
      ...file,
      source: movedClasses.reduce((source, qualifiedName) => source.replace(new RegExp('^\\s*import\\s+' + qualifiedName.replace(/\./g, '\\.') + '\\s*;\\s*\\n?', 'm'), ''), file.source),
    })));
  }
  function attach(editor, refresh) {
    if (editor.__telemarkProject) return editor.__telemarkProject;
    const key = global.TelemarkEditor.draftKey(editor) + ':project';
    const mainName = mainFilename(editor.value);
    let files = normalizeProjectFiles([{name: mainName, source: editor.value}]);
    let active = 0;
    let entry = '';
    let lesson = null;
    let completed = [];
    try {
      const saved = JSON.parse(global.localStorage.getItem(key));
      if (saved) {
        files = normalizeProjectFiles(saved.files);
        entry = saved.entry || '';
        active = Number.isInteger(saved.active) ? Math.max(0, Math.min(saved.active, files.length - 1)) : 0;
      }
    } catch (_) {}
    const bar = document.createElement('div');
    bar.className = 'telemark-project';
    bar.setAttribute('aria-label', 'Java project files');
    editor.parentNode.parentNode.insertBefore(bar, editor.parentNode);
    const status = document.createElement('div');
    status.className = 'telemark-project-status';
    status.setAttribute('role', 'status');
    function report(message) { status.textContent = message; }
    function save() {
      files[active].source = editor.value;
      try {
        global.localStorage.setItem(key, JSON.stringify({files, active, entry}));
        if (lesson) {
          const library = readLibrary();
          library[lesson.id] = {lesson, files, entry, savedAt: Date.now()};
          global.localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
        }
      } catch (_) { report('Browser storage is full or unavailable. Export your project to keep a copy.'); }
    }
    function refreshEditorView() {
      if (global.TelemarkEditor?.clearDiagnostics) global.TelemarkEditor.clearDiagnostics(document);
      const highlighted = document.getElementById('highlighting-content');
      if (highlighted) {
        highlighted.textContent = editor.value + (editor.value.endsWith('\n') ? ' ' : '');
        if (global.Prism) global.Prism.highlightElement(highlighted);
      }
      const overlay = document.getElementById('highlighting');
      if (overlay) { overlay.scrollTop = editor.scrollTop; overlay.scrollLeft = editor.scrollLeft; }
      if (typeof refresh === 'function') refresh();
      editor.dispatchEvent(new Event('telemark:editor-view-change'));
    }
    function updateActiveChrome() {
      bar.querySelectorAll('.telemark-project-tab').forEach((button, index) => {
        button.setAttribute('aria-pressed', String(index === active));
        button.parentElement?.toggleAttribute('data-active', index === active);
      });
    }
    function show(rebuild) {
      editor.value = files[active].source;
      editor.selectionStart = editor.selectionEnd = 0;
      editor.scrollTop = editor.scrollLeft = 0;
      if (rebuild) render(); else updateActiveChrome();
      refreshEditorView();
    }
    function entries() {
      return files.flatMap(f => {
        const ast = global.TelemarkJava?.parse(f.source);
        return (ast?.classes || []).filter(c => ['OpMode', 'LinearOpMode'].includes(c.superClass)).map(c => ({name: (packageName(f.source) ? packageName(f.source) + '.' : '') + c.name, label: c.name}));
      });
    }
    function importFiles(incoming) {
      save();
      const added = normalizeProjectFiles(incoming);
      const duplicates = added.filter(f => files.some(existing => existing.name === f.name));
      if (duplicates.length) throw new Error('Already in this project: ' + duplicates.map(f => f.name).join(', ') + '. Rename or delete the existing file first.');
      files = validateFiles(files.concat(added));
      active = files.length - added.length;
      show(true); save();
      report('Imported ' + added.length + ' file(s) into ' + TEAM_PACKAGE + '.');
    }
    function chooseFiles(incoming, title) {
      const checked = normalizeProjectFiles(incoming);
      const dialog = document.createElement('dialog');
      dialog.className = 'telemark-project-dialog';
      dialog.setAttribute('aria-label', title);
      const heading = document.createElement('h3'); heading.textContent = title; dialog.appendChild(heading);
      const hint = document.createElement('p'); hint.textContent = 'Choose the files to add. Your current files will be kept. Import a mechanism or configuration class to reuse it in this lesson.'; dialog.appendChild(hint);
      const choices = checked.map(f => {
        const label = document.createElement('label');
        const input = document.createElement('input'); input.type = 'checkbox';
        input.checked = !/extends\s+(?:OpMode|LinearOpMode)\b/.test(f.source);
        label.appendChild(input); label.appendChild(document.createTextNode(f.name)); dialog.appendChild(label);
        return {file: f, input};
      });
      const preview = document.createElement('pre'); preview.textContent = checked[0].source; dialog.appendChild(preview);
      choices.forEach(c => c.input.addEventListener('change', () => { preview.textContent = c.file.source; }));
      const error = document.createElement('p'); error.setAttribute('role', 'alert'); dialog.appendChild(error);
      const add = document.createElement('button'); add.textContent = 'Import selected';
      add.addEventListener('click', () => { try { importFiles(choices.filter(c => c.input.checked).map(c => c.file)); dialog.remove(); } catch (e) { error.textContent = e.message; } });
      const cancel = document.createElement('button'); cancel.textContent = 'Cancel'; cancel.addEventListener('click', () => dialog.remove());
      dialog.appendChild(add); dialog.appendChild(cancel); document.body.appendChild(dialog);
      dialog.addEventListener('cancel', () => dialog.remove());
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    }
    function closeDialog(dialog) {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      dialog.remove();
    }
    function showDialog(dialog, initialFocus) {
      document.body.appendChild(dialog);
      dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
      if (initialFocus) initialFocus.focus();
    }
    function openRenameDialog(index) {
      const dialog = document.createElement('dialog'); dialog.className = 'telemark-project-dialog';
      dialog.setAttribute('aria-label', 'Rename file');
      const heading = document.createElement('h3'); heading.textContent = 'Rename ' + files[index].name; dialog.appendChild(heading);
      const hint = document.createElement('p'); hint.textContent = 'The filename must match its public class. Update the class name and any references in your code too.'; dialog.appendChild(hint);
      const label = document.createElement('label'); label.className = 'telemark-project-dialog-field'; label.textContent = 'Filename';
      const input = document.createElement('input'); input.value = files[index].name; input.autocomplete = 'off'; label.appendChild(input); dialog.appendChild(label);
      const error = document.createElement('p'); error.className = 'telemark-project-dialog-error'; error.setAttribute('role', 'alert'); dialog.appendChild(error);
      const buttons = document.createElement('div'); buttons.className = 'telemark-project-dialog-actions';
      const cancel = document.createElement('button'); cancel.textContent = 'Cancel'; cancel.className = 'telemark-project-dialog-cancel'; cancel.addEventListener('click', () => closeDialog(dialog));
      const apply = document.createElement('button'); apply.textContent = 'Rename'; apply.className = 'telemark-project-dialog-primary';
      apply.addEventListener('click', () => {
        const value = input.value.trim();
        if (!/^[A-Za-z_$][\w$]*\.java$/.test(value) || files.some((f, i) => i !== index && f.name === value)) { error.textContent = 'Enter a unique Java filename, such as Mechanism.java.'; return; }
        save(); files[index].name = value; active = index; closeDialog(dialog); show(true); save(); report('Renamed the file to ' + value + '.');
      });
      input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); apply.click(); } });
      buttons.appendChild(cancel); buttons.appendChild(apply); dialog.appendChild(buttons); showDialog(dialog, input); input.select();
    }
    function openDeleteDialog(index) {
      const filename = files[index].name;
      const dialog = document.createElement('dialog'); dialog.className = 'telemark-project-dialog telemark-project-confirm';
      dialog.setAttribute('aria-label', 'Delete ' + filename);
      const icon = document.createElement('span'); icon.className = 'telemark-project-dialog-icon telemark-project-dialog-icon-danger'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = '\u00d7'; dialog.appendChild(icon);
      const heading = document.createElement('h3'); heading.textContent = 'Delete ' + filename + '?'; dialog.appendChild(heading);
      const hint = document.createElement('p'); hint.textContent = 'This removes the file from this browser project. Export first if you may need the code later.'; dialog.appendChild(hint);
      const buttons = document.createElement('div'); buttons.className = 'telemark-project-dialog-actions';
      const cancel = document.createElement('button'); cancel.textContent = 'Cancel'; cancel.className = 'telemark-project-dialog-cancel'; cancel.addEventListener('click', () => closeDialog(dialog));
      const remove = document.createElement('button'); remove.textContent = 'Delete file'; remove.className = 'telemark-project-dialog-danger';
      remove.addEventListener('click', () => {
        save(); files.splice(index, 1);
        if (index < active) active -= 1;
        else if (index === active) active = Math.min(index, files.length - 1);
        try { if (entry && !entries().some(c => c.name === entry)) entry = ''; } catch (_) {}
        closeDialog(dialog); show(true); save(); report('Deleted ' + filename + '.');
      });
      buttons.appendChild(cancel); buttons.appendChild(remove); dialog.appendChild(buttons); showDialog(dialog, cancel);
    }
    function buildCompletedLessonSelect(dialog) {
      const items = Object.values(readLibrary()).filter(item => item?.lesson && completed.includes(item.lesson.id) && item.lesson.id !== lesson?.id).sort((a, b) => a.lesson.title.localeCompare(b.lesson.title, undefined, {numeric: true}));
      if (!items.length) return;
      const label = document.createElement('label'); label.className = 'telemark-project-dialog-field'; label.textContent = 'Completed lesson code';
      const select = document.createElement('select'); select.setAttribute('aria-label', 'Code from a completed lesson');
      const empty = document.createElement('option'); empty.value = ''; empty.textContent = 'Choose a completed lesson\u2026'; select.appendChild(empty);
      items.forEach(item => { const option = document.createElement('option'); option.value = item.lesson.id; option.textContent = item.lesson.title; select.appendChild(option); });
      select.addEventListener('change', () => {
        const item = readLibrary()[select.value];
        if (!item) return;
        closeDialog(dialog);
        try { chooseFiles(item.files, item.lesson.title); } catch (e) { report(e.message); }
      });
      label.appendChild(select); dialog.appendChild(label);
    }
    function openAddDialog(upload) {
      const dialog = document.createElement('dialog'); dialog.className = 'telemark-project-dialog telemark-project-add-dialog';
      dialog.setAttribute('aria-label', 'Add or import a Java file');
      const heading = document.createElement('h3'); heading.textContent = 'Add a Java file'; dialog.appendChild(heading);
      const hint = document.createElement('p'); hint.textContent = 'Every file uses the FTC TeamCode package. Classes in the same package are available by class name; each file still imports the SDK types it uses.'; dialog.appendChild(hint);
      const packageBadge = document.createElement('code'); packageBadge.className = 'telemark-project-package-badge'; packageBadge.textContent = 'package ' + TEAM_PACKAGE + ';'; dialog.appendChild(packageBadge);
      const label = document.createElement('label'); label.className = 'telemark-project-dialog-field'; label.textContent = 'New filename';
      const input = document.createElement('input'); input.placeholder = 'Mechanism.java'; input.autocomplete = 'off'; input.spellcheck = false; label.appendChild(input); dialog.appendChild(label);
      const error = document.createElement('p'); error.className = 'telemark-project-dialog-error'; error.setAttribute('role', 'alert'); dialog.appendChild(error);
      const buttons = document.createElement('div'); buttons.className = 'telemark-project-dialog-actions';
      const cancel = document.createElement('button'); cancel.textContent = 'Cancel'; cancel.className = 'telemark-project-dialog-cancel'; cancel.addEventListener('click', () => closeDialog(dialog));
      const create = document.createElement('button'); create.textContent = 'Create file'; create.className = 'telemark-project-dialog-primary';
      create.addEventListener('click', () => {
        if (files.length >= 40) { error.textContent = 'A project can contain at most 40 Java files.'; return; }
        const raw = input.value.trim();
        const filename = raw.endsWith('.java') ? raw : raw + '.java';
        if (!/^[A-Za-z_$][\w$]*\.java$/.test(filename) || files.some(f => f.name === filename)) { error.textContent = 'Enter a unique Java class filename, such as Mechanism.java.'; return; }
        save(); files.push(inTeamPackage({name: filename, source: 'public class ' + filename.slice(0, -5) + ' {\n\n}\n'})); active = files.length - 1;
        closeDialog(dialog); show(true); save(); report('Created ' + filename + ' in ' + TEAM_PACKAGE + '.');
      });
      input.addEventListener('input', () => { error.textContent = ''; });
      input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); create.click(); } });
      buttons.appendChild(cancel); buttons.appendChild(create); dialog.appendChild(buttons);
      const divider = document.createElement('div'); divider.className = 'telemark-project-dialog-divider'; divider.textContent = 'or reuse code'; dialog.appendChild(divider);
      const reuse = document.createElement('div'); reuse.className = 'telemark-project-dialog-reuse';
      const importButton = document.createElement('button'); importButton.textContent = 'Import .java or project'; importButton.className = 'telemark-project-dialog-secondary'; importButton.addEventListener('click', () => { closeDialog(dialog); upload.click(); }); reuse.appendChild(importButton);
      const rename = document.createElement('button'); rename.textContent = 'Rename current file'; rename.className = 'telemark-project-dialog-secondary'; rename.addEventListener('click', () => { const current = active; closeDialog(dialog); openRenameDialog(current); }); reuse.appendChild(rename);
      dialog.appendChild(reuse); buildCompletedLessonSelect(dialog); showDialog(dialog, input);
    }
    function render() {
      bar.textContent = '';
      const upload = document.createElement('input'); upload.type = 'file'; upload.multiple = true; upload.accept = '.java,.json'; upload.hidden = true;
      upload.addEventListener('change', async () => {
        try {
          const selected = Array.from(upload.files || []);
          if (selected.reduce((sum, f) => sum + f.size, 0) > 2000000) throw new Error('Choose files totaling at most 2 MB.');
          const incoming = [];
          for (const file of selected) {
            const source = await file.text();
            if (file.name.endsWith('.json')) {
              const data = JSON.parse(source);
              if (data.format !== 'telemark-java-project' || data.version !== 1) throw new Error('Choose a Telemark Java project export or .java files.');
              incoming.push(...validateFiles(data.files));
            } else incoming.push({name: file.name, source});
          }
          if (incoming.length) chooseFiles(incoming, 'Import Java files');
        } catch (error) { report(error.message); }
        upload.value = '';
      });
      bar.appendChild(upload);

      const tabs = document.createElement('div'); tabs.className = 'telemark-project-tabs'; tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Open files'); bar.appendChild(tabs);
      files.forEach((file, index) => {
        const shell = document.createElement('div'); shell.className = 'telemark-project-tab-shell'; shell.toggleAttribute('data-active', index === active);
        const button = document.createElement('button'); button.type = 'button'; button.textContent = file.name; button.setAttribute('aria-pressed', String(index === active)); button.className = 'telemark-project-tab'; button.title = file.name + ' (double-click to rename)';
        button.addEventListener('click', () => { if (index === active) return; save(); active = index; show(false); save(); });
        button.addEventListener('dblclick', () => openRenameDialog(index));
        shell.appendChild(button);
        if (files.length > 1) {
          const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'telemark-project-tab-delete'; remove.textContent = '\u00d7'; remove.title = 'Delete ' + file.name; remove.setAttribute('aria-label', 'Delete ' + file.name);
          remove.addEventListener('click', event => { event.stopPropagation(); openDeleteDialog(index); }); shell.appendChild(remove);
        }
        tabs.appendChild(shell);
      });
      const newZone = document.createElement('div'); newZone.className = 'telemark-project-new-zone'; newZone.title = 'Add or import a Java file';
      const add = document.createElement('button'); add.type = 'button'; add.className = 'telemark-project-new'; add.textContent = '+'; add.setAttribute('aria-label', 'Add or import a Java file'); add.addEventListener('click', () => openAddDialog(upload)); newZone.appendChild(add); tabs.appendChild(newZone);

      const utility = document.createElement('div'); utility.className = 'telemark-project-utility'; bar.appendChild(utility);
      try {
        const runnable = entries();
        if (runnable.length > 1) {
          const select = document.createElement('select'); select.setAttribute('aria-label', 'OpMode to run');
          runnable.forEach(c => { const option = document.createElement('option'); option.value = c.name; option.textContent = 'Run: ' + c.label; select.appendChild(option); });
          if (entry) select.value = entry;
          select.addEventListener('change', () => { entry = select.value; save(); if (typeof refresh === 'function') refresh(); }); utility.appendChild(select);
        }
      } catch (_) { /* Incomplete source remains editable. */ }
      const download = document.createElement('button'); download.type = 'button'; download.textContent = 'Export'; download.className = 'telemark-project-tool';
      download.addEventListener('click', () => {
        save();
        const url = URL.createObjectURL(new Blob([JSON.stringify({format: 'telemark-java-project', version: 1, files, entry}, null, 2)], {type: 'application/json'}));
        const link = document.createElement('a'); link.href = url; link.download = 'telemark-project.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      utility.appendChild(download);
      const note = document.createElement('p'); note.className = 'telemark-project-note'; note.textContent = 'Saved on this browser \u00b7 No sign-in needed. Export to move code to another device.'; bar.appendChild(note);
      bar.appendChild(status);
    }
    editor.addEventListener('input', save);
    // Persist autocomplete edits too, which can be delivered as change events.
    editor.addEventListener('change', save);
    const project = {
      save,
      importFiles,
      files() { save(); return files.map(f => ({...f})); },
      diagnosticLocation(line) {
        let start = 2;
        for (const file of files) {
          const count = file.source.split('\n').length;
          if (line < start + count) return file.name + ':' + Math.max(1, line - start + 1);
          start += count;
        }
        return files[files.length - 1].name;
      },
      source() { files[active].source = editor.value; return global.TelemarkJava.serializeProject(files, entry); },
      reset(source) { files = [inTeamPackage({name: mainFilename(source), source})]; active = 0; entry = ''; show(true); save(); }
    };
    editor.__telemarkProject = project;
    global.addEventListener('message', event => {
      if (event.origin !== global.location.origin || event.source !== global.parent || event.data?.type !== 'telemark:project-lesson') return;
      if (typeof event.data.lesson?.id !== 'string' || typeof event.data.lesson?.title !== 'string' || !Array.isArray(event.data.completed)) return;
      const changed = lesson?.id !== event.data.lesson.id || lesson?.title !== event.data.lesson.title ||
        completed.length !== event.data.completed.length || completed.some((id, index) => id !== event.data.completed[index]);
      lesson = event.data.lesson; completed = event.data.completed;
      save();
      if (changed) render();
    });
    function updateCompletion() {
      try {
        const progress = JSON.parse(global.localStorage.getItem('telemark:progress:v1') || '{}');
        completed = (progress.completedLessons || []).filter(id => !(progress.skippedLessons || []).includes(id) && !(progress.autoCompletedLessons || []).includes(id));
      } catch (_) { completed = []; }
    }
    updateCompletion();
    global.addEventListener('storage', event => {
      if (event.key !== 'telemark:progress:v1') return;
      updateCompletion(); render();
    });
    show(true);
    if (global.parent !== global) global.parent.postMessage({type: 'telemark:project-ready'}, global.location.origin);
    return project;
  }
  function createRunner(editor, options) {
    const runtime = global.TelemarkSimulatorBase.createRuntime(options);
    const program = global.TelemarkSimulatorBase.compileStudentSource(editor.__telemarkProject ? editor.__telemarkProject.source() : editor.value, runtime);
    if (!program.ok) throw new Error(program.diagnostics[0].message);
    if (program.kind !== 'iterative') throw new Error('This lesson expects an OpMode with init() and loop().');
    if (!program.methods.init || !program.methods.loop) throw new Error('Required init() or loop() method is missing.');
    function frame(name) { runtime.clearTelemetry(); program.methods[name]?.(); runtime.updateTelemetry(); }
    return {program, runtime, init() { frame('init'); frame('start'); }, loop() { frame('loop'); }, stop() {
      try { frame('stop'); } finally { runtime.devices.forEach(device => { if (['DcMotor', 'DcMotorEx', 'CRServo'].includes(device._state.type)) device.setPower(0); }); }
    }};
  }
  global.TelemarkProject = {attach, createRunner};
  global.addEventListener('load', () => setTimeout(() => {
    let editor = document.getElementById('code-editor');
    const cm = global.cmEditor;
    if (!editor && cm?.getValue && document.getElementById('editor-wrap')) {
      editor = document.createElement('textarea'); editor.id = 'code-editor'; editor.hidden = true;
      editor.value = cm.getValue(); document.getElementById('editor-wrap').appendChild(editor);
      let switching = false;
      attach(editor, () => { switching = true; cm.setValue(editor.value); switching = false; });
      cm.on('change', () => { if (!switching) { editor.value = cm.getValue(); editor.__telemarkProject.save(); } });
    }
    if (editor && global.TelemarkJava && global.TelemarkEditor && !editor.__telemarkProject) {
      attach(editor);
    }
  }, 30));
})(window);

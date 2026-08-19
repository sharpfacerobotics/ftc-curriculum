/**
 * ============================================================================
 * SIMULATOR_BASE.JS — FTC Java Curriculum Simulator Base
 * ============================================================================
 * 
 * A completely self-contained base template for FTC robotics curriculum
 * simulator challenges (Units 8 and 9). This file:
 * 
 *   1. Injects a complete dark-theme CSS stylesheet
 *   2. Builds the entire DOM layout (left panel, right panel, gamepad card)
 *   3. Loads external dependencies (Prism.js, Three.js, fonts)
 *   4. Provides a Prism-highlighted code editor with synchronized scrolling
 *   5. Provides a telemetry panel matching FTC Driver Station style
 *   6. Provides a floating, draggable, resizable, collapsible gamepad card
 *   7. Provides a mini Java-to-JS transpiler with safety checks
 *   8. Provides a mock hardware map registry with callbacks
 *   9. Provides a hardware badge strip
 *  10. Provides a challenge instructions panel with requirement tracking
 *  11. Provides a Three.js scene with field, walls, lights, and orbit controls
 *  12. Provides runtime utilities (getRuntime, sleep, isStopRequested, etc.)
 * 
 * Each challenge HTML file simply includes this script and defines:
 *   window.onSimulatorReady = function() { ... }
 * 
 * That callback receives no arguments and should call the exposed APIs to
 * configure the challenge (set code, register hardware, set badges, etc.)
 * 
 * ============================================================================
 */

(function () {
  "use strict";

  // ========================================================================
  // SECTION 1: CSS THEME INJECTION
  // ========================================================================
  // Injects a complete dark-theme stylesheet into the document head.
  // Uses CSS custom properties for easy reference throughout.
  // ========================================================================

  const CSS_THEME = `
    /* ── Google Fonts ── */
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

    /* ── CSS Custom Properties ── */
    :root {
      --bg: #05080d;
      --panel: #0b1118;
      --border: #243746;
      --active: #22d3ee;
      --good: #22cc66;
      --danger: #cc2222;
      --text-primary: #eaf8ff;
      --text-secondary: #94a3b8;
      --font-ui: 'IBM Plex Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      --font-code: 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
      --editor-line-height: 20.8px;
    }

    /* ── Scrollbar Styling ── */
    * {
      scrollbar-width: thin;
      scrollbar-color: #22d3ee #05080d;
      box-sizing: border-box;
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track {
      background: #05080d;
      border-radius: 999px;
    }
    ::-webkit-scrollbar-thumb {
      background: #22d3ee;
      border: 2px solid #05080d;
      border-radius: 999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #22d3ee;
    }
    ::-webkit-scrollbar-corner { background: #05080d; }

    /* ── Full Page Layout ── */
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    body {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--bg);
      color: var(--text-primary);
      font-family: var(--font-ui);
    }

    /* ── Left Panel (Editor) ── */
    #sim-left-panel {
      width: 50%;
      min-width: 320px;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #111114;
      border-right: 1px solid var(--border);
    }

    /* ── Panel Header ── */
    .sim-panel-header {
      padding: 10px 14px;
      background: #0a0a0d;
      border-bottom: 1px solid var(--border);
    }
    .sim-panel-header-title {
      font-weight: 700;
      color: #fff;
      font-size: 1rem;
      font-family: var(--font-ui);
    }
    .sim-panel-header-sub {
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-family: var(--font-ui);
    }

    /* ── Challenge Card ── */
    .sim-challenge-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin: 8px 10px;
      overflow: hidden;
    }
    .sim-challenge-header {
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0e0e14;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--active);
      font-family: var(--font-ui);
      user-select: none;
    }
    .sim-challenge-header .sim-chevron {
      color: var(--text-secondary);
      font-size: 0.75rem;
      transition: transform 0.2s;
    }
    .sim-challenge-header.open .sim-chevron {
      transform: rotate(90deg);
    }
    .sim-challenge-body {
      display: none;
      padding: 10px 12px;
      font-size: 0.85rem;
      line-height: 1.6;
      color: #bbb;
      font-family: var(--font-ui);
    }
    .sim-challenge-body.open {
      display: block;
    }
    .sim-challenge-desc {
      margin: 6px 0 10px;
      color: #ddd;
      background: #0a0a0f;
      padding: 8px 10px;
      border-radius: 4px;
      font-family: var(--font-code);
      font-size: 0.82rem;
      line-height: 1.5;
    }
    .sim-fault-control {
      display: none;
      gap: 6px;
      align-items: center;
      margin: 0 0 10px;
      padding: 8px;
      border: 1px solid rgba(255, 181, 71, 0.28);
      border-radius: 4px;
      background: rgba(255, 181, 71, 0.06);
    }
    .sim-fault-control.visible {
      display: grid;
    }
    .sim-fault-control label {
      color: #ffb547;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .sim-fault-control select {
      width: 100%;
      border: 1px solid rgba(255, 181, 71, 0.35);
      border-radius: 3px;
      background: #0a0a0f;
      color: #e8f4ff;
      padding: 6px 8px;
      font: 0.78rem var(--font-ui);
    }
    .sim-fault-description {
      color: #c8b58d;
      font-size: 0.75rem;
      line-height: 1.4;
    }

    /* ── Requirements ── */
    .sim-req {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 0;
      font-size: 0.83rem;
      font-family: var(--font-ui);
    }
    .sim-req .sim-check {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      flex-shrink: 0;
    }
    .sim-req .sim-check.pass {
      background: rgba(34, 204, 102, 0.2);
      color: var(--good);
    }
    .sim-req .sim-check.fail {
      background: rgba(100, 100, 100, 0.2);
      color: #555;
    }
    .sim-success-banner {
      display: none;
      background: rgba(34, 204, 102, 0.12);
      border: 1px solid var(--good);
      border-radius: 6px;
      padding: 10px;
      color: var(--good);
      font-weight: 700;
      font-size: 0.9rem;
      margin-top: 8px;
      text-align: center;
      font-family: var(--font-ui);
      animation: sim-banner-in 0.4s ease-out;
    }
    .sim-success-banner.visible {
      display: block;
    }
    @keyframes sim-banner-in {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Code Editor ── */
    .sim-code-wrapper {
      position: relative;
      flex: 1;
      overflow: hidden;
      background: var(--bg);
    }
    #sim-code-editor,
    #sim-highlighting {
      position: absolute;
      inset: 0;
      margin: 0;
      padding: 16px 16px 16px 56px;
      font-family: var(--font-code);
      font-size: 13px;
      line-height: var(--editor-line-height);
      tab-size: 4;
      white-space: pre;
      overflow-wrap: normal;
      word-break: normal;
      font-variant-ligatures: none;
      letter-spacing: 0;
      word-spacing: 0;
      border: 0;
      outline: none;
    }
    #sim-code-editor {
      color: transparent;
      background: transparent;
      caret-color: #fff;
      z-index: 2;
      resize: none;
      overflow: auto;
      display: block;
    }
    #sim-highlighting {
      z-index: 1;
      overflow: hidden;
      pointer-events: none;
    }
    #sim-highlighting code {
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      letter-spacing: inherit;
      word-spacing: inherit;
      white-space: pre;
      text-shadow: none;
      display: block;
      min-height: 100%;
      transform: translate(0, 0);
      will-change: transform;
    }
    /* Line numbers gutter */
    #sim-line-numbers {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 46px;
      color: #444;
      background: #0a0a0d;
      border-right: 1px solid var(--border);
      z-index: 3;
      overflow: hidden;
      user-select: none;
      pointer-events: none;
    }
    .sim-line-numbers-inner {
      padding: 16px 8px 16px 0;
      text-align: right;
      font-family: var(--font-code);
      font-size: 13px;
      line-height: var(--editor-line-height);
      letter-spacing: 0;
      min-height: 100%;
      transform: translateY(0);
    }
    .sim-line-number {
      display: block;
      height: var(--editor-line-height);
      line-height: var(--editor-line-height);
    }

    /* ── Bottom Bar ── */
    .sim-bottom-bar {
      background: var(--panel);
      border-top: 1px solid var(--border);
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
    }
    .sim-controls-row {
      display: flex;
      gap: 8px;
    }
    .sim-controls-row button {
      flex: 1;
      padding: 10px;
      border-radius: 6px;
      border: none;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      color: #fff;
      transition: 0.1s;
      font-family: var(--font-ui);
    }
    .sim-controls-row button:active {
      transform: translateY(1px);
    }
    .sim-btn-run { background: var(--good); }
    .sim-btn-run:hover { filter: brightness(1.1); }
    .sim-btn-run:disabled {
      background: #444;
      color: #888;
      cursor: not-allowed;
      transform: none;
    }
    .sim-btn-stop { background: var(--danger); }
    .sim-btn-stop:hover { filter: brightness(1.1); }
    .sim-btn-reset { background: #555; }
    .sim-btn-reset:hover { filter: brightness(1.2); }

    /* ── DS Status ── */
    .sim-ds-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--font-code);
      font-size: 0.85rem;
    }
    .sim-ds-state { font-weight: 700; }
    .sim-ds-timer { color: #569cd6; }

    /* ── Telemetry Panel ── */
    .sim-telemetry-panel {
      background: #000;
      border: 1px solid #444;
      border-radius: 6px;
      min-height: 50px;
      max-height: 120px;
      padding: 8px;
      font-family: var(--font-code);
      font-size: 0.85rem;
      overflow-y: auto;
      color: #00ff00;
    }
    .sim-telemetry-line {
      margin: 1px 0;
    }
    .sim-telemetry-key {
      color: #4ec9b0;
    }
    .sim-telemetry-error {
      color: #ff4444;
      font-weight: 700;
    }

    /* ── Resizer ── */
    #sim-resizer {
      width: 6px;
      background: #2a2a3a;
      cursor: col-resize;
      z-index: 30;
      transition: background 0.2s;
      flex-shrink: 0;
      touch-action: none;
    }
    #sim-resizer:hover, #sim-resizer.active {
      background: var(--active);
    }

    /* ── Right Panel ── */
    #sim-right-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #0a0a0d;
      min-width: 350px;
      overflow: hidden;
    }

    /* ── Badge Strip ── */
    .sim-badge-strip {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      padding: 10px 10px 0;
    }
    .sim-hw-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 5px;
      border: 1px solid var(--border);
      font-family: var(--font-ui);
      transition: all 0.2s;
    }
    .sim-hw-badge.active {
      border-color: var(--active);
      color: var(--active);
      background: rgba(34, 211, 238, 0.1);
    }
    .sim-hw-badge.inactive {
      background: #111;
      color: #444;
      border-color: #222;
    }

    /* ── Scene Container ── */
    #sim-scene-container {
      flex: 1;
      position: relative;
      margin: 10px;
      border-radius: 8px;
      overflow: hidden;
      background: #050508;
    }
    #sim-robot-canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: grab;
    }
    #sim-robot-canvas:active { cursor: grabbing; }

    /* ── Reset Scene Button ── */
    .sim-scene-reset-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 5;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: rgba(19, 19, 26, 0.85);
      color: var(--text-primary);
      font-family: var(--font-ui);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: 0.15s;
    }
    .sim-scene-reset-btn:hover {
      background: rgba(40, 40, 60, 0.9);
      border-color: var(--active);
      color: var(--active);
    }

    /* ────────────────────────────────────────────────────────────────────────
       GAMEPAD FLOATING CARD
       ──────────────────────────────────────────────────────────────────────── */
    .sim-gamepad-card {
      position: fixed;
      bottom: 12px;
      right: 12px;
      width: 400px;
      min-width: 260px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      box-shadow: 0 6px 24px rgba(0,0,0,0.5);
      overflow: hidden;
    }
    .sim-gamepad-titlebar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      background: #0e0e14;
      border-bottom: 1px solid var(--border);
      cursor: grab;
      user-select: none;
      flex-shrink: 0;
    }
    .sim-gamepad-titlebar:active { cursor: grabbing; }
    .sim-gamepad-title-label {
      font-weight: 700;
      font-size: 0.9rem;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-ui);
    }
    .sim-gamepad-title-label .sim-gp-icon {
      color: #569cd6;
    }
    .sim-gp-collapse-btn {
      width: 24px;
      height: 24px;
      padding: 0;
      border-radius: 4px;
      background: #333;
      border: 1px solid #555;
      color: #ccc;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .sim-gp-collapse-btn:hover { background: #444; }

    .sim-gamepad-body {
      padding: 10px;
      overflow: hidden;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .sim-gamepad-resize-handle {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: nwse-resize;
      z-index: 10;
    }
    .sim-gamepad-resize-handle::after {
      content: '';
      position: absolute;
      bottom: 3px;
      right: 3px;
      width: 6px;
      height: 6px;
      border-right: 2px solid #666;
      border-bottom: 2px solid #666;
    }

    /* ── Gamepad Layout ── */
    .sim-gp-row {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .sim-gp-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .sim-gp-section-label {
      font-size: 0.65rem;
      color: var(--text-secondary);
      font-family: var(--font-code);
      text-align: center;
      white-space: nowrap;
    }

    /* ── Joystick Zone ── */
    .sim-joystick-zone {
      width: 100px;
      height: 100px;
      background: #1a1a24;
      border: 1px solid var(--border);
      border-radius: 8px;
      position: relative;
      touch-action: none;
      cursor: grab;
    }
    .sim-joystick-zone:active { cursor: grabbing; }
    .sim-joystick-crosshair-h,
    .sim-joystick-crosshair-v {
      position: absolute;
      background: #222;
      pointer-events: none;
    }
    .sim-joystick-crosshair-h {
      left: 0; right: 0;
      top: 50%;
      height: 1px;
      transform: translateY(-0.5px);
    }
    .sim-joystick-crosshair-v {
      top: 0; bottom: 0;
      left: 50%;
      width: 1px;
      transform: translateX(-0.5px);
    }
    .sim-joystick-knob {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #4a4a5a, #1a1a24 70%);
      border: 2px solid rgba(255,255,255,0.15);
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      transition: box-shadow 0.15s;
    }
    .sim-joystick-knob.active {
      box-shadow: 0 0 8px rgba(86, 156, 214, 0.5);
      border-color: rgba(86, 156, 214, 0.5);
    }
    .sim-joystick-value {
      font-size: 0.6rem;
      color: var(--text-secondary);
      font-family: var(--font-code);
      text-align: center;
      margin-top: 2px;
    }

    /* ── Trigger Slider ── */
    .sim-trigger-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .sim-trigger-slider {
      width: 30px;
      height: 80px;
      background: #1a1a24;
      border: 1px solid var(--border);
      border-radius: 6px;
      position: relative;
      cursor: pointer;
      touch-action: none;
      overflow: hidden;
    }
    .sim-trigger-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, #2563eb, var(--active));
      border-radius: 0 0 5px 5px;
      transition: height 0.05s;
    }
    .sim-trigger-value {
      font-size: 0.6rem;
      color: var(--text-secondary);
      font-family: var(--font-code);
    }

    /* ── Button Grid ── */
    .sim-gp-btn-grid {
      display: grid;
      gap: 4px;
    }
    .sim-gp-btn-grid.face-buttons {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
    }
    .sim-gp-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.15);
      background: #1a1a24;
      color: var(--text-secondary);
      font-family: var(--font-ui);
      font-weight: 700;
      font-size: 0.7rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.1s;
      user-select: none;
    }
    .sim-gp-btn:hover {
      border-color: rgba(255,255,255,0.3);
    }
    .sim-gp-btn.pressed {
      background: rgba(255,255,255,0.18);
      box-shadow: 0 0 6px rgba(255,255,255,0.25);
    }
    .sim-gp-btn.btn-a { color: #22cc66; border-color: #22cc66; }
    .sim-gp-btn.btn-a.pressed { background: rgba(34,204,102,0.3); }
    .sim-gp-btn.btn-b { color: #cc2222; border-color: #cc2222; }
    .sim-gp-btn.btn-b.pressed { background: rgba(204,34,34,0.3); }
    .sim-gp-btn.btn-x { color: #2266cc; border-color: #2266cc; }
    .sim-gp-btn.btn-x.pressed { background: rgba(34,102,204,0.3); }
    .sim-gp-btn.btn-y { color: #cccc22; border-color: #cccc22; }
    .sim-gp-btn.btn-y.pressed { background: rgba(204,204,34,0.3); }

    /* ── Bumper Buttons ── */
    .sim-gp-bumper {
      padding: 4px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: #1a1a24;
      color: var(--text-secondary);
      font-family: var(--font-code);
      font-size: 0.65rem;
      cursor: pointer;
      user-select: none;
      transition: all 0.1s;
      text-align: center;
    }
    .sim-gp-bumper.pressed {
      background: rgba(255,255,255,0.18);
      border-color: rgba(255,255,255,0.4);
      color: #fff;
    }

    /* ── DPad ── */
    .sim-dpad-grid {
      display: grid;
      grid-template-columns: repeat(3, 28px);
      grid-template-rows: repeat(3, 28px);
      gap: 2px;
    }
    .sim-dpad-btn {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.08);
      background: #1a1a24;
      color: var(--text-secondary);
      font-size: 0.7rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      transition: all 0.1s;
    }
    .sim-dpad-btn.pressed {
      background: rgba(255,255,255,0.18);
      border-color: rgba(255,255,255,0.3);
    }
    .sim-dpad-center {
      background: #0e0e14;
      cursor: default;
      border-color: transparent;
    }

    /* ── Small Buttons (start/back) ── */
    .sim-gp-small-btn {
      padding: 3px 10px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: #1a1a24;
      color: var(--text-secondary);
      font-family: var(--font-code);
      font-size: 0.6rem;
      cursor: pointer;
      user-select: none;
      transition: all 0.1s;
    }
    .sim-gp-small-btn.pressed {
      background: rgba(255,255,255,0.18);
      border-color: rgba(255,255,255,0.3);
      color: #fff;
    }

    /* ── Greyed Out (inactive input) ── */
    .sim-gp-input-inactive {
      opacity: 0.65;
      pointer-events: auto;
    }
    .sim-gp-input-recommended {
      border-color: rgba(0,152,255,0.75) !important;
      box-shadow: 0 0 0 2px rgba(0,152,255,0.25);
      opacity: 1 !important;
    }

    /* ── Logitech Image Overlay Gamepad ── */
    .sim-controller-wrap {
      width: 100%;
      position: relative;
      aspect-ratio: 768 / 512;
      border-radius: 14px;
      overflow: hidden;
      background: #0f0f0f;
      touch-action: none;
      user-select: none;
    }
    .sim-controller-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
      z-index: 1;
    }
    .sim-gp-overlay {
      position: absolute;
      z-index: 4;
      touch-action: none;
      user-select: none;
    }
    .sim-gp-overlay.button {
      border: 2px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.01);
      cursor: pointer;
      opacity: 0.45;
    }
    .sim-gp-overlay.button.pressed,
    .sim-stick-zone.active {
      background: rgba(255,255,255,0.18);
      box-shadow: 0 0 0 2px rgba(255,255,255,0.25);
      opacity: 1;
    }
    .sim-face-a { left:75.5%; top:49%; width:7%; height:10%; transform:translate(-10%,-10%); border-radius:50%; }
    .sim-face-b { left:83%; top:38%; width:7%; height:10%; transform:translate(-10%,-10%); border-radius:50%; }
    .sim-face-x { left:68%; top:38%; width:7%; height:10%; transform:translate(-10%,-10%); border-radius:50%; }
    .sim-face-y { left:75.5%; top:27%; width:7%; height:10%; transform:translate(-10%,-10%); border-radius:50%; }
    .sim-small-back { left:37.5%; top:28%; width:5.2%; height:6.4%; transform:translate(-10%,-10%); border-radius:16px; }
    .sim-small-start { left:58%; top:28%; width:5.2%; height:6.4%; transform:translate(-10%,-10%); border-radius:16px; }
    .sim-bumper-left { left:20%; top:12%; width:14%; height:6%; transform:translate(-50%,-50%); border-radius:8px; }
    .sim-bumper-right { left:80%; top:12%; width:14%; height:6%; transform:translate(-50%,-50%); border-radius:8px; }
    .sim-stick-zone {
      border-radius: 50%;
      background: transparent;
      cursor: grab;
    }
    .sim-stick-zone:active { cursor: grabbing; }
    .sim-stick-left { left:35.5%; top:65.5%; width:17%; height:24%; transform:translate(-50%,-50%); }
    .sim-stick-right { left:64%; top:65.5%; width:17%; height:24%; transform:translate(-50%,-50%); }
    .sim-stick-knob {
      width: 52%;
      height: 52%;
      border-radius: 50%;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle at 35% 35%, rgba(80,80,80,.75), rgba(12,12,12,.55) 70%);
      border: 1px solid rgba(255,255,255,.14);
      pointer-events: none;
      opacity: 0.55;
    }
    .sim-trigger-image {
      position: absolute;
      z-index: 5;
      width: 10%;
      height: 14%;
      top: 0;
      transform: translate(-50%, 0);
      background: rgba(0,0,0,.38);
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,.15);
      cursor: pointer;
      overflow: hidden;
      touch-action: none;
    }
    .sim-trigger-image.left { left:21%; }
    .sim-trigger-image.right { left:79%; }
    .sim-trigger-image .sim-trigger-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 0%;
      background: linear-gradient(to top, #38bdf8, #22d3ee);
    }
    .sim-dpad-overlay { left:21.5%; top:41%; width:16%; height:24%; transform:translate(-50%,-50%); pointer-events:none; }
    .sim-dpad-image-btn {
      position: absolute;
      width: 33%;
      height: 33%;
      background: rgba(255,255,255,0.01);
      border: 1px solid rgba(255,255,255,0.06);
      pointer-events: auto;
      cursor: pointer;
    }
    .sim-dpad-image-btn.pressed { background: rgba(255,255,255,0.18); }
    .sim-dpad-image-up { top:0; left:33%; border-radius:4px 4px 0 0; }
    .sim-dpad-image-down { bottom:0; left:33%; border-radius:0 0 4px 4px; }
    .sim-dpad-image-left { left:0; top:33%; border-radius:4px 0 0 4px; }
    .sim-dpad-image-right { right:0; top:33%; border-radius:0 4px 4px 0; }

    /* ── Hint Container ── */
    #sim-hint-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 150px;
      overflow: auto;
    }
    .sim-hint {
      background: rgba(255,204,0,0.12);
      border-left: 3px solid #ffcc00;
      padding: 6px 8px;
      color: #ffcc00;
      border-radius: 3px;
      font-size: 0.82rem;
      font-family: var(--font-ui);
    }
    .sim-hint.error {
      background: rgba(204,0,0,0.12);
      border-left-color: var(--danger);
      color: #ff6666;
    }
    .sim-hint.info {
      background: rgba(0,122,204,0.12);
      border-left-color: #38bdf8;
      color: #6db3f2;
    }

    @media (max-width: 900px) {
      #sim-left-panel {
        flex: 1 1 auto;
        width: auto !important;
        min-width: 0;
        height: 100%;
        border-right: 1px solid var(--border);
        border-bottom: none;
      }
      #sim-right-panel {
        flex: 0 0 clamp(260px, 34vw, 330px);
        width: clamp(260px, 34vw, 330px);
        min-width: 260px;
        height: 100%;
      }
      .sim-panel-header {
        padding: 8px 12px;
      }
      .sim-challenge-card {
        margin: 6px 8px;
      }
      .sim-challenge-body {
        max-height: 130px;
        overflow: auto;
      }
      .sim-code-wrapper {
        min-height: 210px;
      }
      .sim-bottom-bar {
        padding: 8px;
        gap: 6px;
      }
      .sim-telemetry-panel {
        max-height: 96px;
      }
      .sim-badge-strip {
        padding: 6px 8px;
        gap: 6px;
        flex-wrap: wrap;
      }
      #sim-scene-container {
        margin: 8px;
        flex: 0 0 auto;
        width: calc(100% - 16px);
        aspect-ratio: 1 / 1;
        min-height: 0;
      }
      .sim-gamepad-card {
        width: min(330px, calc(100vw - 24px));
        right: 8px;
        bottom: 8px;
      }
    }

    @media (max-width: 640px) {
      body {
        flex-direction: column;
      }
      #sim-left-panel {
        width: 100% !important;
        height: 62%;
        border-right: none;
        border-bottom: 1px solid var(--border);
      }
      #sim-resizer {
        display: none;
      }
      #sim-right-panel {
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
        height: 38%;
        min-height: 260px;
      }
      #sim-scene-container {
        flex: 1 1 auto;
        width: auto;
        aspect-ratio: auto;
      }
    }
  `;

  function injectCSS() {
    const style = document.createElement("style");
    style.id = "sim-base-theme";
    style.textContent = CSS_THEME;
    document.head.appendChild(style);
  }

  // ========================================================================
  // SECTION 2: DOM CONSTRUCTION
  // ========================================================================
  // Builds the entire page layout from scratch. Each challenge HTML can be
  // a minimal shell that just loads this script.
  // ========================================================================

  function buildDOM() {
    document.body.innerHTML = "";

    // ── Left Panel ──
    const leftPanel = el("div", { id: "sim-left-panel" });

    // Panel header
    const panelHeader = el("div", { className: "sim-panel-header" });
    panelHeader.appendChild(
      el("div", { className: "sim-panel-header-title", id: "sim-header-title" })
    );
    panelHeader.appendChild(
      el("div", { className: "sim-panel-header-sub", id: "sim-header-sub" })
    );
    leftPanel.appendChild(panelHeader);

    // Challenge card
    const challengeCard = el("div", {
      className: "sim-challenge-card",
      id: "sim-challenge-card",
    });

    const challengeHeader = el("div", {
      className: "sim-challenge-header open",
      id: "sim-challenge-header",
    });
    challengeHeader.innerHTML = `<span id="sim-challenge-title-text"></span><span class="sim-chevron">&#9654;</span>`;
    challengeHeader.addEventListener("click", function () {
      this.classList.toggle("open");
      document.getElementById("sim-challenge-body").classList.toggle("open");
    });
    challengeCard.appendChild(challengeHeader);

    const challengeBody = el("div", {
      className: "sim-challenge-body open",
      id: "sim-challenge-body",
    });
    challengeBody.innerHTML = `
      <div class="sim-challenge-desc" id="sim-challenge-desc"></div>
      <div class="sim-fault-control" id="sim-fault-control">
        <label for="sim-fault-select">Optional robot fault</label>
        <select id="sim-fault-select"></select>
        <div class="sim-fault-description" id="sim-fault-description"></div>
      </div>
      <div id="sim-requirements-list"></div>
      <div class="sim-success-banner" id="sim-success-banner"><i class="fa-solid fa-circle-check"></i> Challenge Complete!</div>
    `;
    challengeCard.appendChild(challengeBody);
    leftPanel.appendChild(challengeCard);

    // Code editor
    const codeWrapper = el("div", { className: "sim-code-wrapper" });
    const lineNumbers = el("div", { id: "sim-line-numbers" });
    codeWrapper.appendChild(lineNumbers);
    const codeEditor = el("textarea", {
      id: "sim-code-editor",
      spellcheck: false,
    });
    codeEditor.setAttribute("wrap", "off");
    codeWrapper.appendChild(codeEditor);
    const highlighting = el("pre", { id: "sim-highlighting" });
    highlighting.setAttribute("aria-hidden", "true");
    highlighting.innerHTML = `<code class="language-java" id="sim-highlighting-content"></code>`;
    codeWrapper.appendChild(highlighting);
    leftPanel.appendChild(codeWrapper);

    // Bottom bar
    const bottomBar = el("div", { className: "sim-bottom-bar" });

    const controlsRow = el("div", { className: "sim-controls-row" });
    const btnRun = el("button", {
      className: "sim-btn-run",
      id: "sim-btn-run",
    });
    btnRun.innerHTML = "Init";
    const btnStop = el("button", {
      className: "sim-btn-stop",
      id: "sim-btn-stop",
    });
    btnStop.innerHTML = "&#9632; Stop";
    controlsRow.appendChild(btnRun);
    controlsRow.appendChild(btnStop);
    bottomBar.appendChild(controlsRow);

    const dsStatus = el("div", { className: "sim-ds-status" });
    dsStatus.innerHTML = `
      <span class="sim-ds-state" id="sim-ds-state" style="color:var(--danger)">STOPPED</span>
      <span class="sim-ds-timer">Time: <span id="sim-timer-val">0.00</span>s</span>
    `;
    bottomBar.appendChild(dsStatus);

    const telPanel = el("div", {
      className: "sim-telemetry-panel",
      id: "sim-telemetry-log",
    });
    telPanel.innerHTML = `<span style="color:#666">Press Init to initialize...</span>`;
    bottomBar.appendChild(telPanel);

    const hintContainer = el("div", { id: "sim-hint-container" });
    bottomBar.appendChild(hintContainer);

    leftPanel.appendChild(bottomBar);
    document.body.appendChild(leftPanel);

    // ── Resizer ──
    const resizer = el("div", { id: "sim-resizer" });
    document.body.appendChild(resizer);

    // ── Right Panel ──
    const rightPanel = el("div", { id: "sim-right-panel" });

    const badgeStrip = el("div", {
      className: "sim-badge-strip",
      id: "sim-badge-strip",
    });
    rightPanel.appendChild(badgeStrip);

    const sceneContainer = el("div", { id: "sim-scene-container" });
    const canvas = el("canvas", { id: "sim-robot-canvas" });
    sceneContainer.appendChild(canvas);
    // Reset button overlay
    const resetBtn = el("button", {
      className: "sim-scene-reset-btn",
      id: "sim-scene-reset-btn",
    });
    resetBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Reset';
    resetBtn.addEventListener("click", function () {
      handleStop();
      if (typeof window.onReset === "function") window.onReset();
    });
    sceneContainer.appendChild(resetBtn);
    rightPanel.appendChild(sceneContainer);

    document.body.appendChild(rightPanel);

    // ── Gamepad Card ──
    buildGamepadCard();

    // ── Wire up events ──
    wireEditorEvents();
    wireResizerEvents();
    wireRunStopEvents();
  }

  /** Helper: create an element with properties */
  function el(tag, props) {
    const e = document.createElement(tag);
    if (props) {
      for (const k in props) {
        if (k === "className") e.className = props[k];
        else e[k] = props[k];
      }
    }
    return e;
  }

  /** Escape HTML */
  function escHTML(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ========================================================================
  // SECTION 3: PRISM.JS EDITOR PANEL
  // ========================================================================
  // Loads Prism.js + prism-java, sets up textarea overlay on highlighted
  // pre/code element, synchronized scrolling, line numbers, Tab/Enter/
  // bracket handling.
  // ========================================================================

  let prismLoaded = false;

  function loadPrism(callback) {
    // Load Font Awesome for simulator UI icons.
    if (!document.getElementById("sim-fontawesome-css")) {
      const fa = document.createElement("link");
      fa.id = "sim-fontawesome-css";
      fa.rel = "stylesheet";
      fa.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
      document.head.appendChild(fa);
    }

    // Load Prism CSS (Tomorrow theme)
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css";
    document.head.appendChild(link);

    // Load Prism core
    const script1 = document.createElement("script");
    let finished = false;
    const finish = function () {
      if (finished) return;
      finished = true;
      if (callback) callback();
    };
    script1.src =
      "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js";
    script1.onload = function () {
      // Load Java language
      const script2 = document.createElement("script");
      script2.src =
        "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-java.min.js";
      script2.onload = function () {
        prismLoaded = true;
        finish();
      };
      script2.onerror = finish;
      document.head.appendChild(script2);
    };
    script1.onerror = finish;
    document.head.appendChild(script1);
  }

  function updateHighlighting() {
    const editor = document.getElementById("sim-code-editor");
    const content = document.getElementById("sim-highlighting-content");
    if (!editor || !content) return;

    let text = editor.value;
    // Prism needs a trailing newline to avoid layout issues
    if (text && text[text.length - 1] === "\n") text += " ";

    if (prismLoaded && window.Prism) {
      content.innerHTML = Prism.highlight(
        text || "",
        Prism.languages.java,
        "java"
      );
    } else {
      content.textContent = text || "";
    }
    updateLineNumbers();
  }

  function updateLineNumbers() {
    const editor = document.getElementById("sim-code-editor");
    const gutter = document.getElementById("sim-line-numbers");
    if (!editor || !gutter) return;

    const lines = (editor.value || "").split("\n").length;
    let html = "";
    for (let i = 1; i <= lines; i++) {
      html += '<span class="sim-line-number">' + i + "</span>";
    }
    gutter.innerHTML = '<div class="sim-line-numbers-inner">' + html + "</div>";
  }

  function syncScroll() {
    const editor = document.getElementById("sim-code-editor");
    const highlighting = document.getElementById("sim-highlighting");
    const content = document.getElementById("sim-highlighting-content");
    const lineNumbers = document.getElementById("sim-line-numbers");
    if (!editor || !highlighting) return;

    highlighting.scrollTop = 0;
    highlighting.scrollLeft = 0;
    if (content) {
      content.style.transform =
        "translate(" + -editor.scrollLeft + "px, " + -editor.scrollTop + "px)";
    }
    if (lineNumbers) {
      const inner = lineNumbers.querySelector(".sim-line-numbers-inner");
      if (inner) inner.style.transform = "translateY(" + -editor.scrollTop + "px)";
    }
  }

  function currentLineIndent(line) {
    const match = (line || "").match(/^\s*/);
    return match ? match[0] : "";
  }

  function insertIntoEditor(editor, text, cursorOffset) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value =
      editor.value.substring(0, start) + text + editor.value.substring(end);
    const cursor = start + (cursorOffset == null ? text.length : cursorOffset);
    editor.selectionStart = editor.selectionEnd = cursor;
    updateHighlighting();
    syncScroll();
  }

  function handleJavaEditorAutocomplete(e) {
    if (window.TelemarkEditor) {
      e.stopPropagation();
      const handled = window.TelemarkEditor.handleKeydown(e);
      if (handled) {
        updateHighlighting();
        syncScroll();
      }
      return handled;
    }

    const editor = e.currentTarget;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    e.stopPropagation();

    if (e.key === "Tab") {
      e.preventDefault();
      insertIntoEditor(editor, "    ");
      return true;
    }

    const selected = editor.value.substring(start, end);
    const before = editor.value.substring(0, start);
    const after = editor.value.substring(end);
    const lineBefore = before.split("\n").pop();
    const lineAfter = after.split("\n")[0];
    const indent = currentLineIndent(lineBefore);

    if (e.key === "{") {
      e.preventDefault();
      if (
        /(?:^|\s)(?:if\s*\([^)]*\)|else\s+if\s*\([^)]*\)|else)\s*$/.test(
          lineBefore
        ) &&
        lineAfter.trim() === ""
      ) {
        const inner = indent + "    ";
        insertIntoEditor(editor, " {\n" + inner + "\n" + indent + "}", 3 + inner.length);
      } else {
        insertIntoEditor(editor, "{" + selected + "}", 1 + selected.length);
      }
      return true;
    }

    if ([")", "]", "}", '"', "'"].includes(e.key) && start === end && after[0] === e.key) {
      e.preventDefault();
      editor.selectionStart = editor.selectionEnd = start + 1;
      return true;
    }

    const pairs = { "(": ")", "[": "]", '"': '"', "'": "'" };
    if (pairs[e.key]) {
      e.preventDefault();
      insertIntoEditor(
        editor,
        e.key + selected + pairs[e.key],
        1 + selected.length
      );
      return true;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (lineBefore.trimEnd().endsWith("{") && lineAfter.trimStart().startsWith("}")) {
        const inner = indent + "    ";
        insertIntoEditor(editor, "\n" + inner + "\n" + indent, 1 + inner.length);
      } else {
        const extra = lineBefore.trimEnd().endsWith("{") ? "    " : "";
        insertIntoEditor(editor, "\n" + indent + extra);
      }
      return true;
    }

    return false;
  }

  function wireEditorEvents() {
    const editor = document.getElementById("sim-code-editor");
    if (!editor) return;

    editor.addEventListener("input", function () {
      updateHighlighting();
      syncScroll();
    });

    editor.addEventListener("scroll", syncScroll);

    editor.addEventListener("keydown", handleJavaEditorAutocomplete);
  }

  // Public API
  window.getCode = function () {
    const editor = document.getElementById("sim-code-editor");
    return editor ? editor.value : "";
  };

  window.setCode = function (str) {
    const editor = document.getElementById("sim-code-editor");
    if (editor) {
      editor.value = str;
      updateHighlighting();
      syncScroll();
    }
  };

  // ========================================================================
  // SECTION 4: TELEMETRY PANEL
  // ========================================================================
  // Provides addTelemetry(key, value), updateTelemetry(), clearTelemetry().
  // Mimics the FTC Driver Station telemetry display.
  // ========================================================================

  /** Pending telemetry lines before updateTelemetry() is called */
  let telemetryData = {};
  /** Ordered list of keys for display ordering */
  let telemetryOrder = [];
  /** Whether telemetry has ever been flushed this run */
  let telemetryDirty = false;

  function formatTelemetryValue(format, values) {
    let valueIndex = 0;
    return String(format).replace(/%(\.\d+)?([dfs])/g, function (match, precision, type) {
      const value = values[valueIndex++];
      if (type === "s") return String(value);
      if (type === "d") return String(Math.round(Number(value) || 0));
      const decimals = precision ? Number(precision.slice(1)) : 6;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric.toFixed(decimals) : String(value);
    });
  }

  window.addTelemetry = function (key, value) {
    const k = String(key);
    if (!(k in telemetryData)) {
      telemetryOrder.push(k);
    }
    // Format numbers
    let v = value;
    if (arguments.length > 2 && typeof value === "string") {
      v = formatTelemetryValue(value, Array.prototype.slice.call(arguments, 2));
    }
    if (typeof v === "number" && v !== Math.floor(v)) {
      v = v.toFixed(2);
    }
    telemetryData[k] = String(v);
    telemetryDirty = true;
  };

  window.updateTelemetry = function () {
    const panel = document.getElementById("sim-telemetry-log");
    if (!panel) return;

    let html = "";
    for (let i = 0; i < telemetryOrder.length; i++) {
      const k = telemetryOrder[i];
      const v = telemetryData[k];
      html += `<div class="sim-telemetry-line"><span class="sim-telemetry-key">${escHTML(k)}</span>: ${escHTML(v)}</div>`;
    }
    panel.innerHTML = html || `<span style="color:#666">No telemetry data</span>`;
    // Auto-scroll to bottom
    panel.scrollTop = panel.scrollHeight;
    telemetryDirty = false;
  };

  window.clearTelemetry = function () {
    telemetryData = {};
    telemetryOrder = [];
    telemetryDirty = false;
    const panel = document.getElementById("sim-telemetry-log");
    if (panel) panel.innerHTML = "";
  };

  /**
   * Show an error in telemetry panel (appended, in red)
   */
  function showTelemetryError(msg) {
    const panel = document.getElementById("sim-telemetry-log");
    if (!panel) return;
    const div = document.createElement("div");
    div.className = "sim-telemetry-line sim-telemetry-error";
    div.textContent = "ERROR: " + msg;
    panel.appendChild(div);
    panel.scrollTop = panel.scrollHeight;
  }

  // ========================================================================
  // SECTION 5: FLOATING GAMEPAD CARD
  // ========================================================================
  // Builds a complete gamepad UI with joysticks, triggers, face buttons,
  // bumpers, dpad, start/back. All values accessible via global gamepad
  // object. Draggable, resizable, collapsible.
  // ========================================================================

  /** Global gamepad state */
  window.gamepad = {
    left_stick_x: 0,
    left_stick_y: 0,
    right_stick_x: 0,
    right_stick_y: 0,
    left_trigger: 0,
    right_trigger: 0,
    a: false,
    b: false,
    x: false,
    y: false,
    left_bumper: false,
    right_bumper: false,
    dpad_up: false,
    dpad_down: false,
    dpad_left: false,
    dpad_right: false,
    start: false,
    back: false,
  };

  /** All gamepad input element references for setActiveInputs */
  const gamepadInputElements = {};

  function buildGamepadCard() {
    const card = el("div", {
      className: "sim-gamepad-card",
      id: "sim-gamepad-card",
    });

    // Title bar
    const titlebar = el("div", {
      className: "sim-gamepad-titlebar",
      id: "sim-gamepad-titlebar",
    });
    titlebar.innerHTML = `<span class="sim-gamepad-title-label"><i class="fa-solid fa-gamepad sim-gp-icon"></i> Gamepad 1</span>`;
    const collapseBtn = el("button", {
      className: "sim-gp-collapse-btn",
      id: "sim-gp-collapse-btn",
    });
    collapseBtn.innerHTML = "−";
    titlebar.appendChild(collapseBtn);
    card.appendChild(titlebar);

    // Body
    const body = el("div", {
      className: "sim-gamepad-body",
      id: "sim-gamepad-body",
    });

    body.appendChild(createImageOverlayGamepad());
    card.appendChild(body);

    // Resize handle
    const resizeHandle = el("div", {
      className: "sim-gamepad-resize-handle",
      id: "sim-gamepad-resize-handle",
    });
    card.appendChild(resizeHandle);

    document.body.appendChild(card);

    // Wire drag, resize, collapse
    wireGamepadCardEvents(card, titlebar, collapseBtn, body, resizeHandle);
  }

  function createImageOverlayGamepad() {
    const wrap = el("div", {
      className: "sim-controller-wrap",
      id: "sim-controller-wrap",
    });

    const img = el("img", {
      className: "sim-controller-img",
    });
    img.alt = "Logitech gamepad";
    img.src =
      "https://resource.logitechg.com/w_776,h_437,ar_16:9,c_fill,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/f310/f310-feature-3.png";
    wrap.appendChild(img);

    wrap.appendChild(createImageTrigger("left_trigger", "left"));
    wrap.appendChild(createImageTrigger("right_trigger", "right"));
    wrap.appendChild(createImageJoystick("left", "left_stick_x", "left_stick_y"));
    wrap.appendChild(createImageJoystick("right", "right_stick_x", "right_stick_y"));

    wrap.appendChild(createImageButton("left_bumper", "sim-bumper-left"));
    wrap.appendChild(createImageButton("right_bumper", "sim-bumper-right"));
    wrap.appendChild(createImageButton("back", "sim-small-back"));
    wrap.appendChild(createImageButton("start", "sim-small-start"));
    wrap.appendChild(createImageButton("a", "sim-face-a"));
    wrap.appendChild(createImageButton("b", "sim-face-b"));
    wrap.appendChild(createImageButton("x", "sim-face-x"));
    wrap.appendChild(createImageButton("y", "sim-face-y"));

    const dpad = el("div", { className: "sim-gp-overlay sim-dpad-overlay" });
    dpad.appendChild(createImageButton("dpad_up", "sim-dpad-image-btn sim-dpad-image-up"));
    dpad.appendChild(createImageButton("dpad_down", "sim-dpad-image-btn sim-dpad-image-down"));
    dpad.appendChild(createImageButton("dpad_left", "sim-dpad-image-btn sim-dpad-image-left"));
    dpad.appendChild(createImageButton("dpad_right", "sim-dpad-image-btn sim-dpad-image-right"));
    wrap.appendChild(dpad);

    return wrap;
  }

  function createImageButton(prop, className) {
    const btn = el("div", { className: "sim-gp-overlay button " + className });
    btn.setAttribute("data-gp-input", prop);
    gamepadInputElements[prop] = btn;
    wireHoldButton(btn, prop);
    return btn;
  }

  function wireHoldButton(btn, prop) {
    function press(e) {
      e.preventDefault();
      window.gamepad[prop] = true;
      btn.classList.add("pressed");
      if (btn.setPointerCapture && e.pointerId != null) {
        try {
          btn.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    }
    function release() {
      window.gamepad[prop] = false;
      btn.classList.remove("pressed");
    }
    btn.addEventListener("pointerdown", press);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("lostpointercapture", release);
    btn.addEventListener("mouseleave", release);
  }

  function createImageTrigger(prop, side) {
    const trigger = el("div", {
      className: "sim-trigger-image " + side,
    });
    trigger.setAttribute("data-gp-input", prop);
    gamepadInputElements[prop] = trigger;

    const fill = el("div", { className: "sim-trigger-fill" });
    trigger.appendChild(fill);

    let dragging = false;
    function update(e) {
      const rect = trigger.getBoundingClientRect();
      const pct = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      window.gamepad[prop] = pct;
      fill.style.height = pct * 100 + "%";
    }
    function reset() {
      dragging = false;
      window.gamepad[prop] = 0;
      fill.style.height = "0%";
    }
    trigger.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      dragging = true;
      trigger.setPointerCapture(e.pointerId);
      update(e);
    });
    trigger.addEventListener("pointermove", function (e) {
      if (dragging) update(e);
    });
    trigger.addEventListener("pointerup", reset);
    trigger.addEventListener("pointercancel", reset);
    trigger.addEventListener("lostpointercapture", reset);
    return trigger;
  }

  function createImageJoystick(side, xProp, yProp) {
    const zone = el("div", {
      className: "sim-gp-overlay sim-stick-zone sim-stick-" + side,
    });
    zone.setAttribute("data-gp-input", xProp + "," + yProp);
    gamepadInputElements[xProp] = zone;
    gamepadInputElements[yProp] = zone;

    const knob = el("div", { className: "sim-stick-knob" });
    zone.appendChild(knob);

    wireJoystick(zone, knob, null, xProp, yProp);
    return zone;
  }

  /** Create a joystick input section */
  function createJoystick(side, xProp, yProp) {
    const section = el("div", { className: "sim-gp-section" });
    section.setAttribute("data-gp-input", xProp + "," + yProp);
    gamepadInputElements[xProp] = section;
    gamepadInputElements[yProp] = section;

    const label = el("div", { className: "sim-gp-section-label" });
    label.textContent = side === "left" ? "Left Stick" : "Right Stick";
    section.appendChild(label);

    const zone = el("div", { className: "sim-joystick-zone" });
    zone.id = "sim-joy-zone-" + side;

    // Crosshairs
    zone.appendChild(el("div", { className: "sim-joystick-crosshair-h" }));
    zone.appendChild(el("div", { className: "sim-joystick-crosshair-v" }));

    // Knob
    const knob = el("div", { className: "sim-joystick-knob" });
    knob.id = "sim-joy-knob-" + side;
    zone.appendChild(knob);

    section.appendChild(zone);

    // Value label
    const valueLabel = el("div", { className: "sim-joystick-value" });
    valueLabel.id = "sim-joy-value-" + side;
    valueLabel.textContent = "0.00, 0.00";
    section.appendChild(valueLabel);

    // Wire joystick interaction
    wireJoystick(zone, knob, valueLabel, xProp, yProp);

    return section;
  }

  function wireJoystick(zone, knob, valueLabel, xProp, yProp) {
    let dragging = false;
    let pointerId = null;

    zone.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      dragging = true;
      pointerId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      zone.classList.add("active");
      knob.classList.add("active");
      updateJoystickFromPointer(e);
    });

    zone.addEventListener("pointermove", function (e) {
      if (dragging && e.pointerId === pointerId) {
        updateJoystickFromPointer(e);
      }
    });

    function release() {
      dragging = false;
      pointerId = null;
      zone.classList.remove("active");
      knob.classList.remove("active");
      window.gamepad[xProp] = 0;
      window.gamepad[yProp] = 0;
      knob.style.left = "50%";
      knob.style.top = "50%";
      if (valueLabel) valueLabel.textContent = "0.00, 0.00";
    }

    zone.addEventListener("pointerup", release);
    zone.addEventListener("pointercancel", release);

    function updateJoystickFromPointer(e) {
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxR = Math.min(rect.width, rect.height) / 2 - 14; // knob radius

      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > maxR) {
        dx = (dx / len) * maxR;
        dy = (dy / len) * maxR;
      }

      const nx = Math.max(-1, Math.min(1, dx / maxR));
      // Y is inverted: up on screen = negative Y, but gamepad up = positive
      const ny = Math.max(-1, Math.min(1, -dy / maxR));

      window.gamepad[xProp] = nx;
      window.gamepad[yProp] = ny;

      knob.style.left = 50 + (dx / (rect.width / 2)) * 50 + "%";
      knob.style.top = 50 + (dy / (rect.height / 2)) * 50 + "%";

      if (valueLabel) valueLabel.textContent = nx.toFixed(2) + ", " + ny.toFixed(2);
    }
  }

  /** Create a trigger slider */
  function createTrigger(prop, label) {
    const container = el("div", { className: "sim-trigger-container" });
    container.setAttribute("data-gp-input", prop);
    gamepadInputElements[prop] = container;

    const lbl = el("div", { className: "sim-gp-section-label" });
    lbl.textContent = label;
    container.appendChild(lbl);

    const slider = el("div", { className: "sim-trigger-slider" });
    slider.id = "sim-trigger-" + prop;
    const fill = el("div", { className: "sim-trigger-fill" });
    fill.id = "sim-trigger-fill-" + prop;
    fill.style.height = "0%";
    slider.appendChild(fill);
    container.appendChild(slider);

    const valueLabel = el("div", { className: "sim-trigger-value" });
    valueLabel.id = "sim-trigger-val-" + prop;
    valueLabel.textContent = "0.00";
    container.appendChild(valueLabel);

    // Wire interaction
    let dragging = false;

    function updateTrigger(e) {
      const rect = slider.getBoundingClientRect();
      const pct = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      window.gamepad[prop] = pct;
      fill.style.height = pct * 100 + "%";
      valueLabel.textContent = pct.toFixed(2);
    }

    slider.addEventListener("pointerdown", function (e) {
      dragging = true;
      slider.setPointerCapture(e.pointerId);
      updateTrigger(e);
    });
    slider.addEventListener("pointermove", function (e) {
      if (dragging) updateTrigger(e);
    });
    slider.addEventListener("pointerup", function () {
      dragging = false;
      window.gamepad[prop] = 0;
      fill.style.height = "0%";
      valueLabel.textContent = "0.00";
    });
    slider.addEventListener("pointercancel", function () {
      dragging = false;
      window.gamepad[prop] = 0;
      fill.style.height = "0%";
      valueLabel.textContent = "0.00";
    });

    return container;
  }

  /** Create face buttons (A, B, X, Y) in a cross pattern */
  function createFaceButtons() {
    const section = el("div", { className: "sim-gp-section" });
    const lbl = el("div", { className: "sim-gp-section-label" });
    lbl.textContent = "Buttons";
    section.appendChild(lbl);

    const grid = el("div", { className: "sim-gp-btn-grid face-buttons" });

    // 3x3 grid: [empty, Y, empty], [X, empty, B], [empty, A, empty]
    const layout = [
      [null, "y", null],
      ["x", null, "b"],
      [null, "a", null],
    ];
    const colors = {
      a: "btn-a",
      b: "btn-b",
      x: "btn-x",
      y: "btn-y",
    };

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const name = layout[r][c];
        if (name) {
          const btn = createToggleButton(
            name,
            name.toUpperCase(),
            "sim-gp-btn " + colors[name]
          );
          grid.appendChild(btn);
        } else {
          const spacer = el("div");
          spacer.style.width = "32px";
          spacer.style.height = "32px";
          grid.appendChild(spacer);
        }
      }
    }

    section.appendChild(grid);
    return section;
  }

  /** Create DPad */
  function createDPad() {
    const section = el("div", { className: "sim-gp-section" });
    const lbl = el("div", { className: "sim-gp-section-label" });
    lbl.textContent = "D-Pad";
    section.appendChild(lbl);

    const grid = el("div", { className: "sim-dpad-grid" });
    const layout = [
      [null, "dpad_up", null],
      ["dpad_left", null, "dpad_right"],
      [null, "dpad_down", null],
    ];
    const arrows = {
      dpad_up: "▲",
      dpad_down: "▼",
      dpad_left: "<",
      dpad_right: ">",
    };

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const name = layout[r][c];
        if (name) {
          const btn = createToggleButton(
            name,
            arrows[name],
            "sim-dpad-btn"
          );
          grid.appendChild(btn);
        } else if (r === 1 && c === 1) {
          const center = el("div", { className: "sim-dpad-btn sim-dpad-center" });
          grid.appendChild(center);
        } else {
          const spacer = el("div");
          spacer.style.width = "28px";
          spacer.style.height = "28px";
          grid.appendChild(spacer);
        }
      }
    }

    section.appendChild(grid);
    return section;
  }

  /** Create a bumper button */
  function createBumper(prop, label) {
    const btn = createToggleButton(prop, label, "sim-gp-bumper");
    return btn;
  }

  /** Create a small button (start/back) */
  function createSmallButton(prop, label) {
    return createToggleButton(prop, label, "sim-gp-small-btn");
  }

  /**
   * Generic toggle button factory.
   * Clicking toggles pressed state and updates gamepad[prop].
   */
  function createToggleButton(prop, label, className) {
    const btn = el("div", { className: className });
    btn.textContent = label;
    btn.setAttribute("data-gp-input", prop);
    btn.style.cursor = "pointer";
    gamepadInputElements[prop] = btn;

    btn.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      const isPressed = !window.gamepad[prop];
      window.gamepad[prop] = isPressed;
      if (isPressed) {
        btn.classList.add("pressed");
      } else {
        btn.classList.remove("pressed");
      }
    });

    return btn;
  }

  /** Wire gamepad card drag, resize, collapse */
  function wireGamepadCardEvents(card, titlebar, collapseBtn, body, resizeHandle) {
    let collapsed = false;
    let savedWidth = null;
    let savedHeight = null;

    // ── Collapse/Expand ──
    collapseBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      collapsed = !collapsed;
      if (collapsed) {
        // Save current dimensions
        savedWidth = card.style.width || null;
        savedHeight = card.style.height || null;
        body.style.display = "none";
        resizeHandle.style.display = "none";
        card.style.height = "auto";
        collapseBtn.innerHTML = "+";
      } else {
        body.style.display = "";
        resizeHandle.style.display = "";
        if (savedWidth) card.style.width = savedWidth;
        if (savedHeight) card.style.height = savedHeight;
        collapseBtn.innerHTML = "−";
      }
    });

    // ── Drag ──
    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    titlebar.addEventListener("pointerdown", function (e) {
      if (e.target === collapseBtn || e.target.parentElement === collapseBtn)
        return;
      dragging = true;
      const rect = card.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      titlebar.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    titlebar.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      const newLeft = Math.max(
        0,
        Math.min(window.innerWidth - card.offsetWidth, e.clientX - dragOffsetX)
      );
      const newTop = Math.max(
        0,
        Math.min(window.innerHeight - 40, e.clientY - dragOffsetY)
      );
      card.style.left = newLeft + "px";
      card.style.top = newTop + "px";
      card.style.right = "auto";
      card.style.bottom = "auto";
    });

    titlebar.addEventListener("pointerup", function () {
      dragging = false;
    });
    titlebar.addEventListener("pointercancel", function () {
      dragging = false;
    });

    // ── Resize ──
    let resizing = false;
    let resizeStartX = 0;
    let resizeStartY = 0;
    let resizeStartW = 0;
    let resizeStartH = 0;

    resizeHandle.addEventListener("pointerdown", function (e) {
      resizing = true;
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      resizeStartW = card.offsetWidth;
      resizeStartH = card.offsetHeight;
      resizeHandle.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    });

    resizeHandle.addEventListener("pointermove", function (e) {
      if (!resizing) return;
      card.style.width =
        Math.max(260, resizeStartW + (e.clientX - resizeStartX)) + "px";
      card.style.height =
        Math.max(80, resizeStartH + (e.clientY - resizeStartY)) + "px";
    });

    resizeHandle.addEventListener("pointerup", function () {
      resizing = false;
    });
    resizeHandle.addEventListener("pointercancel", function () {
      resizing = false;
    });
  }

  /**
   * setActiveInputs(array) — highlights lesson-relevant controls.
   * Example: setActiveInputs(["y", "a", "left_stick_y"])
   * Input names that share an element (e.g. left_stick_x and left_stick_y
   * share a joystick) are handled: if ANY shared input is listed, the element
   * is highlighted. Unlisted inputs remain usable for experimentation.
   */
  window.setActiveInputs = function (activeList) {
    const activeSet = new Set(activeList);

    // Track which elements should be highlighted
    const elementActive = new Map();

    for (const prop in gamepadInputElements) {
      const elem = gamepadInputElements[prop];
      if (!elementActive.has(elem)) {
        elementActive.set(elem, false);
      }
      if (activeSet.has(prop)) {
        elementActive.set(elem, true);
      }
    }

    elementActive.forEach(function (isActive, elem) {
      if (isActive) {
        elem.classList.remove("sim-gp-input-inactive");
        elem.classList.add("sim-gp-input-recommended");
      } else {
        elem.classList.remove("sim-gp-input-recommended");
        elem.classList.add("sim-gp-input-inactive");
      }
    });
  };

  // ========================================================================
  // SECTION 6: PANEL RESIZER
  // ========================================================================

  function wireResizerEvents() {
    const resizer = document.getElementById("sim-resizer");
    const leftPanel = document.getElementById("sim-left-panel");
    const rightPanel = document.getElementById("sim-right-panel");
    if (!resizer || !leftPanel || !rightPanel) return;

    let isResizing = false;
    let activePointerId = null;

    function pxValue(value, fallback) {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    function resizeScene() {
      window.dispatchEvent(new Event("resize"));
    }

    function setPanelWidth(clientX) {
      const bodyRect = document.body.getBoundingClientRect();
      const totalWidth = bodyRect.width;
      const resizerWidth = resizer.offsetWidth || 6;
      const leftStyle = window.getComputedStyle(leftPanel);
      const rightStyle = window.getComputedStyle(rightPanel);
      const minLeft = pxValue(leftStyle.minWidth, 260);
      const minRight = pxValue(rightStyle.minWidth, 260);
      const minWidth = Math.min(minLeft, Math.max(160, totalWidth - resizerWidth - minRight));
      const maxWidth = Math.max(minWidth, totalWidth - resizerWidth - minRight);
      const width = Math.max(minWidth, Math.min(maxWidth, clientX - bodyRect.left));

      leftPanel.style.flex = "0 0 " + width + "px";
      leftPanel.style.width = width + "px";
      rightPanel.style.flex = "1 1 0";
      rightPanel.style.width = "auto";
      resizeScene();
    }

    resizer.addEventListener("pointerdown", function (e) {
      isResizing = true;
      activePointerId = e.pointerId;
      resizer.classList.add("active");
      if (resizer.setPointerCapture && e.pointerId != null) {
        resizer.setPointerCapture(e.pointerId);
      }
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      setPanelWidth(e.clientX);
      e.preventDefault();
    });

    function moveResize(e) {
      if (!isResizing) return;
      if (activePointerId != null && e.pointerId != null && e.pointerId !== activePointerId) return;
      setPanelWidth(e.clientX);
      e.preventDefault();
    }

    document.addEventListener("pointermove", moveResize);
    window.addEventListener("pointermove", moveResize);

    function endResize() {
      isResizing = false;
      activePointerId = null;
      resizer.classList.remove("active");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      resizeScene();
    }

    document.addEventListener("pointerup", endResize);
    document.addEventListener("pointercancel", endResize);
    window.addEventListener("pointerup", endResize);
    window.addEventListener("pointercancel", endResize);
  }

  // ========================================================================
  // SECTION 7: RUN/STOP CONTROLS & RUNTIME
  // ========================================================================

  let initialized = false;
  let running = false;
  let loopInterval = null;
  let initLoopInterval = null;
  let pendingLoopFn = null;
  let timerInterval = null;
  let runtimeStart = 0;
  let stopRequested = true;
  let studentLifecycle = null;
  const pendingSleepTimers = new Map();

  window.getRuntime = function () {
    return (Date.now() - runtimeStart) / 1000;
  };

  window.isStopRequested = function () {
    return stopRequested;
  };

  /**
   * sleep(ms) for use in LinearOpMode transpiled code.
   * Returns a Promise that resolves after ms milliseconds.
   */
  window.sleep = function (ms) {
    return new Promise(function (resolve) {
      const timer = setTimeout(function () {
        pendingSleepTimers.delete(timer);
        resolve();
      }, ms);
      pendingSleepTimers.set(timer, resolve);
    });
  };

  function wireRunStopEvents() {
    const btnRun = document.getElementById("sim-btn-run");
    const btnStop = document.getElementById("sim-btn-stop");

    if (btnRun) {
      btnRun.addEventListener("click", function () {
        if (!initialized) handleInit();
        else handleStart();
      });
    }
    if (btnStop) {
      btnStop.addEventListener("click", function () {
        handleStop();
      });
    }
  }

  function setPrimaryButton(label, disabled) {
    const btnRun = document.getElementById("sim-btn-run");
    if (!btnRun) return;
    btnRun.textContent = label;
    btnRun.disabled = !!disabled;
  }

  function setDriverStationState(label, color) {
    const dsState = document.getElementById("sim-ds-state");
    if (!dsState) return;
    dsState.textContent = label;
    dsState.style.color = color;
  }

  function startTimer() {
    runtimeStart = Date.now();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      const timerVal = document.getElementById("sim-timer-val");
      if (timerVal) {
        timerVal.textContent = (
          (Date.now() - runtimeStart) /
          1000
        ).toFixed(2);
      }
    }, 50);
  }

  function startPendingLoop() {
    if (!pendingLoopFn) return;
    const fn = pendingLoopFn;
    pendingLoopFn = null;
    window._simStartLoop(fn);
  }

  function handleInit() {
    if (initialized || running) return;
    initialized = true;
    running = false;
    stopRequested = false;
    pendingLoopFn = null;

    const telLog = document.getElementById("sim-telemetry-log");

    if (telLog) telLog.innerHTML = "";
    setDriverStationState("INIT", "var(--active)");
    setPrimaryButton("Start", false);

    // Clear pending telemetry
    window.clearTelemetry();

    // Call the challenge's explicit init callback. Existing challenge files
    // that still define onRun are treated as init for backward compatibility.
    if (typeof window.onInit === "function") {
      window.onInit();
    } else if (typeof window.onRun === "function") {
      window.onRun();
    }

    if (studentLifecycle && typeof studentLifecycle.initLoop === "function") {
      initLoopInterval = setInterval(function () {
        if (initialized && !running) studentLifecycle.initLoop();
      }, 50);
    }
  }

  function handleStart() {
    if (!initialized || running) return;
    running = true;
    stopRequested = false;

    if (initLoopInterval) {
      clearInterval(initLoopInterval);
      initLoopInterval = null;
    }

    setDriverStationState("RUNNING", "var(--good)");
    setPrimaryButton("Start", true);
    startTimer();

    if (studentLifecycle && typeof studentLifecycle.start === "function") {
      studentLifecycle.start();
    }
    startPendingLoop();

    if (typeof window.onStart === "function") {
      window.onStart();
    }
  }

  function handleRun() {
    if (!initialized) handleInit();
    if (initialized && !running) handleStart();
  }

  function handleStop() {
    initialized = false;
    running = false;
    stopRequested = true;
    pendingLoopFn = null;

    if (loopInterval) {
      clearInterval(loopInterval);
      loopInterval = null;
    }
    if (initLoopInterval) {
      clearInterval(initLoopInterval);
      initLoopInterval = null;
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    pendingSleepTimers.forEach(function (resolve, timer) {
      clearTimeout(timer);
      resolve();
    });
    pendingSleepTimers.clear();

    const dsState = document.getElementById("sim-ds-state");
    const btnRun = document.getElementById("sim-btn-run");
    const timerVal = document.getElementById("sim-timer-val");

    if (dsState) {
      dsState.textContent = "STOPPED";
      dsState.style.color = "var(--danger)";
    }
    if (btnRun) {
      btnRun.disabled = false;
      btnRun.textContent = "Init";
    }
    if (timerVal) timerVal.textContent = "0.00";

    if (studentLifecycle && typeof studentLifecycle.stop === "function") {
      studentLifecycle.stop();
    }
    studentLifecycle = null;

    // Call the challenge's onStop callback
    if (typeof window.onStop === "function") {
      window.onStop();
    }
  }

  // Expose for transpiler
  window._simHandleRun = handleRun;
  window._simHandleInit = handleInit;
  window._simHandleStart = handleStart;
  window._simHandleStop = handleStop;
  window._simIsRunning = function () {
    return running;
  };
  window._simIsInitialized = function () {
    return initialized;
  };

  // ========================================================================
  // SECTION 8: MINI-TRANSPILER ENGINE
  // ========================================================================
  // Converts student Java code into executable JavaScript.
  // ========================================================================

  /**
   * Extract the body of a method from Java source code.
   * Returns the code between the opening { and closing } of the method.
   */
  function getMethodBody(code, name) {
    if (window.TelemarkJava) {
      try {
        const method = window.TelemarkJava.findMethod(code, name);
        return method ? method.body : null;
      } catch (error) {
        showTelemetryError(
          `${error.message} (line ${error.line || 1}, column ${error.column || 1})`
        );
        return null;
      }
    }

    // Match "void methodName(...) {"
    const re = new RegExp(
      "(?:public\\s+)?void\\s+" + name + "\\s*\\([^)]*\\)\\s*\\{"
    );
    const m = re.exec(code);
    if (!m) return null;

    let idx = m.index + m[0].length;
    let depth = 1;
    for (; idx < code.length; idx++) {
      if (code[idx] === "{") depth++;
      else if (code[idx] === "}") {
        depth--;
        if (depth === 0) {
          return code.slice(m.index + m[0].length, idx);
        }
      }
    }
    return null;
  }

  /**
   * Transpile a block of Java code into JavaScript.
   */
  function transpileJava(java) {
    if (window.TelemarkJava) {
      return window.TelemarkJava.transpileBody(java, {
        gamepad1Name: "gamepad",
        gamepad2Name: "gamepad2",
        addTelemetryName: "addTelemetry",
        updateTelemetryName: "updateTelemetry",
        clearTelemetryName: "clearTelemetry",
      });
    }

    let js = java;

    // Strip Java type declarations → let
    js = js.replace(
      /\b(double|int|boolean|String|float|long|byte|short|char)\s+(?=[a-zA-Z_])/g,
      "let "
    );

    // Strip common FTC hardware type declarations → let
    js = js.replace(
      /\b(DcMotor|DcMotorEx|Servo|CRServo|TouchSensor|DigitalChannel|ColorSensor|DistanceSensor|IMU|BNO055IMU)\s+(?=[a-zA-Z_])/g,
      "let "
    );

    // Handle array declarations: let[] → let
    js = js.replace(/\blet\s*\[\s*\]/g, "let ");

    // Replace gamepad1. with gamepad.
    js = js.replace(/\bgamepad1\./g, "gamepad.");

    // Replace telemetry.addData( with addTelemetry(
    js = js.replace(/\btelemetry\s*\.\s*addData\s*\(/g, "addTelemetry(");

    // Replace telemetry.update() with updateTelemetry()
    js = js.replace(
      /\btelemetry\s*\.\s*update\s*\(\s*\)/g,
      "updateTelemetry()"
    );

    // Replace telemetry.clear() with clearTelemetry()
    js = js.replace(
      /\btelemetry\s*\.\s*clear\s*\(\s*\)/g,
      "clearTelemetry()"
    );

    // Replace getRuntime() — already a global function, just ensure it's available
    // (No replacement needed since getRuntime is defined globally)

    // Replace hardwareMap.get(Type.class, "name") with hardwareMap.get("Type", "name")
    js = js.replace(
      /\bhardwareMap\s*\.\s*get\s*\(\s*(\w+)\.class\s*,/g,
      'hardwareMap.get("$1",'
    );

    // Replace common FTC enum constants with simple simulator values
    js = js.replace(
      /\bServo\s*\.\s*Direction\s*\.\s*(FORWARD|REVERSE)\b/g,
      '"$1"'
    );
    js = js.replace(
      /\b(?:DcMotor|DcMotorSimple)\s*\.\s*Direction\s*\.\s*(FORWARD|REVERSE)\b/g,
      '"$1"'
    );

    // Add iteration safety cap to while and for loops
    js = addLoopSafety(js);

    return js;
  }

  /**
   * Add iteration safety caps to while and for loops.
   * Injects a counter that throws after 10000 iterations.
   */
  function addLoopSafety(js) {
    let counter = 0;

    // Process while loops
    js = js.replace(
      /\bwhile\s*\(([^)]*)\)\s*\{/g,
      function (match, cond) {
        const varName = "__loopGuard" + counter++;
        return (
          "let " +
          varName +
          "=0; while(" +
          cond +
          "){ if(++" +
          varName +
          ">10000) throw new Error('Loop exceeded 10000 iterations — possible infinite loop');"
        );
      }
    );

    // Process for loops
    js = js.replace(
      /\bfor\s*\(([^)]*)\)\s*\{/g,
      function (match, cond) {
        const varName = "__loopGuard" + counter++;
        return (
          "let " +
          varName +
          "=0; for(" +
          cond +
          "){ if(++" +
          varName +
          ">10000) throw new Error('Loop exceeded 10000 iterations — possible infinite loop');"
        );
      }
    );

    return js;
  }

  /**
   * Detect blocking loops in loop() body.
   * If while(gamepad... or while(true) is found, throw before executing.
   */
  function detectBlockingLoop(javaBody) {
    // Check for while loops that reference gamepad or are while(true)
    const blockingPatterns = [
      /\bwhile\s*\(\s*gamepad/,
      /\bwhile\s*\(\s*true\s*\)/,
      /\bwhile\s*\(\s*!?\s*gamepad/,
    ];
    for (const pattern of blockingPatterns) {
      if (pattern.test(javaBody)) {
        return true;
      }
    }
    return false;
  }

  function stripMethodBodies(code) {
    const chars = code.split("");
    const re =
      /(?:@\w+(?:\([^)]*\))?\s*)*(?:public|private|protected)?\s*(?:static\s+)?(?:void|[\w<>[\]]+)\s+\w+\s*\([^)]*\)\s*\{/g;
    let match;

    while ((match = re.exec(code)) !== null) {
      let idx = re.lastIndex;
      let depth = 1;
      for (; idx < code.length; idx++) {
        if (code[idx] === "{") depth++;
        else if (code[idx] === "}") {
          depth--;
          if (depth === 0) break;
        }
      }

      for (let i = re.lastIndex; i < idx; i++) {
        chars[i] = " ";
      }
      re.lastIndex = idx + 1;
    }

    return chars.join("");
  }

  function extractClassFields(code) {
    const fields = [];
    const fieldMap = {};
    const classOnlyCode = stripMethodBodies(code);
    const re =
      /\b(DcMotor|DcMotorEx|Servo|CRServo|TouchSensor|DigitalChannel|ColorSensor|DistanceSensor|IMU|BNO055IMU|double|int|boolean|String|float|long|byte|short|char)\s+([^;]+);/g;
    let match;

    while ((match = re.exec(classOnlyCode)) !== null) {
      match[2].split(",").forEach(function (part) {
        const nameMatch = part.trim().match(/^([A-Za-z_$][\w$]*)(?:\s*=\s*([\s\S]+))?$/);
        if (nameMatch && !fieldMap[nameMatch[1]]) {
          const field = {
            name: nameMatch[1],
            initializer: nameMatch[2] ? transpileJava(nameMatch[2].trim()) : undefined,
          };
          fieldMap[field.name] = field;
          fields.push(field);
        }
      });
    }

    return fields;
  }

  function wrapWithClassFieldScope(js, fields) {
    if (!fields || fields.length === 0) return js;

    const load = fields
      .map(function (field) {
        let expr = "__scope." + field.name;
        if (field.initializer !== undefined) {
          expr =
            "(__scope." +
            field.name +
            "!==undefined?__scope." +
            field.name +
            ":(" +
            field.initializer +
            "))";
        }
        return "var " + field.name + "=" + expr + ";";
      })
      .join("\n");
    const store = fields
      .map(function (field) {
        return "__scope." + field.name + "=" + field.name + ";";
      })
      .join("\n");

    return load + "\n" + js + "\n" + store;
  }

  /**
   * transpileAndRun(javaCode, initHandler, loopHandler)
   * 
   * - Extracts init() and loop() method bodies from javaCode
   * - Transpiles each to JavaScript
   * - Calls initHandler with a function wrapping the transpiled init body
   * - Calls loopHandler with a function wrapping the transpiled loop body,
   *   which will be invoked at 20Hz via setInterval
   * 
   * initHandler(initFn): called once with the init function
   * loopHandler(loopFn): called with the loop function; the base sets up
   *   the 20Hz interval and stores it for stopExecution()
   */
  window.transpileAndRun = function (javaCode, initHandler, loopHandler) {
    try {
      if (window.TelemarkJava) {
        const compiled = window.TelemarkJava.compile(javaCode, {
          gamepad1: window.gamepad,
          gamepad2: window.gamepad2,
          hardwareMap: window.hardwareMap,
          addTelemetry: window.addTelemetry,
          updateTelemetry: window.updateTelemetry,
          clearTelemetry: window.clearTelemetry,
          getRuntime: window.getRuntime,
          isStopRequested: window.isStopRequested,
          opModeIsActive: function () {
            return initialized && running && !stopRequested;
          },
          waitForStart: function () {
            return new Promise(function (resolve) {
              const poll = setInterval(function () {
                if (running || stopRequested) {
                  clearInterval(poll);
                  resolve();
                }
              }, 20);
            });
          },
          sleep: window.sleep,
        });

        if (!compiled.ok) {
          const diagnostic = compiled.diagnostics[0];
          showTelemetryError(
            `${diagnostic.message} (line ${diagnostic.line}, column ${diagnostic.column})`
          );
          return;
        }

        studentLifecycle = {
          initLoop: compiled.methods.init_loop || null,
          start: compiled.methods.start || null,
          stop: compiled.methods.stop || null,
        };

        if (compiled.kind === "linear") {
          Promise.resolve(compiled.methods.runOpMode?.()).catch(function (error) {
            showTelemetryError("runOpMode() runtime error: " + error.message);
            window.stopExecution();
          });
          return;
        }

        if (compiled.methods.init && initHandler) {
          initHandler(compiled.methods.init);
        } else if (compiled.methods.init) {
          compiled.methods.init();
        }

        if (compiled.methods.loop) {
          const wrappedLoop = function () {
            try {
              window.clearTelemetry();
              compiled.methods.loop();
              window.updateTelemetry();
            } catch (error) {
              showTelemetryError("loop() runtime error: " + error.message);
              window.stopExecution();
            }
          };
          if (loopHandler) loopHandler(wrappedLoop);
          else window._simStartLoop(wrappedLoop);
        }
        return;
      }

      // Extract method bodies
      const initBody = getMethodBody(javaCode, "init");
      const loopBody = getMethodBody(javaCode, "loop");
      const classFields = extractClassFields(javaCode);
      const classScope = {};
      classFields.forEach(function (field) {
        classScope[field.name] = undefined;
      });

      // Transpile init
      if (initBody !== null) {
        const initJS = wrapWithClassFieldScope(
          transpileJava(initBody),
          classFields
        );
        try {
          const initFn = new Function(
            "gamepad",
            "hardwareMap",
            "addTelemetry",
            "updateTelemetry",
            "clearTelemetry",
            "getRuntime",
            "__scope",
            '"use strict";\n' + initJS
          );
          if (initHandler) {
            initHandler(function () {
              initFn(
                window.gamepad,
                window.hardwareMap,
                window.addTelemetry,
                window.updateTelemetry,
                window.clearTelemetry,
                window.getRuntime,
                classScope
              );
            });
          }
        } catch (e) {
          showTelemetryError("init() error: " + e.message);
          return;
        }
      }

      // Transpile loop
      if (loopBody !== null) {
        // Check for blocking loops
        if (detectBlockingLoop(loopBody)) {
          showTelemetryError(
            "Blocking loop detected in loop()! Do not use while(gamepad...) or while(true) inside loop(). The loop() method is already called repeatedly."
          );
          return;
        }

        const loopJS = wrapWithClassFieldScope(
          transpileJava(loopBody),
          classFields
        );
        try {
          const loopFn = new Function(
            "gamepad",
            "hardwareMap",
            "addTelemetry",
            "updateTelemetry",
            "clearTelemetry",
            "getRuntime",
            "isStopRequested",
            "__scope",
            '"use strict";\n' + loopJS
          );
          let wrappedLoop = function () {
            try {
              // Clear telemetry for this frame
              window.clearTelemetry();
              loopFn(
                window.gamepad,
                window.hardwareMap,
                window.addTelemetry,
                window.updateTelemetry,
                window.clearTelemetry,
                window.getRuntime,
                window.isStopRequested,
                classScope
              );
              window.updateTelemetry();
            } catch (e) {
              showTelemetryError("loop() runtime error: " + e.message);
              window.stopExecution();
            }
          };

          if (loopHandler) {
            loopHandler(wrappedLoop);
          } else {
            // Start after the Driver Station Start button. If this was called
            // during Init, _simStartLoop stores the loop until Start is pressed.
            window._simStartLoop(wrappedLoop);
          }
        } catch (e) {
          showTelemetryError("loop() compile error: " + e.message);
          return;
        }
      }
    } catch (e) {
      showTelemetryError("Transpiler error: " + e.message);
    }
  };

  /**
   * stopExecution() — clears the loop interval and stops execution.
   */
  window.stopExecution = function () {
    if (loopInterval) {
      clearInterval(loopInterval);
      loopInterval = null;
    }
    handleStop();
  };

  // Expose internal transpiler utilities for challenges that need custom control
  window._simTranspile = transpileJava;
  window._simGetMethodBody = getMethodBody;
  window._simDetectBlockingLoop = detectBlockingLoop;
  window._simShowTelemetryError = showTelemetryError;

  /**
   * Start a 20Hz loop that calls the provided function.
   * Returns the interval ID. Stored in loopInterval for stopExecution().
   */
  window._simStartLoop = function (fn) {
    if (loopInterval) clearInterval(loopInterval);
    loopInterval = null;
    if (!running) {
      pendingLoopFn = fn;
      return null;
    }
    loopInterval = setInterval(fn, 50);
    return loopInterval;
  };

  // ========================================================================
  // SECTION 9: HARDWARE MAP REGISTRY
  // ========================================================================
  // Mock hardware devices that fire callbacks when methods are called.
  // ========================================================================

  const hwCallbacks = {
    onMotorPower: [],
    onMotorDirection: [],
    onMotorMode: [],
    onMotorZeroPower: [],
    onServoPower: [],
    onServoPosition: [],
    onServoDirection: [],
    onCRServoPower: [],
    onTouchSensor: [],
    onColorSensor: [],
    onIMU: [],
  };

  /** Registry of mock devices by name */
  const hwDevices = {};

  /**
   * Mock DcMotor
   */
  function MockDcMotor(name) {
    this._name = name;
    this._power = 0;
    this._direction = "FORWARD";
    this._mode = "RUN_WITHOUT_ENCODER";
    this._zeroPowerBehavior = "BRAKE";
    this._currentPosition = 0;
    this._ticksPerRev = 1120;
  }

  MockDcMotor.prototype.setPower = function (power) {
    this._power = Math.max(-1, Math.min(1, power));
    hwCallbacks.onMotorPower.forEach(
      function (cb) {
        cb(this._name, this._power);
      }.bind(this)
    );
  };

  MockDcMotor.prototype.getPower = function () {
    return this._power;
  };

  MockDcMotor.prototype.setDirection = function (dir) {
    this._direction = dir;
    hwCallbacks.onMotorDirection.forEach(
      function (cb) {
        cb(this._name, dir);
      }.bind(this)
    );
  };

  MockDcMotor.prototype.getDirection = function () {
    return this._direction;
  };

  MockDcMotor.prototype.setMode = function (mode) {
    this._mode = mode;
    hwCallbacks.onMotorMode.forEach(
      function (cb) {
        cb(this._name, mode);
      }.bind(this)
    );
  };

  MockDcMotor.prototype.getMode = function () {
    return this._mode;
  };

  MockDcMotor.prototype.setZeroPowerBehavior = function (behavior) {
    this._zeroPowerBehavior = behavior;
    hwCallbacks.onMotorZeroPower.forEach(
      function (cb) {
        cb(this._name, behavior);
      }.bind(this)
    );
  };

  MockDcMotor.prototype.getCurrentPosition = function () {
    return this._currentPosition;
  };

  MockDcMotor.prototype.getMotorType = function () {
    return {
      getTicksPerRev: function () {
        return this._ticksPerRev;
      }.bind(this),
    };
  };

  MockDcMotor.prototype.setTargetPosition = function (pos) {
    this._targetPosition = pos;
  };

  MockDcMotor.prototype.isBusy = function () {
    return false;
  };

  /**
   * Mock Servo
   */
  function MockServo(name) {
    this._name = name;
    this._position = 0;
    this._physicalPosition = 0;
    this._scaleMin = 0;
    this._scaleMax = 1;
    this._direction = "FORWARD";
  }

  MockServo.prototype.setPosition = function (pos) {
    this._position = Math.max(0, Math.min(1, pos));
    this._physicalPosition =
      this._scaleMin + this._position * (this._scaleMax - this._scaleMin);
    hwCallbacks.onServoPosition.forEach(
      function (cb) {
        cb(this._name, this._position, this._physicalPosition);
      }.bind(this)
    );
  };

  MockServo.prototype.getPosition = function () {
    return this._position;
  };

  MockServo.prototype.getPhysicalPosition = function () {
    return this._physicalPosition;
  };

  MockServo.prototype.scaleRange = function (min, max) {
    min = Number(min);
    max = Number(max);
    if (!isFinite(min) || !isFinite(max)) return;
    if (typeof window.setServoScaleRange === "function") {
      window.setServoScaleRange(this._name, min, max);
    }
    if (min < 0 || max > 1 || min >= max) return;
    this._scaleMin = min;
    this._scaleMax = max;
    this._physicalPosition =
      this._scaleMin + this._position * (this._scaleMax - this._scaleMin);
  };

  MockServo.prototype.setDirection = function (dir) {
    this._direction = dir === "REVERSE" ? "REVERSE" : "FORWARD";
    hwCallbacks.onServoDirection.forEach(
      function (cb) {
        cb(this._name, this._direction);
      }.bind(this)
    );
  };

  MockServo.prototype.getDirection = function () {
    return this._direction;
  };

  /**
   * Mock CRServo (continuous rotation)
   */
  function MockCRServo(name) {
    this._name = name;
    this._power = 0;
    this._direction = "FORWARD";
  }

  MockCRServo.prototype.setPower = function (power) {
    this._power = Math.max(-1, Math.min(1, power));
    hwCallbacks.onCRServoPower.forEach(
      function (cb) {
        cb(this._name, this._power);
      }.bind(this)
    );
  };

  MockCRServo.prototype.getPower = function () {
    return this._power;
  };

  MockCRServo.prototype.setDirection = function (dir) {
    this._direction = dir;
  };

  /**
   * Mock TouchSensor
   */
  function MockTouchSensor(name) {
    this._name = name;
    this._pressed = false;
  }

  MockTouchSensor.prototype.isPressed = function () {
    return this._pressed;
  };

  // Allow challenges to set the pressed state
  MockTouchSensor.prototype._setPressed = function (val) {
    this._pressed = val;
    hwCallbacks.onTouchSensor.forEach(
      function (cb) {
        cb(this._name, val);
      }.bind(this)
    );
  };

  /**
   * Mock ColorSensor
   */
  function MockColorSensor(name) {
    this._name = name;
    this._red = 0;
    this._green = 0;
    this._blue = 0;
    this._alpha = 0;
    this._argb = 0;
  }

  MockColorSensor.prototype.red = function () {
    return this._red;
  };
  MockColorSensor.prototype.green = function () {
    return this._green;
  };
  MockColorSensor.prototype.blue = function () {
    return this._blue;
  };
  MockColorSensor.prototype.alpha = function () {
    return this._alpha;
  };
  MockColorSensor.prototype.argb = function () {
    return this._argb;
  };

  // Allow challenges to set values
  MockColorSensor.prototype._setColor = function (r, g, b, a) {
    this._red = r;
    this._green = g;
    this._blue = b;
    this._alpha = a || 0;
    this._argb = ((a || 255) << 24) | (r << 16) | (g << 8) | b;
    hwCallbacks.onColorSensor.forEach(
      function (cb) {
        cb(this._name, { r: r, g: g, b: b, a: a });
      }.bind(this)
    );
  };

  /**
   * Mock IMU
   */
  function MockIMU(name) {
    this._name = name;
    this._heading = 0;
    this._angularVelocity = { x: 0, y: 0, z: 0 };
    this._orientation = { heading: 0, pitch: 0, roll: 0 };
  }

  MockIMU.prototype.initialize = function () {};

  MockIMU.prototype.resetYaw = function () {
    this._heading = 0;
  };

  MockIMU.prototype.getRobotYawPitchRollAngles = function () {
    const self = this;
    return {
      getYaw: function () {
        return self._heading;
      },
      getPitch: function () {
        return self._orientation.pitch;
      },
      getRoll: function () {
        return self._orientation.roll;
      },
    };
  };

  MockIMU.prototype.getRobotAngularVelocity = function () {
    return this._angularVelocity;
  };

  // Allow challenges to set heading
  MockIMU.prototype._setHeading = function (deg) {
    this._heading = deg;
    hwCallbacks.onIMU.forEach(
      function (cb) {
        cb(this._name, { heading: deg });
      }.bind(this)
    );
  };

  /**
   * The global hardwareMap object
   */
  window.hardwareMap = {
    _devices: hwDevices,

    registerMotor: function (name) {
      const motor = new MockDcMotor(name);
      hwDevices[name] = motor;
      return motor;
    },

    registerServo: function (name) {
      const servo = new MockServo(name);
      hwDevices[name] = servo;
      return servo;
    },

    registerCRServo: function (name) {
      const crServo = new MockCRServo(name);
      hwDevices[name] = crServo;
      return crServo;
    },

    registerTouchSensor: function (name) {
      const sensor = new MockTouchSensor(name);
      hwDevices[name] = sensor;
      return sensor;
    },

    registerColorSensor: function (name) {
      const sensor = new MockColorSensor(name);
      hwDevices[name] = sensor;
      return sensor;
    },

    registerIMU: function (name) {
      const imu = new MockIMU(name);
      hwDevices[name] = imu;
      return imu;
    },

    /**
     * Intercepts hardwareMap.get(Type.class, "name") from transpiled code.
     * The transpiler converts Type.class to "Type" string.
     */
    get: function (type, name) {
      // If the device already exists, return it
      if (hwDevices[name]) return hwDevices[name];

      // Auto-register based on type string
      const typeStr = String(type).toLowerCase();
      if (typeStr.includes("dcmotor")) {
        return this.registerMotor(name);
      } else if (typeStr.includes("crservo")) {
        return this.registerCRServo(name);
      } else if (typeStr.includes("servo")) {
        return this.registerServo(name);
      } else if (typeStr.includes("touch")) {
        return this.registerTouchSensor(name);
      } else if (typeStr.includes("color")) {
        return this.registerColorSensor(name);
      } else if (typeStr.includes("imu")) {
        return this.registerIMU(name);
      }

      // Fallback: create a generic motor
      console.warn(
        "[HardwareMap] Unknown type '" + type + "' for device '" + name + "', defaulting to DcMotor"
      );
      return this.registerMotor(name);
    },

    /**
     * Register callback: onMotorPower(callback)
     * callback receives (name, power)
     */
    onMotorPower: function (cb) {
      hwCallbacks.onMotorPower.push(cb);
    },
    onMotorDirection: function (cb) {
      hwCallbacks.onMotorDirection.push(cb);
    },
    onMotorMode: function (cb) {
      hwCallbacks.onMotorMode.push(cb);
    },
    onMotorZeroPower: function (cb) {
      hwCallbacks.onMotorZeroPower.push(cb);
    },
    onServoPosition: function (cb) {
      hwCallbacks.onServoPosition.push(cb);
    },
    onServoDirection: function (cb) {
      hwCallbacks.onServoDirection.push(cb);
    },
    onServoPower: function (cb) {
      hwCallbacks.onCRServoPower.push(cb);
    },
    onCRServoPower: function (cb) {
      hwCallbacks.onCRServoPower.push(cb);
    },
    onTouchSensor: function (cb) {
      hwCallbacks.onTouchSensor.push(cb);
    },
    onColorSensor: function (cb) {
      hwCallbacks.onColorSensor.push(cb);
    },
    onIMU: function (cb) {
      hwCallbacks.onIMU.push(cb);
    },

    /**
     * Clear all registered devices and callbacks.
     * Called between challenges or on reset.
     */
    clear: function () {
      for (const k in hwDevices) delete hwDevices[k];
      for (const k in hwCallbacks) hwCallbacks[k] = [];
    },
  };

  // Also expose DcMotor direction and mode constants for transpiled code
  window.DcMotor = {
    Direction: {
      FORWARD: "FORWARD",
      REVERSE: "REVERSE",
    },
    RunMode: {
      RUN_WITHOUT_ENCODER: "RUN_WITHOUT_ENCODER",
      RUN_USING_ENCODER: "RUN_USING_ENCODER",
      RUN_TO_POSITION: "RUN_TO_POSITION",
      STOP_AND_RESET_ENCODER: "STOP_AND_RESET_ENCODER",
    },
    ZeroPowerBehavior: {
      BRAKE: "BRAKE",
      FLOAT: "FLOAT",
    },
  };

  // Expose DcMotorSimple for direction
  window.DcMotorSimple = {
    Direction: {
      FORWARD: "FORWARD",
      REVERSE: "REVERSE",
    },
  };

  // Expose Servo direction
  window.Servo = {
    Direction: {
      FORWARD: "FORWARD",
      REVERSE: "REVERSE",
    },
  };

  // Expose AngleUnit for IMU
  window.AngleUnit = {
    DEGREES: "DEGREES",
    RADIANS: "RADIANS",
  };

  // ========================================================================
  // SECTION 10: HARDWARE BADGE STRIP
  // ========================================================================

  /**
   * setBadges(array) — sets the hardware badge strip.
   * Each item: { iconClass: "fa-solid fa-gear", label: "DcMotor", active: true/false }
   */
  window.setBadges = function (badges) {
    const strip = document.getElementById("sim-badge-strip");
    if (!strip) return;

    strip.innerHTML = "";
    badges.forEach(function (badge) {
      const div = el("div", {
        className: "sim-hw-badge " + (badge.active ? "active" : "inactive"),
      });
      const iconHtml = badge.iconClass
        ? '<i class="' + escHTML(badge.iconClass) + '"></i>'
        : '<span style="font-size:0.9rem">' + escHTML(badge.icon || "") + "</span>";
      div.innerHTML = iconHtml + " " + escHTML(badge.label);

      // Allow an ID for dynamic updates
      if (badge.id) div.id = badge.id;

      strip.appendChild(div);
    });
  };

  // ========================================================================
  // SECTION 11: CHALLENGE INSTRUCTIONS PANEL
  // ========================================================================

  let challengeRequirements = [];
  let challengeCompleteCallback = null;
  let challengeHintRules = [];
  let challengeWasComplete = false;
  let challengeFaultModes = [];
  let activeFaultId = "";

  /**
   * setChallenge(title, description, requirements)
   * setChallenge({title, scenario, requirements, successMessage, hints, faultModes, onComplete})
   * The positional signature remains supported for existing lesson adapters.
   */
  window.setChallenge = function (title, description, requirements) {
    const config = typeof title === "object" && title !== null
      ? title
      : {
          title: title,
          scenario: description,
          requirements: requirements,
        };
    const headerTitle = document.getElementById("sim-header-title");
    const headerSub = document.getElementById("sim-header-sub");
    const titleText = document.getElementById("sim-challenge-title-text");
    const desc = document.getElementById("sim-challenge-desc");
    const reqList = document.getElementById("sim-requirements-list");
    const banner = document.getElementById("sim-success-banner");

    if (headerTitle) headerTitle.textContent = config.title || "Simulator Challenge";
    if (headerSub) headerSub.textContent = config.scenario || config.description || "";
    if (titleText) titleText.innerHTML = '<i class="fa-solid fa-trophy" style="margin-right:4px"></i> ' + escHTML(config.title || "Simulator Challenge");
    if (desc) desc.innerHTML = config.scenario || config.description || "";
    if (banner) {
      banner.classList.remove("visible");
      banner.innerHTML = '<i class="fa-solid fa-circle-check"></i> '
        + escHTML(config.successMessage || "Challenge Complete!");
    }

    challengeRequirements = config.requirements || [];
    challengeCompleteCallback = typeof config.onComplete === "function"
      ? config.onComplete
      : null;
    challengeHintRules = Array.isArray(config.hints) ? config.hints : [];
    challengeWasComplete = false;
    window.setFaultModes(config.faultModes || []);

    if (reqList) {
      reqList.innerHTML = "";
      challengeRequirements.forEach(function (req, idx) {
        const div = el("div", { className: "sim-req", id: "sim-req-" + idx });
        div.innerHTML =
          '<span class="sim-check fail"><i class="fa-solid fa-check"></i></span> ' + escHTML(req);
        reqList.appendChild(div);
      });
    }
  };

  window.setFaultModes = function (faultModes) {
    challengeFaultModes = Array.isArray(faultModes) ? faultModes : [];
    activeFaultId = "";
    const control = document.getElementById("sim-fault-control");
    const select = document.getElementById("sim-fault-select");
    const description = document.getElementById("sim-fault-description");
    if (!control || !select || !description) return;

    control.classList.toggle("visible", challengeFaultModes.length > 0);
    select.innerHTML = "";
    const normal = document.createElement("option");
    normal.value = "";
    normal.textContent = "Normal robot";
    select.appendChild(normal);

    challengeFaultModes.forEach(function (fault) {
      const option = document.createElement("option");
      option.value = fault.id;
      option.textContent = fault.label;
      select.appendChild(option);
    });
    description.textContent = "No injected fault. Behavior is deterministic.";

    select.onchange = function () {
      activeFaultId = select.value;
      const active = challengeFaultModes.find(function (fault) {
        return fault.id === activeFaultId;
      });
      description.textContent = active
        ? active.description || "A repeatable robot fault is active."
        : "No injected fault. Behavior is deterministic.";
      handleStop();
      if (typeof window.onFaultModeChange === "function") {
        window.onFaultModeChange(activeFaultId, active || null);
      }
      if (active) {
        window.addHint(
          '<i class="fa-solid fa-screwdriver-wrench"></i> Fault enabled: '
            + escHTML(active.label) + ". Reinitialize before testing.",
          "info"
        );
      }
    };
  };

  window.getActiveFault = function () {
    return activeFaultId;
  };

  window.isFaultActive = function (faultId) {
    return activeFaultId === faultId;
  };

  window.createSeededRandom = function (seed) {
    let state = (Number(seed) || 1) >>> 0;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  };

  window.evaluateChallengeHints = function (context) {
    challengeHintRules.forEach(function (rule) {
      if (!rule || typeof rule.when !== "function" || !rule.when(context)) return;
      window.addHint(escHTML(rule.message || ""), rule.type || "warn");
    });
  };

  /**
   * setRequirement(index, passed) — turns requirement green or red.
   */
  window.setRequirement = function (index, passed) {
    const reqEl = document.getElementById("sim-req-" + index);
    if (!reqEl) return;
    const check = reqEl.querySelector(".sim-check");
    if (check) {
      check.className = "sim-check " + (passed ? "pass" : "fail");
    }

    // Check if all requirements are met
    checkAllRequirements();
  };

  function checkAllRequirements() {
    let allPass = true;
    for (let i = 0; i < challengeRequirements.length; i++) {
      const reqEl = document.getElementById("sim-req-" + i);
      if (reqEl) {
        const check = reqEl.querySelector(".sim-check");
        if (!check || !check.classList.contains("pass")) {
          allPass = false;
          break;
        }
      }
    }

    const banner = document.getElementById("sim-success-banner");
    if (allPass && challengeRequirements.length > 0) {
      if (banner) banner.classList.add("visible");
      if (!challengeWasComplete) {
        challengeWasComplete = true;
        if (challengeCompleteCallback) challengeCompleteCallback();
        if (typeof window.onChallengeComplete === "function") {
          window.onChallengeComplete();
        }
      }
    } else {
      challengeWasComplete = false;
      if (banner) banner.classList.remove("visible");
    }
  }

  // ========================================================================
  // SECTION 12: THREE.JS SCENE BASE
  // ========================================================================
  // Loads Three.js, creates renderer/scene/camera, orbit controls,
  // field plane, perimeter walls, lights, animation loop.
  // ========================================================================

  let threeScene = null;
  let threeCamera = null;
  let threeRenderer = null;
  let animationFrameId = null;
  let fieldMeshes = []; // floor + walls for setFieldVisible

  /** Default orbit state */
  const defaultOrbit = {
    theta: 0.4,
    phi: 0.75,
    radius: 6,
    target: { x: 0, y: 0.2, z: 0 },
  };

  const orbit = {
    theta: defaultOrbit.theta,
    phi: defaultOrbit.phi,
    radius: defaultOrbit.radius,
    target: { x: defaultOrbit.target.x, y: defaultOrbit.target.y, z: defaultOrbit.target.z },
    dragging: false,
    panning: false,
    prevX: 0,
    prevY: 0,
  };

  function loadThreeJS(callback) {
    const script = document.createElement("script");
    let finished = false;
    const finish = function () {
      if (finished) return;
      finished = true;
      if (callback) callback();
    };
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = finish;
    script.onerror = finish;
    document.head.appendChild(script);
  }

  function showGraphicsFallback(message) {
    const container = document.getElementById("sim-scene-container");
    const canvas = document.getElementById("sim-robot-canvas");
    if (canvas) canvas.style.display = "none";
    if (!container || document.getElementById("sim-graphics-fallback")) return;
    const fallback = el("div", {id: "sim-graphics-fallback"});
    fallback.style.cssText = [
      "height:100%",
      "display:grid",
      "place-items:center",
      "padding:24px",
      "color:#aeb4c0",
      "font:0.85rem/1.6 var(--font-ui)",
      "text-align:center",
      "background:#08080c",
    ].join(";");
    fallback.innerHTML = '<div><strong style="display:block;color:#ffb547;margin-bottom:8px">3D view unavailable</strong>'
      + escHTML(message)
      + '<br>The editor, telemetry, requirements, and hints still work.</div>';
    container.appendChild(fallback);
  }

  function updateCameraOrbit() {
    if (!threeCamera) return;
    const o = orbit;
    threeCamera.position.x =
      o.target.x + o.radius * Math.sin(o.phi) * Math.sin(o.theta);
    threeCamera.position.y = o.target.y + o.radius * Math.cos(o.phi);
    threeCamera.position.z =
      o.target.z + o.radius * Math.sin(o.phi) * Math.cos(o.theta);
    threeCamera.lookAt(o.target.x, o.target.y, o.target.z);
  }

  function initThreeScene() {
    const container = document.getElementById("sim-scene-container");
    const canvas = document.getElementById("sim-robot-canvas");
    if (!container || !canvas || !window.THREE) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x050508);

    threeCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    updateCameraOrbit();

    threeRenderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    threeRenderer.setSize(w, h);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeRenderer.shadowMap.enabled = true;

    // ── Lights ──
    const ambient = new THREE.AmbientLight(0x404050, 0.6);
    threeScene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(3, 6, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    threeScene.add(dirLight);

    // ── Floor ──
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    threeScene.add(floor);
    fieldMeshes.push(floor);

    // ── Perimeter Walls ──
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x151520 });
    const wallGeoH = new THREE.BoxGeometry(8, 0.6, 0.1);
    const wallGeoV = new THREE.BoxGeometry(0.1, 0.6, 8);

    [-1, 1].forEach(function (s) {
      const w1 = new THREE.Mesh(wallGeoH, wallMat);
      w1.position.set(0, 0.3, s * 4);
      threeScene.add(w1);
      fieldMeshes.push(w1);

      const w2 = new THREE.Mesh(wallGeoV, wallMat);
      w2.position.set(s * 4, 0.3, 0);
      threeScene.add(w2);
      fieldMeshes.push(w2);
    });

    // ── Orbit Controls ──
    wireOrbitControls(canvas);

    // ── Window Resize ──
    window.addEventListener("resize", function () {
      if (!container || !threeCamera || !threeRenderer) return;
      const w2 = container.clientWidth;
      const h2 = container.clientHeight;
      threeCamera.aspect = w2 / h2;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(w2, h2);
    });

    // Expose globally
    window.scene = threeScene;
    window.camera = threeCamera;
    window.renderer = threeRenderer;

    // Start animation loop
    startAnimationLoop();
  }

  function wireOrbitControls(canvas) {
    canvas.addEventListener("pointerdown", function (e) {
      if (e.button === 0) {
        orbit.dragging = true;
        orbit.panning = false;
      } else if (e.button === 1 || e.button === 2) {
        orbit.dragging = false;
        orbit.panning = true;
      }
      orbit.prevX = e.clientX;
      orbit.prevY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    canvas.addEventListener("pointermove", function (e) {
      if (!orbit.dragging && !orbit.panning) return;

      const dx = e.clientX - orbit.prevX;
      const dy = e.clientY - orbit.prevY;
      orbit.prevX = e.clientX;
      orbit.prevY = e.clientY;

      if (orbit.dragging) {
        orbit.theta -= dx * 0.008;
        orbit.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, orbit.phi - dy * 0.008)
        );
      }

      if (orbit.panning && threeCamera) {
        const panSpeed = 0.005 * orbit.radius;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        right.setFromMatrixColumn(threeCamera.matrixWorld, 0);
        up.setFromMatrixColumn(threeCamera.matrixWorld, 1);

        orbit.target.x -= right.x * dx * panSpeed + up.x * dy * panSpeed;
        orbit.target.y -= right.y * dx * panSpeed + up.y * dy * panSpeed;
        orbit.target.z -= right.z * dx * panSpeed + up.z * dy * panSpeed;
        orbit.target.y = Math.max(-0.5, orbit.target.y);
      }

      updateCameraOrbit();
    });

    canvas.addEventListener("pointerup", function () {
      orbit.dragging = false;
      orbit.panning = false;
    });
    canvas.addEventListener("pointercancel", function () {
      orbit.dragging = false;
      orbit.panning = false;
    });

    canvas.addEventListener(
      "wheel",
      function (e) {
        e.preventDefault();
        orbit.radius = Math.max(
          1.5,
          Math.min(15, orbit.radius + e.deltaY * 0.008)
        );
        updateCameraOrbit();
      },
      { passive: false }
    );

    canvas.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });
  }

  /** Custom animation callbacks that challenges can register */
  const animationCallbacks = [];

  function startAnimationLoop() {
    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      // Run any registered animation callbacks
      for (let i = 0; i < animationCallbacks.length; i++) {
        try {
          animationCallbacks[i]();
        } catch (e) {
          console.error("[Animation callback error]", e);
        }
      }

      if (threeRenderer && threeScene && threeCamera) {
        threeRenderer.render(threeScene, threeCamera);
      }
    }
    animate();
  }

  /**
   * Register a callback to run on each animation frame (60fps).
   * Returns an ID that can be used to remove it.
   */
  window.addAnimationCallback = function (fn) {
    animationCallbacks.push(fn);
    return animationCallbacks.length - 1;
  };

  /**
   * Remove an animation callback by ID.
   */
  window.removeAnimationCallback = function (id) {
    if (id >= 0 && id < animationCallbacks.length) {
      animationCallbacks[id] = function () {}; // no-op to preserve indices
    }
  };

  /**
   * resetCamera() — return to default orbit view.
   */
  window.resetCamera = function () {
    orbit.theta = defaultOrbit.theta;
    orbit.phi = defaultOrbit.phi;
    orbit.radius = defaultOrbit.radius;
    orbit.target.x = defaultOrbit.target.x;
    orbit.target.y = defaultOrbit.target.y;
    orbit.target.z = defaultOrbit.target.z;
    updateCameraOrbit();
  };

  window.setCameraOrbit = function (options) {
    options = options || {};
    if (typeof options.theta === "number") orbit.theta = options.theta;
    if (typeof options.phi === "number") orbit.phi = options.phi;
    if (typeof options.radius === "number") orbit.radius = options.radius;
    if (options.target) {
      if (typeof options.target.x === "number") orbit.target.x = options.target.x;
      if (typeof options.target.y === "number") orbit.target.y = options.target.y;
      if (typeof options.target.z === "number") orbit.target.z = options.target.z;
    }
    updateCameraOrbit();
  };

  /**
   * setFieldVisible(bool) — hide/show field plane and walls.
   */
  window.setFieldVisible = function (visible) {
    fieldMeshes.forEach(function (mesh) {
      mesh.visible = visible;
    });
  };

  // ========================================================================
  // SECTION 13: CONSOLE ERROR CAPTURE
  // ========================================================================
  // Catches uncaught errors from student code and displays them in
  // telemetry rather than crashing the page.
  // ========================================================================

  window.addEventListener("error", function (event) {
    showTelemetryError(
      (event.message || "Unknown error") +
        (event.lineno ? " (line " + event.lineno + ")" : "")
    );
    // Prevent default browser error handling
    event.preventDefault();
  });

  window.addEventListener("unhandledrejection", function (event) {
    showTelemetryError(
      "Unhandled promise rejection: " +
        (event.reason ? event.reason.message || event.reason : "Unknown")
    );
    event.preventDefault();
  });

  // ========================================================================
  // SECTION 14: ADDITIONAL EXPOSED UTILITIES
  // ========================================================================

  /**
   * Set the panel header title and subtitle.
   */
  window.setHeader = function (title, subtitle) {
    const t = document.getElementById("sim-header-title");
    const s = document.getElementById("sim-header-sub");
    if (t) t.textContent = title;
    if (s) s.textContent = subtitle || "";
  };

  /**
   * Add a hint message below the telemetry panel.
   * type: 'warn' (default), 'error', 'info'
   */
  window.addHint = function (message, type) {
    const container = document.getElementById("sim-hint-container");
    if (!container) return;
    const normalizedType = type || "warn";
    const key = normalizedType + "::" + String(message).replace(/\s+/g, " ").trim();
    for (let i = 0; i < container.children.length; i++) {
      if (container.children[i].getAttribute("data-sim-hint-key") === key) {
        return;
      }
    }

    const maxHints = 4;
    while (container.children.length >= maxHints) {
      container.removeChild(container.firstElementChild);
    }

    const div = el("div", {
      className: "sim-hint" + (type === "error" ? " error" : type === "info" ? " info" : ""),
    });
    div.setAttribute("data-sim-hint-key", key);
    div.innerHTML = message;
    container.appendChild(div);
  };

  /**
   * Clear all hints.
   */
  window.clearHints = function () {
    const container = document.getElementById("sim-hint-container");
    if (container) container.innerHTML = "";
  };

  /**
   * ResizeObserver for the scene container to handle panel resize
   */
  function observeSceneResize() {
    const container = document.getElementById("sim-scene-container");
    if (!container || !window.ResizeObserver) return;

    const ro = new ResizeObserver(function () {
      if (!threeCamera || !threeRenderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      threeCamera.aspect = w / h;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(w, h);
    });
    ro.observe(container);
  }

  // ========================================================================
  // SECTION 15: INITIALIZATION
  // ========================================================================
  // On DOMContentLoaded, build the entire UI, load dependencies, then
  // call window.onSimulatorReady() so the challenge can configure itself.
  // ========================================================================

  function initialize() {
    // 1. Inject CSS
    injectCSS();

    // 2. Build DOM
    buildDOM();

    // 3. Load dependencies and then init scene + editor highlighting
    let prismReady = false;
    let threeReady = false;

    function checkReady() {
      if (prismReady && threeReady) {
        // Initialize Three.js scene
        try {
          if (!window.THREE) {
            throw new Error("The graphics library could not be loaded.");
          }
          initThreeScene();
        } catch (graphicsError) {
          console.warn("[Simulator graphics fallback]", graphicsError);
          threeScene = null;
          threeCamera = null;
          threeRenderer = null;
          window.scene = null;
          window.camera = null;
          window.renderer = null;
          showGraphicsFallback(
            graphicsError && graphicsError.message
              ? graphicsError.message
              : "WebGL is unavailable in this browser."
          );
          startAnimationLoop();
        }

        // Observe resize
        observeSceneResize();

        // Initial code highlighting
        updateHighlighting();
        syncScroll();
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () {
            updateHighlighting();
            syncScroll();
          });
        }

        // Call the challenge's onSimulatorReady callback
        if (typeof window.onSimulatorReady === "function") {
          try {
            window.onSimulatorReady();
          } catch (e) {
            console.error("[onSimulatorReady error]", e);
            showTelemetryError("Setup error: " + e.message);
          }
        }
      }
    }

    loadPrism(function () {
      prismReady = true;
      checkReady();
    });

    loadThreeJS(function () {
      threeReady = true;
      checkReady();
    });
  }

  // Wait for DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    // DOM already loaded (e.g., script loaded with defer or at end of body)
    initialize();
  }
})();

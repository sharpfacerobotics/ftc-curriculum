/**
 * TelemarkEditor
 *
 * Shared Java editing behavior for the browser simulators. The helper keeps
 * the lightweight textarea editors consistent without requiring a server-side
 * editor or build step.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TelemarkEditor = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DEFAULT_INDENT = "    ";
  const PAIRS = {"(": ")", "[": "]", "{": "}", '"': '"', "'": "'"};
  const CLOSERS = new Set(Object.values(PAIRS));
  const DRAFT_PREFIX = "telemark.editor.v1:";
  const DRAFT_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

  function runtimeRoot() {
    return typeof globalThis !== "undefined" ? globalThis : {};
  }

  function hashString(value) {
    let hash = 2166136261;
    const source = String(value || "");
    for (let index = 0; index < source.length; index++) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function pageDraftScope(options) {
    options = options || {};
    if (options.scope) return String(options.scope);
    const host = runtimeRoot();
    const location = options.location || host.location || {};
    const path = location.pathname || "simulator";
    const search = String(location.search || "");
    const variants = [];

    if (typeof URLSearchParams === "function") {
      const params = new URLSearchParams(search);
      ["lesson", "challenge", "step", "unit"].forEach(function (name) {
        if (params.has(name)) variants.push(name + "=" + params.get(name));
      });
      if (params.has("code")) variants.push("code=" + hashString(params.get("code")));
    } else if (search) {
      variants.push("query=" + hashString(search));
    }
    if (location.hash) variants.push("hash=" + hashString(location.hash));
    return path + (variants.length ? "::" + variants.join("&") : "");
  }

  function draftKey(editor, options) {
    options = options || {};
    if (options.key) return String(options.key);
    const identity = editor && (editor.id || editor.name) || "code-editor";
    return DRAFT_PREFIX + hashString(pageDraftScope(options)) + ":" + identity;
  }

  function draftStorage(options) {
    options = options || {};
    if (options.storage) return options.storage;
    try {
      return runtimeRoot().localStorage || null;
    } catch (_error) {
      return null;
    }
  }

  function saveDraft(editor, options) {
    if (!editor || typeof editor.value !== "string") return false;
    const storage = draftStorage(options);
    if (!storage) return false;
    try {
      storage.setItem(draftKey(editor, options), JSON.stringify({
        value: editor.value,
        savedAt: Date.now(),
      }));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function restoreDraft(editor, options) {
    if (!editor || typeof editor.value !== "string") return false;
    const storage = draftStorage(options);
    if (!storage) return false;
    const key = draftKey(editor, options);
    try {
      const draft = JSON.parse(storage.getItem(key) || "null");
      if (!draft || typeof draft.value !== "string") return false;
      if (!Number.isFinite(draft.savedAt) || Date.now() - draft.savedAt > DRAFT_MAX_AGE) {
        storage.removeItem(key);
        return false;
      }
      if (editor.value === draft.value) return true;
      editor.value = draft.value;
      if (typeof editor.dispatchEvent === "function") {
        const EventType = runtimeRoot().Event;
        if (typeof EventType === "function") {
          editor.dispatchEvent(new EventType("input", {bubbles: true}));
          editor.dispatchEvent(new EventType("telemark:draft-restored"));
        }
      }
      return true;
    } catch (_error) {
      return false;
    }
  }

  function clearDiagnostics(documentOverride) {
    const doc = documentOverride || runtimeRoot().document;
    if (!doc || typeof doc.querySelectorAll !== "function") return;

    doc.querySelectorAll(
      ".sim-telemetry-error,.telemetry-error,.sim-hint.error,.hint.error,.hint-error"
    ).forEach(function (element) {
      if (element && typeof element.remove === "function") element.remove();
    });
    doc.querySelectorAll(".scene-hint.error").forEach(function (element) {
      element.classList.remove("visible", "error");
      element.textContent = "";
    });

    // A few early lessons rendered compiler failures directly into the
    // telemetry panel instead of assigning an error class. Only clear panels
    // whose whole contents describe a compiler/runtime failure; student
    // telemetry remains untouched.
    ["sim-telemetry-log", "telemetry-log"].forEach(function (id) {
      const panel = typeof doc.getElementById === "function" ? doc.getElementById(id) : null;
      if (!panel || panel.querySelector(".sim-telemetry-error,.telemetry-error")) return;
      const text = String(panel.textContent || "").trim();
      if (/^(?:ERROR:\s*)?(?:(?:Java|init\(\)|init_loop\(\)|loop\(\)|runOpMode\(\)|Setup|simulator)\s+)?(?:compile(?:\/runtime)?|runtime) error\b/i.test(text)) {
        panel.innerHTML = "";
      }
    });
  }

  function scheduleDraftRestore(editor, options) {
    const host = runtimeRoot();
    const restore = function () {
      const defer = typeof host.setTimeout === "function" ? host.setTimeout : function (fn) { fn(); };
      defer(function () { restoreDraft(editor, options); }, 0);
    };
    if (host.document && host.document.readyState !== "complete"
        && typeof host.addEventListener === "function") {
      host.addEventListener("load", restore, {once: true});
    } else {
      restore();
    }
  }

  function bindPersistence(editor, options) {
    if (!editor) return function () {};
    if (editor.__telemarkPersistenceDetach) return editor.__telemarkPersistenceDetach;
    options = options || {};
    const listener = function () {
      clearDiagnostics();
      saveDraft(editor, options);
    };
    editor.addEventListener("input", listener);
    editor.__telemarkPersistenceDetach = function () {
      editor.removeEventListener("input", listener);
      delete editor.__telemarkPersistenceDetach;
    };
    if (options.restore !== false) scheduleDraftRestore(editor, options);
    return editor.__telemarkPersistenceDetach;
  }

  function lineStartAt(text, position) {
    return text.lastIndexOf("\n", Math.max(0, position - 1)) + 1;
  }

  function leadingWhitespace(text) {
    return (text.match(/^\s*/) || [""])[0];
  }

  function replaceRange(editor, start, end, replacement, selectionStart, selectionEnd) {
    if (typeof editor.setRangeText === "function") {
      editor.setRangeText(replacement, start, end, "preserve");
    } else {
      editor.value = editor.value.slice(0, start) + replacement + editor.value.slice(end);
    }
    editor.selectionStart = selectionStart;
    editor.selectionEnd = selectionEnd == null ? selectionStart : selectionEnd;
  }

  function prevent(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function editLines(editor, start, end, indent, remove) {
    const text = editor.value;
    const blockStart = lineStartAt(text, start);
    let blockEnd = end;
    if (end > start && text[end - 1] === "\n") blockEnd -= 1;
    const block = text.slice(blockStart, blockEnd);
    const lines = block.split("\n");
    const changes = [];
    let sourceOffset = 0;

    const transformed = lines.map(function (line) {
      if (!remove) {
        changes.push({position: sourceOffset, removed: 0, inserted: indent.length});
        sourceOffset += line.length + 1;
        return indent + line;
      }

      let count = 0;
      if (line[0] === "\t") count = 1;
      else {
        while (count < indent.length && line[count] === " ") count += 1;
      }
      if (count) changes.push({position: sourceOffset, removed: count, inserted: 0});
      sourceOffset += line.length + 1;
      return line.slice(count);
    }).join("\n");

    function mapPosition(position) {
      const relative = position - blockStart;
      let delta = 0;
      for (const change of changes) {
        if (change.position > relative) continue;
        if (change.removed) {
          delta -= Math.min(change.removed, Math.max(0, relative - change.position));
        } else {
          delta += change.inserted;
        }
      }
      return blockStart + relative + delta;
    }

    const replacementEnd = blockEnd;
    const newStart = mapPosition(start);
    const newEnd = mapPosition(end);
    replaceRange(editor, blockStart, replacementEnd, transformed, newStart, newEnd);
  }

  function handleTab(editor, event, indent) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    prevent(event);

    if (start !== end || editor.value.slice(start, end).includes("\n")) {
      editLines(editor, start, end, indent, event.shiftKey);
      return true;
    }

    if (!event.shiftKey) {
      replaceRange(editor, start, end, indent, start + indent.length);
      return true;
    }

    const lineStart = lineStartAt(editor.value, start);
    const line = editor.value.slice(lineStart).split("\n", 1)[0];
    let removeCount = 0;
    if (line[0] === "\t") removeCount = 1;
    else {
      while (removeCount < indent.length && line[removeCount] === " ") removeCount += 1;
    }
    if (removeCount) {
      replaceRange(
        editor,
        lineStart,
        lineStart + removeCount,
        "",
        Math.max(lineStart, start - removeCount),
      );
    }
    return true;
  }

  function shouldIndentUnbracedControl(line) {
    const trimmed = line.trim();
    return /^(?:(?:if|for|while|switch|catch|synchronized)\s*\(.*\)|else(?:\s+if\s*\(.*\))?|do|try|finally)$/.test(trimmed)
      || /^(?:case\b.*|default)\s*:$/.test(trimmed);
  }

  function handleEnter(editor, event, indentUnit) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const before = editor.value.slice(0, start);
    const after = editor.value.slice(end);
    const lineBefore = before.slice(lineStartAt(before, before.length));
    const lineAfter = after.split("\n", 1)[0];
    const indent = leadingWhitespace(lineBefore);
    const opensBlock = lineBefore.trimEnd().endsWith("{");
    const closesBlock = lineAfter.trimStart().startsWith("}");
    let insertion;
    let cursorOffset;

    prevent(event);
    if (opensBlock && closesBlock) {
      const innerIndent = indent + indentUnit;
      insertion = "\n" + innerIndent + "\n" + indent;
      cursorOffset = 1 + innerIndent.length;
    } else {
      const extra = opensBlock || shouldIndentUnbracedControl(lineBefore) ? indentUnit : "";
      insertion = "\n" + indent + extra;
      cursorOffset = insertion.length;
    }

    replaceRange(editor, start, end, insertion, start + cursorOffset);
    return true;
  }

  function handleKeydown(event, options) {
    options = options || {};
    const editor = event.currentTarget || event.target;
    if (!editor || typeof editor.value !== "string" || event.isComposing) return false;
    if ((event.ctrlKey || event.metaKey || event.altKey) && event.key !== "Tab") return false;

    const indent = options.indent || DEFAULT_INDENT;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const key = event.key;

    if (key === "Tab") return handleTab(editor, event, indent);
    if (key === "Enter") return handleEnter(editor, event, indent);

    if (key === "Backspace" && start === end && start > 0) {
      const opening = editor.value[start - 1];
      if (PAIRS[opening] === editor.value[start]) {
        prevent(event);
        replaceRange(editor, start - 1, start + 1, "", start - 1);
        return true;
      }
    }

    // A manually typed closing brace on an indented blank line belongs one
    // level out, aligned with the statement that opened the block.
    if (key === "}" && start === end) {
      const lineStart = lineStartAt(editor.value, start);
      const linePrefix = editor.value.slice(lineStart, start);
      if (/^\s+$/.test(linePrefix)) {
        const removeCount = linePrefix.endsWith("\t")
          ? 1
          : Math.min(indent.length, (linePrefix.match(/ +$/) || [""])[0].length);
        if (removeCount) {
          prevent(event);
          if (editor.value[start] === "}") {
            replaceRange(editor, start - removeCount, start, "", start - removeCount + 1);
          } else {
            replaceRange(editor, start - removeCount, start, "}", start - removeCount + 1);
          }
          return true;
        }
      }
    }

    // Overtype an automatically inserted closer instead of duplicating it.
    if (CLOSERS.has(key) && start === end && editor.value[start] === key) {
      prevent(event);
      editor.selectionStart = editor.selectionEnd = start + 1;
      return true;
    }

    if (Object.prototype.hasOwnProperty.call(PAIRS, key)) {
      if ((key === '"' || key === "'") && editor.value[start - 1] === "\\") return false;
      prevent(event);
      const selected = editor.value.slice(start, end);
      replaceRange(
        editor,
        start,
        end,
        key + selected + PAIRS[key],
        start + 1,
        start + 1 + selected.length,
      );
      return true;
    }

    return false;
  }

  function attach(editor, options) {
    if (!editor) return function () {};
    if (editor.__telemarkEditorDetach) return editor.__telemarkEditorDetach;
    options = options || {};

    const listener = function (event) {
      const handled = handleKeydown(event, options);
      if (handled) {
        clearDiagnostics();
        saveDraft(editor, options);
        if (typeof options.onChange === "function") options.onChange(editor);
      }
    };
    editor.addEventListener("keydown", listener);
    bindPersistence(editor, options);
    editor.__telemarkEditorDetach = function () {
      editor.removeEventListener("keydown", listener);
      delete editor.__telemarkEditorDetach;
    };
    return editor.__telemarkEditorDetach;
  }

  function autoBindEditors() {
    const host = runtimeRoot();
    const doc = host.document;
    if (!doc || typeof doc.querySelectorAll !== "function") return;
    const bind = function (root) {
      if (root && typeof root.matches === "function" && root.matches("textarea")) {
        bindPersistence(root, {restore: root.id !== "sim-code-editor"});
      }
      if (!root || typeof root.querySelectorAll !== "function") return;
      root.querySelectorAll("textarea").forEach(function (editor) {
        bindPersistence(editor, {restore: editor.id !== "sim-code-editor"});
      });
    };
    bind(doc);
    if (typeof host.MutationObserver === "function") {
      const observer = new host.MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          Array.prototype.forEach.call(mutation.addedNodes || [], bind);
        });
      });
      const target = doc.documentElement || doc.body;
      if (target) observer.observe(target, {childList: true, subtree: true});
    }
  }

  const host = runtimeRoot();
  if (host.document) {
    if (host.document.readyState === "loading" && typeof host.document.addEventListener === "function") {
      host.document.addEventListener("DOMContentLoaded", autoBindEditors, {once: true});
    } else {
      autoBindEditors();
    }
  }

  return Object.freeze({
    version: "1.1.0",
    attach: attach,
    bindPersistence: bindPersistence,
    clearDiagnostics: clearDiagnostics,
    draftKey: draftKey,
    handleKeydown: handleKeydown,
    restoreDraft: restoreDraft,
    saveDraft: saveDraft,
  });
});

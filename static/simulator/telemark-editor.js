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
      if (handled && typeof options.onChange === "function") options.onChange(editor);
    };
    editor.addEventListener("keydown", listener);
    editor.__telemarkEditorDetach = function () {
      editor.removeEventListener("keydown", listener);
      delete editor.__telemarkEditorDetach;
    };
    return editor.__telemarkEditorDetach;
  }

  return {
    version: "1.0.0",
    attach,
    handleKeydown,
  };
});

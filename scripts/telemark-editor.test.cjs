const assert = require('node:assert/strict');
const TelemarkEditor = require('../static/simulator/telemark-editor.js');

function makeEditor(value, selectionStart = value.length, selectionEnd = selectionStart) {
  const listeners = new Map();
  return {
    value,
    selectionStart,
    selectionEnd,
    setRangeText(replacement, start, end) {
      this.value = this.value.slice(0, start) + replacement + this.value.slice(end);
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    press(key, extra = {}) {
      const event = {
        key,
        currentTarget: this,
        preventDefault() {
          this.defaultPrevented = true;
        },
        stopPropagation() {
          this.propagationStopped = true;
        },
        ...extra,
      };
      const listener = listeners.get('keydown');
      if (listener) listener(event);
      else TelemarkEditor.handleKeydown(event);
      return event;
    },
  };
}

function testClosingDelimiterOvertype() {
  const editor = makeEditor('telemetry.update');
  editor.press('(');
  assert.equal(editor.value, 'telemetry.update()');
  assert.equal(editor.selectionStart, 'telemetry.update('.length);

  editor.press(')');
  assert.equal(editor.value, 'telemetry.update()');
  assert.equal(editor.selectionStart, editor.value.length);
}

function testPairingAndSelectionWrapping() {
  for (const [opening, closing] of Object.entries({
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
  })) {
    const empty = makeEditor('');
    empty.press(opening);
    assert.equal(empty.value, opening + closing);
    assert.equal(empty.selectionStart, 1);

    const selected = makeEditor('ready', 0, 5);
    selected.press(opening);
    assert.equal(selected.value, opening + 'ready' + closing);
    assert.deepEqual(
      [selected.selectionStart, selected.selectionEnd],
      [1, 6],
    );
  }
}

function testStructuredEnterIndentation() {
  for (const header of ['if (ready) ', 'else ', 'for (int i = 0; i < 3; i++) ', 'while (active) ']) {
    const editor = makeEditor(header);
    editor.press('{');
    editor.press('Enter');
    assert.equal(editor.value, header + '{\n    \n}');
    assert.equal(editor.selectionStart, (header + '{\n    ').length);
  }

  const unbraced = makeEditor('while (active)');
  unbraced.press('Enter');
  assert.equal(unbraced.value, 'while (active)\n    ');
}

function testPairedBackspaceAndBraceDedent() {
  const pair = makeEditor('()', 1);
  pair.press('Backspace');
  assert.equal(pair.value, '');
  assert.equal(pair.selectionStart, 0);

  const brace = makeEditor('        }', 8);
  brace.press('}');
  assert.equal(brace.value, '    }');
  assert.equal(brace.selectionStart, 5);
}

function testMultilineIndentAndOutdent() {
  const editor = makeEditor('    foo\n    bar', 4, 15);
  editor.press('Tab');
  assert.equal(editor.value, '        foo\n        bar');
  assert.deepEqual([editor.selectionStart, editor.selectionEnd], [8, 23]);

  editor.press('Tab', {shiftKey: true});
  assert.equal(editor.value, '    foo\n    bar');
  assert.deepEqual([editor.selectionStart, editor.selectionEnd], [4, 15]);

  const singleLine = makeEditor('    telemetry  .update()', 18);
  singleLine.press('Tab', {shiftKey: true});
  assert.equal(singleLine.value, 'telemetry  .update()');
  assert.equal(singleLine.selectionStart, 14);

  const unindented = makeEditor('telemetry  .update()', 12);
  unindented.press('Tab', {shiftKey: true});
  assert.equal(unindented.value, 'telemetry  .update()');
}

function testSingleChangeNotification() {
  const editor = makeEditor('if (ready) ');
  let changes = 0;
  TelemarkEditor.attach(editor, {
    onChange() {
      changes += 1;
    },
  });
  editor.press('{');
  assert.equal(changes, 1);
  editor.press('Enter');
  assert.equal(changes, 2);
}

testClosingDelimiterOvertype();
testPairingAndSelectionWrapping();
testStructuredEnterIndentation();
testPairedBackspaceAndBraceDedent();
testMultilineIndentAndOutdent();
testSingleChangeNotification();
console.log('TelemarkEditor tests passed');

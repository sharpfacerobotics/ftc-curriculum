/**
 * TelemarkJava
 *
 * A small Java parser, compiler, and FTC OpMode lifecycle used by Telemark's
 * browser simulators. It intentionally supports the Java subset taught by the
 * curriculum instead of attempting to load arbitrary JVM libraries.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TelemarkJava = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const TYPE_NAMES = new Set([
    "boolean", "byte", "char", "double", "float", "int", "long", "short",
    "String", "Object", "DcMotor", "DcMotorEx", "Servo", "CRServo",
    "TouchSensor", "DigitalChannel", "AnalogInput", "ColorSensor",
    "DistanceSensor", "IMU", "BNO055IMU", "ElapsedTime", "Pose", "Path",
    "PathChain", "BezierCurve", "BezierLine", "AprilTagDetection",
  ]);
  const MODIFIERS = new Set([
    "public", "private", "protected", "static", "final", "abstract",
    "synchronized", "volatile", "transient",
  ]);
  const CONTROL_WORDS = new Set([
    "if", "else", "for", "while", "switch", "case", "default", "return",
    "break", "continue", "throw", "try", "catch", "finally", "new",
  ]);

  class TelemarkJavaError extends Error {
    constructor(message, token, code) {
      super(message);
      this.name = "TelemarkJavaError";
      this.line = token?.line ?? 1;
      this.column = token?.column ?? 1;
      this.code = code || "TELEMARK_JAVA_ERROR";
    }
  }

  function tokenize(source) {
    const tokens = [];
    let index = 0;
    let line = 1;
    let column = 1;

    const push = (type, value, start, startLine, startColumn) => {
      tokens.push({type, value, start, end: index, line: startLine, column: startColumn});
    };
    const advance = () => {
      const ch = source[index++];
      if (ch === "\n") {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
      return ch;
    };

    while (index < source.length) {
      const start = index;
      const startLine = line;
      const startColumn = column;
      const ch = source[index];

      if (/\s/.test(ch)) {
        let value = "";
        while (index < source.length && /\s/.test(source[index])) value += advance();
        push("space", value, start, startLine, startColumn);
        continue;
      }

      if (ch === "/" && source[index + 1] === "/") {
        let value = "";
        while (index < source.length && source[index] !== "\n") value += advance();
        push("comment", value, start, startLine, startColumn);
        continue;
      }

      if (ch === "/" && source[index + 1] === "*") {
        let value = "";
        value += advance();
        value += advance();
        while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
          value += advance();
        }
        if (index >= source.length) {
          throw new TelemarkJavaError("Unterminated block comment", {line: startLine, column: startColumn});
        }
        value += advance();
        value += advance();
        push("comment", value, start, startLine, startColumn);
        continue;
      }

      if (ch === '"' || ch === "'") {
        const quote = advance();
        let value = quote;
        let escaped = false;
        while (index < source.length) {
          const next = advance();
          value += next;
          if (!escaped && next === quote) break;
          escaped = !escaped && next === "\\";
          if (next !== "\\") escaped = false;
        }
        if (!value.endsWith(quote) || value.length === 1) {
          throw new TelemarkJavaError("Unterminated string literal", {line: startLine, column: startColumn});
        }
        push("string", value, start, startLine, startColumn);
        continue;
      }

      if (/[A-Za-z_$]/.test(ch)) {
        let value = "";
        while (index < source.length && /[\w$]/.test(source[index])) value += advance();
        push("identifier", value, start, startLine, startColumn);
        continue;
      }

      if (/\d/.test(ch) || (ch === "." && /\d/.test(source[index + 1]))) {
        let value = "";
        while (index < source.length && /[\dA-Fa-f_xXbBeE.+-]/.test(source[index])) {
          const next = source[index];
          if ((next === "+" || next === "-") && !/[eE]$/.test(value)) break;
          value += advance();
        }
        value = value.replace(/[fFdDlL]$/, "");
        push("number", value, start, startLine, startColumn);
        continue;
      }

      const triple = source.slice(index, index + 3);
      const pair = source.slice(index, index + 2);
      if ([">>>", "<<=", ">>="].includes(triple)) {
        advance(); advance(); advance();
        push("symbol", triple, start, startLine, startColumn);
        continue;
      }
      if ([
        "==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=",
        "/=", "%=", "->", "::", "<<", ">>", "&=", "|=", "^=",
      ].includes(pair)) {
        advance(); advance();
        push("symbol", pair, start, startLine, startColumn);
        continue;
      }

      advance();
      push("symbol", ch, start, startLine, startColumn);
    }

    return tokens;
  }

  function significant(tokens) {
    return tokens.filter((token) => token.type !== "space" && token.type !== "comment");
  }

  function assertBalanced(tokens) {
    const stack = [];
    const pairs = {")": "(", "]": "[", "}": "{"};
    for (const token of significant(tokens)) {
      if (["(", "[", "{"].includes(token.value)) stack.push(token);
      if (Object.hasOwn(pairs, token.value)) {
        const opening = stack.pop();
        if (!opening || opening.value !== pairs[token.value]) {
          throw new TelemarkJavaError(`Unexpected '${token.value}'`, token, "UNBALANCED_DELIMITER");
        }
      }
    }
    if (stack.length) {
      const opening = stack[stack.length - 1];
      throw new TelemarkJavaError(`Missing closing delimiter for '${opening.value}'`, opening, "UNBALANCED_DELIMITER");
    }
  }

  function parse(source) {
    const tokens = tokenize(source);
    assertBalanced(tokens);
    return {
      type: "CompilationUnit",
      source,
      tokens,
      classes: extractClasses(source, tokens),
      enums: extractEnums(tokens),
    };
  }

  function extractEnums(allTokens) {
    const tokens = significant(allTokens);
    const enums = [];
    for (let i = 0; i < tokens.length; i += 1) {
      if (tokens[i].value !== "enum" || tokens[i + 1]?.type !== "identifier") continue;
      const name = tokens[i + 1].value;
      let open = i + 2;
      while (open < tokens.length && tokens[open].value !== "{") open += 1;
      if (open >= tokens.length) continue;
      const close = matchingToken(tokens, open);
      if (close < 0) throw new TelemarkJavaError(`Enum ${name} is missing '}'`, tokens[i]);
      const values = [];
      for (let cursor = open + 1; cursor < close; cursor += 1) {
        const token = tokens[cursor];
        if (token.value === ";") break;
        if (
          token.type === "identifier"
          && (cursor === open + 1 || tokens[cursor - 1].value === ",")
        ) {
          values.push(token.value);
        }
      }
      enums.push({type: "EnumDeclaration", name, values});
      i = close;
    }
    return enums;
  }

  function nextSignificant(tokens, from, direction = 1) {
    let index = from + direction;
    while (index >= 0 && index < tokens.length) {
      if (tokens[index].type !== "space" && tokens[index].type !== "comment") return index;
      index += direction;
    }
    return -1;
  }

  function matchingToken(tokens, openIndex) {
    const open = tokens[openIndex]?.value;
    const close = open === "{" ? "}" : open === "(" ? ")" : open === "[" ? "]" : null;
    if (!close) return -1;
    let depth = 0;
    for (let i = openIndex; i < tokens.length; i += 1) {
      if (tokens[i].value === open) depth += 1;
      if (tokens[i].value === close) {
        depth -= 1;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  function extractClasses(source, allTokens) {
    const tokens = significant(allTokens);
    const classes = [];
    for (let i = 0; i < tokens.length; i += 1) {
      if (tokens[i].value !== "class") continue;
      const name = tokens[i + 1];
      if (!name || name.type !== "identifier") continue;
      let cursor = i + 2;
      let superClass = null;
      if (tokens[cursor]?.value === "extends") {
        superClass = tokens[cursor + 1]?.value || null;
        cursor += 2;
      }
      while (cursor < tokens.length && tokens[cursor].value !== "{") cursor += 1;
      if (cursor >= tokens.length) continue;
      const close = matchingToken(tokens, cursor);
      if (close < 0) throw new TelemarkJavaError(`Class ${name.value} is missing '}'`, name);
      const bodyStart = tokens[cursor].end;
      const bodyEnd = tokens[close].start;
      classes.push({
        type: "ClassDeclaration",
        name: name.value,
        superClass,
        start: tokens[i].start,
        end: tokens[close].end,
        bodyStart,
        bodyEnd,
        methods: extractMethods(source, bodyStart, bodyEnd),
        fields: extractFields(source.slice(bodyStart, bodyEnd)),
      });
      i = close;
    }
    return classes;
  }

  function extractFields(classBody) {
    const tokens = significant(tokenize(classBody));
    const fields = [];
    let depth = 0;
    let statement = [];

    for (const token of tokens) {
      if (token.value === "{") {
        depth += 1;
        if (depth === 1) statement = [];
        continue;
      }
      if (token.value === "}") {
        depth -= 1;
        statement = [];
        continue;
      }
      if (depth > 0) continue;
      statement.push(token);
      if (token.value !== ";") continue;

      const isStatic = statement.some((part) => part.value === "static");
      const useful = statement.filter((part) => !MODIFIERS.has(part.value));
      statement = [];
      if (useful.some((part) => part.value === "(")) continue;
      if (!isDeclarationType(useful, 0)) continue;

      let cursor = 1;
      while (useful[cursor]?.value === "[" && useful[cursor + 1]?.value === "]") cursor += 2;
      while (cursor < useful.length) {
        const nameToken = useful[cursor];
        if (nameToken?.type !== "identifier") break;
        cursor += 1;
        const initializer = [];
        if (useful[cursor]?.value === "=") {
          cursor += 1;
          while (cursor < useful.length && ![",", ";"].includes(useful[cursor].value)) {
            initializer.push(useful[cursor]);
            cursor += 1;
          }
        }
        fields.push({
          name: nameToken.value,
          type: useful[0]?.value || "Object",
          static: isStatic,
          initialValue: literalValue(initializer),
          initializer: initializer.map((part) => part.value).join(" "),
        });
        if (useful[cursor]?.value === ",") cursor += 1;
        else break;
      }
    }
    return fields;
  }

  function literalValue(tokens) {
    if (!tokens.length) return undefined;
    if (tokens.length === 1) {
      const token = tokens[0];
      if (token.type === "number") return Number(token.value);
      if (token.type === "string") {
        try {
          return JSON.parse(token.value);
        } catch {
          return token.value.slice(1, -1);
        }
      }
      if (token.value === "true") return true;
      if (token.value === "false") return false;
      if (token.value === "null") return null;
    }
    if (
      tokens.length === 3
      && tokens[0].type === "identifier"
      && tokens[1].value === "."
      && tokens[2].type === "identifier"
    ) {
      return tokens[2].value;
    }
    return undefined;
  }

  function extractMethods(source, bodyStart, bodyEnd) {
    const tokens = significant(tokenize(source.slice(bodyStart, bodyEnd))).map((token) => ({
      ...token,
      start: token.start + bodyStart,
      end: token.end + bodyStart,
    }));
    const methods = [];
    let depth = 0;
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (token.value === "{") depth += 1;
      if (token.value === "}") depth -= 1;
      if (depth !== 0 || token.value !== "(") continue;

      const nameToken = tokens[i - 1];
      if (!nameToken || nameToken.type !== "identifier" || CONTROL_WORDS.has(nameToken.value)) continue;
      const paramsEnd = matchingToken(tokens, i);
      if (paramsEnd < 0) continue;
      let bodyOpen = paramsEnd + 1;
      while (MODIFIERS.has(tokens[bodyOpen]?.value)) bodyOpen += 1;
      if (tokens[bodyOpen]?.value !== "{") continue;
      const bodyClose = matchingToken(tokens, bodyOpen);
      if (bodyClose < 0) throw new TelemarkJavaError(`Method ${nameToken.value} is missing '}'`, nameToken);
      methods.push({
        type: "MethodDeclaration",
        name: nameToken.value,
        params: parseParameters(tokens.slice(i + 1, paramsEnd)),
        body: source.slice(tokens[bodyOpen].end, tokens[bodyClose].start),
        line: nameToken.line,
        column: nameToken.column,
      });
      i = bodyClose;
    }
    return methods;
  }

  function parseParameters(tokens) {
    const params = [];
    let current = [];
    for (const token of tokens) {
      if (token.value === ",") {
        if (current.length) params.push(current[current.length - 1].value);
        current = [];
      } else {
        current.push(token);
      }
    }
    if (current.length) params.push(current[current.length - 1].value);
    return params;
  }

  function findMethod(source, name) {
    const ast = parse(source);
    for (const classNode of ast.classes) {
      const method = classNode.methods.find((candidate) => candidate.name === name);
      if (method) return method;
    }
    return null;
  }

  function isDeclarationType(tokens, index) {
    const token = tokens[index];
    if (!token || token.type !== "identifier") return false;
    if (!TYPE_NAMES.has(token.value) && !/^[A-Z]\w*$/.test(token.value)) return false;
    let next = index + 1;
    if (tokens[next]?.value === "<") {
      let genericDepth = 1;
      next += 1;
      while (next < tokens.length && genericDepth) {
        if (tokens[next].value === "<") genericDepth += 1;
        if (tokens[next].value === ">") genericDepth -= 1;
        next += 1;
      }
    }
    while (tokens[next]?.value === "[" && tokens[next + 1]?.value === "]") next += 2;
    return tokens[next]?.type === "identifier";
  }

  function emitExpression(tokens, options) {
    let output = "";
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      const value = token.value;

      if (value === "this" && tokens[i + 1]?.value === ".") continue;
      if (value === "null") {
        output += "null ";
        continue;
      }
      if (value === "Math" || value === "String") {
        output += value + " ";
        continue;
      }
      if (value === "gamepad1") {
        output += (options.gamepad1Name || "gamepad") + " ";
        continue;
      }
      if (value === "gamepad2") {
        output += (options.gamepad2Name || "gamepad2") + " ";
        continue;
      }
      if (value === "telemetry" && tokens[i + 1]?.value === "." && tokens[i + 2]?.value === "addData") {
        output += (options.addTelemetryName || "addTelemetry");
        i += 2;
        continue;
      }
      if (value === "telemetry" && tokens[i + 1]?.value === "." && tokens[i + 2]?.value === "update") {
        output += (options.updateTelemetryName || "updateTelemetry");
        i += 2;
        continue;
      }
      if (value === "telemetry" && tokens[i + 1]?.value === "." && tokens[i + 2]?.value === "clear") {
        output += (options.clearTelemetryName || "clearTelemetry");
        i += 2;
        continue;
      }
      if (tokens[i + 1]?.value === "." && tokens[i + 2]?.value === "class") {
        output += JSON.stringify(value);
        i += 2;
        continue;
      }
      if (
        ["DcMotor", "DcMotorSimple", "Servo", "DigitalChannel"].includes(value)
        && tokens[i + 1]?.value === "."
      ) {
        let cursor = i + 1;
        const parts = [value];
        while (tokens[cursor]?.value === "." && tokens[cursor + 1]?.type === "identifier") {
          parts.push(tokens[cursor + 1].value);
          cursor += 2;
        }
        if (parts.length >= 3) {
          output += JSON.stringify(parts[parts.length - 1]);
          i = cursor - 1;
          continue;
        }
      }
      if (value === "new" && tokens[i + 1]?.type === "identifier") {
        const typeName = tokens[i + 1].value;
        if (tokens[i + 2]?.value === "[" && tokens[i + 4]?.value === "]") {
          output += "new Array(" + emitExpression([tokens[i + 3]], options) + ")";
          i += 4;
          continue;
        }
        output += "new " + typeName + " ";
        i += 1;
        continue;
      }
      if (value === "(double)" || value === "(int)") continue;
      output += value;
      if (token.type === "identifier" || token.type === "number" || token.type === "string") output += " ";
    }
    return output.trim();
  }

  function transpileBody(source, options = {}) {
    const rawTokens = significant(tokenize(source));
    assertBalanced(rawTokens);
    const output = [];
    let loopCounter = 0;
    const loopGuards = new Map();

    for (let i = 0; i < rawTokens.length; i += 1) {
      const token = rawTokens[i];

      if (token.value === "@") {
        while (i < rawTokens.length && ![";", "{"].includes(rawTokens[i]?.value)) i += 1;
        i -= 1;
        continue;
      }

      if (MODIFIERS.has(token.value)) continue;

      if (token.value === "for" && rawTokens[i + 1]?.value === "(") {
        const close = matchingToken(rawTokens, i + 1);
        const inside = rawTokens.slice(i + 2, close);
        const colonIndex = inside.findIndex((part) => part.value === ":");
        const semicolonCount = inside.filter((part) => part.value === ";").length;
        if (colonIndex >= 0 && semicolonCount === 0) {
          const left = inside.slice(0, colonIndex);
          const name = [...left].reverse().find((part) => part.type === "identifier")?.value;
          const right = inside.slice(colonIndex + 1);
          if (!name) throw new TelemarkJavaError("Invalid enhanced for loop", token);
          const guard = `__telemarkLoop${loopCounter++}`;
          output.push(`let ${guard}=0; for (const ${name} of ${emitExpression(right, options)})`);
          loopGuards.set(close, guard);
          i = close;
          continue;
        }
        const guard = `__telemarkLoop${loopCounter++}`;
        output.push(`let ${guard}=0; for`);
        loopGuards.set(close, guard);
        continue;
      }

      if (
        token.value === "case"
        && rawTokens[i + 1]?.type === "identifier"
        && rawTokens[i + 2]?.value === ":"
      ) {
        output.push("case", JSON.stringify(rawTokens[i + 1].value), ":");
        i += 2;
        continue;
      }

      if (token.value === "while" && rawTokens[i + 1]?.value === "(") {
        const close = matchingToken(rawTokens, i + 1);
        const guard = `__telemarkLoop${loopCounter++}`;
        output.push(`let ${guard}=0; while`);
        loopGuards.set(close, guard);
        continue;
      }

      if (isDeclarationType(rawTokens, i)) {
        let cursor = i + 1;
        if (rawTokens[cursor]?.value === "<") {
          let depth = 1;
          cursor += 1;
          while (cursor < rawTokens.length && depth) {
            if (rawTokens[cursor].value === "<") depth += 1;
            if (rawTokens[cursor].value === ">") depth -= 1;
            cursor += 1;
          }
        }
        while (rawTokens[cursor]?.value === "[" && rawTokens[cursor + 1]?.value === "]") cursor += 2;
        output.push("let");
        i = cursor - 1;
        continue;
      }

      if (token.value === "{") {
        const previous = rawTokens[i - 1];
        const guard = previous?.value === ")" ? loopGuards.get(i - 1) : null;
        output.push("{");
        if (guard) {
          output.push(`if(++${guard}>${options.loopLimit || 10000}) throw new Error("Loop limit exceeded");`);
        }
        continue;
      }

      if (token.value === "this" && rawTokens[i + 1]?.value === ".") {
        if (options.preserveThis) {
          output.push("this");
        } else {
          i += 1;
        }
        continue;
      }

      if (token.value === "gamepad1") {
        output.push(options.gamepad1Name || "gamepad");
        continue;
      }

      if (token.value === "gamepad2") {
        output.push(options.gamepad2Name || "gamepad2");
        continue;
      }

      if (
        options.async
        && ["waitForStart", "sleep"].includes(token.value)
        && rawTokens[i + 1]?.value === "("
      ) {
        output.push("await", token.value);
        continue;
      }

      if (
        token.value === "telemetry"
        && rawTokens[i + 1]?.value === "."
        && ["addData", "update", "clear"].includes(rawTokens[i + 2]?.value)
      ) {
        const method = rawTokens[i + 2].value;
        output.push(
          method === "addData"
            ? (options.addTelemetryName || "addTelemetry")
            : method === "update"
              ? (options.updateTelemetryName || "updateTelemetry")
              : (options.clearTelemetryName || "clearTelemetry"),
        );
        i += 2;
        continue;
      }

      if (rawTokens[i + 1]?.value === "." && rawTokens[i + 2]?.value === "class") {
        output.push(JSON.stringify(token.value));
        i += 2;
        continue;
      }

      if (
        ["DcMotor", "DcMotorSimple", "Servo", "DigitalChannel"].includes(token.value)
        && rawTokens[i + 1]?.value === "."
      ) {
        let cursor = i + 1;
        const parts = [token.value];
        while (rawTokens[cursor]?.value === "." && rawTokens[cursor + 1]?.type === "identifier") {
          parts.push(rawTokens[cursor + 1].value);
          cursor += 2;
        }
        if (parts.length >= 3) {
          output.push(JSON.stringify(parts[parts.length - 1]));
          i = cursor - 1;
          continue;
        }
      }

      if (token.value === "new" && rawTokens[i + 1]?.type === "identifier") {
        const typeName = rawTokens[i + 1].value;
        if (rawTokens[i + 2]?.value === "[") {
          const close = matchingToken(rawTokens, i + 2);
          const size = rawTokens.slice(i + 3, close);
          output.push(`new Array(${emitExpression(size, options)})`);
          i = close;
          continue;
        }
        output.push("new", typeName);
        i += 1;
        continue;
      }

      if (
        token.value === "("
        && ["double", "float", "long", "short", "byte", "boolean", "String"].includes(rawTokens[i + 1]?.value)
        && rawTokens[i + 2]?.value === ")"
      ) {
        i += 2;
        continue;
      }

      if (token.value === "(" && rawTokens[i + 1]?.value === "int" && rawTokens[i + 2]?.value === ")") {
        i += 2;
        continue;
      }

      if (token.type === "number") {
        output.push(token.value.replace(/[fFdDlL]$/, ""));
        continue;
      }

      if (token.value === "true" || token.value === "false" || token.value === "null") {
        output.push(token.value);
        continue;
      }

      if (token.value === "super" && rawTokens[i + 1]?.value === ".") {
        output.push(options.preserveThis ? "super" : "this");
        continue;
      }

      if (
        options.fieldNames?.has(token.value)
        && token.type === "identifier"
        && rawTokens[i - 1]?.value !== "."
        && rawTokens[i + 1]?.value !== ":"
      ) {
        output.push("this." + token.value);
        continue;
      }

      if (token.value === "System" && rawTokens[i + 1]?.value === ".") {
        output.push("System");
        continue;
      }

      if (token.value === "do") {
        const guard = `__telemarkLoop${loopCounter++}`;
        output.push(`let ${guard}=0; do`);
        continue;
      }

      if (token.value === "synchronized") continue;

      output.push(token.value);
    }

    return output.join(" ")
      .replace(/\s+([;,.()[\]{}])/g, "$1")
      .replace(/([({[])\s+/g, "$1")
      .replace(/\s+([)}\]])/g, "$1")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function diagnosticFromError(error) {
    return {
      severity: "error",
      message: error.message,
      line: error.line || 1,
      column: error.column || 1,
      code: error.code || "COMPILE_ERROR",
    };
  }

  function createGamepad(source = {}) {
    const aliases = {
      left_stick_x: "leftStickX",
      left_stick_y: "leftStickY",
      right_stick_x: "rightStickX",
      right_stick_y: "rightStickY",
      left_trigger: "leftTrigger",
      right_trigger: "rightTrigger",
      left_bumper: "leftBumper",
      right_bumper: "rightBumper",
      dpad_up: "dpadUp",
      dpad_down: "dpadDown",
      dpad_left: "dpadLeft",
      dpad_right: "dpadRight",
    };
    return new Proxy(source, {
      get(target, property) {
        if (property in target) return target[property];
        const alias = aliases[property];
        return alias ? target[alias] : undefined;
      },
      set(target, property, value) {
        if (property in target) target[property] = value;
        else if (aliases[property] && aliases[property] in target) target[aliases[property]] = value;
        else target[property] = value;
        return true;
      },
    });
  }

  function createRuntime(options = {}) {
    const devices = new Map();
    const telemetry = [];
    const gamepad1 = createGamepad(options.gamepad1 || options.gamepad || {});
    const gamepad2 = createGamepad(options.gamepad2 || {});

    function device(type, name) {
      const key = `${type}:${name}`;
      if (devices.has(key)) return devices.get(key);
      const state = {
        type,
        name,
        power: 0,
        position: 0,
        direction: "FORWARD",
        mode: "RUN_WITHOUT_ENCODER",
        targetPosition: 0,
        currentPosition: 0,
      };
      const value = {
        setPower(power) {
          state.power = Number(power) || 0;
          options.onPower?.(state.power, state);
        },
        getPower: () => state.power,
        setPosition(position) {
          state.position = Number(position) || 0;
          options.onPosition?.(state.position, state);
        },
        getPosition: () => state.position,
        setDirection(direction) {
          state.direction = direction;
          options.onDirection?.(direction, state);
        },
        setMode(mode) {
          state.mode = mode;
          options.onMode?.(mode, state);
        },
        setTargetPosition(position) {
          state.targetPosition = Number(position) || 0;
          options.onTargetPosition?.(state.targetPosition, state);
        },
        getCurrentPosition: () =>
          options.getCurrentPosition?.(state) ?? state.currentPosition,
        isBusy: () => options.isBusy?.(state) ?? false,
        getState: () => options.getDigitalState?.(state) ?? true,
        isPressed: () => options.isPressed?.(state) ?? false,
        getVoltage: () => options.getVoltage?.(state) ?? 0,
        getDistance: (unit) => options.getDistance?.(state, unit) ?? Infinity,
        red: () => options.getColor?.("red", state) ?? 0,
        green: () => options.getColor?.("green", state) ?? 0,
        blue: () => options.getColor?.("blue", state) ?? 0,
        _state: state,
      };
      devices.set(key, value);
      return value;
    }

    return {
      gamepad1,
      gamepad2,
      devices,
      hardwareMap: {
        get(type, name) {
          return device(String(type), String(name));
        },
      },
      addTelemetry(key, value, ...formatArgs) {
        let rendered = value;
        if (typeof value === "string" && formatArgs.length) {
          let index = 0;
          rendered = value.replace(/%(\.\d+)?f|%d|%s/g, (specifier) => {
            const next = formatArgs[index++];
            if (specifier.endsWith("f")) {
              const precision = Number(specifier.match(/\.(\d+)/)?.[1] || 6);
              return Number(next).toFixed(precision);
            }
            if (specifier === "%d") return String(Math.trunc(Number(next)));
            return String(next);
          });
        }
        telemetry.push({key: String(key), value: rendered});
        options.onTelemetry?.(String(key), rendered);
      },
      updateTelemetry() {
        options.onTelemetryUpdate?.(telemetry.slice());
      },
      clearTelemetry() {
        telemetry.length = 0;
        options.onTelemetryClear?.();
      },
      getRuntime: options.getRuntime || (() => 0),
      isStopRequested: options.isStopRequested || (() => false),
      opModeIsActive: options.opModeIsActive || (() => true),
      waitForStart: options.waitForStart || (() => Promise.resolve()),
      sleep: options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, Number(ms) || 0))),
    };
  }

  function compileMethod(method, options = {}) {
    const js = transpileBody(method.body, options);
    try {
      const FunctionConstructor = options.async
        ? Object.getPrototypeOf(async function () {}).constructor
        : Function;
      const fn = new FunctionConstructor(
        "runtime",
        "scope",
        ...method.params,
        `const gamepad=runtime.gamepad1||runtime.gamepad||{};
const gamepad2=runtime.gamepad2||{};
const hardwareMap=runtime.hardwareMap;
const addTelemetry=runtime.addTelemetry||(()=>{});
const updateTelemetry=runtime.updateTelemetry||(()=>{});
const clearTelemetry=runtime.clearTelemetry||(()=>{});
const getRuntime=runtime.getRuntime||(()=>0);
const opModeIsActive=runtime.opModeIsActive||(()=>false);
const isStopRequested=runtime.isStopRequested||(()=>false);
const waitForStart=runtime.waitForStart||(()=>Promise.resolve());
const sleep=runtime.sleep||(()=>Promise.resolve());
${options.classPrelude || ""}
with(scope){${js}}`
      );
      return (...args) => fn(options.runtime || {}, options.scope || {}, ...args);
    } catch (error) {
      throw new TelemarkJavaError(
        `${method.name}() compile error: ${error.message}`,
        {line: method.line, column: method.column},
        "JAVASCRIPT_GENERATION_ERROR",
      );
    }
  }

  function defaultValue(field) {
    if (field.initializer) return field.initializer;
    if (field.type === "boolean") return "false";
    if (["byte", "double", "float", "int", "long", "short"].includes(field.type)) return "0";
    return "null";
  }

  function buildClassPrelude(ast, mainClass, options = {}) {
    const definitions = (ast.enums || []).map((enumNode) => {
      const entries = enumNode.values
        .map((value) => `${value}:${JSON.stringify(value)}`)
        .join(",");
      return `const ${enumNode.name}=Object.freeze({${entries}});`;
    });
    for (const classNode of ast.classes) {
      if (classNode === mainClass) continue;
      const inheritedFields = classNode.superClass
        ? ast.classes.find((candidate) => candidate.name === classNode.superClass)?.fields || []
        : [];
      const fieldNames = new Set(
        [...inheritedFields, ...(classNode.fields || [])]
          .filter((field) => !field.static)
          .map((field) => field.name),
      );
      const constructor = classNode.methods.find((method) => method.name === classNode.name);
      const instanceInitializers = (classNode.fields || [])
        .filter((field) => !field.static)
        .map((field) => `this.${field.name}=${defaultValue(field)};`)
        .join("");
      const methods = classNode.methods
        .filter((method) => method.name !== classNode.name)
        .map((method) => {
          const body = transpileBody(method.body, {
            ...options,
            preserveThis: true,
            fieldNames,
          });
          return `${method.name}(${method.params.join(",")}){${body}}`;
        })
        .join("\n");
      const constructorBody = constructor
        ? transpileBody(constructor.body, {
            ...options,
            preserveThis: true,
            fieldNames,
          })
        : "";
      const extension = classNode.superClass ? ` extends ${classNode.superClass}` : "";
      const implicitSuper = classNode.superClass && !/\bsuper\s*\(/.test(constructorBody)
        ? "super();"
        : "";
      definitions.push(
        `class ${classNode.name}${extension}{constructor(${constructor?.params.join(",") || ""}){${implicitSuper}${instanceInitializers}${constructorBody}}${methods}}`,
      );
      for (const field of classNode.fields || []) {
        if (field.static) definitions.push(`${classNode.name}.${field.name}=${defaultValue(field)};`);
      }
    }
    return definitions.join("\n");
  }

  function compile(source, runtime = {}, options = {}) {
    try {
      const ast = parse(source);
      const classNode = ast.classes.find((candidate) =>
        candidate.superClass === "OpMode" || candidate.superClass === "LinearOpMode"
      ) || ast.classes[0];
      if (!classNode) throw new TelemarkJavaError("No Java class was found");
      const scope = Object.fromEntries(
        (classNode.fields || []).map((field) => [field.name, field.initialValue]),
      );
      const classPrelude = buildClassPrelude(ast, classNode, options);
      const methods = {};
      for (const method of classNode.methods) {
        methods[method.name] = compileMethod(method, {
          ...options,
          runtime,
          scope,
          classPrelude,
          async: classNode.superClass === "LinearOpMode" && method.name === "runOpMode",
        });
      }
      for (const [name, method] of Object.entries(methods)) {
        if (!["init", "init_loop", "start", "loop", "stop", "runOpMode"].includes(name)) {
          scope[name] = method;
        }
      }
      return {
        ok: true,
        ast,
        className: classNode.name,
        kind: classNode.superClass === "LinearOpMode" ? "linear" : "iterative",
        methods,
        scope,
        diagnostics: [],
      };
    } catch (error) {
      return {
        ok: false,
        diagnostics: [diagnosticFromError(error)],
      };
    }
  }

  function createLifecycle(options = {}) {
    const tickMs = options.tickMs || 50;
    let compiled = null;
    let phase = "idle";
    let initTimer = null;
    let loopTimer = null;
    let startResolver = null;
    let stopRequested = false;
    const pendingSleeps = new Map();

    const clearTimers = () => {
      if (initTimer) clearInterval(initTimer);
      if (loopTimer) clearInterval(loopTimer);
      initTimer = null;
      loopTimer = null;
    };
    const call = (name) => {
      if (!compiled?.methods[name]) return;
      return compiled.methods[name]();
    };

    const runtime = {
      ...(options.runtime || {}),
      getRuntime: () => options.getRuntime?.() ?? 0,
      isStopRequested: () => stopRequested,
      opModeIsActive: () => phase === "running" && !stopRequested,
      waitForStart: () => new Promise((resolve) => {
        if (phase === "running") resolve();
        else startResolver = resolve;
      }),
      sleep: (ms) => new Promise((resolve) => {
        const timer = setTimeout(() => {
          pendingSleeps.delete(timer);
          resolve();
        }, Math.max(0, Number(ms) || 0));
        pendingSleeps.set(timer, resolve);
      }),
    };

    return {
      get phase() {
        return phase;
      },
      init(source) {
        clearTimers();
        stopRequested = false;
        phase = "initialized";
        compiled = compile(source, runtime, options.compiler);
        if (!compiled.ok) return compiled;
        options.onReset?.();
        if (compiled.kind === "linear") {
          Promise.resolve(call("runOpMode")).catch(options.onError || console.error);
        } else {
          call("init");
          if (compiled.methods.init_loop) {
            initTimer = setInterval(() => {
              if (phase === "initialized") call("init_loop");
            }, tickMs);
          }
        }
        return compiled;
      },
      start() {
        if (!compiled?.ok || phase !== "initialized") return;
        if (initTimer) clearInterval(initTimer);
        initTimer = null;
        phase = "running";
        if (startResolver) {
          startResolver();
          startResolver = null;
        }
        if (compiled.kind === "iterative") {
          call("start");
          if (compiled.methods.loop) loopTimer = setInterval(() => call("loop"), tickMs);
        }
      },
      stop() {
        if (phase === "idle" || phase === "stopped") return;
        stopRequested = true;
        clearTimers();
        if (startResolver) {
          startResolver();
          startResolver = null;
        }
        for (const [timer, resolve] of pendingSleeps) {
          clearTimeout(timer);
          resolve();
        }
        pendingSleeps.clear();
        if (compiled?.kind === "iterative") call("stop");
        phase = "stopped";
        options.onStop?.();
      },
      reset() {
        clearTimers();
        stopRequested = false;
        startResolver = null;
        for (const [timer, resolve] of pendingSleeps) {
          clearTimeout(timer);
          resolve();
        }
        pendingSleeps.clear();
        compiled = null;
        phase = "idle";
        options.onReset?.();
      },
    };
  }

  return {
    version: "1.0.0",
    TelemarkJavaError,
    tokenize,
    parse,
    findMethod,
    transpileBody,
    compile,
    createLifecycle,
    createGamepad,
    createRuntime,
  };
});

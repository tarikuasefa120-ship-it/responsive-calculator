// Memory value storage
let memory = 0;

// Angle mode: "deg" (degrees) or "rad" (radians)
let angleMode = "deg";

// Get important DOM elements
const display = document.getElementById("display"); // Input display
const modeButton = document.getElementById("modeButton"); // Degree/Radian toggle button
const themeToggle = document.getElementById("themeToggle"); // Theme toggle button

// Toggle between light and dark theme
function toggleTheme() {
  document.body.classList.toggle("dark"); // Add/remove "dark" class
  // Change icon depending on mode
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}

// Move cursor to end of input
function setCursorToEnd(el) {
  el.focus(); // Focus input
  el.setSelectionRange(el.value.length, el.value.length); // Move cursor to end
}

// Insert text at cursor position
function insertAtCursor(text) {
  const start = display.selectionStart; // Cursor start
  const end = display.selectionEnd; // Cursor end
  const before = display.value.substring(0, start); // Text before cursor
  const after = display.value.substring(end); // Text after cursor

  display.value = before + text + after; // Insert text

  const pos = start + text.length; // New cursor position
  display.setSelectionRange(pos, pos); // Set cursor
  display.focus(); // Refocus input
}

// Append value (used for numbers and symbols)
function append(val) {
  insertAtCursor(val);
}

// Append trig function with opening bracket
function appendTrig(fn) {
  insertAtCursor(fn + '(');
}

// Append symbol directly
function appendSymbol(sym) {
  insertAtCursor(sym);
}

// Insert nth root template
function insertRoot() {
  insertAtCursor('root( , )'); // Placeholder format
  const pos = display.value.indexOf('root( , )') + 5; // Position inside brackets
  display.setSelectionRange(pos, pos);
  display.focus();
}

// Clear entire display
function clearDisplay() {
  display.value = '';
  display.focus();
}

// Delete last character or selection
function backspace() {
  const start = display.selectionStart;
  const end = display.selectionEnd;

  if (start === end && start > 0) {
    // Delete single character
    display.value = display.value.slice(0, start - 1) + display.value.slice(end);
    display.setSelectionRange(start - 1, start - 1);
  } else {
    // Delete selected text
    display.value = display.value.slice(0, start) + display.value.slice(end);
    display.setSelectionRange(start, start);
  }

  display.focus();
}

// Factorial calculation (recursive)
function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw Error("Invalid factorial"); // Only valid for non-negative integers
  return n <= 1 ? 1 : n * factorial(n - 1);
}

// Permutation: nPr
function nPr(n, r) {
  return factorial(n) / factorial(n - r);
}

// Combination: nCr
function nCr(n, r) {
  return factorial(n) / (factorial(r) * factorial(n - r));
}

// Check undefined trig cases (e.g., tan(90°))
function isUndefinedTrig(fn, val) {
  if (angleMode === "deg") {
    if (fn === "tan") {
      const normalized = ((+val % 180) + 180) % 180; // Normalize angle
      return normalized === 90; // Undefined at 90°, 270°, etc.
    }
  } else {
    if (fn === "tan") {
      const cosVal = Math.cos(+val);
      return Math.abs(cosVal) < 1e-10; // Avoid division by zero
    }
  }
  return false;
}

// Evaluate trig functions inside expression
function evaluateTrigFunctions(expr) {
  const deg = angleMode === "deg";

  return expr.replace(/(sin|cos|tan|asin|acos|atan)\(([^()]+)\)/g, (_, fn, arg) => {
    const val = eval(arg); // Evaluate inner value

    if (isUndefinedTrig(fn, val)) return "undefined";

    const trig = {
      sin: x => Math.sin(deg ? x * Math.PI / 180 : x),
      cos: x => Math.cos(deg ? x * Math.PI / 180 : x),
      tan: x => Math.tan(deg ? x * Math.PI / 180 : x),
      asin: x => deg ? Math.asin(x) * 180 / Math.PI : Math.asin(x),
      acos: x => deg ? Math.acos(x) * 180 / Math.PI : Math.acos(x),
      atan: x => deg ? Math.atan(x) * 180 / Math.PI : Math.atan(x),
    };

    return trig[fn](val);
  });
}

// Evaluate factorials in expression
function evaluateFactorials(expr) {
  return expr.replace(/(\d+)!/g, (_, n) => factorial(+n));
}

// Evaluate exponents (^)
function evaluateExponents(expr) {
  const expRE = /(\d+(?:\.\d+)?|\([^()]+\))\^(\d+(?:\.\d+)?|\([^()]+\))/;

  while (expRE.test(expr)) {
    expr = expr.replace(expRE, (_, base, exp) => Math.pow(eval(base), eval(exp)));
  }

  return expr;
}

// Convert e^(x) to Math.exp(x)
function convertEtoExp(expr) {
  return expr.replace(/e\^\(([^()]+)\)/g, (_, inside) => `Math.exp(${inside})`);
}

// Evaluate nth roots
function evaluateNthRoots(expr) {
  expr = expr.replace(/\\sqrt\[(\d+)\]\{([^{}]+)\}/g, (_, n, x) => Math.pow(+x, 1 / +n));
  expr = expr.replace(/root\(([^,]+),([^()]+)\)/g, (_, n, x) => Math.pow(+x, 1 / +n));
  expr = expr.replace(/(\d+)ⁿ√\(([^()]+)\)/g, (_, n, x) => Math.pow(+x, 1 / +n));
  return expr;
}

// Evaluate permutations and combinations
function evaluatePermutations(expr) {
  expr = expr.replace(/p\((\d+),(\d+)\)/g, (_, n, r) => nPr(+n, +r));
  expr = expr.replace(/c\((\d+),(\d+)\)/g, (_, n, r) => nCr(+n, +r));
  return expr;
}

// Evaluate natural log
function evaluateLn(expr) {
  return expr.replace(/ln\(([^)]+)\)/g, (_, x) => `Math.log(${x})`);
}

// Convert percentages to decimals
function evaluatePercent(expr) {
  return expr.replace(/(\d+(\.\d+)?)%/g, (_, num) => +num / 100);
}

// Replace symbols with JavaScript equivalents
function replaceSymbols(expr) {
  return expr.replace(/\u03C0/g, 'Math.PI') // π
             .replace(/\u221A\(/g, 'Math.sqrt(') // √
             .replace(/log\(/g, 'Math.log10(') // log
             .replace(/\u00F7/g, '/') // ÷
             .replace(/\u00D7/g, '*') // ×
             .replace(/(?<![a-zA-Z])e(?![a-zA-Z^(])/g, 'Math.E'); // e constant
}

// Preprocess expression before evaluation
function preprocess(expr) {
  expr = replaceSymbols(expr);
  expr = convertEtoExp(expr);
  expr = evaluatePercent(expr);
  expr = evaluateFactorials(expr);
  expr = evaluateLn(expr);
  expr = evaluatePermutations(expr);
  expr = evaluateTrigFunctions(expr);
  expr = evaluateNthRoots(expr);
  expr = evaluateExponents(expr);
  return expr;
}

// Main calculation function
function calculate() {
  try {
    const expr = preprocess(display.value); // Clean expression
    const result = eval(expr); // Evaluate

    if (!isFinite(result) || result === undefined || result === null || result === "undefined") {
      display.value = "undefined";
    } else {
      display.value = +parseFloat(result.toFixed(10)); // Limit decimals
    }
  } catch {
    display.value = "undefined"; // Catch errors
  }

  setCursorToEnd(display);
}

// Add value to memory
function memoryAdd() {
  try {
    const val = eval(preprocess(display.value));
    if (!isFinite(val)) throw new Error();
    memory += val;
    display.value = '';
  } catch {
    display.value = "undefined";
  }

  setCursorToEnd(display);
}

// Subtract value from memory
function memorySubtract() {
  try {
    const val = eval(preprocess(display.value));
    if (!isFinite(val)) throw new Error();
    memory -= val;
    display.value = '';
  } catch {
    display.value = "undefined";
  }

  setCursorToEnd(display);
}

// Recall memory value
function memoryRecall() {
  append(memory.toString());
}

// Keyboard input restrictions
display.addEventListener('keydown', e => {
  const keys = '0123456789+-*/().^!eπ,% ';

  // Block invalid keys
  if (!keys.includes(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
    e.preventDefault();
  }

  // Enter triggers calculation
  if (e.key === 'Enter') {
    e.preventDefault();
    calculate();
  }
});

// Toggle between degree and radian mode
function toggleMode() {
  angleMode = angleMode === "deg" ? "rad" : "deg";
  modeButton.textContent = angleMode;
  setCursorToEnd(display);
}

// Button click animation effect
const buttons = document.querySelectorAll("button");

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.add("active"); // Add animation class
    setTimeout(() => btn.classList.remove("active"), 120); // Remove after delay
  });
});
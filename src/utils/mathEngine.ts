/**
 * High-Precision Scientific Math Engine
 * Supports expressions, constants, trigonometric/hyperbolic functions,
 * operator precedence, implicit multiplication, step tracing, and variable substitution.
 */

export type AngleMode = 'DEG' | 'RAD' | 'GRAD';

export interface EvalOptions {
  angleMode?: AngleMode;
  variables?: Record<string, number>;
  recordSteps?: boolean;
}

export interface StepTrace {
  step: number;
  description: string;
  subExpression?: string;
  result?: string;
}

export interface EvalResult {
  value: number;
  steps: StepTrace[];
  error?: string;
}

export const CONSTANTS: Record<string, { value: number; symbol: string; description: string }> = {
  pi: { value: Math.PI, symbol: 'π', description: 'Archimedes constant (3.14159...)' },
  e: { value: Math.E, symbol: 'e', description: "Euler's number (2.71828...)" },
  phi: { value: 1.618033988749895, symbol: 'φ', description: 'Golden ratio (1.61803...)' },
  c: { value: 299792458, symbol: 'c', description: 'Speed of light in vacuum (m/s)' },
  h: { value: 6.62607015e-34, symbol: 'h', description: "Planck constant (J·s)" },
  G: { value: 6.6743e-11, symbol: 'G', description: 'Newtonian gravitational constant (m³/(kg·s²))' },
  NA: { value: 6.02214076e23, symbol: 'N_A', description: "Avogadro's constant (mol⁻¹)" },
  kB: { value: 1.380649e-23, symbol: 'k_B', description: "Boltzmann constant (J/K)" },
};

// Factorial helper with memoization/gamma approximation for non-integers
export function factorial(n: number): number {
  if (n < 0) return NaN;
  if (!Number.isInteger(n)) {
    // Lanczos approximation of Gamma(n + 1)
    return gamma(n + 1);
  }
  if (n > 170) return Infinity;
  let res = 1;
  for (let i = 2; i <= n; i++) {
    res *= i;
  }
  return res;
}

// Lanczos approximation for Gamma function
export function gamma(z: number): number {
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    x += p[i] / (z + i + 1);
  }
  const t = z + p.length - 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

export function permutations(n: number, r: number): number {
  if (n < 0 || r < 0 || r > n) return 0;
  return factorial(n) / factorial(n - r);
}

export function combinations(n: number, r: number): number {
  if (n < 0 || r < 0 || r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

// Angle conversion utilities
export function toRadians(angle: number, mode: AngleMode): number {
  if (mode === 'DEG') return (angle * Math.PI) / 180;
  if (mode === 'GRAD') return (angle * Math.PI) / 200;
  return angle;
}

export function fromRadians(rad: number, mode: AngleMode): number {
  if (mode === 'DEG') return (rad * 180) / Math.PI;
  if (mode === 'GRAD') return (rad * 200) / Math.PI;
  return rad;
}

type TokenType = 'NUMBER' | 'IDENTIFIER' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'COMMA';

interface Token {
  type: TokenType;
  value: string;
  isUnary?: boolean;
}

// Tokenize raw mathematical input string
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const str = input.replace(/\s+/g, '');

  while (i < str.length) {
    const char = str[i];

    // Numbers (integer, decimal, scientific notation)
    if (/[0-9]/.test(char) || (char === '.' && i + 1 < str.length && /[0-9]/.test(str[i + 1]))) {
      let numStr = '';
      while (i < str.length && (/[0-9.]/.test(str[i]) || ((str[i] === 'e' || str[i] === 'E') && i + 1 < str.length && /[0-9+-]/.test(str[i + 1])))) {
        if ((str[i] === 'e' || str[i] === 'E') && (str[i + 1] === '+' || str[i + 1] === '-')) {
          numStr += str[i];
          i++;
          numStr += str[i];
          i++;
        } else {
          numStr += str[i];
          i++;
        }
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Identifiers (function names, constants, variables)
    if (/[a-zA-Z_πφ]/.test(char)) {
      let idStr = '';
      while (i < str.length && /[a-zA-Z0-9_πφ]/.test(str[i])) {
        idStr += str[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value: idStr });
      continue;
    }

    // Operators and Parentheses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }
    if (char === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    if (['+', '-', '*', '/', '^', '%', '!', '×', '÷'].includes(char)) {
      const op = char === '×' ? '*' : char === '÷' ? '/' : char;
      // Detect unary operator: unary minus or plus occurs if it is at the start or follows an operator or LPAREN
      const prev = tokens[tokens.length - 1];
      const isUnary = (op === '-' || op === '+') && (!prev || prev.type === 'OPERATOR' || prev.type === 'LPAREN' || prev.type === 'COMMA');
      tokens.push({ type: 'OPERATOR', value: op, isUnary });
      i++;
      continue;
    }

    // Unknown character
    throw new Error(`Unexpected character: "${char}"`);
  }

  // Insert implicit multiplications: e.g. 2pi -> 2 * pi, 2(3) -> 2 * (3), (2)(3) -> (2)*(3), 3x -> 3*x
  const expanded: Token[] = [];
  for (let j = 0; j < tokens.length; j++) {
    const curr = tokens[j];
    const prev = tokens[j - 1];

    if (prev) {
      const isPrevOperand = prev.type === 'NUMBER' || prev.type === 'RPAREN' || (prev.type === 'IDENTIFIER' && !isKnownFunction(prev.value));
      const isCurrOperand = curr.type === 'NUMBER' || curr.type === 'LPAREN' || curr.type === 'IDENTIFIER';

      if (isPrevOperand && isCurrOperand) {
        expanded.push({ type: 'OPERATOR', value: '*' });
      }
    }
    expanded.push(curr);
  }

  return expanded;
}

export function isKnownFunction(name: string): boolean {
  const fns = [
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
    'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
    'ln', 'log', 'log10', 'log2', 'exp', 'sqrt', 'cbrt', 'root',
    'abs', 'round', 'floor', 'ceil', 'sign', 'fact', 'gamma',
    'nPr', 'nCr', 'deg', 'rad'
  ];
  return fns.includes(name.toLowerCase());
}

// Precedence and associativity
const PRECEDENCE: Record<string, { prec: number; rightAssoc?: boolean }> = {
  'u-': { prec: 5, rightAssoc: true },
  'u+': { prec: 5, rightAssoc: true },
  '!': { prec: 4 },
  '^': { prec: 4, rightAssoc: true },
  '*': { prec: 3 },
  '/': { prec: 3 },
  '%': { prec: 3 },
  '+': { prec: 2 },
  '-': { prec: 2 },
};

// Shunting Yard to Reverse Polish Notation (RPN)
export function shuntingYard(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const opStack: Token[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'NUMBER') {
      output.push(token);
    } else if (token.type === 'IDENTIFIER') {
      if (isKnownFunction(token.value)) {
        opStack.push(token);
      } else {
        // Variable or constant
        output.push(token);
      }
    } else if (token.type === 'COMMA') {
      while (opStack.length > 0 && opStack[opStack.length - 1].type !== 'LPAREN') {
        output.push(opStack.pop()!);
      }
      if (opStack.length === 0) {
        throw new Error('Misplaced comma or mismatched parentheses');
      }
    } else if (token.type === 'OPERATOR') {
      const opKey = token.isUnary ? `u${token.value}` : token.value;
      const opInfo = PRECEDENCE[opKey] || { prec: 1 };

      while (opStack.length > 0) {
        const top = opStack[opStack.length - 1];
        if (top.type === 'OPERATOR') {
          const topKey = top.isUnary ? `u${top.value}` : top.value;
          const topInfo = PRECEDENCE[topKey] || { prec: 1 };

          if (
            (!opInfo.rightAssoc && opInfo.prec <= topInfo.prec) ||
            (opInfo.rightAssoc && opInfo.prec < topInfo.prec)
          ) {
            output.push(opStack.pop()!);
            continue;
          }
        } else if (top.type === 'IDENTIFIER' && isKnownFunction(top.value)) {
          output.push(opStack.pop()!);
          continue;
        }
        break;
      }
      opStack.push(token);
    } else if (token.type === 'LPAREN') {
      opStack.push(token);
    } else if (token.type === 'RPAREN') {
      while (opStack.length > 0 && opStack[opStack.length - 1].type !== 'LPAREN') {
        output.push(opStack.pop()!);
      }
      if (opStack.length === 0) {
        throw new Error('Mismatched parentheses: unexpected ")"');
      }
      opStack.pop(); // Remove LPAREN
      if (opStack.length > 0 && opStack[opStack.length - 1].type === 'IDENTIFIER' && isKnownFunction(opStack[opStack.length - 1].value)) {
        output.push(opStack.pop()!);
      }
    }
  }

  while (opStack.length > 0) {
    const top = opStack.pop()!;
    if (top.type === 'LPAREN') {
      throw new Error('Mismatched parentheses: unclosed "("');
    }
    output.push(top);
  }

  return output;
}

// Evaluate RPN Tokens
export function evaluateRPN(rpn: Token[], options: EvalOptions = {}): EvalResult {
  const stack: number[] = [];
  const steps: StepTrace[] = [];
  const angleMode = options.angleMode || 'RAD';
  const variables = options.variables || {};

  let stepCount = 1;

  for (const token of rpn) {
    if (token.type === 'NUMBER') {
      stack.push(parseFloat(token.value));
    } else if (token.type === 'IDENTIFIER') {
      const lower = token.value.toLowerCase();

      // Check user variable
      if (token.value in variables) {
        stack.push(variables[token.value]);
        continue;
      }
      if (lower in variables) {
        stack.push(variables[lower]);
        continue;
      }

      // Check standard constants
      if (lower === 'pi' || token.value === 'π') {
        stack.push(Math.PI);
        continue;
      }
      if (lower === 'e') {
        stack.push(Math.E);
        continue;
      }
      if (lower === 'phi' || token.value === 'φ') {
        stack.push(1.618033988749895);
        continue;
      }
      if (CONSTANTS[token.value]) {
        stack.push(CONSTANTS[token.value].value);
        continue;
      }

      // Functions
      if (isKnownFunction(lower)) {
        if (lower === 'atan2' || lower === 'root' || lower === 'npr' || lower === 'ncr') {
          if (stack.length < 2) throw new Error(`Function ${token.value} requires 2 arguments`);
          const b = stack.pop()!;
          const a = stack.pop()!;
          let res = 0;
          if (lower === 'atan2') res = fromRadians(Math.atan2(a, b), angleMode);
          else if (lower === 'root') res = Math.pow(a, 1 / b);
          else if (lower === 'npr') res = permutations(a, b);
          else if (lower === 'ncr') res = combinations(a, b);

          if (options.recordSteps) {
            steps.push({
              step: stepCount++,
              description: `Calculate ${lower}(${formatNumber(a)}, ${formatNumber(b)})`,
              result: formatNumber(res),
            });
          }
          stack.push(res);
        } else {
          if (stack.length < 1) throw new Error(`Function ${token.value} requires 1 argument`);
          const a = stack.pop()!;
          let res = 0;

          switch (lower) {
            case 'sin':
              res = Math.sin(toRadians(a, angleMode));
              if (Math.abs(res) < 1e-15) res = 0;
              break;
            case 'cos':
              res = Math.cos(toRadians(a, angleMode));
              if (Math.abs(res) < 1e-15) res = 0;
              break;
            case 'tan': {
              const rad = toRadians(a, angleMode);
              if (Math.abs(Math.cos(rad)) < 1e-14) throw new Error('Undefined: tangent of right angle');
              res = Math.tan(rad);
              break;
            }
            case 'asin':
              if (a < -1 || a > 1) throw new Error('Domain error: arcsin argument must be between -1 and 1');
              res = fromRadians(Math.asin(a), angleMode);
              break;
            case 'acos':
              if (a < -1 || a > 1) throw new Error('Domain error: arccos argument must be between -1 and 1');
              res = fromRadians(Math.acos(a), angleMode);
              break;
            case 'atan':
              res = fromRadians(Math.atan(a), angleMode);
              break;
            case 'sinh':
              res = Math.sinh(a);
              break;
            case 'cosh':
              res = Math.cosh(a);
              break;
            case 'tanh':
              res = Math.tanh(a);
              break;
            case 'asinh':
              res = Math.asinh(a);
              break;
            case 'acosh':
              if (a < 1) throw new Error('Domain error: arccosh requires x >= 1');
              res = Math.acosh(a);
              break;
            case 'atanh':
              if (a <= -1 || a >= 1) throw new Error('Domain error: arctanh requires -1 < x < 1');
              res = Math.atanh(a);
              break;
            case 'ln':
              if (a <= 0) throw new Error('Domain error: logarithm of non-positive number');
              res = Math.log(a);
              break;
            case 'log':
            case 'log10':
              if (a <= 0) throw new Error('Domain error: logarithm of non-positive number');
              res = Math.log10(a);
              break;
            case 'log2':
              if (a <= 0) throw new Error('Domain error: logarithm of non-positive number');
              res = Math.log2(a);
              break;
            case 'exp':
              res = Math.exp(a);
              break;
            case 'sqrt':
              if (a < 0) throw new Error('Domain error: square root of negative number');
              res = Math.sqrt(a);
              break;
            case 'cbrt':
              res = Math.cbrt(a);
              break;
            case 'abs':
              res = Math.abs(a);
              break;
            case 'round':
              res = Math.round(a);
              break;
            case 'floor':
              res = Math.floor(a);
              break;
            case 'ceil':
              res = Math.ceil(a);
              break;
            case 'sign':
              res = Math.sign(a);
              break;
            case 'fact':
              res = factorial(a);
              break;
            case 'gamma':
              res = gamma(a);
              break;
            case 'deg':
              res = (a * 180) / Math.PI;
              break;
            case 'rad':
              res = (a * Math.PI) / 180;
              break;
            default:
              throw new Error(`Unsupported function: ${token.value}`);
          }

          if (options.recordSteps) {
            steps.push({
              step: stepCount++,
              description: `Evaluate ${lower}(${formatNumber(a)})`,
              result: formatNumber(res),
            });
          }
          stack.push(res);
        }
      } else {
        throw new Error(`Undefined variable or function: "${token.value}"`);
      }
    } else if (token.type === 'OPERATOR') {
      if (token.isUnary) {
        if (stack.length < 1) throw new Error('Invalid unary operator syntax');
        const a = stack.pop()!;
        const res = token.value === '-' ? -a : +a;
        stack.push(res);
      } else if (token.value === '!') {
        if (stack.length < 1) throw new Error('Invalid factorial syntax');
        const a = stack.pop()!;
        const res = factorial(a);
        if (options.recordSteps) {
          steps.push({
            step: stepCount++,
            description: `Compute factorial ${formatNumber(a)}!`,
            result: formatNumber(res),
          });
        }
        stack.push(res);
      } else {
        if (stack.length < 2) throw new Error(`Operator "${token.value}" requires 2 operands`);
        const b = stack.pop()!;
        const a = stack.pop()!;
        let res = 0;

        switch (token.value) {
          case '+':
            res = a + b;
            break;
          case '-':
            res = a - b;
            break;
          case '*':
            res = a * b;
            break;
          case '/':
            if (b === 0) throw new Error('Division by zero');
            res = a / b;
            break;
          case '^':
            res = Math.pow(a, b);
            break;
          case '%':
            res = a % b;
            break;
          default:
            throw new Error(`Unknown operator "${token.value}"`);
        }

        if (options.recordSteps) {
          steps.push({
            step: stepCount++,
            description: `${formatNumber(a)} ${token.value} ${formatNumber(b)}`,
            result: formatNumber(res),
          });
        }
        stack.push(res);
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error('Invalid expression format');
  }

  return {
    value: stack[0],
    steps,
  };
}

// Master evaluate expression function
export function evaluateExpression(expr: string, options: EvalOptions = {}): EvalResult {
  const clean = expr.trim();
  if (!clean) {
    return { value: 0, steps: [] };
  }

  try {
    const tokens = tokenize(clean);
    const rpn = shuntingYard(tokens);
    const result = evaluateRPN(rpn, options);
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Syntax Error';
    return {
      value: NaN,
      steps: [],
      error: message,
    };
  }
}

// Format numbers nicely: respects scientific vs float vs engineering formats
export function formatNumber(
  val: number,
  mode: 'standard' | 'scientific' | 'engineering' | 'fixed' = 'standard',
  digits: number = 6
): string {
  if (isNaN(val)) return 'Error';
  if (!isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';

  // Float close to 0
  if (Math.abs(val) < 1e-14 && val !== 0) return '0';

  if (mode === 'fixed') {
    return val.toFixed(digits);
  }

  if (mode === 'scientific') {
    return val.toExponential(digits);
  }

  if (mode === 'engineering') {
    const exp = Math.floor(Math.log10(Math.abs(val)));
    const engExp = Math.floor(exp / 3) * 3;
    const mantissa = val / Math.pow(10, engExp);
    return `${mantissa.toFixed(3)} × 10^${engExp}`;
  }

  // Standard smart format
  if (Math.abs(val) >= 1e12 || (Math.abs(val) > 0 && Math.abs(val) < 1e-6)) {
    return val.toExponential(6);
  }

  // Strip trailing zeros after decimal
  const str = Number(val.toFixed(10)).toString();
  return str;
}

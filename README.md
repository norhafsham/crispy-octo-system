# Safe Arithmetic Operations with Overflow/Underflow Checks

This repository demonstrates best practices for handling arithmetic operations safely in JavaScript/TypeScript, preventing overflow and underflow errors.

## 📋 Overview

Unchecked arithmetic operations can lead to unexpected behavior and security vulnerabilities. This project provides:

- **Safe arithmetic utilities** with built-in overflow/underflow validation
- **GitHub CodeQL Code Scanning** for continuous security analysis
- **Real-world examples** demonstrating safe operations
- **Custom error handling** for arithmetic failures

## 🚀 Features

### Safe Operations
- **safeAdd()** - Addition with overflow/underflow checks
- **safeSubtract()** - Subtraction with underflow checks
- **safeMultiply()** - Multiplication with overflow validation
- **safeDivide()** - Division with zero-check
- **safeIncrement()** - Safe increment with overflow check
- **safeDecrement()** - Safe decrement with underflow check
- **safeModulo()** - Modulo with zero-check
- **safePower()** - Exponentiation with overflow validation

### Validation Utilities
- **isWithinSafeRange()** - Check if a value is a safe integer
- **getSafeRange()** - Get the safe integer limits for JavaScript
- **validateSafeInteger()** - Throw `ArithmeticError` if a value is outside that range

## 📁 Project Structure

```
.
├── .github/
│   └── workflows/
│       ├── codeql.yml                        # CodeQL Code Scanning workflow
│       └── test.yml                          # Typecheck + tests with coverage
├── docs/                                     # Solidity-side reference guides
├── scripts/                                  # graphify maintenance tooling (Python)
├── src/
│   ├── arithmetic-utils.ts                   # Core safe arithmetic functions
│   ├── examples.ts                           # Usage examples (BankAccount, SafeCounter)
│   ├── event-emission-examples.ts            # Smart-contract event patterns (simulated)
│   ├── storage-optimization-examples.ts      # Storage/gas patterns (simulated)
│   └── *.test.ts                             # Vitest suites, one per source file
├── ton-blockchain-docs/                      # Vendored copy of ton-blockchain/docs
├── tsconfig.json
├── vitest.config.ts
└── README.md                                 # This file
```

`ton-blockchain-docs/` is a vendored copy of the upstream
[ton-blockchain/docs](https://github.com/ton-blockchain/docs) site. It is a
separate, self-contained npm project, is not built or tested by this
repository's CI, and should not be edited here — but it accounts for the large
majority of files in the tree, so scope repo-wide searches to `src/`.

The two `*-examples.ts` modules above *simulate* Solidity/EVM behavior in plain
TypeScript. There is no blockchain or gas metering involved; their
`estimatedGas` numbers are illustrative constants.

## 🔒 Safe Integer Range in JavaScript

JavaScript's safe integer range is defined by IEEE 754 double-precision floating-point format:

- **MAX_SAFE_INTEGER**: 9,007,199,254,740,991 (2^53 - 1)
- **MIN_SAFE_INTEGER**: -9,007,199,254,740,991 (-(2^53 - 1))

Operations outside this range may lose precision.

**These utilities are integer-only.** Every operand *and every result* is
checked with `Number.isInteger`, so passing a fractional value — or producing
one — throws `ArithmeticError`. `safeMultiply(100, 1.05)` and
`safeDivide(10, 4)` both throw. Represent fractional quantities as scaled
integers (money in cents, for example) and divide only where the result
divides evenly.

## 💻 Usage Examples

### Safe Addition
```typescript
import { safeAdd, ArithmeticError } from './src/arithmetic-utils';

try {
  const result = safeAdd(100, 50);
  console.log(result); // 150
} catch (error) {
  if (error instanceof ArithmeticError) {
    console.error('Arithmetic error:', error.message);
  }
}
```

### Safe Multiplication
```typescript
import { safeMultiply } from './src/arithmetic-utils';

try {
  const result = safeMultiply(6, 7);
  console.log(result); // 42
} catch (error) {
  if (error instanceof ArithmeticError) {
    console.error('Multiplication overflow detected');
  }
}
```

### Safe Division
```typescript
import { safeDivide } from './src/arithmetic-utils';

try {
  const result = safeDivide(20, 4);
  console.log(result); // 5
  
  // This will throw an error
  safeDivide(10, 0); // ArithmeticError: Division by zero
} catch (error) {
  if (error instanceof ArithmeticError) {
    console.error('Division by zero not allowed');
  }
}
```

### Real-world Example: Bank Transaction
Because the utilities are integer-only, hold money as whole cents and apply
rates with integer multiply-then-divide rather than a fractional factor:

```typescript
import { safeAdd, safeSubtract, safeMultiply, safeDivide, ArithmeticError } from './src/arithmetic-utils';

let balance = 100_000_000; // $1,000,000.00, in cents

try {
  balance = safeAdd(balance, 5_000_000);      // Deposit $50,000.00
  balance = safeSubtract(balance, 2_500_000); // Withdraw $25,000.00

  // 5% interest: multiply first, then divide, so no fractional value is ever
  // produced. safeMultiply(balance, 1.05) would throw.
  const interest = safeDivide(safeMultiply(balance, 5), 100);
  balance = safeAdd(balance, interest);       // 107,625,000 cents
} catch (error) {
  if (error instanceof ArithmeticError) {
    console.error('Transaction failed:', error.message);
  }
}
```

See `src/examples.ts` for a fuller `BankAccount` that wraps each of these in
its own try/catch and reports failure by returning `false` instead of throwing.

## 🔍 Code Scanning with CodeQL

This repository uses GitHub's CodeQL to automatically detect code quality issues and security vulnerabilities.

### How Code Scanning Works

1. **Automatic Analysis**: CodeQL analyzes code on every push and pull request
2. **Vulnerability Detection**: Identifies potential overflow, underflow, and other arithmetic issues
3. **Security Reports**: Findings appear in the Security tab of the repository

### Enabling Code Scanning

The CodeQL workflow (`.github/workflows/codeql.yml`) is already configured and will:

- Run on every push to `main` branch
- Run on every pull request to `main` branch
- Run weekly (Sundays at midnight UTC)

### Viewing Security Findings

1. Go to your repository on GitHub
2. Click **Security** tab
3. Select **Code scanning alerts**
4. Review and manage detected vulnerabilities

## ⚠️ Common Pitfalls

### 1. **Unchecked Overflow**
```typescript
// ❌ BAD - No overflow check
const result = a + b;

// ✅ GOOD - With overflow check
const result = safeAdd(a, b);
```

### 2. **Division by Zero**
```typescript
// ❌ BAD - No zero check
const result = a / b;

// ✅ GOOD - With zero check
const result = safeDivide(a, b);
```

### 3. **Large Number Operations**
```typescript
// ❌ BAD - May lose precision
const result = Number.MAX_SAFE_INTEGER * 2;

// ✅ GOOD - Validation prevents precision loss
const result = safeMultiply(Number.MAX_SAFE_INTEGER, 2);
```

## 🛠️ Running Examples

To run the example code:

```bash
# Install dev dependencies (required)
npm install

# Run the demos
npm run example          # safe-arithmetic demos (src/examples.ts)
npm run event-example    # event-emission patterns
npm run storage-example  # storage/gas patterns

# Typecheck, test, build
npm run check            # tsc --noEmit
npm test                 # vitest run
npm run test:coverage    # same suite plus a coverage report (what CI runs)
npm run build            # emit JS + declarations to dist/
```

## 📚 Best Practices

1. **Always validate external input** before arithmetic operations
2. **Use safe arithmetic functions** for critical operations (financial, security)
3. **Check for boundary conditions** (overflow/underflow potential)
4. **Enable Code Scanning** to catch vulnerabilities automatically
5. **Handle errors gracefully** with try-catch blocks
6. **Document assumptions** about input ranges in your code

## 🔗 Related Resources

- [MDN: Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
- [GitHub Code Scanning](https://docs.github.com/en/code-security/code-scanning)
- [CodeQL Documentation](https://codeql.github.com/)
- [JavaScript Arithmetic Operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators#arithmetic_operators)

## 📝 License

This project is provided as an educational resource.

## 🤝 Contributing

Contributions are welcome! Please ensure:

- All arithmetic operations use safe functions
- Code passes CodeQL analysis
- Examples are clear and well-documented
- Error handling is comprehensive

---

**Last Updated**: 2026-08-29

For more information about preventing arithmetic vulnerabilities, see the security advisories in the GitHub Security tab.

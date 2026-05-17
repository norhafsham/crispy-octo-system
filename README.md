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

### Validation Utilities
- **isWithinSafeRange()** - Check if a value is a safe integer
- **getSafeRange()** - Get the safe integer limits for JavaScript

## 📁 Project Structure

```
.
├── .github/
│   └── workflows/
│       └── codeql.yml          # CodeQL Code Scanning workflow
├── src/
│   ├── arithmetic-utils.ts     # Core safe arithmetic functions
│   └── examples.ts              # Usage examples
└── README.md                    # This file
```

## 🔒 Safe Integer Range in JavaScript

JavaScript's safe integer range is defined by IEEE 754 double-precision floating-point format:

- **MAX_SAFE_INTEGER**: 9,007,199,254,740,991 (2^53 - 1)
- **MIN_SAFE_INTEGER**: -9,007,199,254,740,991 (-(2^53 - 1))

Operations outside this range may lose precision.

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
```typescript
import { safeAdd, safeSubtract, safeMultiply } from './src/arithmetic-utils';

let balance = 1000000;

// Safe operations with error handling
try {
  balance = safeAdd(balance, 50000);      // Deposit
  balance = safeSubtract(balance, 25000); // Withdrawal
  balance = safeMultiply(balance, 1.05);  // Apply 5% interest
} catch (error) {
  console.error('Transaction failed:', error.message);
}
```

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
# Install dependencies (if using a build tool)
npm install

# Run examples with TypeScript
npx ts-node src/examples.ts

# Or compile and run
npm run build
npm run start
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

**Last Updated**: 2026-05-17

For more information about preventing arithmetic vulnerabilities, see the security advisories in the GitHub Security tab.

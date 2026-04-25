/\*\*

- FILEWRITER_USAGE.md
-
- Complete guide to using the FileWriter system
  \*/

# FileWriter System - Usage Guide

## Overview

FileWriter is a production-ready file I/O system for managing generated code. It handles:

- ✅ Writing code to disk with validation
- ✅ Syntax validation (JavaScript, React, JSON)
- ✅ Error handling and recovery
- ✅ Statistics and audit trails
- ✅ Multiple file writes with batching
- ✅ Directory management and tree structure

## Quick Start

### Basic File Writing

```javascript
import { fileWriter } from "./utils/fileWriter.js";

// Write a single file
await fileWriter.write(
  "backend/models/user.js",
  `
export const User = {
  name: String,
  email: String
};
`,
);
```

### Multiple Files (Recommended)

```javascript
const files = {
  "backend/models/schema.js": "...",
  "backend/routes/api.js": "...",
  "frontend/components/App.jsx": "...",
};

const result = await fileWriter.writeMultiple(files);
console.log(`Wrote ${result.success} files, ${result.bytes} bytes`);
```

### Write JSON Config

```javascript
await fileWriter.writeJSON("config/plan.json", {
  feature: "user-auth",
  tasks: ["schema", "api", "ui"],
});
```

---

## Code Validation

### How Validation Works

The system automatically validates code when writing:

```javascript
// This will throw an error (has TODO placeholders)
await fileWriter.write(
  "app.js",
  `
export function login() {
  // TODO: implement login
}
`,
);
```

### Disable Validation (When Needed)

```javascript
await fileWriter.write("app.js", anyCode, { validate: false });
```

### Validate Without Writing

```javascript
import { CodeValidator } from "./utils/fileWriter.js";

const result = CodeValidator.validateJavaScript(code);
if (!result.valid) {
  console.error("Errors:", result.errors);
}
```

### Supported Validation Types

```javascript
// JavaScript/Node.js
CodeValidator.validateJavaScript(code);

// React/JSX
CodeValidator.validateReact(code);

// JSON
CodeValidator.validateJSON(code);

// Auto-detect
CodeValidator.validate(code, "javascript"); // or 'react', 'json'
```

---

## File Operations

### Read File

```javascript
const content = await fileWriter.read("backend/server.js");
```

### Check File Exists

```javascript
const exists = await fileWriter.exists("backend/models.js");
```

### List All Generated Files

```javascript
const files = await fileWriter.listAll();
console.log(files); // ['backend/models.js', 'frontend/App.jsx', ...]
```

### Get Directory Tree

```javascript
const tree = await fileWriter.getTree();
console.log(tree);
// output:
// ├── backend/
// │   ├── models/
// │   │   ├── schema.js
// │   ├── routes/
// │   │   ├── api.js
// ├── frontend/
// │   ├── components/
```

---

## Monitoring & Statistics

### Get Write Statistics

```javascript
const stats = fileWriter.getStats();
// {
//   written: 5,
//   failed: 0,
//   totalBytes: 2048,
//   avgFileSize: 410,
//   files: ['backend/models.js (412B)', ...],
//   errors: []
// }
```

### Get File Checksum

```javascript
const checksum = await fileWriter.getChecksum("backend/models.js");
console.log(checksum); // SHA256 hash
```

### Create Snapshot

```javascript
const snapshot = await fileWriter.snapshot();
// {
//   timestamp: '2026-04-25T10:30:00.000Z',
//   outputDir: './output',
//   fileCount: 8,
//   totalBytes: 5120,
//   tree: '...',
//   stats: {...}
// }
```

---

## Cleanup Operations

### Clear All Output (Dangerous!)

```javascript
// Must pass confirm=true to execute
await fileWriter.clear(true);
```

### Safe Cleanup (Keeps Structure)

```javascript
// Removes generated code but keeps directory structure
await fileWriter.cleanup();
```

---

## Integration with Pipelines

### Backend Pipeline Example

```javascript
import { fileWriter } from '../utils/fileWriter.js';
import { call } from '../utils/llm.js';
import { backendCodePrompts } from '../prompts/codeGenerationPrompts.js';

export async function runBackendPipeline(tasks) {
  console.log('[Backend Pipeline] Starting...');

  const outputs = {};

  // Generate schema
  const schema = await call({
    system: 'You are an expert Node.js developer',
    messages: [{
      role: 'user',
      content: backendCodePrompts.generateSchema(...)
    }]
  });

  // Write to file
  await fileWriter.write('backend/models/schema.js', schema);
  outputs.schema = schema;

  // ... repeat for routes, auth, etc

  console.log('Stats:', fileWriter.getStats());
  return outputs;
}
```

### Frontend Pipeline Example

```javascript
export async function runFrontendPipeline(tasks) {
  console.log("[Frontend Pipeline] Starting...");

  const componentFiles = {};

  // Generate multiple components
  for (const component of ["LoginForm", "Dashboard", "Profile"]) {
    const code = await generateComponent(component);
    componentFiles[`frontend/components/${component}.jsx`] = code;
  }

  // Write all at once
  const result = await fileWriter.writeMultiple(componentFiles);
  console.log(`Wrote ${result.success} components`);

  return result;
}
```

---

## Error Handling

### Catch Write Errors

```javascript
try {
  await fileWriter.write("app.js", invalidCode);
} catch (err) {
  console.error(`Failed to write: ${err.message}`);
  // err.message will indicate the validation failure
}
```

### Check Failed Writes

```javascript
const stats = fileWriter.getStats();
if (stats.failed > 0) {
  console.error("Failed writes:", stats.errors);
  // [{path: 'file.js', error: 'Validation failed: ...'}, ...]
}
```

### Retry on Failure

```javascript
async function writeWithRetry(path, content, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fileWriter.write(path, content);
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed: ${err.message}`);
      if (i < maxRetries - 1) {
        // Try regenerating code instead of just retrying
        // content = await regenerateCode(...);
      }
    }
  }
  throw new Error(`Failed to write after ${maxRetries} attempts`);
}
```

---

## Performance Tips

### Batch Write Large Volumes

```javascript
// ❌ Slow - write one by one
for (const file of files) {
  await fileWriter.write(file.path, file.content);
}

// ✅ Fast - batch write
await fileWriter.writeMultiple(
  Object.fromEntries(files.map((f) => [f.path, f.content])),
);
```

### Monitor Memory Usage

```javascript
// FileWriter tracks stats in memory
// For very large volumes, periodically reset:
const stats = fileWriter.getStats();
if (stats.totalBytes > 10 * 1024 * 1024) {
  // 10MB
  console.log("Taking snapshot...");
  await fileWriter.snapshot();
  // In future, could serialize to database
}
```

### Cache Generated Files

```javascript
// Check if file exists before regenerating
if (await fileWriter.exists("backend/models.js")) {
  const existing = await fileWriter.read("backend/models.js");
  // Reuse instead of regenerating
}
```

---

## Testing Generated Code

### Quick Syntax Check

```javascript
const { CodeValidator } = require("./utils/fileWriter.js");

const files = await fileWriter.listAll();
for (const file of files) {
  if (file.endsWith(".js")) {
    const content = await fileWriter.read(file);
    const validation = CodeValidator.validate(content);
    if (!validation.valid) {
      console.warn(`${file}: ${validation.errors.join(", ")}`);
    }
  }
}
```

### Generate Tests for Code

```javascript
import { testPrompts } from "./prompts/codeGenerationPrompts.js";
import { call } from "./utils/llm.js";

async function generateTests(sourceFile) {
  const code = await fileWriter.read(sourceFile);

  const testCode = await call({
    system: "You are a Jest testing expert",
    messages: [
      {
        role: "user",
        content: testPrompts.generateTests(code),
      },
    ],
  });

  await fileWriter.write(sourceFile.replace(".js", ".test.js"), testCode, {
    language: "javascript",
  });
}
```

---

## Advanced Usage

### Custom Base Directory

```javascript
import { FileWriter } from "./utils/fileWriter.js";

const customWriter = new FileWriter("./my-output-dir");
await customWriter.write("app.js", code);
```

### Track Checksums for Versioning

```javascript
const checksums = {};

for (const file of fileWriter.writtenFiles) {
  const hash = await fileWriter.getChecksum(file.path);
  checksums[file.path] = hash;
}

// Later, verify unchanged:
const newHash = await fileWriter.getChecksum("backend/models.js");
if (checksums["backend/models.js"] !== newHash) {
  console.log("File was modified");
}
```

### Export Generation Report

```javascript
const snapshot = await fileWriter.snapshot();
const report = {
  generatedAt: new Date().toISOString(),
  totalFiles: snapshot.fileCount,
  totalBytes: snapshot.totalBytes,
  structure: snapshot.tree,
  files: fileWriter.getStats().files,
};

await fileWriter.writeJSON("GENERATION_REPORT.json", report);
```

---

## Common Patterns

### Pattern 1: Generate → Validate → Report

```javascript
async function generateAndReport(spec) {
  console.log("1. Generating files...");
  const files = await generateAllCode(spec);

  console.log("2. Writing files...");
  await fileWriter.writeMultiple(files);

  console.log("3. Validating...");
  let validFiles = 0;
  for (const file of fileWriter.writtenFiles) {
    const content = await fileWriter.read(file.path);
    const validation = CodeValidator.validate(content, file.language);
    if (validation.valid) validFiles++;
  }

  console.log("4. Reporting...");
  const stats = fileWriter.getStats();
  console.log(`✓ Generated ${stats.written} files`);
  console.log(`✓ Valid: ${validFiles}/${stats.written}`);
  console.log(`✓ Total: ${stats.totalBytes} bytes`);
}
```

### Pattern 2: Incremental Generation with Rollback

```javascript
async function generateWithFallback(spec) {
  const snapshot = await fileWriter.snapshot();

  try {
    const files = await generateAllCode(spec);
    await fileWriter.writeMultiple(files);
    return { success: true, snapshot };
  } catch (err) {
    console.error("Generation failed, rolling back...");
    await fileWriter.cleanup(); // Remove partial output
    return { success: false, error: err.message, snapshot };
  }
}
```

### Pattern 3: Progressive Generation with Checkpoints

```javascript
async function generateWithCheckpoints(spec) {
  const checkpoints = [];

  // Phase 1: Backend
  console.log('Phase 1: Generating backend...');
  await fileWriter.write('backend/models.js', ...);
  checkpoints.push(await fileWriter.snapshot());

  // Phase 2: Frontend
  console.log('Phase 2: Generating frontend...');
  await fileWriter.write('frontend/App.jsx', ...);
  checkpoints.push(await fileWriter.snapshot());

  // Phase 3: Tests
  console.log('Phase 3: Generating tests...');
  await fileWriter.write('backend/__tests__/models.test.js', ...);
  checkpoints.push(await fileWriter.snapshot());

  return checkpoints;
}
```

---

## Troubleshooting

### Issue: "File contains placeholder code"

**Cause:** LLM generated incomplete code with TODO/FIXME

**Solution:** Regenerate with better prompts or different model

```javascript
// Add to prompt:
// "Generate complete, production-ready code with no TODOs or FIXMEs"
```

### Issue: "Mismatched braces"

**Cause:** Syntax error in generated code

**Solution:** Ask LLM to validate and fix

```javascript
if (!validation.valid) {
  const fixed = await regenerateWithRepairPrompt(code, validation.errors);
}
```

### Issue: "No exports found"

**Cause:** LLM didn't add exports

**Solution:** Add to all code generation prompts:

```
"Always include proper export statements (export default or named exports)"
```

---

## API Reference

### FileWriter Methods

| Method                          | Returns            | Description           |
| ------------------------------- | ------------------ | --------------------- |
| `write(path, content, options)` | Promise<Result>    | Write single file     |
| `writeMultiple(files, options)` | Promise<Summary>   | Write multiple files  |
| `writeJSON(path, obj)`          | Promise<Result>    | Write JSON file       |
| `read(path)`                    | Promise<string>    | Read file content     |
| `exists(path)`                  | Promise<boolean>   | Check if file exists  |
| `ensureDir(path)`               | Promise<string>    | Create directory      |
| `listAll()`                     | Promise<string[]>  | List all files        |
| `getTree(dir, depth)`           | Promise<string>    | Get tree structure    |
| `getStats()`                    | object             | Get write statistics  |
| `getChecksum(path)`             | Promise<string>    | Get SHA256 hash       |
| `snapshot()`                    | Promise<object>    | Create state snapshot |
| `cleanup()`                     | Promise<void>      | Remove generated code |
| `clear(confirm)`                | Promise<{removed}> | Clear all output      |

### CodeValidator Methods

| Method                     | Returns         | Description                |
| -------------------------- | --------------- | -------------------------- |
| `validate(code, language)` | {valid, errors} | Detect language & validate |
| `validateJavaScript(code)` | {valid, errors} | Validate JS code           |
| `validateReact(code)`      | {valid, errors} | Validate React code        |
| `validateJSON(code)`       | {valid, errors} | Validate JSON              |

---

## Next Steps

Now that FileWriter is ready, implement:

1. **Prompt Templates** - Create production prompts for code generation
2. **Backend Pipeline** - Use FileWriter to write generated backend code
3. **Frontend Pipeline** - Use FileWriter to write generated frontend code
4. **End-to-End Tests** - Test full generation flow with FileWriter

See `PRODUCTION_ROADMAP.md` for detailed implementation guides.

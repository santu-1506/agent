/\*\*

- QUICK_REFERENCE.md
-
- One-page cheat sheet for FileWriter + Phase 2 implementation
- Print this or keep it open while working
  \*/

# Quick Reference Card

## FileWriter API (Most Used)

### Write Code to Disk

```javascript
import { fileWriter } from "./utils/fileWriter.js";

// Single file
await fileWriter.write("path/file.js", code);

// Multiple files (faster)
await fileWriter.writeMultiple({
  "path1/file.js": code1,
  "path2/file.js": code2,
});

// JSON files
await fileWriter.writeJSON("config/app.json", { port: 3000 });
```

### Check What Was Written

```javascript
const stats = fileWriter.getStats();
console.log(stats);
// {
//   written: 5,
//   failed: 0,
//   totalBytes: 2048,
//   files: ['backend/models/User.js (412B)', ...],
//   errors: []
// }
```

### Get File Tree

```javascript
const tree = await fileWriter.getTree();
console.log(tree);
// ├── backend/
// │   ├── models/
// │   │   ├── User.js
// │   ├── routes/
// │   │   ├── api.js
```

---

## CodeValidator Validation

### Automatic (Built into FileWriter)

```javascript
// Validates automatically when writing
await fileWriter.write("app.js", code); // Throws if invalid
```

### Manual Validation

```javascript
import { CodeValidator } from "./utils/fileWriter.js";

const result = CodeValidator.validate(code, "javascript");
if (!result.valid) {
  console.error("Errors:", result.errors);
}
```

### What Gets Validated

- ✅ JavaScript syntax (acorn parser)
- ✅ React JSX syntax
- ✅ JSON syntax
- ✅ TODO/FIXME placeholders detected
- ✅ Mismatched braces/brackets
- ✅ Missing exports

---

## LLM Integration Pattern

### Call LLM (Anthropic or OpenAI)

```javascript
import { call } from "./utils/llm.js";

const code = await call({
  system: "You are an expert Node.js developer.",
  messages: [
    {
      role: "user",
      content: "Generate a Mongoose schema...",
    },
  ],
  maxTokens: 2000,
  temperature: 0.2, // Lower = more deterministic
});
```

### Common Parameters

| Param         | Value  | Notes                                           |
| ------------- | ------ | ----------------------------------------------- |
| `system`      | String | System role, e.g., "expert developer"           |
| `messages`    | Array  | Messages array: `{ role: 'user', content: '' }` |
| `maxTokens`   | Number | 1000-3000 typical for code                      |
| `temperature` | Number | 0.0-1.0 (0.2 good for code)                     |

---

## Prompt Template Formula

For every code-generation prompt, use this structure:

```javascript
function generateSchema(spec, modelName) {
  return `You are an expert Node.js/MongoDB developer.

Generate a complete, production-ready Mongoose schema for "${modelName}".

SPEC:
${JSON.stringify(spec, null, 2)}

REQUIREMENTS:
- Use latest Mongoose v7+ syntax
- Include proper validation
- Add timestamps if needed
- Include indexes for performance
- Include error messages
- NO TODOs, NO FIXMEs, NO placeholder code
- Export as: export default mongoose.model('${modelName}', schema)

Generate ONLY the JavaScript code, no explanations:`;
}
```

### Checklist for Each Prompt

- ✅ Clear role ("expert X developer")
- ✅ "Production-ready" requirement
- ✅ "NO TODOs, NO FIXMEs" explicit
- ✅ List of specific requirements
- ✅ Export/import format specified
- ✅ "Generate ONLY code, no explanations"

---

## Pipeline Integration Pattern

```javascript
// Pattern: LLM → FileWriter → MessageBus

import { call } from "../utils/llm.js";
import { fileWriter } from "../utils/fileWriter.js";
import { messageBus } from "../utils/messageBus.js";
import { backendCodePrompts } from "../prompts/codeGenerationPrompts.js";

export async function runBackendPipeline(spec) {
  console.log("[Backend] Generating...");

  try {
    // 1. Generate code with LLM
    const code = await call({
      system: "expert developer",
      messages: [
        {
          role: "user",
          content: backendCodePrompts.generateSchema(spec),
        },
      ],
      maxTokens: 2000,
      temperature: 0.2,
    });

    // 2. Write to disk (validates automatically)
    await fileWriter.write("backend/models/schema.js", code);

    // 3. Notify other agents
    messageBus.send("backend:schema-done", { code });

    return { success: true, code };
  } catch (err) {
    console.error("Failed:", err.message);
    return { success: false, error: err.message };
  }
}
```

---

## Error Handling

### Common Errors & Fixes

| Error                            | Cause           | Fix                              |
| -------------------------------- | --------------- | -------------------------------- |
| "File contains placeholder code" | TODOs in output | Update prompt: "NO TODOs"        |
| "Mismatched braces"              | Bad syntax      | Regenerate, check prompt clarity |
| "No exports found"               | Missing export  | Add to prompt: "Include exports" |
| "Empty file"                     | Blank output    | Try different temp (0.1-0.3)     |

### Error Recovery

```javascript
try {
  await fileWriter.write('file.js', code);
} catch (err) {
  // Regenerate with better prompt
  const fixed = await regenerateCode(...);
  await fileWriter.write('file.js', fixed);
}
```

---

## File Paths (Relative to Project Root)

```
Input:
- prompts/codeGenerationPrompts.js    ← Create this
- pipelines/backendPipeline.js        ← Update this
- pipelines/frontendPipeline.js       ← Update this

Output (auto-created):
- output/backend/models/              ← Generated models
- output/backend/routes/              ← Generated routes
- output/backend/middleware/          ← Generated middleware
- output/frontend/components/         ← Generated components
- output/frontend/services/           ← Generated services
- GENERATION_REPORT.json              ← Stats report
```

---

## Testing Checklist

After implementing prompts + pipeline:

```bash
# 1. Check syntax
node -e "import('./prompts/codeGenerationPrompts.js').then(p => console.log(p))"

# 2. Run FileWriter tests
node test/fileWriter.test.js

# 3. Test generation
node app.js "Create a simple blog"

# 4. Check output
ls -la output/
cat output/backend/models/*.js      # Check for real code, no TODOs
cat output/frontend/components/*.jsx  # Check for real React code

# 5. Verify stats
node -e "import('./utils/fileWriter.js').then(fw => console.log(fw.fileWriter.getStats()))"
```

---

## Message Bus (For Coordination)

### Send Event

```javascript
messageBus.send("agent-name", { data: value });
```

### Receive Event

```javascript
const message = messageBus.receive("agent-name");
if (messageBus.has("agent-name")) {
  // Message exists
}
```

### Get Audit Trail

```javascript
const history = messageBus.getLog();
console.log(history); // All events sent so far
```

---

## File System Operations

### Read File

```javascript
const content = await fileWriter.read("path/file.js");
```

### File Exists?

```javascript
if (await fileWriter.exists("path/file.js")) {
  // Yes
}
```

### List All Files

```javascript
const files = await fileWriter.listAll();
console.log(files); // ['backend/models.js', 'frontend/App.jsx', ...]
```

### Get File Hash

```javascript
const hash = await fileWriter.getChecksum("path/file.js");
// SHA256 hash for version tracking
```

### Create Snapshot

```javascript
const snap = await fileWriter.snapshot();
console.log(snap);
// { timestamp, fileCount, totalBytes, tree, stats }
```

### Cleanup (Remove Generated Files)

```javascript
await fileWriter.cleanup(); // Safe delete
await fileWriter.clear(true); // Dangerous - requires confirm
```

---

## Quick Start: Next 30 Minutes

```bash
# 1. Create prompts file (2 min)
touch prompts/codeGenerationPrompts.js

# 2. Add first prompt (5 min)
# Edit file, add generateSchema() function

# 3. Test it loads (1 min)
node -e "import('./prompts/codeGenerationPrompts.js').then(p => console.log('✓ Loaded'))"

# 4. Start backend pipeline integration (15 min)
# Edit pipelines/backendPipeline.js
# Add: LLM call + FileWriter.write()

# 5. Test (7 min)
# Run: node app.js "Create a blog"
# Check: ls output/backend/
```

---

## IDE Shortcuts (VS Code)

| Action              | Keys             |
| ------------------- | ---------------- |
| Go to file          | Cmd+P → filename |
| Search in file      | Cmd+F            |
| Replace in file     | Cmd+H            |
| Go to definition    | F12              |
| Find all references | Cmd+K Cmd+R      |
| Format code         | Shift+Option+F   |
| Run terminal        | Ctrl+`           |

---

## Debug Mode

### Enable Logging

```javascript
// In app.js
const DEBUG = true;

if (DEBUG) {
  console.log("LLM output:", code);
  console.log("FileWriter stats:", fileWriter.getStats());
  console.log("Messages:", messageBus.getLog());
}
```

### Check What FileWriter Validated

```javascript
const stats = fileWriter.getStats();
stats.errors.forEach((err) => {
  console.error(`${err.path}: ${err.error}`);
});
```

### Monitor Pipeline Progress

```javascript
const result = await runBackendPipeline(spec);
console.log("Backend result:", result);
console.log("Files written:", result.files);
console.log("Stats:", fileWriter.getStats());
```

---

## Quick Problem Solver

**"My code didn't generate"**
→ Check: `await call()` returned empty? Update LLM model in config.

**"Generated code has TODOs"**
→ Fix: Update prompt to emphasize "NO TODOs, NO FIXMEs"

**"Files not written"**
→ Check: `fileWriter.getStats().failed > 0`? See `.errors` for why.

**"Validation failed"**
→ See: `CodeValidator.validate(code)` to check specific errors.

**"App runs but no output/"**
→ Check: `console.log()` statements in pipeline to trace execution.

**"Import errors"**
→ Verify: File exists at path, correct ES6 import syntax.

---

## Key Files to Remember

| File                               | Purpose      | Status       |
| ---------------------------------- | ------------ | ------------ |
| `utils/llm.js`                     | LLM adapter  | ✅ Ready     |
| `utils/fileWriter.js`              | File I/O     | ✅ Ready     |
| `utils/messageBus.js`              | Events       | ✅ Ready     |
| `prompts/codeGenerationPrompts.js` | Prompts      | ⏳ TO CREATE |
| `pipelines/backendPipeline.js`     | Backend gen  | 🟡 TO UPDATE |
| `pipelines/frontendPipeline.js`    | Frontend gen | 🟡 TO UPDATE |
| `app.js`                           | Orchestrator | ✅ Ready     |
| `test/fileWriter.test.js`          | Tests        | ✅ Ready     |

---

## Documentation Order (Read This Way)

1. **Quick Reference** ← You are here
2. **FILEWRITER_USAGE.md** - Detailed API
3. **PHASE_2_IMPLEMENTATION_GUIDE.md** - Step-by-step implementation
4. **examples/fileWriterPipelineExample.js** - Real code examples
5. **test/fileWriter.test.js** - Working patterns

---

**Print this page or keep it open. Bookmark for quick lookup!**

**You've got this! 🚀**

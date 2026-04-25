/\*\*

- PHASE_2_IMPLEMENTATION_GUIDE.md
-
- Step-by-step guide to implementing Option B (Complete Prompts) & Option C (Working Pipelines)
- Builds on FileWriter system (Phase 1 - COMPLETE)
-
- Status: FileWriter ✅ COMPLETE - Ready for Phase 2
- Time Estimate: 6-8 hours to MVP
  \*/

# Phase 2: Implementation Guide

## 📊 Current Status

### ✅ COMPLETED (Phase 1)

- Project structure and all 25 scaffolding files
- Core utilities: LLM adapter, messageBus, FileWriter
- Agent architecture and base classes
- **FileWriter system with full validation** (36/36 tests passing)
  - CodeValidator (JS, React, JSON syntax checking)
  - File I/O operations (read, write, delete, cleanup)
  - Statistics and snapshots for auditing
  - Production-ready for code generation

### 🟡 IN PROGRESS (Phase 2 - Your Next Task)

- Complete prompt templates for code generation
- Integrate FileWriter into backend pipeline
- Integrate FileWriter into frontend pipeline
- End-to-end testing of generation

### 🔲 FUTURE (Phase 3+)

- Multi-agent orchestration improvements
- Database persistence layer
- Rate limiting and caching
- Full deployment documentation

---

## 🎯 What You'll Accomplish in Phase 2

After this phase, you will have:

✅ **Working Backend Code Generation**

- Generates real Express.js code (not plans)
- Creates database schemas, routes, middleware
- Writes files to `output/backend/`
- All code passes validation

✅ **Working Frontend Code Generation**

- Generates real React components (not plans)
- Creates API services, pages, components
- Writes files to `output/frontend/`
- All code passes validation

✅ **Complete Generation Pipeline**

- Full end-to-end: Spec → Backend + Frontend → Files on Disk
- Real test: `node app.js "Simple blog"` generates actual working code
- Statistics and reporting for all generations

---

## 🔧 Implementation: Step 1 - Complete Prompts (2-3 hours)

### What to Create

Create file: `prompts/codeGenerationPrompts.js`

This file will contain all LLM prompts for actual code generation (not planning).

### Template Structure

```javascript
/**
 * prompts/codeGenerationPrompts.js
 *
 * Code-generation prompts that produce complete, production-ready code
 * NOT task plans - actual working code
 */

// ===== BACKEND PROMPTS =====
export const backendCodePrompts = {
  // Generate complete Mongoose schema
  generateSchema(spec, models) {
    return `You are an expert Node.js/MongoDB developer...`;
  },

  // Generate complete Express routes
  generateAPIRoutes(spec, schema) {
    return `You are an expert Express.js developer...`;
  },

  // Generate authentication middleware
  generateAuthMiddleware(spec, authType = "jwt") {
    return `You are an expert Node.js security developer...`;
  },
};

// ===== FRONTEND PROMPTS =====
export const frontendCodePrompts = {
  // Generate React component
  generateComponent(spec, componentType) {
    return `You are an expert React developer...`;
  },

  // Generate API service
  generateService(endpoints) {
    return `You are an expert frontend developer...`;
  },
};
```

### Quality Checklist for Each Prompt

For EVERY prompt, ensure it includes:

```
✅ Clear role: "You are an expert [developer type]"
✅ Complete code requirement: "Generate complete production-ready code"
✅ No placeholders: "NO TODOs, NO FIXMEs, NO placeholder code"
✅ Output format: "Return ONLY the code, no explanations"
✅ Requirements list: Error handling, validation, imports/exports
✅ Example input/output if helpful
✅ Specific constraints (database, auth type, styling, etc.)
```

### Recommended Prompts to Create (in priority order)

**TIER 1: Backend Foundation (Must have)**

1. `generateSchema()` - Mongoose schema generation
2. `generateAPIRoutes()` - Express router with CRUD endpoints
3. `generateAuthMiddleware()` - JWT auth middleware

**TIER 2: Frontend Foundation (Must have)**

1. `generateAppComponent()` - Main App component with routing
2. `generatePageComponent()` - Page components
3. `generateServiceAPI()` - API integration service

**TIER 3: Supporting (Nice to have)**

1. `generateController()` - Backend controllers
2. `generateModel()` - Backend models
3. `generateFormComponent()` - React form components
4. `generateTests()` - Test generation for both backend/frontend

### Example Implementation

Here's a concrete example for the first prompt:

```javascript
export const backendCodePrompts = {
  generateSchema(spec, modelName) {
    return `You are an expert Node.js/MongoDB developer.
    
Generate a complete, production-ready Mongoose schema for a "${modelName}" model.

SPEC:
${JSON.stringify(spec, null, 2)}

REQUIREMENTS:
- Use latest Mongoose syntax (v7+)
- Include proper validation rules (required, minlength, matches, etc.)
- Add timestamps (createdAt, updatedAt) if appropriate
- Include useful indexes for queryability
- Add any pre/post hooks needed
- Include proper error messages in validators
- Export as: export default mongoose.model('${modelName}', schema)
- NO TODOs, NO FIXMEs, NO placeholder code
- Return ONLY the JavaScript code, no explanations

Generate the complete schema:`;
  },
};
```

---

## 🔧 Implementation: Step 2 - Backend Pipeline (2 hours)

### Current State

File: `pipelines/backendPipeline.js` exists but is a skeleton:

```javascript
// Current - doesn't actually generate code
export async function runBackendPipeline(tasks) {
  console.log("[BackendPipeline] Generating backend...");
  // TODO: Actually call agents and LLM
}
```

### What to Implement

Transform it into a working pipeline that:

1. Calls LLM with code-generation prompts
2. Validates generated code with FileWriter
3. Writes files to disk
4. Returns real code output

### Implementation Template

```javascript
import { call } from "../utils/llm.js";
import { fileWriter } from "../utils/fileWriter.js";
import { backendCodePrompts } from "../prompts/codeGenerationPrompts.js";
import { messageBus } from "../utils/messageBus.js";

export async function runBackendPipeline(spec, tasks) {
  console.log("\n[BackendPipeline] 🔨 Generating backend code...");

  const outputs = {};
  const writtenFiles = [];

  try {
    // ===== STEP 1: Generate Schema =====
    console.log("  → Generating database schema...");
    const schemaCode = await call({
      system: "You are an expert Node.js/MongoDB developer.",
      messages: [
        {
          role: "user",
          content: backendCodePrompts.generateSchema(spec.database, "User"),
        },
      ],
      maxTokens: 2000,
      temperature: 0.2,
    });

    // Write schema file
    const schemaPath = "backend/models/User.js";
    await fileWriter.write(schemaPath, schemaCode);
    outputs.schema = schemaCode;
    writtenFiles.push(schemaPath);
    messageBus.send("backend:schema-generated", { schema: schemaCode });

    // ===== STEP 2: Generate API Routes =====
    console.log("  → Generating API routes...");
    const routesCode = await call({
      system: "You are an expert Express.js developer.",
      messages: [
        {
          role: "user",
          content: backendCodePrompts.generateAPIRoutes(spec, {
            User: schemaCode,
          }),
        },
      ],
      maxTokens: 3000,
      temperature: 0.2,
    });

    // Write routes file
    const routesPath = "backend/routes/api.js";
    await fileWriter.write(routesPath, routesCode);
    outputs.routes = routesCode;
    writtenFiles.push(routesPath);
    messageBus.send("backend:routes-generated", { routes: routesCode });

    // ===== STEP 3: Generate Auth Middleware =====
    console.log("  → Generating authentication middleware...");
    const authCode = await call({
      system: "You are an expert Node.js security developer.",
      messages: [
        {
          role: "user",
          content: backendCodePrompts.generateAuthMiddleware(spec, "jwt"),
        },
      ],
      maxTokens: 1500,
      temperature: 0.2,
    });

    // Write auth file
    const authPath = "backend/middleware/auth.js";
    await fileWriter.write(authPath, authCode);
    outputs.auth = authCode;
    writtenFiles.push(authPath);
    messageBus.send("backend:auth-generated", { auth: authCode });

    // ===== SUMMARY =====
    const stats = fileWriter.getStats();
    console.log(`  ✅ Backend pipeline complete`);
    console.log(
      `     Files: ${stats.written} | Size: ${(stats.totalBytes / 1024).toFixed(2)}KB`,
    );

    if (stats.failed > 0) {
      console.error(`     ⚠️  ${stats.failed} files failed validation`);
      return { success: false, errors: stats.errors };
    }

    return {
      success: true,
      outputs,
      files: writtenFiles,
      stats,
    };
  } catch (err) {
    console.error("❌ Backend pipeline failed:", err.message);
    return { success: false, error: err.message };
  }
}
```

### Key Points for Backend Pipeline

1. **Call LLM with actual prompts** - Use `backendCodePrompts.generateSchema()` etc.
2. **Write each file** - `fileWriter.write()` automatically validates
3. **Handle validation errors** - FileWriter throws if code doesn't validate
4. **Send messages** - Use messageBus to notify other agents of progress
5. **Return output** - Return actual code for next pipeline step

---

## 🎨 Implementation: Step 3 - Frontend Pipeline (2 hours)

### Same Pattern as Backend

Frontend pipeline follows identical structure:

```javascript
// pipelines/frontendPipeline.js
export async function runFrontendPipeline(spec, tasks) {
  console.log("\n[FrontendPipeline] 🎨 Generating frontend code...");

  const outputs = {};
  const writtenFiles = [];

  try {
    // STEP 1: Generate App component
    const appCode = await call({
      system: "You are an expert React developer.",
      messages: [
        {
          role: "user",
          content: frontendCodePrompts.generateAppComponent(spec),
        },
      ],
      maxTokens: 2000,
      temperature: 0.2,
    });

    await fileWriter.write("frontend/App.jsx", appCode);
    outputs.app = appCode;
    writtenFiles.push("frontend/App.jsx");

    // STEP 2: Generate page components
    // STEP 3: Generate API service
    // ... etc

    return { success: true, outputs, files: writtenFiles };
  } catch (err) {
    console.error("❌ Frontend pipeline failed:", err.message);
    return { success: false, error: err.message };
  }
}
```

---

## 🧪 Testing (Step 4)

### Test 1: Backend Generation Only

```bash
# Create test app spec
node -e "
import { generateProduct } from './app.js';
const spec = {
  name: 'Simple Notes App',
  backend: 'Express + MongoDB',
  frontend: 'React',
  features: ['user-auth', 'create-notes', 'list-notes']
};
const result = await generateProduct(spec);
console.log(result);
"

# Verify files created
ls -la output/backend/models/
ls -la output/backend/routes/
ls -la output/backend/middleware/

# Check content
cat output/backend/models/User.js  # Should have real schema, no TODOs
```

### Test 2: Frontend Generation Only

```bash
ls -la output/frontend/
cat output/frontend/App.jsx  # Should have real React code
```

### Test 3: Full Pipeline

```bash
node app.js "Create a blog platform"

# Should generate:
# output/
# ├── backend/
# │   ├── models/
# │   │   ├── User.js
# │   │   ├── Post.js
# │   ├── routes/
# │   │   ├── api.js
# │   ├── middleware/
# │   │   ├── auth.js
# ├── frontend/
# │   ├── App.jsx
# │   ├── components/
# │   ├── services/
# │   │   ├── api.js
# └── GENERATION_REPORT.json
```

### Test 4: Verify Code Quality

```javascript
// Check all files have no TODOs
import fs from "fs/promises";

const files = await fs.readdir("output", { recursive: true });
for (const file of files) {
  if (file.endsWith(".js") || file.endsWith(".jsx")) {
    const content = await fs.readFile(`output/${file}`, "utf-8");
    if (content.includes("TODO") || content.includes("FIXME")) {
      console.error(`❌ ${file} has placeholders`);
    }
  }
}
console.log("✅ All files validated");
```

---

## 🚨 Troubleshooting

### Issue: "Code validation failed"

**Cause:** Generated code has syntax errors

**Solution:**

1. Check what CodeValidator rejected: `fileWriter.getStats().errors`
2. Update the prompt to be more specific
3. Try with different temperature (0.1 = more deterministic)
4. Use a different LLM model

### Issue: "No exports found"

**Cause:** LLM forgot to add export statements

**Solution:** Add to ALL prompts:

```
"Always include proper export statements (export default or named exports)"
"Return the complete importable module"
```

### Issue: "Missing imports"

**Cause:** LLM assumes imports exist but doesn't add them

**Solution:** Add to prompts:

```
"Include all necessary imports at the top of the file"
"Import from 'express', 'mongoose', 'react', etc as needed"
```

---

## ⏱️ Time Breakdown

| Task                         | Time         | Status  |
| ---------------------------- | ------------ | ------- |
| Create prompts file          | 30 min       | ⏳ TODO |
| Implement 3 backend prompts  | 1.5 hrs      | ⏳ TODO |
| Implement 3 frontend prompts | 1.5 hrs      | ⏳ TODO |
| Update backend pipeline      | 1 hr         | ⏳ TODO |
| Update frontend pipeline     | 1 hr         | ⏳ TODO |
| Integration testing          | 1 hr         | ⏳ TODO |
| **TOTAL**                    | **~6-8 hrs** |         |

**If you start now: Done by [ESTIMATE 8 hours from now]**

---

## 🎯 Success Criteria

After Phase 2, you can say:

- ✅ "I can run `node app.js 'build a todo app'` and get real code"
- ✅ "Backend and frontend code generate with zero TODOs"
- ✅ "All generated files are syntactically valid"
- ✅ "I have real working Express routes, Mongoose schemas, React components"
- ✅ "The system writes code to disk with proper validation"
- ✅ "Generation reports show exactly what was generated"

---

## 📚 Reference Files

- **FileWriter Documentation:** [FILEWRITER_USAGE.md](./FILEWRITER_USAGE.md)
- **FileWriter Tests:** [test/fileWriter.test.js](./test/fileWriter.test.js) - See examples
- **FileWriter Examples:** [examples/fileWriterPipelineExample.js](./examples/fileWriterPipelineExample.js)
- **Agent Pattern:** [agents/manager/managerAgent.js](./agents/manager/managerAgent.js) - See how it calls LLM

---

## 🚀 Next Action

### RIGHT NOW (< 5 minutes)

1. Create `prompts/codeGenerationPrompts.js`
2. Add first prompt: `generateSchema()`
3. Test it loads: `node -e "import('./prompts/codeGenerationPrompts.js').then(p => console.log(p))"`

### THEN (< 30 minutes)

1. Complete all 6 core prompts
2. Add to `backendCodePrompts` and `frontendCodePrompts`

### THEN (< 2 hours)

1. Update `pipelines/backendPipeline.js` to use prompts + FileWriter
2. Update `pipelines/frontendPipeline.js` similarly
3. Test both

### FINALLY (< 1 hour)

1. Test full app.js pipeline
2. Verify files on disk have real code
3. Celebrate 🎉

---

## 💡 Pro Tips

1. **Start with one prompt** - Get `generateSchema()` working first
2. **Test incrementally** - Don't build all prompts at once
3. **Use the examples** - See [examples/fileWriterPipelineExample.js](./examples/fileWriterPipelineExample.js)
4. **Keep prompts simple** - Long prompts often confuse LLMs, be concise
5. **Validate as you go** - FileWriter will catch errors immediately
6. **Use temperature 0.2** - Lower = more deterministic code

---

## 📞 Need Help?

1. Check [FILEWRITER_USAGE.md](./FILEWRITER_USAGE.md) for API reference
2. Review [test/fileWriter.test.js](./test/fileWriter.test.js) for working patterns
3. Look at [examples/fileWriterPipelineExample.js](./examples/fileWriterPipelineExample.js) for integration
4. Check CodeValidator messages - they tell you exactly what failed

---

**You've got this! FileWriter is production-ready. Time to make it generate real code! 🚀**

# Production Readiness Roadmap

## Critical Blockers & Solutions

### 🔴 BLOCKER #1: Code Generation (Currently → Plans Only)

**Problem:** Agents return task _plans_ but don't generate actual code.

**Solution:** Create agents that call LLM to generate code, not plans.

**Example - BEFORE (Current):**

```javascript
// Current: returns metadata, no code
{
  feature_name: "User Auth",
  backend_tasks: ["Create schema", "Build API"],  // Just descriptions!
  frontend_tasks: ["Build login form"]
}
```

**Example - AFTER (Production):**

```javascript
// With actual code
{
  feature_name: "User Auth",
  backend_code: {
    schema: "const userSchema = ...",  // ACTUAL CODE
    routes: "router.post('/auth', ...)"
  },
  frontend_code: {
    LoginForm: "export function LoginForm() { ... }"
  }
}
```

---

### 🔴 BLOCKER #2: File I/O (Currently → Nowhere)

**Problem:** Generated code exists in memory but never written to disk.

**Solution 1:** Create FileWriter utility (PRIORITY 1 - 2 hours)

```javascript
// utils/fileWriter.js
import fs from "fs/promises";
import path from "path";

export class FileWriter {
  constructor(baseDir = "./output") {
    this.baseDir = baseDir;
  }

  async ensureDir(dirPath) {
    const fullPath = path.join(this.baseDir, dirPath);
    await fs.mkdir(fullPath, { recursive: true });
    return fullPath;
  }

  async write(relativePath, content) {
    const fullPath = path.join(this.baseDir, relativePath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, "utf-8");

    console.log(`  ✓ Wrote: ${relativePath}`);
    return fullPath;
  }

  async writeJSON(relativePath, obj) {
    return this.write(relativePath, JSON.stringify(obj, null, 2));
  }

  async writeMultiple(files) {
    // files = { 'path/file.js': 'content', ... }
    for (const [filePath, content] of Object.entries(files)) {
      await this.write(filePath, content);
    }
  }

  async validate(content, language) {
    // Basic validation
    if (language === "javascript" && !content.trim()) {
      throw new Error("Empty JavaScript file");
    }
    if (language === "javascript" && content.includes("PLACEHOLDER")) {
      throw new Error("File contains placeholder code");
    }
    return true;
  }

  async getCurrentOutput() {
    try {
      return await fs.readdir(this.baseDir, { recursive: true });
    } catch {
      return [];
    }
  }
}

export const fileWriter = new FileWriter("./output");
```

**Solution 2:** Update pipelines to write files

```javascript
// pipelines/backendPipeline.js
import { fileWriter } from "../utils/fileWriter.js";

export async function runBackendPipeline(backendTasks) {
  console.log("[BackendPipeline] Generating backend code...");

  const outputs = {};

  for (const task of backendTasks) {
    // Call LLM to generate code for this task
    const code = await generateBackendCode(task);

    // Write to file
    const fileName = `backend/${task.component}/${task.name}.js`;
    await fileWriter.write(fileName, code);

    outputs[task.name] = { fileName, code };
  }

  return outputs;
}
```

---

### 🔴 BLOCKER #3: Prompt Templates (Currently → Stubs)

**Problem:** Prompts don't actually generate code.

**Solution:** Create comprehensive code-generation prompts (PRIORITY 2 - 4 hours)

```javascript
// prompts/codeGenerationPrompts.js

export const backendCodePrompts = {
  // Generate Express.js routes
  generateRoutes: (apiSpec) => `
You are an expert Node.js/Express developer.
Generate production-ready Express.js routes based on this API spec:

${JSON.stringify(apiSpec, null, 2)}

Requirements:
- Use express.Router()
- Include validation middleware
- Add try/catch error handling
- Return JSON responses
- Include JSDoc comments
- No placeholder code

Generate ONLY valid, runnable JavaScript code. No explanations.
  `,

  // Generate Mongoose schemas
  generateSchema: (dataModel) => `
You are an expert MongoDB/Mongoose developer.
Generate a production-ready Mongoose schema for:

${JSON.stringify(dataModel, null, 2)}

Requirements:
- Use Mongoose schema syntax
- Include all validations
- Add timestamps if needed
- Include indexes for performance
- Export default the model
- No placeholder code

Generate ONLY valid, runnable JavaScript code. No explanations.
  `,

  // Generate authentication middleware
  generateAuth: (authSpec) => `
You are an expert Node.js security developer.
Generate production-ready JWT authentication middleware:

Spec: ${JSON.stringify(authSpec, null, 2)}

Requirements:
- Validate JWT tokens
- Handle expired tokens
- Return proper HTTP status codes
- Include error messages
- Add logging
- No hardcoded secrets

Generate ONLY valid, runnable JavaScript code. No explanations.
  `,
};

export const frontendCodePrompts = {
  // Generate React components
  generateComponent: (componentSpec) => `
You are an expert React developer.
Generate a production-ready React functional component:

${JSON.stringify(componentSpec, null, 2)}

Requirements:
- Use React hooks (useState, useEffect, etc.)
- Add PropTypes validation
- Include error handling
- Add loading states
- Include JSDoc comments
- Export as named export
- No placeholder code

Generate ONLY valid, runnable JavaScript code. No explanations.
  `,

  // Generate API service layer
  generateService: (apiEndpoints) => `
You are an expert frontend developer.
Generate a production-ready API service layer for these endpoints:

${JSON.stringify(apiEndpoints, null, 2)}

Requirements:
- Use fetch or axios
- Handle errors gracefully
- Include retry logic
- Add request/response interceptors
- Include JSDoc comments
- Export as named functions
- No placeholder code

Generate ONLY valid, runnable JavaScript code. No explanations.
  `,
};

export const testPrompts = {
  // Generate Jest tests
  generateTests: (sourceCode) => `
You are an expert in writing Jest tests.
Generate production-ready Jest tests for this code:

\`\`\`javascript
${sourceCode}
\`\`\`

Requirements:
- Test all functions and edge cases
- Use describe/test blocks
- Include assertions
- Mock external dependencies
- Add setup/teardown if needed
- Aim for >80% coverage
- No placeholder code

Generate ONLY valid, runnable Jest test code. No explanations.
  `,
};
```

---

### 🔴 BLOCKER #4: Pipeline Implementation (Currently → Incomplete)

**Problem:** Pipelines don't execute real generation.

**Solution:** Implement real backend/frontend pipelines (PRIORITY 3 - 4 hours)

```javascript
// pipelines/backendPipeline.js
import { call, callJSON } from "../utils/llm.js";
import { fileWriter } from "../utils/fileWriter.js";
import { backendCodePrompts } from "../prompts/codeGenerationPrompts.js";

export async function runBackendPipeline(backendTasks) {
  console.log("\n[BackendPipeline] 🔨 Generating backend code...");

  const results = {};
  let fileCount = 0;

  // Step 1: Generate Database Schema
  if (backendTasks.some((t) => t.includes("schema"))) {
    console.log("  → Generating database schema...");
    const schemaCode = await call({
      system: "You are an expert Node.js developer.",
      messages: [
        {
          role: "user",
          content: backendCodePrompts.generateSchema({
            entities: ["User", "Product", "Order"],
            relationships: "User has many Orders, Order has many Products",
          }),
        },
      ],
      maxTokens: 2000,
    });

    await fileWriter.validate(schemaCode, "javascript");
    await fileWriter.write("backend/models/schema.js", schemaCode);
    results.schema = { code: schemaCode };
    fileCount++;
  }

  // Step 2: Generate API Routes
  if (backendTasks.some((t) => t.includes("api"))) {
    console.log("  → Generating API routes...");
    const routesCode = await call({
      system: "You are an expert Node.js/Express developer.",
      messages: [
        {
          role: "user",
          content: backendCodePrompts.generateRoutes({
            endpoints: [
              {
                method: "GET",
                path: "/api/users",
                description: "Get all users",
              },
              {
                method: "POST",
                path: "/api/users",
                description: "Create user",
              },
            ],
          }),
        },
      ],
      maxTokens: 3000,
    });

    await fileWriter.validate(routesCode, "javascript");
    await fileWriter.write("backend/routes/api.js", routesCode);
    results.routes = { code: routesCode };
    fileCount++;
  }

  // Step 3: Generate Authentication
  if (backendTasks.some((t) => t.includes("auth"))) {
    console.log("  → Generating authentication...");
    const authCode = await call({
      system: "You are an expert Node.js security developer.",
      messages: [
        {
          role: "user",
          content: backendCodePrompts.generateAuth({ type: "JWT" }),
        },
      ],
      maxTokens: 1500,
    });

    await fileWriter.validate(authCode, "javascript");
    await fileWriter.write("backend/middleware/auth.js", authCode);
    results.auth = { code: authCode };
    fileCount++;
  }

  // Step 4: Generate main server file
  console.log("  → Generating server entry point...");
  const serverCode = generateServerEntry(results);
  await fileWriter.write("backend/server.js", serverCode);
  fileCount++;

  console.log(`  ✅ Backend pipeline complete (${fileCount} files)`);
  return results;
}

function generateServerEntry(components) {
  return `
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
import apiRoutes from './routes/api.js';
import authMiddleware from './middleware/auth.js';

app.use('/api', authMiddleware, apiRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

export default app;
  `.trim();
}
```

**Similarly for frontend:**

```javascript
// pipelines/frontendPipeline.js
import { call } from "../utils/llm.js";
import { fileWriter } from "../utils/fileWriter.js";
import { frontendCodePrompts } from "../prompts/codeGenerationPrompts.js";

export async function runFrontendPipeline(frontendTasks) {
  console.log("\n[FrontendPipeline] 🎨 Generating frontend code...");

  const results = {};
  let fileCount = 0;

  // Generate LoginForm component
  if (frontendTasks.some((t) => t.includes("login"))) {
    console.log("  → Generating LoginForm component...");
    const componentCode = await call({
      system: "You are an expert React developer.",
      messages: [
        {
          role: "user",
          content: frontendCodePrompts.generateComponent({
            name: "LoginForm",
            props: ["onSubmit"],
            state: ["email", "password", "loading", "error"],
          }),
        },
      ],
      maxTokens: 2000,
    });

    await fileWriter.validate(componentCode, "javascript");
    await fileWriter.write("frontend/components/LoginForm.jsx", componentCode);
    results.login = { code: componentCode };
    fileCount++;
  }

  // Generate API service layer
  console.log("  → Generating API service...");
  const serviceCode = await call({
    system: "You are an expert frontend developer.",
    messages: [
      {
        role: "user",
        content: frontendCodePrompts.generateService([
          { method: "POST", path: "/api/login", name: "login" },
          { method: "GET", path: "/api/users", name: "getUsers" },
        ]),
      },
    ],
    maxTokens: 1500,
  });

  await fileWriter.validate(serviceCode, "javascript");
  await fileWriter.write("frontend/services/api.js", serviceCode);
  results.service = { code: serviceCode };
  fileCount++;

  console.log(`  ✅ Frontend pipeline complete (${fileCount} files)`);
  return results;
}
```

---

### 🔴 BLOCKER #5: Validation & Testing (Currently → None)

**Problem:** No way to verify generated code is valid.

**Solution:** Add code validation (PRIORITY 4 - 2 hours)

```javascript
// utils/codeValidator.js
import { parse } from "acorn";

export class CodeValidator {
  static validateJavaScript(code) {
    try {
      parse(code, { ecmaVersion: 2022, sourceType: "module" });
      return { valid: true };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  static validateReact(code) {
    // Check for required imports
    if (!code.includes("import React") && !code.includes('from "react"')) {
      return { valid: false, error: "Missing React import" };
    }

    // Validate JSX syntax
    return this.validateJavaScript(code);
  }

  static validateExports(code) {
    if (!code.includes("export")) {
      return { valid: false, error: "No exports found" };
    }
    return { valid: true };
  }

  static generateTests(sourceCode) {
    const testTemplate = `
import { describe, test, expect } from '@jest/globals';
// Add actual test implementations
describe('Generated Code', () => {
  test('should be valid', () => {
    expect(true).toBe(true);
  });
});
    `;
    return testTemplate;
  }
}
```

---

## 📋 Implementation Checklist

### Week 1: Core Code Generation

- [ ] **Day 1**: FileWriter utility
  - [ ] `ensureDir()` method
  - [ ] `write()` method
  - [ ] `validate()` method
  - [ ] Test with dummy files

- [ ] **Day 2**: Prompt templates
  - [ ] Backend code prompts (schema, routes, auth)
  - [ ] Frontend code prompts (components, services)
  - [ ] Test prompts generation
  - [ ] Test LLM calls

- [ ] **Day 3-4**: Pipeline implementation
  - [ ] Backend pipeline writes files
  - [ ] Frontend pipeline writes files
  - [ ] Integration with manager agent
  - [ ] Error handling

- [ ] **Day 5**: Validation system
  - [ ] JavaScript syntax validation
  - [ ] React component validation
  - [ ] Export validation
  - [ ] Test generation

- [ ] **Day 6-7**: Integration & testing
  - [ ] End-to-end: spec → generated code → files
  - [ ] Error scenarios
  - [ ] Output cleanup
  - [ ] Performance testing

---

## 🚀 Quick Start Implementation

### Step 1: Add FileWriter (2 hours)

```bash
# Create the file
touch utils/fileWriter.js

# Add content from above and test:
node -e "
import { fileWriter } from './utils/fileWriter.js';
await fileWriter.write('test/hello.txt', 'Hello World');
console.log('✓ FileWriter works!');
"
```

### Step 2: Update package.json

```json
{
  "dependencies": {
    "acorn": "^8.11.0" // Add for AST parsing
  }
}
```

### Step 3: Test the pipeline

```javascript
// test-pipeline.js
import { runBackendPipeline } from "./pipelines/backendPipeline.js";

const tasks = ["schema", "api", "auth"];
const result = await runBackendPipeline(tasks);
console.log("Generated files:", Object.keys(result));
```

---

## 📊 Priority Matrix

| Phase  | Days | What                    | Why                 |
| ------ | ---- | ----------------------- | ------------------- |
| **P1** | 2    | FileWriter              | Unblocks everything |
| **P2** | 4    | Prompts + Pipelines     | Core functionality  |
| **P3** | 2    | Validation              | Quality assurance   |
| **P4** | 3    | Testing + Logging       | Production ready    |
| **P5** | 2    | Rate limiting + Caching | Reliability         |

---

## ✅ Definition of Done

When these are complete, you're production-ready:

- ✅ Generator runs `node app.js "my spec"`
- ✅ Files appear in `output/backend/` and `output/frontend/`
- ✅ Generated code passes syntax validation
- ✅ All code has proper error handling
- ✅ Logging captures full execution flow
- ✅ API rate limiting prevents quota issues
- ✅ Request caching reduces costs
- ✅ Tests pass (>70% coverage)
- ✅ Generated code documented
- ✅ Deployment guide created

---

**Ready to start implementing? Pick Week 1 task and I'll write the code.**

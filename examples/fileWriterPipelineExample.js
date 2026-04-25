/**
 * examples/fileWriterPipelineExample.js
 * 
 * Concrete example of using FileWriter in a real pipeline
 * This shows the exact pattern for integrating FileWriter with code generation
 */

import { fileWriter } from '../utils/fileWriter.js';
import { call } from '../utils/llm.js';

/**
 * Example 1: Simple Backend Schema Generation
 * Shows: Single file write + validation
 */
export async function exampleBackendSchema() {
  console.log('\n=== Example 1: Backend Schema Generation ===\n');
  
  // Step 1: Generate schema code using LLM
  const schemaCode = await call({
    system: 'You are an expert Node.js developer. Generate complete, production-ready code with no TODOs or placeholders.',
    messages: [{
      role: 'user',
      content: `Generate a Mongoose schema for a User model with:
        - name (String, required)
        - email (String, required, unique)
        - password (String, required)
        - createdAt (Date, default now)
        - updatedAt (Date, default now)
        
        Include proper indexes and validation. Return complete working code.`
    }],
    maxTokens: 1000,
    temperature: 0.2
  });
  
  // Step 2: Write to file (validation happens automatically)
  try {
    await fileWriter.write(
      'backend/models/User.js',
      schemaCode,
      { validate: true }
    );
    console.log('✓ Schema written successfully');
  } catch (err) {
    console.error('✗ Failed to write schema:', err.message);
    return;
  }
  
  // Step 3: Display stats
  const stats = fileWriter.getStats();
  console.log(`✓ Stats: ${stats.written} file(s), ${stats.totalBytes} bytes`);
}

/**
 * Example 2: Multiple Backend Files
 * Shows: Batch writes, multiple agents, coordination
 */
export async function exampleBackendMultipleFiles() {
  console.log('\n=== Example 2: Multiple Backend Files ===\n');
  
  const files = {};
  
  // Generate schema
  console.log('→ Generating schema...');
  files['backend/models/schema.js'] = await call({
    system: 'You are an expert Node.js developer.',
    messages: [{
      role: 'user',
      content: `Generate a complete Mongoose schema with proper validation, indexes, and timestamps.`
    }],
    maxTokens: 800,
    temperature: 0.2
  });
  
  // Generate API routes
  console.log('→ Generating API routes...');
  files['backend/routes/api.js'] = await call({
    system: 'You are an expert Express.js developer.',
    messages: [{
      role: 'user',
      content: `Generate Express routes for CRUD operations on users. Include proper error handling.`
    }],
    maxTokens: 1200,
    temperature: 0.2
  });
  
  // Generate middleware
  console.log('→ Generating middleware...');
  files['backend/middleware/auth.js'] = await call({
    system: 'You are an expert Node.js security developer.',
    messages: [{
      role: 'user',
      content: `Generate JWT authentication middleware for Express. Include token verification and error handling.`
    }],
    maxTokens: 1000,
    temperature: 0.2
  });
  
  // Write all files at once
  console.log('→ Writing files...');
  const result = await fileWriter.writeMultiple(files);
  
  if (result.success === Object.keys(files).length) {
    console.log(`✓ All ${result.success} files written successfully`);
    console.log(`✓ Total: ${result.bytes} bytes`);
  } else {
    console.error(`✗ Only ${result.success}/${Object.keys(files).length} files written`);
  }
}

/**
 * Example 3: Frontend Component Generation
 * Shows: Language-specific validation (React), multiple components
 */
export async function exampleFrontendComponents() {
  console.log('\n=== Example 3: Frontend Components ===\n');
  
  const components = {
    'LoginForm': 'A login form with email and password fields, error handling, and submit button',
    'Dashboard': 'A dashboard with stats cards showing user count, revenue, and active sessions',
    'Profile': 'A user profile page with editable name, email, and password change form'
  };
  
  const files = {};
  
  for (const [name, description] of Object.entries(components)) {
    console.log(`→ Generating ${name} component...`);
    
    const componentCode = await call({
      system: 'You are an expert React developer. Generate complete production-ready React components with hooks.',
      messages: [{
        role: 'user',
        content: `Generate a complete React functional component for: ${description}
          
          Requirements:
          - Use React hooks (useState, useEffect)
          - Include proper error handling
          - Add form validation where applicable
          - Use semantic HTML
          - Include JSDoc comments
          - No placeholder TODOs
          
          Return only the component code, no imports at top level.`
      }],
      maxTokens: 1500,
      temperature: 0.2
    });
    
    files[`frontend/components/${name}.jsx`] = componentCode;
  }
  
  // Write all components
  console.log('→ Writing components...');
  const result = await fileWriter.writeMultiple(files);
  
  console.log(`✓ Generated ${result.success} components`);
  console.log(`✓ Total: ${result.bytes} bytes`);
  
  // Display tree
  console.log('\n✓ Generated structure:');
  const tree = await fileWriter.getTree();
  console.log(tree);
}

/**
 * Example 4: Config File Generation (JSON)
 * Shows: JSON validation, config files
 */
export async function exampleConfigGeneration() {
  console.log('\n=== Example 4: Config Generation ===\n');
  
  const config = {
    app: {
      name: 'AI Product Builder',
      version: '1.0.0',
      port: 3000,
      environment: 'production'
    },
    database: {
      type: 'mongodb',
      url: 'mongodb://localhost:27017/app',
      poolSize: 10,
      retryAttempts: 3
    },
    features: {
      authentication: true,
      apiRateLimit: true,
      caching: true,
      logging: true
    },
    api: {
      baseUrl: 'http://localhost:3000/api',
      timeout: 30000,
      retries: 2
    }
  };
  
  console.log('→ Writing config...');
  await fileWriter.writeJSON('backend/config/app.config.json', config);
  
  console.log('✓ Config written successfully');
  console.log('✓ Checksum:', await fileWriter.getChecksum('backend/config/app.config.json'));
}

/**
 * Example 5: Error Handling & Recovery
 * Shows: Validation failures, retry logic, graceful degradation
 */
export async function exampleErrorHandling() {
  console.log('\n=== Example 5: Error Handling ===\n');
  
  // Example: Bad code with TODO placeholders
  const badCode = `
export function login() {
  // TODO: Implement login logic
  return { success: false };
}
`;
  
  console.log('→ Attempting to write code with TODOs...');
  try {
    await fileWriter.write('backend/auth.js', badCode, { validate: true });
    console.log('✓ Written');
  } catch (err) {
    console.warn('✗ Validation failed (expected):', err.message);
    
    // Fallback: Generate proper code
    console.log('→ Regenerating with LLM...');
    const fixedCode = await call({
      system: 'You are an expert Node.js developer.',
      messages: [{
        role: 'user',
        content: `Generate a complete, production-ready login function for Express/JWT authentication.
          NO TODOs, NO placeholders, complete implementation.`
      }],
      maxTokens: 1000,
      temperature: 0.2
    });
    
    // Try again
    await fileWriter.write('backend/auth.js', fixedCode, { validate: true });
    console.log('✓ Fixed code written successfully');
  }
}

/**
 * Example 6: Snapshot & Statistics
 * Shows: Monitoring generated code, creating reports
 */
export async function exampleSnapshot() {
  console.log('\n=== Example 6: Snapshot & Statistics ===\n');
  
  // Generate some files first (using previous examples)
  const files = {
    'app.js': 'export const app = () => "Hello";',
    'config.json': JSON.stringify({ port: 3000 }),
    'utils/helpers.js': 'export const helper = () => "Help";'
  };
  
  await fileWriter.writeMultiple(files);
  
  // Get statistics
  console.log('→ Generation Statistics:');
  const stats = fileWriter.getStats();
  console.log(`  Files written: ${stats.written}`);
  console.log(`  Total bytes: ${stats.totalBytes}`);
  console.log(`  Avg file size: ${stats.avgFileSize} bytes`);
  console.log(`  Failed: ${stats.failed}`);
  
  // Get tree structure
  console.log('\n→ Directory Structure:');
  const tree = await fileWriter.getTree();
  console.log(tree);
  
  // Create snapshot
  console.log('\n→ Creating snapshot...');
  const snapshot = await fileWriter.snapshot();
  console.log(`  Timestamp: ${snapshot.timestamp}`);
  console.log(`  Total files: ${snapshot.fileCount}`);
  console.log(`  Total bytes: ${snapshot.totalBytes}`);
  
  return snapshot;
}

/**
 * Example 7: Full Product Generation Pipeline
 * Shows: Complete end-to-end flow with all steps
 */
export async function exampleFullPipeline(productSpec) {
  console.log('\n=== Example 7: Full Product Pipeline ===\n');
  
  console.log('📋 Product Spec:', productSpec);
  console.log('\n🚀 Starting generation pipeline...\n');
  
  const timeline = {};
  
  try {
    // Phase 1: Backend
    console.log('📦 Phase 1: Backend Generation');
    timeline.backendStart = Date.now();
    
    const backendFiles = {
      'backend/models/schema.js': 'Generated schema code...',
      'backend/routes/api.js': 'Generated API routes...',
      'backend/middleware/auth.js': 'Generated auth middleware...',
      'backend/config/database.js': 'Generated DB config...'
    };
    
    await fileWriter.writeMultiple(backendFiles);
    timeline.backendEnd = Date.now();
    console.log(`✓ Backend complete (${timeline.backendEnd - timeline.backendStart}ms)\n`);
    
    // Phase 2: Frontend
    console.log('🎨 Phase 2: Frontend Generation');
    timeline.frontendStart = Date.now();
    
    const frontendFiles = {
      'frontend/components/App.jsx': 'Generated App component...',
      'frontend/components/Home.jsx': 'Generated Home page...',
      'frontend/services/api.js': 'Generated API service...',
      'frontend/styles/app.css': 'Generated styles...'
    };
    
    await fileWriter.writeMultiple(frontendFiles);
    timeline.frontendEnd = Date.now();
    console.log(`✓ Frontend complete (${timeline.frontendEnd - timeline.frontendStart}ms)\n`);
    
    // Phase 3: Configuration
    console.log('⚙️  Phase 3: Configuration');
    timeline.configStart = Date.now();
    
    const configFiles = {
      'backend/config/app.config.json': { port: 3000, env: 'production' },
      'frontend/.env': 'REACT_APP_API_URL=http://localhost:3000',
    };
    
    await fileWriter.writeJSON(Object.keys(configFiles)[0], configFiles['backend/config/app.config.json']);
    timeline.configEnd = Date.now();
    console.log(`✓ Configuration complete (${timeline.configEnd - timeline.configStart}ms)\n`);
    
    // Phase 4: Report
    console.log('📊 Phase 4: Generation Report');
    const stats = fileWriter.getStats();
    const snapshot = await fileWriter.snapshot();
    
    console.log(`✅ Total files: ${snapshot.fileCount}`);
    console.log(`✅ Total size: ${(snapshot.totalBytes / 1024).toFixed(2)} KB`);
    console.log(`✅ Success rate: ${stats.written}/${stats.written + stats.failed}`);
    console.log(`\nTotal time: ${Date.now() - timeline.backendStart}ms\n`);
    
    // Display structure
    console.log('📁 Generated Structure:');
    console.log(snapshot.tree);
    
    return { success: true, stats, snapshot };
  } catch (err) {
    console.error('❌ Pipeline failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   FileWriter Pipeline Examples             ║');
  console.log('╚════════════════════════════════════════════╝');
  
  try {
    // Reset between examples
    await fileWriter.cleanup();
    
    // Run examples (skip LLM-dependent ones in demo)
    console.log('\n[Running simplified examples - LLM calls skipped]\n');
    
    // Example 4: Config (no LLM calls)
    await exampleConfigGeneration();
    
    // Example 6: Snapshot & Stats
    await exampleSnapshot();
    
    // Example 5: Error handling (no actual LLM)
    console.log('\n=== Example 5: Error Handling (Demo) ===\n');
    console.log('✓ Validation would catch TODO placeholders');
    console.log('✓ System would retry with regeneration');
    console.log('✓ Failed writes tracked in stats');
    
    console.log('\n✅ Examples completed!');
    console.log('\nFor full examples with LLM calls, see:');
    console.log('  - exampleBackendSchema()');
    console.log('  - exampleBackendMultipleFiles()');
    console.log('  - exampleFrontendComponents()');
    console.log('  - exampleFullPipeline()');
    
  } catch (err) {
    console.error('Error running examples:', err);
  }
}

// Export for testing
export {
  exampleBackendSchema,
  exampleBackendMultipleFiles,
  exampleFrontendComponents,
  exampleConfigGeneration,
  exampleErrorHandling,
  exampleSnapshot,
  exampleFullPipeline
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

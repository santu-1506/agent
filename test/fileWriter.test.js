/**
 * test/fileWriter.test.js
 * 
 * Comprehensive test suite for FileWriter and CodeValidator
 * 
 * Run with: node test/fileWriter.test.js
 */

import { FileWriter, CodeValidator } from '../utils/fileWriter.js';
import fs from 'fs/promises';
import path from 'path';

const testDir = './test-output';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ ${message}`);
    failCount++;
  }
}

async function test(name, fn) {
  console.log(`\n📋 ${name}`);
  try {
    await fn();
  } catch (err) {
    console.error(`  ✗ Test failed: ${err.message}`);
    failCount++;
  }
}

// ─── Code Validator Tests ─────────────────────────────────────────────────────

await test('CodeValidator - Valid JavaScript', () => {
  const code = `
export function hello() {
  return 'world';
}
export default hello;
  `.trim();

  const result = CodeValidator.validateJavaScript(code);
  assert(result.valid, 'Should be valid');
  assert(result.errors.length === 0, 'Should have no errors');
});

await test('CodeValidator - Detects placeholder code', () => {
  const code = `
export function hello() {
  // TODO: implement this
}
  `.trim();

  const result = CodeValidator.validateJavaScript(code);
  assert(!result.valid, 'Should detect TODO placeholder');
  assert(result.errors.length > 0, 'Should have errors');
});

await test('CodeValidator - Detects mismatched braces', () => {
  const code = `
export function hello() {
  return 'world';
// missing close brace
  `.trim();

  const result = CodeValidator.validateJavaScript(code);
  assert(!result.valid, 'Should detect mismatched braces');
});

await test('CodeValidator - React validation', () => {
  const code = `
import React from 'react';

export function LoginForm() {
  return <form><input type="text" /></form>;
}
  `.trim();

  const result = CodeValidator.validateReact(code);
  assert(result.valid, 'Should be valid React');
});

await test('CodeValidator - Detect missing React import', () => {
  const code = `
export function LoginForm() {
  return <form></form>;
}
  `.trim();

  const result = CodeValidator.validateReact(code);
  assert(!result.valid, 'Should detect missing React import');
});

await test('CodeValidator - JSON validation', () => {
  const code = JSON.stringify({ name: 'test', value: 123 });
  const result = CodeValidator.validateJSON(code);
  assert(result.valid, 'Should be valid JSON');
});

await test('CodeValidator - Invalid JSON', () => {
  const code = `{ invalid: json }`;
  const result = CodeValidator.validateJSON(code);
  assert(!result.valid, 'Should detect invalid JSON');
});

// ─── File Writer Tests ─────────────────────────────────────────────────────────

const writer = new FileWriter(testDir);

// Clean up before tests
try {
  await fs.rm(testDir, { recursive: true, force: true });
} catch {}

await test('FileWriter - Create directory', async () => {
  const dir = await writer.ensureDir('backend/models');
  assert(dir.includes('backend/models'), 'Directory path should include backend/models');
});

await test('FileWriter - Write simple file', async () => {
  const result = await writer.write('test/hello.js', `
export function hello() {
  return 'world';
}
export default hello;
  `.trim());

  assert(result.success, 'Write should succeed');
  assert(result.bytes > 0, 'Should have written bytes');
});

await test('FileWriter - Write multiple files', async () => {
  const files = {
    'backend/models/user.js': `export const User = { name: String };`,
    'backend/routes/api.js': `export const routes = [];`,
    'frontend/App.jsx': `export default function App() { return <div>App</div>; }`,
  };

  const result = await writer.writeMultiple(files);
  assert(result.success === 3, 'Should write all 3 files');
  assert(result.failed === 0, 'Should have no failures');
});

await test('FileWriter - Write JSON file', async () => {
  const obj = { feature: 'auth', tasks: ['schema', 'api'] };
  const result = await writer.writeJSON('config/plan.json', obj);
  assert(result.success, 'JSON write should succeed');
});

await test('FileWriter - Read file', async () => {
  await writer.write('test/readme.js', `// Test file\nexport default 'test';`);
  const content = await writer.read('test/readme.js');
  assert(content.includes('Test file'), 'Should read file content');
});

await test('FileWriter - Check file exists', async () => {
  await writer.write('test/exists.js', 'export default true;');
  const exists = await writer.exists('test/exists.js');
  const notExists = await writer.exists('test/nonexistent.js');

  assert(exists === true, 'File should exist');
  assert(notExists === false, 'File should not exist');
});

await test('FileWriter - List all files', async () => {
  const files = await writer.listAll();
  assert(files.length > 0, 'Should list files');
  assert(files.some(f => f.includes('backend')), 'Should include backend files');
});

await test('FileWriter - Get directory tree', async () => {
  const tree = await writer.getTree();
  assert(tree.includes('backend'), 'Tree should include backend');
  assert(tree.includes('frontend'), 'Tree should include frontend');
});

await test('FileWriter - Get statistics', () => {
  const stats = writer.getStats();
  assert(stats.written > 0, 'Should have written files');
  assert(stats.totalBytes > 0, 'Should have written bytes');
  assert(stats.files.length > 0, 'Should list files');
});

await test('FileWriter - Get checksum', async () => {
  await writer.write('test/checksum.js', 'export const content = "test";');
  const checksum = await writer.getChecksum('test/checksum.js');
  assert(checksum.length === 64, 'SHA256 checksum should be 64 chars');
});

await test('FileWriter - Create snapshot', async () => {
  const snapshot = await writer.snapshot();
  assert(snapshot.timestamp, 'Should have timestamp');
  assert(snapshot.fileCount > 0, 'Should have file count');
  assert(snapshot.tree, 'Should have tree');
});

await test('FileWriter - Validation on write', async () => {
  try {
    // Try to write invalid code
    await writer.write('test/invalid.js', 'THIS IS NOT VALID JAVASCRIPT {{{', {
      validate: true,
    });
    assert(false, 'Should reject invalid code');
  } catch (err) {
    assert(err.message.includes('Validation failed'), 'Should throw validation error');
  }
});

await test('FileWriter - Skip validation', async () => {
  const result = await writer.write('test/novalidate.js', 'INVALID CODE', {
    validate: false,
  });
  assert(result.success, 'Should write without validation');
});

await test('FileWriter - Cleanup', async () => {
  await writer.cleanup();
  const files = await writer.listAll();
  // Should remove backend/frontend generated files (test/ and config/ persist)
  const hasBackendContent = files.some(f => f.startsWith('backend/') && f.includes('.js'));
  const hasFrontendContent = files.some(f => f.startsWith('frontend/') && f.includes('.js'));
  assert(!hasBackendContent, 'Should remove backend files');
  assert(!hasFrontendContent, 'Should remove frontend files');
});

// ─── Integration Test ─────────────────────────────────────────────────────────

await test('Integration - Full backend generation workflow', async () => {
  const writer2 = new FileWriter(testDir);
  await writer2.cleanup();

  // Simulate backend generation
  const backendFiles = {
    'backend/models/schema.js': `
import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({ name: String });
export default mongoose.model('User', userSchema);
    `.trim(),
    'backend/routes/api.js': `
import express from 'express';
const router = express.Router();
router.get('/users', (req, res) => res.json([]));
export default router;
    `.trim(),
    'backend/middleware/auth.js': `
export function authMiddleware(req, res, next) {
  next();
}
export default authMiddleware;
    `.trim(),
  };

  const result = await writer2.writeMultiple(backendFiles);
  const stats = writer2.getStats();

  assert(result.success === 3, 'Should write all backend files');
  assert(stats.written === 3, 'Stats should show 3 written files');
  assert(stats.totalBytes > 0, 'Should have written bytes');
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log(`Test Results: ${passCount} passed, ${failCount} failed`);
console.log('═'.repeat(60));

if (failCount === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}

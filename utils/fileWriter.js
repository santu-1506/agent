/**
 * utils/fileWriter.js
 * 
 * Production-ready file writing system for generated code.
 * 
 * Exports:
 *   FileWriter         — main class
 *   fileWriter         — singleton instance
 *   CodeValidator      — validation utilities
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// ─── Code Validation ──────────────────────────────────────────────────────────

/**
 * Validates generated code for syntax and quality
 */
class CodeValidator {
  /**
   * Validate JavaScript/Node.js code
   * @param {string} code
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateJavaScript(code) {
    const errors = [];

    // Check for empty code
    if (!code || !code.trim()) {
      errors.push('Code is empty');
      return { valid: false, errors };
    }

    // Check for placeholder patterns (common LLM failure mode)
    const placeholders = [
      /\/\/\s*TODO:/i,
      /\/\/\s*FIXME:/i,
      /\/\/\s*\.\.\..*\n/,
      /function\s+\w+\(\)\s*{\s*\/\/.*\n\s*}/,
      /\.\.\.\s*implementation/i,
      /YOUR_/,
      /TODO_/,
    ];

    for (const pattern of placeholders) {
      if (pattern.test(code)) {
        errors.push(`Contains placeholder: ${pattern.toString()}`);
      }
    }

    // Basic syntax check - look for matching braces
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    // Check for required exports (for modules)
    if (!code.includes('export') && !code.includes('module.exports')) {
      errors.push('No exports found');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate React/JSX code
   * @param {string} code
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateReact(code) {
    const errors = [];

    // Run JS validation first
    const jsValidation = this.validateJavaScript(code);
    if (!jsValidation.valid) {
      return jsValidation;
    }

    // Check for React imports
    if (!code.includes("from 'react'") && !code.includes('from "react"')) {
      errors.push('Missing React import');
    }

    // Check for JSX (basic heuristic)
    if (!/<\w+/.test(code)) {
      errors.push('No JSX elements found');
    }

    // Check for export (component must export)
    if (!code.includes('export default') && !code.includes('export function') && !code.includes('export const')) {
      errors.push('React component must be exported');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate JSON code/config
   * @param {string} code
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateJSON(code) {
    try {
      JSON.parse(code);
      return { valid: true, errors: [] };
    } catch (err) {
      return {
        valid: false,
        errors: [`Invalid JSON: ${err.message}`],
      };
    }
  }

  /**
   * Detect language and validate
   * @param {string} code
   * @param {string} language - 'javascript', 'react', 'json', etc.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validate(code, language = 'javascript') {
    language = language.toLowerCase();

    if (language === 'react' || language === 'jsx') {
      return this.validateReact(code);
    } else if (language === 'json') {
      return this.validateJSON(code);
    } else {
      return this.validateJavaScript(code);
    }
  }
}

// ─── File Writer ──────────────────────────────────────────────────────────────

/**
 * Manages file I/O for generated code
 */
class FileWriter {
  constructor(baseDir = './output') {
    this.baseDir = baseDir;
    this.writtenFiles = [];
    this.failedWrites = [];
    this.totalBytesWritten = 0;
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Relative path
   * @returns {Promise<string>} Full path
   */
  async ensureDir(dirPath) {
    const fullPath = path.join(this.baseDir, dirPath);
    try {
      await fs.mkdir(fullPath, { recursive: true });
      return fullPath;
    } catch (err) {
      throw new Error(`Failed to create directory ${dirPath}: ${err.message}`);
    }
  }

  /**
   * Write content to file with validation
   * @param {string} filePath - Relative path from baseDir
   * @param {string} content - File content
   * @param {object} options - { language: 'javascript', validate: true }
   * @returns {Promise<{success: boolean, path: string, bytes: number}>}
   */
  async write(filePath, content, options = {}) {
    const { language = 'javascript', validate = true } = options;
    const fullPath = path.join(this.baseDir, filePath);
    const dir = path.dirname(fullPath);

    try {
      // Validate content if requested
      if (validate) {
        const validation = CodeValidator.validate(content, language);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(fullPath, content, 'utf-8');

      const bytes = Buffer.byteLength(content, 'utf-8');
      this.writtenFiles.push({ path: filePath, bytes, language });
      this.totalBytesWritten += bytes;

      console.log(`  ✓ ${filePath} (${bytes} bytes)`);

      return { success: true, path: fullPath, bytes };
    } catch (err) {
      this.failedWrites.push({ path: filePath, error: err.message });
      console.error(`  ✗ ${filePath}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Write multiple files
   * @param {object} files - { 'path/file.js': 'content', ... }
   * @param {object} options - Global options
   * @returns {Promise<{success: number, failed: number, bytes: number}>}
   */
  async writeMultiple(files, options = {}) {
    let successCount = 0;
    let failedCount = 0;

    for (const [filePath, content] of Object.entries(files)) {
      try {
        await this.write(filePath, content, options);
        successCount++;
      } catch (err) {
        failedCount++;
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      bytes: this.totalBytesWritten,
    };
  }

  /**
   * Write JSON file
   * @param {string} filePath
   * @param {object} obj
   * @returns {Promise<{success: boolean, path: string, bytes: number}>}
   */
  async writeJSON(filePath, obj) {
    const content = JSON.stringify(obj, null, 2);
    return this.write(filePath, content, { language: 'json' });
  }

  /**
   * Read file (for verification)
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  async read(filePath) {
    const fullPath = path.join(this.baseDir, filePath);
    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (err) {
      throw new Error(`Failed to read ${filePath}: ${err.message}`);
    }
  }

  /**
   * File exists check
   * @param {string} filePath
   * @returns {Promise<boolean>}
   */
  async exists(filePath) {
    const fullPath = path.join(this.baseDir, filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all files in output directory
   * @returns {Promise<string[]>}
   */
  async listAll() {
    try {
      const files = await fs.readdir(this.baseDir, { recursive: true });
      return files.filter(f => !f.startsWith('.'));
    } catch {
      return [];
    }
  }

  /**
   * Get directory tree structure
   * @param {string} dir - Start directory
   * @param {number} depth - Current depth
   * @returns {Promise<string>}
   */
  async getTree(dir = '', depth = 0) {
    const fullPath = path.join(this.baseDir, dir);
    const indent = '  '.repeat(depth);
    let tree = '';

    try {
      const items = await fs.readdir(fullPath, { withFileTypes: true });

      for (const item of items.sort()) {
        if (item.name.startsWith('.')) continue;

        if (item.isDirectory()) {
          tree += `${indent}├── ${item.name}/\n`;
          tree += await this.getTree(path.join(dir, item.name), depth + 1);
        } else {
          tree += `${indent}├── ${item.name}\n`;
        }
      }
    } catch (err) {
      tree += `${indent}[error reading directory]\n`;
    }

    return tree;
  }

  /**
   * Clear output directory (use with caution!)
   * @param {boolean} confirm - Must pass true to execute
   * @returns {Promise<{removed: number}>}
   */
  async clear(confirm = false) {
    if (!confirm) {
      throw new Error('Pass confirm=true to clear output directory');
    }

    try {
      const files = await fs.readdir(this.baseDir, { recursive: true, withFileTypes: true });
      let removed = 0;

      for (const file of files) {
        const fullPath = path.join(file.parentPath || this.baseDir, file.name);
        if (file.isFile()) {
          await fs.unlink(fullPath);
          removed++;
        }
      }

      this.writtenFiles = [];
      this.failedWrites = [];
      this.totalBytesWritten = 0;

      return { removed };
    } catch (err) {
      throw new Error(`Failed to clear directory: ${err.message}`);
    }
  }

  /**
   * Get statistics about written files
   * @returns {object}
   */
  getStats() {
    return {
      written: this.writtenFiles.length,
      failed: this.failedWrites.length,
      totalBytes: this.totalBytesWritten,
      avgFileSize: this.writtenFiles.length > 0 ? Math.round(this.totalBytesWritten / this.writtenFiles.length) : 0,
      files: this.writtenFiles.map(f => `${f.path} (${f.bytes}B)`),
      errors: this.failedWrites,
    };
  }

  /**
   * Generate checksum of file
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  async getChecksum(filePath) {
    const content = await this.read(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Create a snapshot of current state
   * @returns {Promise<object>}
   */
  async snapshot() {
    const files = await this.listAll();
    const tree = await this.getTree();
    const stats = this.getStats();

    return {
      timestamp: new Date().toISOString(),
      outputDir: this.baseDir,
      fileCount: files.length,
      totalBytes: this.totalBytesWritten,
      tree,
      stats,
    };
  }

  /**
   * Clean up the output directory safely
   * (keeps structure, but removes generated code)
   * @returns {Promise<void>}
   */
  async cleanup() {
    const dirs = ['backend', 'frontend', 'shared'];
    
    for (const dir of dirs) {
      const fullPath = path.join(this.baseDir, dir);
      try {
        await fs.rm(fullPath, { recursive: true, force: true });
        console.log(`  ✓ Cleaned ${dir}/`);
      } catch (err) {
        console.warn(`  ⚠ Could not clean ${dir}/: ${err.message}`);
      }
    }

    // Recreate empty structure
    for (const dir of dirs) {
      await this.ensureDir(dir);
    }

    this.writtenFiles = [];
    this.failedWrites = [];
    this.totalBytesWritten = 0;
  }
}

// ─── Singleton Instance ────────────────────────────────────────────────────────

export const fileWriter = new FileWriter('./output');

export { FileWriter, CodeValidator };

export default fileWriter;

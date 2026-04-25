/**
 * Shared Agent Prompts
 * Reusable templates for formatting, error correction, and cross-agent communication
 */

export const sharedPrompts = {
  /**
   * Code formatting and style enforcement
   */
  formatCode: (code, language = 'javascript') => `
You are a Code Formatter. Please format and clean up the following ${language} code:

${code}

Apply consistent:
- Indentation (2 spaces for JavaScript)
- Naming conventions
- Code organization
- Comments and documentation
- Error handling

Respond with formatted, production-ready code only. No explanations.
`,

  /**
   * Error correction and debugging prompt
   */
  correctError: (code, error, context = '') => `
You are a Code Debugger. Fix the following error in the code:

ERROR MESSAGE:
${error}

ORIGINAL CODE:
${code}

CONTEXT:
${context}

Analyze the error and provide:
1. Root cause explanation
2. Fixed code
3. Any additional notes or improvements

Respond in valid JSON with keys: root_cause, fixed_code, notes.
`,

  /**
   * Cross-agent sync and validation
   */
  synchronizeComponents: (backendSpec, frontendSpec) => `
You are a Synchronization Agent. Validate that frontend and backend specifications are compatible:

BACKEND SPECIFICATION:
${JSON.stringify(backendSpec, null, 2)}

FRONTEND SPECIFICATION:
${JSON.stringify(frontendSpec, null, 2)}

Check:
1. **API Contracts**: Do frontend API calls match backend endpoints?
2. **Data Schemas**: Do frontend data structures match backend models?
3. **Authentication**: Is frontend auth compatible with backend auth?
4. **Naming Consistency**: Are entity names consistent across stack?
5. **Missing Integration**: Are there any gaps?

Respond in valid JSON with keys: contracts_match, schemas_compatible, auth_compatible, naming_consistent, issues_found, recommendations.
`,

  /**
   * Test generation template
   */
  generateTests: (code, language = 'javascript', testFramework = 'jest') => `
You are a Test Generation Agent. Generate comprehensive tests for the following ${language} code:

${code}

Using ${testFramework}, create:
- Unit tests for all functions
- Edge cases and error conditions
- Mocking where appropriate
- Assertions for expected behavior

Respond with complete, runnable test code. Use best practices for test structure and naming.
`,

  /**
   * Documentation generation
   */
  generateDocumentation: (code, componentName) => `
You are a Documentation Agent. Generate comprehensive documentation for:

COMPONENT/MODULE: ${componentName}

CODE:
${code}

Create:
- Overview/description
- Usage examples
- Parameters/props documentation
- Return values/output
- Error scenarios
- Best practices

Respond in Markdown format with clear structure and examples.
`,

  /**
   * Code review and suggestions
   */
  reviewCode: (code, context = '') => `
You are a Code Reviewer. Review the following code for:
- Code quality and best practices
- Performance issues
- Security vulnerabilities
- Accessibility concerns (for frontend)
- Maintainability and readability

CODE:
${code}

CONTEXT:
${context}

Respond in valid JSON with keys: quality_score (1-10), strengths (array), weaknesses (array), security_issues (array), suggestions (array).
`,

  /**
   * Dependency resolution prompt
   */
  resolveDependencies: (code, generatedFiles = []) => `
You are a Dependency Resolver. Analyze the following code and list all required dependencies:

CODE:
${code}

OTHER GENERATED FILES:
${generatedFiles.join(', ')}

Identify:
1. External library dependencies (npm packages)
2. Internal module imports
3. Missing imports that need to be added
4. Unused imports to remove
5. Version constraints

Respond in valid JSON with keys: external_dependencies (array), internal_imports (array), missing_imports (array), unused_imports (array), suggestions (array).
`
};

export default sharedPrompts;

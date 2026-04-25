/**
 * Backend Agent Prompts
 * Templates for database schema, API, and authentication generation
 */

export const backendPrompts = {
  /**
   * Backend architecture planning prompt
   */
  planBackendArchitecture: (specification, techStack) => `
You are the BackendPlanner Agent responsible for designing the server-side architecture.

PRODUCT SPECIFICATION:
${specification}

TECH STACK SELECTED:
${JSON.stringify(techStack, null, 2)}

Please design the backend architecture including:

1. **Database Schema**: Entities, relationships, and data types
2. **API Structure**: RESTful endpoint organization, resource models
3. **Authentication Strategy**: JWT, OAuth, sessions, roles/permissions
4. **Middleware & Utilities**: Logging, error handling, validation
5. **Third-party Integrations**: Services to integrate with
6. **Scalability Considerations**: Caching, rate limiting, pagination strategies

Respond in valid JSON with keys: schema_overview, api_structure, auth_strategy, middleware, integrations, scalability_notes.
`,

  /**
   * Database schema generation prompt
   */
  generateSchema: (specification, architecture, dbType = 'mongodb') => `
You are the SchemaAgent responsible for generating database schema definitions.

PRODUCT SPECIFICATION:
${specification}

ARCHITECTURE PLAN:
${JSON.stringify(architecture, null, 2)}

DATABASE TYPE: ${dbType}

Generate a complete database schema with:
- Entity definitions with fields, types, and constraints
- Relationships (one-to-one, one-to-many, many-to-many)
- Indexes for performance optimization
- Validation rules

For ${dbType === 'mongodb' ? 'MongoDB: Use Mongoose schema syntax' : 'SQL: Use CREATE TABLE syntax'}

Respond with complete, ready-to-use schema code. Include comments explaining each entity.
`,

  /**
   * API endpoint generation prompt
   */
  generateAPI: (specification, architecture, framework = 'express') => `
You are the APIAgent responsible for generating REST API endpoints.

PRODUCT SPECIFICATION:
${specification}

ARCHITECTURE PLAN:
${JSON.stringify(architecture, null, 2)}

FRAMEWORK: ${framework}

Generate API routes with:
- Endpoint definitions (GET, POST, PUT, DELETE)
- Request/response schemas
- Input validation
- Error handling
- Status codes

For ${framework}: Use Express.js routing patterns

Respond with complete, ready-to-use route handler code. Include proper error handling and validation.
`,

  /**
   * Authentication system generation prompt
   */
  generateAuth: (specification, architecture) => `
You are the AuthAgent responsible for implementing authentication and authorization.

PRODUCT SPECIFICATION:
${specification}

ARCHITECTURE PLAN:
${JSON.stringify(architecture, null, 2)}

Generate authentication implementation including:
- User model/entity
- Authentication middleware
- JWT token generation and validation
- Password hashing strategy
- Role-based access control (RBAC)
- Session management (if applicable)

Respond with complete, production-ready authentication code including security best practices.
`,

  /**
   * Backend integration and validation prompt
   */
  validateBackend: (schema, api, auth, specification) => `
You are the BackendIntegrator responsible for validating the complete backend.

SCHEMA:
${schema}

API ROUTES:
${api}

AUTHENTICATION:
${auth}

ORIGINAL SPECIFICATION:
${specification}

Validate:
1. Does the schema support all API endpoints?
2. Are all required endpoints for the specification implemented?
3. Are authentication requirements properly implemented?
4. Are there any missing dependencies or imports?
5. Are there any obvious bugs or issues?

Provide fix recommendations for any issues found.

Respond in valid JSON with keys: schema_complete, api_complete, auth_complete, issues_found, fix_recommendations.
`
};

export default backendPrompts;

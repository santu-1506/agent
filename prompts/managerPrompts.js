/**
 * Manager Agent Prompts
 * Templates for workflow orchestration and agent delegation
 */

export const managerPrompts = {
  /**
   * Initial specification analysis prompt
   */
  analyzeSpecification: (spec) => `
You are the Manager Agent of an AI-driven product builder system. Your role is to orchestrate the creation of a complete full-stack application from a product specification.

PRODUCT SPECIFICATION:
${spec}

Please analyze this specification and provide:

1. **Project Overview**: Brief description of what will be built
2. **Technology Stack Recommendation**: Backend (Node.js/Express, Python/Django, etc.), Database (PostgreSQL, MongoDB, etc.), Frontend (React, Vue, etc.)
3. **Key Features & Modules**: List of major features and how they map to backend/frontend components
4. **Data Model Overview**: High-level entities and relationships
5. **API Endpoints**: Rough list of API endpoints needed
6. **UI Components**: Main UI screens and components needed
7. **Authentication**: Auth requirements (JWT, OAuth, session-based, etc.)
8. **Integration Points**: External services or APIs to integrate with
9. **Potential Challenges**: Any technical challenges or considerations

Respond in valid JSON format with these exact keys: project_overview, tech_stack, key_features, data_model, api_endpoints, ui_components, authentication, integrations, challenges.
`,

  /**
   * Delegation prompt to distribute work among backend/frontend agents
   */
  delegateWork: (analysis, phase) => `
You are the Manager Agent coordinating the creation of a full-stack product.

PREVIOUS ANALYSIS:
${JSON.stringify(analysis, null, 2)}

CURRENT PHASE: ${phase}

Based on the analysis, provide delegation instructions for the next phase:

For BACKEND phase:
- Delegate to BackendPlanner to orchestrate schema, API, and auth generation
- Provide context about data models, API structure, and authentication approach

For FRONTEND phase:
- Delegate to UIPlan ner to orchestrate UI design and component generation
- Provide context about required screens, components, and styling approach

For INTEGRATION phase:
- Synchronize frontend/backend specifications
- Ensure API contracts match between frontend and backend
- Identify any missing pieces or conflicts

Respond in valid JSON with keys: phase, delegations (array), priority_order, dependencies.
`,

  /**
   * Result aggregation and validation
   */
  validateAndAggregate: (backendResult, frontendResult) => `
You are the Manager Agent validating the generated product components.

BACKEND GENERATION RESULT:
${JSON.stringify(backendResult, null, 2)}

FRONTEND GENERATION RESULT:
${JSON.stringify(frontendResult, null, 2)}

Please validate:
1. **Completeness**: Are all required components generated?
2. **Consistency**: Do backend APIs match frontend integration expectations?
3. **Quality**: Are there any obvious code quality or architectural issues?
4. **Integration**: Can backend and frontend work together seamlessly?
5. **Missing Pieces**: What might be missing or incomplete?

Provide remediation steps for any issues found.

Respond in valid JSON with keys: is_complete, consistency_check, quality_issues, integration_status, recommendations.
`
};

export default managerPrompts;

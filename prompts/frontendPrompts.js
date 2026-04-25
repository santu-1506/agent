/**
 * Frontend Agent Prompts
 * Templates for UI planning, component generation, and styling
 */

export const frontendPrompts = {
  /**
   * UI architecture planning prompt
   */
  planUIArchitecture: (specification, backendAPI) => `
You are the UIPlan ner Agent responsible for designing the user interface architecture.

PRODUCT SPECIFICATION:
${specification}

BACKEND API STRUCTURE:
${JSON.stringify(backendAPI, null, 2)}

Please design the UI architecture including:

1. **Main Screens**: List of primary screens/pages user will see
2. **Component Hierarchy**: How components are organized and nested
3. **Navigation Flow**: How users navigate between screens
4. **State Management**: Data flow and state management strategy
5. **Styling Approach**: Design system, color scheme, typography
6. **API Integration**: Which screens/components use which API endpoints
7. **User Interactions**: Key user interactions and their flows

Respond in valid JSON with keys: screens, component_hierarchy, navigation_flow, state_strategy, styling_approach, api_mapping, user_interactions.
`,

  /**
   * React component generation prompt
   */
  generateComponents: (specification, uiArchitecture, componentType) => `
You are the ComponentAgent responsible for generating React components.

PRODUCT SPECIFICATION:
${specification}

UI ARCHITECTURE:
${JSON.stringify(uiArchitecture, null, 2)}

COMPONENT TYPE TO GENERATE: ${componentType}

Generate React components for ${componentType} with:
- Functional component syntax (hooks-based)
- Props with PropTypes or TypeScript
- Local state management (useState, useReducer)
- Event handlers
- Proper structure and organization
- Comments explaining the component's purpose

Respond with production-ready React component code. Use modern React patterns and best practices.
`,

  /**
   * API integration layer generation prompt
   */
  generateAPIIntegration: (backendAPI, specification) => `
You are the APIIntegrationAgent responsible for creating the API service layer.

BACKEND API ENDPOINTS:
${JSON.stringify(backendAPI, null, 2)}

PRODUCT SPECIFICATION:
${specification}

Generate an API integration layer including:
- Service functions for each backend endpoint
- Request/response handling
- Error handling and retries
- Base URL and configuration
- Authentication token management
- Loading and error states

Respond with complete, ready-to-use API service code. Use axios or fetch as appropriate.
`,

  /**
   * Styling and CSS generation prompt
   */
  generateStyling: (uiArchitecture, specification) => `
You are the StylingAgent responsible for generating styles and CSS.

UI ARCHITECTURE:
${JSON.stringify(uiArchitecture, null, 2)}

PRODUCT SPECIFICATION:
${specification}

Generate styling including:
- Tailwind CSS classes or CSS-in-JS
- Color palette and design system
- Responsive design patterns
- Component styling
- Animations and transitions (if appropriate)
- Accessibility considerations

Respond with production-ready styling code. Be consistent with modern CSS practices.
`,

  /**
   * Frontend integration and validation prompt
   */
  validateFrontend: (components, apiIntegration, styling, specification) => `
You are the FrontendIntegrator responsible for validating the complete frontend.

COMPONENTS:
${components}

API INTEGRATION:
${apiIntegration}

STYLING:
${styling}

ORIGINAL SPECIFICATION:
${specification}

Validate:
1. Are all required screens and components generated?
2. Does the API integration match the backend API?
3. Is the styling consistent and complete?
4. Are there any missing imports or dependencies?
5. Are there any obvious bugs or usability issues?

Provide fix recommendations for any issues found.

Respond in valid JSON with keys: components_complete, api_integration_valid, styling_complete, issues_found, fix_recommendations.
`
};

export default frontendPrompts;

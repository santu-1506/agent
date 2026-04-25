/**
 * Agent Configuration
 * Central configuration for all agents, LLM settings, and system behavior
 */

export const agentConfig = {
  // Agent role definitions
  agents: {
    manager: {
      id: 'manager',
      role: 'ManagerAgent',
      description: 'Orchestrates product specification and delegates to specialized agents',
      timeout: 30000,
      maxRetries: 2
    },
    backendPlanner: {
      id: 'backendPlanner',
      role: 'BackendPlanner',
      description: 'Plans backend architecture and delegates to schema, API, and auth agents',
      timeout: 30000,
      maxRetries: 2
    },
    schemaAgent: {
      id: 'schemaAgent',
      role: 'SchemaAgent',
      description: 'Generates database schemas and data models',
      timeout: 20000,
      maxRetries: 2
    },
    apiAgent: {
      id: 'apiAgent',
      role: 'APIAgent',
      description: 'Generates RESTful API endpoints and routing',
      timeout: 20000,
      maxRetries: 2
    },
    authAgent: {
      id: 'authAgent',
      role: 'AuthAgent',
      description: 'Generates authentication and authorization logic',
      timeout: 20000,
      maxRetries: 2
    },
    backendIntegrator: {
      id: 'backendIntegrator',
      role: 'BackendIntegrator',
      description: 'Validates and integrates backend components',
      timeout: 30000,
      maxRetries: 3
    },
    uiPlanner: {
      id: 'uiPlanner',
      role: 'UIPlan ner',
      description: 'Plans UI architecture and component hierarchy',
      timeout: 30000,
      maxRetries: 2
    },
    componentAgent: {
      id: 'componentAgent',
      role: 'ComponentAgent',
      description: 'Generates React components',
      timeout: 20000,
      maxRetries: 2
    },
    apiIntegrationAgent: {
      id: 'apiIntegrationAgent',
      role: 'APIIntegrationAgent',
      description: 'Generates API service layer and integration',
      timeout: 20000,
      maxRetries: 2
    },
    stylingAgent: {
      id: 'stylingAgent',
      role: 'StylingAgent',
      description: 'Generates CSS and styling',
      timeout: 15000,
      maxRetries: 2
    },
    frontendIntegrator: {
      id: 'frontendIntegrator',
      role: 'FrontendIntegrator',
      description: 'Validates and integrates frontend components',
      timeout: 30000,
      maxRetries: 3
    },
    syncAgent: {
      id: 'syncAgent',
      role: 'SyncAgent',
      description: 'Synchronizes frontend/backend specifications',
      timeout: 20000,
      maxRetries: 2
    },
    debugAgent: {
      id: 'debugAgent',
      role: 'DebugAgent',
      description: 'Handles errors and implements fixes',
      timeout: 25000,
      maxRetries: 3
    },
    testAgent: {
      id: 'testAgent',
      role: 'TestAgent',
      description: 'Generates and validates tests',
      timeout: 25000,
      maxRetries: 2
    }
  },

  // LLM Configuration
  llm: {
    provider: 'anthropic',
    primaryModel: process.env.LLM_MODEL_PRIMARY || 'claude-3-5-sonnet-20241022',
    fallbackModel: process.env.LLM_MODEL_FALLBACK || 'claude-3-haiku-20240307',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096'),
    contextWindow: {
      primary: 200000, // Claude 3.5 Sonnet
      fallback: 200000 // Claude 3 Haiku
    }
  },

  // Message Bus Configuration
  messageBus: {
    timeout: parseInt(process.env.AGENT_TIMEOUT_MS || '30000'),
    maxRetries: parseInt(process.env.AGENT_MAX_RETRIES || '2'),
    enablePersistence: process.env.ENABLE_AGENT_PERSISTENCE === 'true'
  },

  // Output Configuration
  output: {
    baseDir: process.env.OUTPUT_DIR || './output',
    backendDir: 'backend',
    frontendDir: 'frontend'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableDebug: process.env.ENABLE_DEBUG_LOGGING === 'true'
  },

  // Model selection strategy
  selectModel: (taskType) => {
    const primaryModel = agentConfig.llm.primaryModel;
    const fallbackModel = agentConfig.llm.fallbackModel;

    // Route complex tasks to primary model
    if (['architecture', 'planning', 'integration'].includes(taskType)) {
      return primaryModel;
    }

    // Use fallback for simpler tasks
    if (['formatting', 'documentation'].includes(taskType)) {
      return fallbackModel;
    }

    return primaryModel; // Default to primary
  },

  // Retry policy with exponential backoff
  getBackoffDelay: (attemptNumber) => {
    return Math.min(1000 * Math.pow(2, attemptNumber), 10000);
  },

  // Circuit breaker configuration
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000 // 1 minute
  }
};

export default agentConfig;

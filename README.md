# AI Product Builder

A sophisticated multi-agent AI system that generates full-stack applications from natural language product specifications using Claude 3.5 Sonnet.

## Overview

The AI Product Builder uses a hierarchical agent architecture to orchestrate the generation of complete backend and frontend codebases. The system breaks down product specifications into modular components and has specialized agents handle different aspects of the application development process.

### Key Features

- **Multi-Agent Architecture**: Specialized agents for different domains (backend, frontend, testing, debugging)
- **Hierarchical Orchestration**: Manager agent coordinates workflow between backend and frontend teams
- **LLM-Powered Code Generation**: Uses Anthropic Claude 3.5 Sonnet for high-quality code generation
- **Error Handling & Auto-Correction**: Debug agent automatically fixes errors and sync issues
- **Production-Ready Output**: Generated code includes proper structure, error handling, and validation

## Project Structure

```
ai-product-builder/
├── app.js                          # Main entry point
├── package.json                    # Dependencies
├── .env.example                    # Environment variables template
│
├── config/
│   └── agentConfig.js              # Agent roles, LLM settings, retry policies
│
├── utils/
│   ├── llm.js                      # Anthropic Claude wrapper with caching
│   └── messageBus.js               # Event-driven agent communication system
│
├── prompts/
│   ├── managerPrompts.js           # Workflow orchestration templates
│   ├── backendPrompts.js           # Database schema, API, auth templates
│   ├── frontendPrompts.js          # UI, components, styling templates
│   └── sharedPrompts.js            # Reusable formatting, testing templates
│
├── agents/
│   ├── BaseAgent.js                # Abstract base class for all agents
│   │
│   ├── manager/
│   │   └── managerAgent.js         # Orchestrates entire workflow
│   │
│   ├── backend/
│   │   ├── backendPlanner.js       # Plans backend architecture
│   │   ├── schemaAgent.js          # Generates database schemas
│   │   ├── apiAgent.js             # Generates REST API endpoints
│   │   ├── authAgent.js            # Generates auth & authorization
│   │   └── backendIntegrator.js    # Validates backend integration
│   │
│   ├── frontend/
│   │   ├── uiPlanner.js            # Plans UI architecture
│   │   ├── componentAgent.js       # Generates React components
│   │   ├── apiIntegrationAgent.js  # Generates API service layer
│   │   ├── stylingAgent.js         # Generates CSS & styling
│   │   └── frontendIntegrator.js   # Validates frontend integration
│   │
│   └── shared/
│       ├── syncAgent.js            # Syncs frontend/backend specs
│       ├── debugAgent.js           # Fixes errors & issues
│       └── testAgent.js            # Generates tests
│
├── pipelines/
│   ├── backendPipeline.js          # Backend generation workflow
│   └── frontendPipeline.js         # Frontend generation workflow
│
└── output/
    ├── backend/                    # Generated backend code
    └── frontend/                   # Generated frontend code
```

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (Claude 3.5 Sonnet)

### Setup

1. Clone or download the project
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file from template:

   ```bash
   cp .env.example .env
   ```

4. Add your Anthropic API key to `.env`:
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```

## Usage

### Basic Usage

Generate a product from a specification:

```bash
node app.js "Build a Todo application with user authentication and MongoDB backend"
```

### Default Example

If no specification is provided, a default Todo app example runs:

```bash
npm start
```

### Environment Variables

Key environment variables in `.env`:

| Variable            | Description                           | Default                    |
| ------------------- | ------------------------------------- | -------------------------- |
| `ANTHROPIC_API_KEY` | Claude API key                        | Required                   |
| `LLM_MODEL_PRIMARY` | Primary Claude model                  | claude-3-5-sonnet-20241022 |
| `LLM_TEMPERATURE`   | LLM creativity (0-1)                  | 0.7                        |
| `AGENT_TIMEOUT_MS`  | Agent execution timeout               | 30000                      |
| `AGENT_MAX_RETRIES` | Retry attempts on failure             | 2                          |
| `LOG_LEVEL`         | Logging level (debug/info/warn/error) | info                       |

## Architecture

### Agent Communication

Agents communicate through the **MessageBus**, an event-driven system that:

- Routes messages between agents
- Manages request/response tracking
- Implements timeout and retry logic
- Supports both async (pub/sub) and sync (task execution) patterns

### Workflow Phases

1. **Analysis Phase**: Manager analyzes product spec, identifies tech stack and features
2. **Backend Generation Phase**: BackendPlanner orchestrates schema, API, and auth agents
3. **Frontend Generation Phase**: UIPlan ner orchestrates UI design and component generation
4. **Integration Phase**: SyncAgent validates frontend/backend compatibility
5. **Validation Phase**: IntegratorAgents validate generated code quality
6. **Error Correction Phase**: DebugAgent fixes any identified issues

### Key Components

#### BaseAgent

All agents extend `BaseAgent` which provides:

- LLM interaction with circuit breaker pattern
- Message bus registration and communication
- Execution history and statistics tracking
- Structured logging

#### LLMUtil

Wrapper around Anthropic Claude API:

- Request caching to reduce API calls
- Token counting and context management
- Support for both text and structured (JSON) outputs
- Automatic retry with exponential backoff

#### MessageBus

Event-driven communication system:

- Pub/sub messaging between agents
- Synchronous task execution with timeouts
- Request/response tracking
- Statistics and monitoring

## Code Generation Strategy

### Backend Generation

1. **Schema Design**: Generates database models with relationships
2. **API Development**: Creates RESTful endpoints with validation
3. **Authentication**: Implements JWT or session-based auth
4. **Integration**: Validates all components work together

### Frontend Generation

1. **UI Architecture**: Plans screens, components, navigation
2. **Component Development**: Generates React components with hooks
3. **API Integration**: Creates service layer for backend calls
4. **Styling**: Generates CSS using Tailwind or CSS-in-JS
5. **Integration**: Validates components and API integration

## Error Handling & Auto-Correction

The system includes multi-layer error handling:

1. **Circuit Breaker Pattern**: Prevents cascading failures
2. **Automatic Retries**: Exponential backoff for transient failures
3. **Debug Agent**: Analyzes errors and generates fixes
4. **Sync Validation**: Ensures frontend/backend compatibility

## Token Usage Optimization

The system optimizes API costs through:

- **Request Caching**: Identical requests return cached results
- **Model Routing**: Complex tasks use Claude 3.5 Sonnet, simple tasks use cheaper models
- **Context Management**: Only relevant code and context passed to LLM
- **Batch Processing**: Where possible, multiple tasks combined into single API call

## Extensibility

### Adding New Agents

1. Create agent class extending `BaseAgent`
2. Implement `execute(taskData)` method
3. Register with MessageBus in pipeline
4. Create corresponding prompt templates

### Adding New Agent Types

1. Create new folder in `agents/`
2. Define agents for that domain
3. Create pipeline file to orchestrate them
4. Update manager to call new pipeline

### Supported Tech Stacks

Currently scaffolded for:

- **Backend**: Node.js/Express (extensible to Python/Django, Java/Spring)
- **Frontend**: React (extensible to Vue, Angular)
- **Database**: MongoDB or PostgreSQL

## Configuration

### Agent Configuration

All agent settings in `config/agentConfig.js`:

```javascript
agents: {
  agentId: {
    id: 'agentId',
    role: 'AgentRole',
    timeout: 30000,
    maxRetries: 2
  }
}
```

### LLM Settings

```javascript
llm: {
  primaryModel: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  maxTokens: 4096,
  contextWindow: 200000
}
```

### Circuit Breaker

Prevents cascading failures:

```javascript
circuitBreaker: {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000
}
```

## Monitoring & Statistics

Each agent tracks:

- Successful vs failed executions
- Token usage
- Execution history (last 100 events)
- Circuit breaker state

Get agent stats:

```javascript
const stats = agent.getStats();
```

Includes:

- Success/failure counts
- Total tokens used
- Circuit breaker state
- Recent events

## Limitations & Future Improvements

### Current Limitations

- Generated code requires manual review before production use
- Limited to specifications that fit in context window (~200K tokens)
- No automatic code execution or validation in sandboxed environment
- Tests are generated but not automatically executed

### Future Enhancements

1. **Docker Sandbox**: Execute and test generated code in containers
2. **Git Integration**: Auto-commit generated code to repository
3. **Visual Review**: UI screenshots and visual validation
4. **Performance Testing**: Load testing and optimization suggestions
5. **Security Scanning**: CVE detection and security best practices
6. **Cost Estimation**: Provide deployment cost estimates
7. **CI/CD Pipeline**: Auto-generate GitHub Actions workflows

## Development

### Running in Debug Mode

```bash
npm run dev
```

Sets `ENABLE_DEBUG_LOGGING=true` for verbose output

### Token Tracking

The system tracks and reports token usage:

```javascript
const usage = llm.getTokenUsage();
// {
//   totalInputTokens: 45000,
//   totalOutputTokens: 15000,
//   totalTokens: 60000
// }
```

## Performance Considerations

### Optimization Tips

1. **Batch Similar Tasks**: Group related generation tasks
2. **Reuse Context**: Pass generated files to dependent agents
3. **Monitor Token Usage**: Track cumulative usage to manage costs
4. **Use Fallback Models**: Route simple tasks to cheaper models
5. **Cache Results**: Enable caching for repeated specifications

### Expected Generation Times

- **Simple Todo App**: 2-3 minutes (80K-100K tokens)
- **Medium E-commerce**: 5-8 minutes (200K-300K tokens)
- **Complex SaaS**: 10-15 minutes (400K-600K tokens)

## Cost Estimation

Using Claude 3.5 Sonnet pricing (~$3/$15 per 1M input/output tokens):

- **Simple App**: ~$0.30-0.50
- **Medium App**: ~$1.00-1.50
- **Complex App**: ~$2.00-3.00

With request caching, costs can reduce by 20-30% for similar specifications.

## License

MIT

## Support

For issues, suggestions, or contributions, please refer to the project documentation or contact the maintainers.

---

**Built with**: Claude 3.5 Sonnet, Node.js, and modern AI orchestration patterns.

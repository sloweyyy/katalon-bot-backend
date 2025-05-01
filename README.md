# Katalon Support Bot - Backend

This is the backend service for the Katalon Support Bot, built with NestJS.

## Project Structure

```
src/
├── app.controller.ts    # Main application controller
├── app.module.ts        # Main application module
├── app.service.ts       # Main application service  
├── main.ts              # Application entry point
├── gemini/              # Gemini integration module
│   ├── gemini.module.ts
│   └── gemini.service.ts
└── mcp/                 # MCP (Model Context Protocol) module
    ├── mcp.controller.ts
    ├── mcp.module.ts
    ├── mcp.service.ts
    └── dto/             # Data Transfer Objects
        ├── ask-gemini.dto.ts
        └── ask-mcp.dto.ts
```

## Features

- Direct Gemini API integration for AI responses
- MCP (Model Context Protocol) integration for enhanced Katalon-specific responses
- REST API endpoints for chat functionality
- Long-context conversations with history management

## Refactored Architecture

The backend has been refactored to follow best practices for maintainability, scalability, and reusability:

### Core Module

The core module (`src/core`) provides shared functionality used throughout the application:

- **Configuration Management**: Centralized environment variable handling via NestJS ConfigService
- **Logging Service**: Custom logger service with context support
- **Redis Cache**: Configured Redis store for caching
- **Interfaces**: Common interfaces that define contracts for implementation

### Feature Modules

The application is organized into feature modules:

- **GeminiModule**: Handles communication with Google's Gemini AI model
- **McpModule**: Implements the Model Context Protocol (MCP) integration
- **ChatHistoryModule**: Manages chat sessions and message history

#### Chat History Module Structure

The Chat History module has been refactored to improve maintainability:

```
chat-history/
├── chat-history.controller.ts  # REST API endpoints for chat history
├── chat-history.module.ts      # Module definition
├── chat-history.service.ts     # Business logic for managing chat history
└── dto/                        # Data Transfer Objects
    ├── add-message.dto.ts      # DTO for adding messages
    ├── create-chat-session.dto.ts  # DTO for creating chat sessions
    ├── generate-title.dto.ts   # DTO for title generation
    ├── index.ts                # Barrel exports
    └── update-title.dto.ts     # DTO for updating titles
```

Each DTO includes validation rules with class-validator decorators and Swagger documentation annotations.

### Architecture Benefits

- **Maintainability**: Clear separation of concerns with focused modules
- **Scalability**: Properly isolated services with dependency injection
- **Reusability**: Interfaces and abstractions enable easy extension
- **Error Handling**: Consistent error management across services

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

### Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Docker Deployment

### Prerequisites

- Docker and Docker Compose installed on your server
- Port 3001 available for the backend API

### Deployment Steps

1. Clone this repository:
   ```bash
   git clone <your-backend-repo-url>
   cd katalon-bot-backend
   ```

2. Configure environment variables:
   - Create a `.env` file in the root directory with your configuration
   - Example:
     ```
     # Backend environment variables
     NODE_ENV=production
     
     # Redis configuration
     REDIS_HOST=redis
     REDIS_PORT=6379
     REDIS_PASSWORD=
     REDIS_TLS=false
     
     # API configuration
     PORT=3001
     
     # External service credentials
     GEMINI_API_KEY=your_gemini_api_key
     ```

3. Deploy with Docker Compose:
   ```bash
   # Build and start the containers
   docker-compose up -d
   
   # If you need to rebuild from scratch
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. Verify the deployment:
   ```bash
   docker-compose ps
   ```

### Configuration

- The backend API will be available at: `http://your-server-ip:3001`
- Redis data is persisted in a Docker volume named `redis-data`
- Environment variables can be modified by editing the `.env` file and restarting the containers

### Stopping the Service

```bash
docker-compose down
```

To remove volumes as well:
```bash
docker-compose down -v
```

### Viewing Logs

```bash
docker-compose logs -f
```

### Deployment on Cloud Platforms

When deploying to cloud platforms, you'll need to:

1. Configure separate Redis instance or use a managed Redis service
2. Set environment variables according to your platform's guidelines
3. Ensure proper networking between your backend and Redis services

## API Documentation

- API documentation is available at: `http://your-server-ip:3001/api`

## API Endpoints

### Gemini Endpoint
- `POST /mcp/ask/gemini`: Direct interaction with Gemini AI

### MCP Endpoint
- `POST /mcp/ask/mcp`: Interaction with Gemini through MCP for Katalon-specific responses

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port number for the server | 3001 |
| GEMINI_API_KEY | API key for Google's Gemini API | - |
| REDIS_HOST | Redis server host | localhost |
| REDIS_PORT | Redis server port | 6379 |
| REDIS_PASSWORD | Redis server password | - |
| REDIS_TLS | Whether to use TLS for Redis connection | false |

## Development

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run linting
npm run lint
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
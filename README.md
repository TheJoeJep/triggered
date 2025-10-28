# Triggered App

A dynamic trigger system for custom AI agents with web interface, REST API, and MCP server integration.

## Features

- **Dynamic Trigger System**: Create one-time, recurring, and interval-based triggers
- **Web Dashboard**: Modern UI for managing triggers
- **REST API**: Full API with API key authentication
- **MCP Integration**: AI agents can create and manage triggers programmatically
- **Webhook Execution**: Send custom HTTP requests with JSON payloads
- **Execution History**: Track all trigger executions

## Tech Stack

### Backend
- Node.js with TypeScript
- Express.js
- PostgreSQL with Prisma ORM
- BullMQ + Redis for job scheduling
- JWT authentication

### Frontend
- React with TypeScript
- Tailwind CSS
- React Query for state management
- React Router

## Getting Started

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd triggered-app
```

2. Set up environment variables
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

3. Start the services
```bash
docker-compose up -d
```

4. Run database migrations
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
```

5. Start the development servers

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### API Keys
- `GET /api/keys` - List API keys
- `POST /api/keys` - Create API key
- `DELETE /api/keys/:id` - Delete API key

### Triggers
- `GET /api/triggers` - List all triggers
- `GET /api/triggers/:id` - Get trigger details
- `POST /api/triggers` - Create trigger
- `PUT /api/triggers/:id` - Update trigger
- `DELETE /api/triggers/:id` - Delete trigger
- `POST /api/triggers/:id/pause` - Pause trigger
- `POST /api/triggers/:id/resume` - Resume trigger
- `GET /api/triggers/:id/executions` - Get execution history

### MCP Endpoints
- `GET /mcp/triggers/list` - List triggers (API key auth)
- `POST /mcp/triggers/create` - Create trigger (API key auth)
- `PUT /mcp/triggers/:id` - Update trigger (API key auth)
- `DELETE /mcp/triggers/:id` - Delete trigger (API key auth)

## Usage

1. Register an account at http://localhost:5173
2. Create triggers via the web interface or API
3. Triggers will execute based on their schedule
4. View execution history in the dashboard

## Deployment

The project includes Docker configuration. To deploy:

1. Build the images
```bash
docker-compose build
```

2. Deploy to your platform (Railway, Render, etc.)

## License

MIT


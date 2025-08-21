# Docker Setup for Day Planner Backend

This document provides instructions for running the Day Planner Backend using Docker.

## Quick Start

### Using NPM Scripts (Recommended)

**Development Environment:**
```bash
# Start development environment
npm run docker:dev

# View logs (all services)
npm run docker:dev:logs

# Stop development environment
npm run docker:dev:stop

# Access SQLite database
npm run docker:dev:db
```

**Production Environment:**
```bash
# Use docker-compose directly for production
docker-compose up -d

# View logs
docker-compose logs -f

# Stop production environment
docker-compose down
```

### Using Docker Compose Directly

**Production Deployment:**
```bash
# Build and run the production container
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop the container
docker-compose down
```

**Development Environment:**
```bash
# Build and run the development container with hot reload
docker-compose -f docker-compose.dev.yml up -d

# Check logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop the container
docker-compose -f docker-compose.dev.yml down
```

The development environment includes:
- **API Server**: `http://localhost:3001` - Day Planner Backend API
- **libSQL Database**: File-based or remote libSQL database

## Manual Docker Commands

### Build Production Image

```bash
docker build -t day-planner-backend:latest .
```

### Build Development Image

```bash
docker build -f Dockerfile.dev -t day-planner-backend:dev .
```

### Run Production Container

```bash
docker run -d \
  --name day-planner-api \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  day-planner-backend:latest
```

### Run Development Container

```bash
docker run -d \
  --name day-planner-api-dev \
  -p 3001:3001 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/data:/app/data \
  day-planner-backend:dev
```

## NPM Docker Scripts Reference

### Development Scripts
| Script | Command | Description |
|--------|---------|-------------|
| `npm run docker:dev` | Start development environment | Launches API container |
| `npm run docker:dev:build` | Start development environment (rebuild) | Forces rebuild of container |
| `npm run docker:dev:stop` | Stop development environment | Stops development container |
| `npm run docker:dev:logs` | View all development logs | Shows logs from API service |
| `npm run docker:dev:logs:api` | View API logs only | Shows only backend API logs |
| `npm run docker:dev:shell` | Access API container shell | Opens shell in backend container |
| `npm run docker:dev:restart` | Restart development services | Restarts development container |

### Utility Scripts
| Script | Command | Description |
|--------|---------|-------------|
| `npm run docker:clean` | Clean all Docker resources | Removes containers and volumes |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Port number for the API server |
| `NODE_ENV` | `production` | Node.js environment |
| `LIBSQL_URL` | `file:/app/data/planner.db` | libSQL database URL (file:// for local, libsql:// for remote) |
| `LIBSQL_AUTH_TOKEN` | (empty) | Authentication token for remote libSQL databases (required for Turso) |

## Data Persistence

### Local libSQL Database

When using `file://` URLs (default), the libSQL database is stored in the `./data` directory and mounted as a volume to persist data between container restarts.

| Component | Database Path | Volume Mount |
|-----------|---------------|--------------|
| **Backend API** | `/app/data/planner.db` | `./data:/app/data` |
| **Host Machine** | `./data/planner.db` | Local filesystem |

### Remote libSQL Database (Turso)

When using `libsql://` URLs, data is stored remotely on Turso's infrastructure:

- **No local files** - All data stored remotely
- **Authentication required** - Must provide `LIBSQL_AUTH_TOKEN`
- **Automatic backups** - Handled by Turso
- **Global distribution** - Edge locations for low latency

**Configuration Examples:**

```bash
# Local file database (default)
LIBSQL_URL=file:/app/data/planner.db
LIBSQL_AUTH_TOKEN=

# Remote Turso database
LIBSQL_URL=libsql://your-database-name.turso.io
LIBSQL_AUTH_TOKEN=your-auth-token-here
```

## Health Check

The application includes a health check endpoint at `/api/health` that is automatically used by Docker to monitor container health.

## Security Features

- Runs as non-root user (`dayplanner`)
- Multi-stage build for minimal production image
- Only production dependencies in final image
- Security headers via Helmet middleware

## Troubleshooting

### Platform Issues (Apple Silicon Macs)

If you see platform mismatch errors on Apple Silicon (M1/M2) Macs:
```
! sqlite-db The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8)
```

This is automatically handled in the docker-compose.dev.yml with `platform: linux/amd64`. The SQLite container will run under emulation, which works fine for development purposes.

### Check Container Status

```bash
# Production
docker-compose ps

# Development
docker-compose -f docker-compose.dev.yml ps
```

### View Logs

```bash
# Production
docker-compose logs day-planner-backend

# Development - Backend service
docker-compose -f docker-compose.dev.yml logs day-planner-backend-dev

# Development - SQLite database service
docker-compose -f docker-compose.dev.yml logs sqlite-db
```

### Access Container Shell

```bash
# Production
docker-compose exec day-planner-backend sh

# Development - Backend container
docker-compose -f docker-compose.dev.yml exec day-planner-backend-dev sh

# Development - SQLite database container
docker-compose -f docker-compose.dev.yml exec sqlite-db sh
```

### Reset Database

```bash
# Stop containers
docker-compose down

# Remove database file
rm -f data/planner.db

# Start containers (database will be recreated)
docker-compose up -d
```

## Performance

- Production image size: ~50MB (Alpine Linux base)
- Development image includes TypeScript compilation and hot reload
- Health checks run every 30 seconds

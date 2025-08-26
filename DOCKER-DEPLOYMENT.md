# Day Planner Backend - Docker Deployment

This guide explains the Docker deployment setup for the Day Planner Backend API using GitHub Actions and GitHub Container Registry (GHCR).

## 🚀 Overview

The Day Planner Backend is a Node.js/TypeScript REST API with:
- **Google OAuth 2.0 authentication**
- **SQLite database with libSQL**
- **JWT token management**
- **Multi-stage Docker builds**
- **Automated GitHub Actions deployment**

## 📦 Docker Image

- **Registry**: `ghcr.io/{username}/day-planner-backend`
- **Base Image**: `node:18-alpine`
- **Architecture**: Multi-platform (`linux/amd64`, `linux/arm64`)
- **Size**: ~150MB (optimized production build)

## 🔧 Configuration

### Environment Variables

```bash
# Database Configuration
LIBSQL_URL=file:data/planner.db
LIBSQL_AUTH_TOKEN=

# Server Configuration
PORT=3001
NODE_ENV=production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-secret
JWT_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your-session-secret

# CORS Configuration
FRONTEND_URL=http://localhost:4173
```

### Required Secrets

Set these in your deployment environment:

1. **GOOGLE_CLIENT_ID** - OAuth 2.0 client ID
2. **GOOGLE_CLIENT_SECRET** - OAuth 2.0 client secret
3. **JWT_SECRET** - Secret key for JWT signing (minimum 32 characters)
4. **SESSION_SECRET** - Secret key for session management

## 🐳 Usage

### Pull and Run

```bash
# Pull latest image
docker pull ghcr.io/{username}/day-planner-backend:latest

# Run with environment file
docker run -d \
  --name day-planner-api \
  -p 3001:3001 \
  --env-file .env.production \
  -v $(pwd)/data:/app/data \
  ghcr.io/{username}/day-planner-backend:latest

# Check health
curl http://localhost:3001/api/health
```

### Docker Compose

```yaml
version: '3.8'

services:
  day-planner-backend:
    image: ghcr.io/{username}/day-planner-backend:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - LIBSQL_URL=file:data/planner.db
    volumes:
      - backend_data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "const http = require('http'); const options = { hostname: 'localhost', port: process.env.PORT || 3001, path: '/api/health', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => { process.exit(1); }); req.end();"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  backend_data:
    driver: local
```

## 🛡️ Security Features

### Container Security
- **Non-root user**: Runs as `dayplanner` user (UID 1001)
- **Read-only filesystem**: Application files are immutable
- **Minimal attack surface**: Alpine Linux base with minimal packages
- **Health checks**: Built-in health monitoring

### Application Security
- **JWT authentication**: Secure token-based authentication
- **CORS protection**: Configurable cross-origin resource sharing
- **Helmet.js**: Security headers middleware
- **Input validation**: Joi schema validation
- **SQL injection protection**: Parameterized queries

## 📊 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify token

### Tasks
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/toggle` - Toggle task completion
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/stats/summary` - Get task statistics

### System
- `GET /api/health` - Health check endpoint

## 🗄️ Database

### SQLite Database
- **Location**: `/app/data/planner.db` (mounted volume)
- **Engine**: libSQL (SQLite compatible)
- **Schema**: Automatically initialized on startup
- **Backup**: Volume-based persistence

### Tables
- **users**: User accounts with Google OAuth data
- **tasks**: User tasks with priority and completion status

### Migrations
The database schema is automatically created/updated on container startup.

## 🚀 Deployment Options

### Option 1: Cloud Platforms

#### AWS ECS/Fargate
```bash
# Create task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Deploy service
aws ecs update-service --cluster production --service day-planner-backend --force-new-deployment
```

#### Google Cloud Run
```bash
gcloud run deploy day-planner-backend \
  --image ghcr.io/{username}/day-planner-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

#### Azure Container Instances
```bash
az container create \
  --resource-group production \
  --name day-planner-backend \
  --image ghcr.io/{username}/day-planner-backend:latest \
  --ports 3001 \
  --environment-variables NODE_ENV=production
```

### Option 2: Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: day-planner-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: day-planner-backend
  template:
    metadata:
      labels:
        app: day-planner-backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/{username}/day-planner-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: GOOGLE_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: day-planner-secrets
              key: google-client-id
        volumeMounts:
        - name: data-volume
          mountPath: /app/data
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: day-planner-data-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: day-planner-backend-service
spec:
  selector:
    app: day-planner-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer
```

### Option 3: Docker Swarm

```yaml
version: '3.8'

services:
  day-planner-backend:
    image: ghcr.io/{username}/day-planner-backend:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    secrets:
      - google_client_id
      - google_client_secret
      - jwt_secret
    volumes:
      - backend_data:/app/data
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

secrets:
  google_client_id:
    external: true
  google_client_secret:
    external: true
  jwt_secret:
    external: true

volumes:
  backend_data:
    driver: local
```

## 🔍 Monitoring and Logging

### Health Checks
```bash
# Basic health check
curl http://localhost:3001/api/health

# Detailed health check with authentication test
curl -H "Authorization: Bearer invalid-token" http://localhost:3001/api/auth/verify
```

### Logs
```bash
# View container logs
docker logs day-planner-api -f

# View specific log levels
docker logs day-planner-api 2>&1 | grep ERROR
```

### Metrics
```bash
# Container stats
docker stats day-planner-api

# Database size
docker exec day-planner-api ls -la /app/data/
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Permission Errors
```bash
# Fix: Ensure volume has correct permissions
docker exec day-planner-api chown -R dayplanner:nodejs /app/data
```

#### 2. Google OAuth Errors
```bash
# Fix: Verify environment variables
docker exec day-planner-api env | grep GOOGLE
```

#### 3. Port Already in Use
```bash
# Fix: Stop conflicting containers
docker ps | grep 3001
docker stop <container-id>
```

#### 4. Health Check Failures
```bash
# Debug: Check application status
docker exec day-planner-api curl -f http://localhost:3001/api/health
```

### Debug Mode

```bash
# Run with debug logging
docker run -d \
  -p 3001:3001 \
  -e DEBUG=* \
  -e NODE_ENV=development \
  ghcr.io/{username}/day-planner-backend:latest
```

## 📈 Performance Optimization

### Production Settings
```bash
# Recommended environment variables for production
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=512"
UV_THREADPOOL_SIZE=4
```

### Resource Limits
```yaml
# Docker Compose resource limits
services:
  day-planner-backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## 🔒 Security Best Practices

1. **Use secrets management**: Store sensitive data in Docker secrets or Kubernetes secrets
2. **Regular updates**: Keep base images and dependencies updated
3. **Network isolation**: Use Docker networks or Kubernetes network policies
4. **Read-only filesystem**: Mount `/tmp` as writable volume if needed
5. **Scan images**: Use `docker scan` or similar tools for vulnerability scanning

## 📝 Maintenance

### Backup Database
```bash
# Create backup
docker exec day-planner-api sqlite3 /app/data/planner.db ".backup backup-$(date +%Y%m%d).db"

# Copy backup from container
docker cp day-planner-api:/app/backup-$(date +%Y%m%d).db ./backups/
```

### Update Application
```bash
# Pull latest image
docker pull ghcr.io/{username}/day-planner-backend:latest

# Rolling update (zero downtime)
docker-compose up -d --no-deps day-planner-backend
```

### Database Maintenance
```bash
# Vacuum database (optimize)
docker exec day-planner-api sqlite3 /app/data/planner.db "VACUUM;"

# Check database integrity
docker exec day-planner-api sqlite3 /app/data/planner.db "PRAGMA integrity_check;"
```

---

For more information, see the [main deployment guide](../day-planner/DOCKER-DEPLOYMENT.md) for full-stack deployment instructions.

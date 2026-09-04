## CI/CD & Deployment

### Continuous Integration

Every push and PR triggers GitHub Actions workflow that:

- Runs linting and type checking
- Executes test suite with PostgreSQL and Redis
- Builds Docker image to catch build failures

### Local Development

```bash
docker compose up
```

### Production Deployment

1. Set environment variables in `.env` (copy from `.env.example`)
2. Run deployment script:

```bash
./scripts/deploy.sh
```

Or manually:

```bash
# Build
docker compose -f docker-compose.prod.yml build

# Migrate database
docker compose -f docker-compose.prod.yml run --rm monolith npx prisma migrate deploy

# Start services
docker compose -f docker-compose.prod.yml up -d
```

### Rollback

```bash
# Rollback database migration
docker compose -f docker-compose.prod.yml run --rm monolith npx prisma migrate down

# Restart previous version
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

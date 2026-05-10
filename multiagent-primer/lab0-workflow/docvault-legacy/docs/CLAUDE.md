# DocVault Platform Developer Guide

**NOTE**: This was the original `.claude/CLAUDE.md` but moved to `docs/` during repo cleanup. It should be copied to `.claude/CLAUDE.md` for Claude Code to pick it up automatically.

## Overview
DocVault is our flagship e-commerce platform for pet supplies. Built on Spring Boot 2.7 with PostgreSQL.

## Tech Stack
- **Framework**: Spring Boot 2.7.x (upgrading to 3.x planned for Q3 2023)
- **Database**: PostgreSQL 14 running on AWS RDS (instance: docvault-prod.abc123.us-east-1.rds.amazonaws.com)
- **Cache**: Redis cluster for session management
- **Search**: Elasticsearch 7.x for product catalog search
- **Messaging**: RabbitMQ for order event processing

## Package Structure
```
com.pawsfirst.docvault/
├── controllers/        # REST endpoints
├── services/           # Business logic
├── repositories/       # Data access (Spring Data JPA)
├── entities/           # JPA entities
├── dto/                # Data transfer objects
├── config/             # Spring configuration
└── messaging/          # RabbitMQ consumers/producers
```

## Running Locally
```bash
# Start PostgreSQL and Redis via Docker
docker-compose up -d

# Run the app
mvn spring-boot:run -Dspring.profiles.active=local
```

Make sure you have the `.env` file with database credentials. Ask @carlos-m or @priya-s for access.

## Key Contacts
- **Carlos Martinez** - Tech Lead (carlos@pawsfirst.com)
- **Priya Sharma** - Senior Backend (priya@pawsfirst.com)
- **DevOps**: Handled by platform team, Slack #docvault-infra

## Database Migrations
We use Flyway for migrations. Scripts are in `src/main/resources/db/migration/`.
Run `mvn flyway:migrate` before starting the app if you see schema errors.

## Environment Variables
```
POSTGRES_URL=jdbc:postgresql://localhost:5432/docvault
POSTGRES_USER=docvault_app
POSTGRES_PASSWORD=<ask Carlos>
REDIS_HOST=localhost
REDIS_PORT=6379
SMTP_HOST=smtp.sendgrid.net
SMTP_API_KEY=<ask Priya>
ELASTICSEARCH_URL=http://localhost:9200
RABBITMQ_HOST=localhost
```

## Testing
```bash
mvn test                          # Unit tests
mvn verify -Pintegration-test     # Integration tests (requires Docker)
```

## Deployment
Deployed via Jenkins pipeline. Push to `develop` triggers staging deploy.
Push to `main` triggers production deploy after approval.

Jenkins: https://jenkins.pawsfirst.internal/job/docvault/

## Notes
- The `OrderService` was refactored in Sprint 42 by Jake. He consolidated several services into one "for simplicity"
- Product search uses Elasticsearch in production but falls back to SQL LIKE queries locally
- Email notifications go through SendGrid in prod, console logging locally
- The checkout flow has some tech debt from the Black Friday 2021 rush. "Temporary" fixes that stuck

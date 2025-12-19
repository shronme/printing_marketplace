.PHONY: help migrate-up migrate-down migrate-down-all migrate-create migrate-current migrate-history migrate-show migrate-stamp docker-up docker-down

# Default target
help:
	@echo "Available Alembic commands:"
	@echo "  make migrate-up              - Apply all pending migrations (upgrade to head)"
	@echo "  make migrate-down            - Downgrade one revision"
	@echo "  make migrate-down-all        - Downgrade all migrations (to base)"
	@echo "  make migrate-create MSG=...  - Create a new migration with autogenerate (requires MSG='message')"
	@echo "  make migrate-current         - Show current database revision"
	@echo "  make migrate-history         - Show migration history"
	@echo "  make migrate-show REV=...    - Show details of a specific revision (requires REV=revision)"
	@echo "  make migrate-stamp REV=...   - Stamp database to a specific revision (requires REV=revision)"
	@echo ""
	@echo "Docker commands:"
	@echo "  make docker-up               - Start all containers"
	@echo "  make docker-down             - Stop all containers"

# Start containers
docker-up:
	docker compose up -d

# Stop containers
docker-down:
	docker compose down

# Apply all pending migrations
migrate-up:
	docker compose run --rm backend alembic upgrade head

# Downgrade one revision
migrate-down:
	docker compose run --rm backend alembic downgrade -1

# Downgrade all migrations
migrate-down-all:
	docker compose run --rm backend alembic downgrade base

# Create a new migration with autogenerate
migrate-create:
	@if [ -z "$(MSG)" ]; then \
		echo "Error: MSG parameter is required. Usage: make migrate-create MSG='your message'"; \
		exit 1; \
	fi
	docker compose run --rm backend alembic revision --autogenerate -m "$(MSG)"

# Show current database revision
migrate-current:
	docker compose run --rm backend alembic current

# Show migration history
migrate-history:
	docker compose run --rm backend alembic history

# Show details of a specific revision
migrate-show:
	@if [ -z "$(REV)" ]; then \
		echo "Error: REV parameter is required. Usage: make migrate-show REV=revision"; \
		exit 1; \
	fi
	docker compose run --rm backend alembic show $(REV)

# Stamp database to a specific revision (without running migrations)
migrate-stamp:
	@if [ -z "$(REV)" ]; then \
		echo "Error: REV parameter is required. Usage: make migrate-stamp REV=revision"; \
		exit 1; \
	fi
	docker compose run --rm backend alembic stamp $(REV)


```Makefile
# Define variables
PYTHON_ENV = .venv
PYTHON = $(PYTHON_ENV)/bin/python
PIP = $(PYTHON_ENV)/bin/pip
UVICORN = $(PYTHON_ENV)/bin/uvicorn
PYTEST = $(PYTHON_ENV)/bin/pytest
ALEMBIC = $(PYTHON_ENV)/bin/alembic

APP_DIR = app
MAIN_APP = $(APP_DIR).api.main:app

# Default target
.PHONY: all
all: help

# Help message
.PHONY: help
help:
	@echo "Usage:"
	@echo "  make install        - Install python dependencies"
	@echo "  make dev            - Install dev dependencies"
	@echo "  make run            - Run the FastAPI application with Uvicorn"
	@echo "  make tests          - Run all tests"
	@echo "  make test-unit      - Run unit tests"
	@echo "  make test-integration - Run integration tests"
	@echo "  make test-api       - Run API tests"
	@echo "  make lint           - Run linting checks (using pre-commit)"
	@echo "  make format         - Auto-format code (using pre-commit)"
	@echo "  make migrate-head   - Apply all pending database migrations"
	@echo "  make migrate-create MESSAGE=\"<message>\" - Create a new migration script"
	@echo "  make docker-build   - Build Docker images"
	@echo "  make docker-up      - Start services using Docker Compose"
	@echo "  make docker-down    - Stop services using Docker Compose"
	@echo "  make reset-db       - Stop, remove volumes, then bring up services (DANGEROUS: DELETES DB DATA)"
	@echo "  make setup          - Full development setup (install, docker-up, migrate)"

# Setup Python environment and install dependencies
$(PYTHON_ENV):
	python3 -m venv $(PYTHON_ENV)
	$(PIP) install --upgrade pip setuptools wheel

.PHONY: install
install: $(PYTHON_ENV)
	$(PIP) install -r requirements.txt
	pre-commit install
	@echo "Python dependencies installed. pre-commit hooks set up."

.PHONY: dev
dev: $(PYTHON_ENV)
	$(PIP) install -r requirements.txt
	@echo "Python dev dependencies installed."


# Run the application
.PHONY: run
run: install
	$(UVICORN) $(MAIN_APP) --host 0.0.0.0 --port 8000 --reload

# Database Migrations
.PHONY: migrate-head
migrate-head: install
	@echo "Applying database migrations..."
	$(ALEMBIC) upgrade head

.PHONY: migrate-create
migrate-create: install
ifndef MESSAGE
	$(error MESSAGE is required, e.g., make migrate-create MESSAGE="add user table")
endif
	$(ALEMBIC) revision --autogenerate -m "$(MESSAGE)"

# Testing
.PHONY: tests
tests: install
	$(PYTEST) tests/

.PHONY: test-unit
test-unit: install
	$(PYTEST) tests/unit/

.PHONY: test-integration
test-integration: install
	$(PYTEST) tests/integration/

.PHONY: test-api
test-api: install
	$(PYTEST) tests/api/

# Linting and Formatting
.PHONY: lint
lint: install
	pre-commit run --all-files

.PHONY: format
format: install
	pre-commit run --all-files

# Docker commands
.PHONY: docker-build
docker-build:
	docker-compose build

.PHONY: docker-up
docker-up:
	docker-compose up -d

.PHONY: docker-down
docker-down:
	docker-compose down

.PHONY: reset-db
reset-db:
	@echo "WARNING: This will stop Docker services and remove database volumes, deleting all data."
	@read -p "Are you sure? (y/N) " confirm; \
	if [ "$$confirm" = "y" ]; then \
		docker-compose down -v; \
		docker-compose up -d; \
		make migrate-head; \
		echo "Database reset and migrations applied."; \
	else \
		echo "Operation cancelled."; \
	fi

.PHONY: setup
setup: install docker-up migrate-head
	@echo "Development environment setup complete. You can now run 'make run'."

# Clean up
.PHONY: clean
clean:
	rm -rf $(PYTHON_ENV)
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	rm -f .coverage .pytest_cache
	@echo "Cleaned up."
```
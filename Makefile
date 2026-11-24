.PHONY: up down build logs test

up:
	@docker-compose up -d
	@echo "Services starting..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"

down:
	@docker-compose down
	@echo "Services stopped."

build:
	@docker-compose build
	@echo "Images built."

logs:
	@docker-compose logs -f

test:
	@cd backend && pytest -v
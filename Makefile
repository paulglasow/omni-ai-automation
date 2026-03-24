# Makefile for OmniAI v4 Automation

.PHONY: setup clean status validate verify build deploy help

# Default target
help:
	@echo ""
	@echo "OmniAI v4 — Available Commands"
	@echo "──────────────────────────────────────────"
	@echo "  make setup     Run the full automated setup wizard"
	@echo "  make validate  Check .env for missing or malformed variables"
	@echo "  make verify    Confirm GitHub, Vercel, and Supabase are working"
	@echo "  make build     Build the React application"
	@echo "  make deploy    Deploy to Vercel manually"
	@echo "  make status    Show current setup status"
	@echo "  make clean     Remove build artifacts and node_modules"
	@echo ""

# Run the full automated setup wizard
setup:
	@echo "Starting OmniAI v4 setup..."
	@npm install
	@npm run setup

# Validate environment variables
validate:
	@npm run validate

# Verify all services are running
verify:
	@npm run verify

# Build the React application
build:
	@npm run build

# Deploy to Vercel
deploy:
	@npm run deploy

# Show current setup status
status:
	@echo ""
	@echo "── OmniAI v4 Setup Status ────────────────────────────────────"
	@echo ""
	@if [ -f .env ]; then \
		echo "  ✅ .env file exists"; \
	else \
		echo "  ❌ .env file missing — run: make setup"; \
	fi
	@if [ -d node_modules ]; then \
		echo "  ✅ Dependencies installed"; \
	else \
		echo "  ❌ Dependencies missing — run: npm install"; \
	fi
	@if [ -d build ]; then \
		echo "  ✅ Build output exists (./build/)"; \
	else \
		echo "  ⚠️  No build output — run: make build"; \
	fi
	@echo ""
	@npm run validate 2>/dev/null || true
	@echo ""

# Remove build artifacts and dependencies
clean:
	@echo "Cleaning up..."
	@rm -rf build/ dist/ .next/
	@rm -rf node_modules/
	@echo "  ✅ Removed: build/, dist/, node_modules/"
	@echo "  ℹ️  .env was NOT removed (run: rm .env  to delete it manually)"
	@echo ""

# Next-Gen-Rally-OS — operational tasks.
# These wrap the pnpm/turbo scripts so infra and CI have stable entry points.

.PHONY: install generate migrate push seed dev build typecheck lint test deploy-rally-os deploy-public-site

install:        ## Install workspace dependencies
	pnpm install

generate:       ## Generate the Prisma client
	pnpm db:generate

migrate:        ## Apply Prisma migrations (prisma migrate deploy)
	pnpm db:migrate

push:           ## Push the Prisma schema to the database (no migration history)
	pnpm db:push

seed:           ## Seed a demo organization + coach login
	pnpm db:seed

dev:            ## Run all apps in dev
	pnpm dev

build:          ## Build every workspace
	pnpm build

typecheck:      ## Typecheck every workspace
	pnpm typecheck

lint:           ## Lint every workspace
	pnpm lint

test:           ## Run unit tests
	pnpm test

# Deploys use the Vercel CLI; VERCEL_TOKEN must be set. See infra/vercel/README.md.
deploy-rally-os:      ## Deploy the coach app to Vercel
	cd apps/rally-os && vercel deploy --prod --token $$VERCEL_TOKEN

deploy-public-site:   ## Deploy a team public site to Vercel
	cd apps/public-site && vercel deploy --prod --token $$VERCEL_TOKEN

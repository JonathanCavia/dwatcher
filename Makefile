.PHONY: help setup install start restart refresh clean lint typecheck format format-write test test-all expo expo-android expo-android-dev expo-android-emulator expo-android-all expo-clean
.DEFAULT_GOAL := help

SHELL := /bin/bash

# Android SDK paths (required for expo-android-* targets)
ANDROID_HOME ?= /opt/homebrew/share/android-commandlinetools
JAVA_HOME ?= $(shell asdf where java 2>/dev/null || echo $(JAVA_HOME))
export ANDROID_HOME
export ANDROID_SDK_ROOT = $(ANDROID_HOME)
export JAVA_HOME

help: ## Show available targets
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-24s\033[0m %s\n", $$1, $$2}'

setup: install ## Install workspace dependencies (host pnpm)

install: ## Install workspace dependencies on the host via pnpm
	@pnpm install

start: ## Start Expo dev server for mobile app
	@pnpm --filter @dwatcher/mobile start

restart: setup start ## Reinstall dependencies, then start the dev server

refresh: clean install ## Clean caches, reinstall dependencies

clean: ## Remove all node_modules and common workspace caches/artifacts
	@find . -type d \( -name node_modules -o -name .next -o -name .turbo -o -name .expo -o -name coverage -o -name dist \) -prune -exec rm -rf {} +
	@rm -rf tmp
	@echo "Cleaned node_modules, caches, dist, and tmp artifacts"

lint: ## Run workspace linters on the host via pnpm
	@pnpm -r lint

typecheck: ## Run workspace type checks on the host via pnpm
	@pnpm -r typecheck

format: ## Check workspace formatting on the host via pnpm
	@pnpm -r format

format-write: ## Fix code formatting in-place
	@pnpm -r format:write

test: ## Run workspace tests on the host via pnpm
	@pnpm -r test

test-all: lint typecheck format test ## Run full test suite (lint + typecheck + format + test)

build: ## Build all workspace packages that have a build step
	@pnpm -r build

expo: ## Start Expo dev server on the host (apps/mobile)
	@cd apps/mobile && npx expo start -c

expo-clean: clean setup expo ## Start Expo dev server from a clean state (apps/mobile)

expo-android: ## Build and run Android app on connected device/emulator
	@cd apps/mobile && npx expo run:android

expo-android-dev: ## Prebuild and run Android dev build in emulator
	@cd apps/mobile && npx expo prebuild --platform android && npx expo run:android

expo-android-emulator: ## Launch Android emulator (dwatcher-dev AVD)
	@$(ANDROID_HOME)/emulator/emulator -avd dwatcher-dev &

expo-android-all: expo-android-emulator ## Emulator + prebuild + run (full Android dev cycle)
	@sleep 10
	@cd apps/mobile && npx expo prebuild --platform android && npx expo run:android

expo-android-build: ## Build Android app bundle locally (requires Android SDK)
	@cd apps/mobile/android && ./gradlew bundleRelease

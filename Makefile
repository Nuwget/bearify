PORT ?= 8000

run: ## abre o site em http://localhost:$(PORT)
	./serve.sh $(PORT)

help: ## lista os comandos
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-8s %s\n", $$1, $$2}'

.PHONY: run help

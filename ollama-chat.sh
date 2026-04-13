#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bun run "$SCRIPT_DIR/index.ts" "$@"

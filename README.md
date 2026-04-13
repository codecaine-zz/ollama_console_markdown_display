# Ollama Console Markdown Display

Chat with Ollama models in your terminal with beautifully rendered markdown output and clipboard-copyable code blocks. Powered by Bun v1.3.12's `Bun.markdown.ansi()` API.

## Requirements

- macOS (ARM or Intel)
- [Bun](https://bun.sh) v1.3.12+
- [Ollama](https://ollama.ai) running locally

## Usage

### One-liner mode

```bash
# Basic question
bun run index.ts "explain closures in JavaScript"

# Specify a model
bun run index.ts -m qwen3.5:4b "write fizzbuzz in python"

# Save response to a file
bun run index.ts -o response.md "create a REST API in Node.js"

# Enable thinking/reasoning mode
bun run index.ts -t "why is the sky blue"

# Combine flags: custom model + thinking + save output
bun run index.ts -m qwen3.5:27b -t -o answer.md "explain monads"
```

### Interactive chat mode

```bash
# Start chat with default model
bun run index.ts

# Start chat with a specific model
bun run index.ts -m qwen3.5:27b

# Start chat with thinking mode enabled
bun run index.ts -t

# Start chat with auto-save to file
bun run index.ts -o session.md

# Combine: specific model + thinking + output
bun run index.ts -m qwen3.5:4b -t -o log.md
```

### Read a markdown file

```bash
# Auto-detect .md file
bun run index.ts README.md

# Explicit flag
bun run index.ts -r notes.md
```

### Show help

```bash
bun run index.ts -h
```

### Options

| Flag                  | Description                              |
| --------------------- | ---------------------------------------- |
| `-m, --model <name>`  | Model to use (default: `qwen3.5:latest`) |
| `-o, --output <file>` | Save response markdown to a file         |
| `-r, --read <file>`   | Render a markdown file in the terminal   |
| `-t, --think`         | Enable thinking/reasoning mode           |
| `-h, --help`          | Show help                                |

### Chat commands

| Command         | Action                            |
| --------------- | --------------------------------- |
| `copy <n>`      | Copy code block #n to clipboard   |
| `copy all`      | Copy all code blocks to clipboard |
| `save <file>`   | Save last response to a file      |
| `model <name>`  | Switch to a different model       |
| `models`        | List available Ollama models      |
| `think`         | Toggle thinking mode on/off       |
| `think on/off`  | Set thinking mode explicitly      |
| `exit` / `quit` | End the chat                      |

## Features

- **Streaming** — tokens appear in real-time, then get replaced with formatted markdown
- **Rendered markdown** — headings, lists, bold, italic, code blocks with language labels
- **Read .md files** — render any markdown file in the terminal with syntax coloring
- **Code block clipboard** — numbered code blocks with `copy <n>` to pbcopy
- **Save output** — save responses to markdown files with `-o` flag or `save` command
- **Model switching** — switch models mid-chat with `model <name>`, list with `models`
- **Thinking mode** — enable chain-of-thought reasoning with `-t` flag or `think` command
- **Conversation memory** — chat mode maintains full message history

## Compile to Executable

Build a standalone binary with no runtime dependencies using `bun build --compile`:

```bash
bun build --compile index.ts --outfile ollama-chat
```

Then run it directly:

```bash
./ollama-chat "explain async/await in JavaScript"
./ollama-chat -t -m qwen3.5:27b
./ollama-chat README.md
```

Optionally move it to your PATH:

```bash
mv ollama-chat /usr/local/bin/
```

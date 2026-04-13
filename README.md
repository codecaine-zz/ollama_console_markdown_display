# Ollama Console Markdown Display

Chat with Ollama models in your terminal with beautifully rendered markdown output and clipboard-copyable code blocks. Powered by Bun v1.3.12's `Bun.markdown.ansi()` API.

## Demo

![Demo](demo.gif)

## Requirements

- macOS (ARM or Intel)
- [Bun](https://bun.sh) v1.3.12+
- [Ollama](https://ollama.ai) installed (started automatically if not running)

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
| `<n>`           | Copy code block #n to clipboard   |
| `all`           | Copy all code blocks to clipboard |
| `save <file>`   | Save last response to a file      |
| `model <name>`  | Switch to a different model       |
| `models`        | List available Ollama models      |
| `think`         | Toggle thinking mode on/off       |
| `think on/off`  | Set thinking mode explicitly      |
| `exit` / `quit` | End the chat                      |

After each response with code blocks, a copy prompt appears where you can type a block number, `all`, or press enter to continue chatting.

## Install as a global command

Bun's `--compile` flag produces unsigned ARM64 binaries that macOS kills on Apple Silicon. Use a shell wrapper instead:

```bash
# Make the wrapper script executable and link it into your PATH
chmod +x ollama-chat.sh
sudo ln -sf "$(pwd)/ollama-chat.sh" /usr/local/bin/ollama-chat
```

Now you can use it from anywhere:

```bash
ollama-chat "explain closures in JavaScript"
ollama-chat -m qwen3.5:27b -t "why is the sky blue"
ollama-chat README.md
```

## Features

- **Streaming** — tokens appear in real-time, then get replaced with formatted markdown
- **Rendered markdown** — headings, lists, bold, italic, code blocks with language labels
- **Read .md files** — render any markdown file in the terminal with syntax coloring
- **Code block clipboard** — numbered code blocks with `copy <n>` to pbcopy
- **Save output** — save responses to markdown files with `-o` flag or `save` command
- **Model switching** — switch models mid-chat with `model <name>`, list with `models`
- **Thinking mode** — enable chain-of-thought reasoning with `-t` flag or `think` command
- **Conversation memory** — chat mode maintains full message history
- **Automatic Ollama startup** — detects if Ollama is running and starts it automatically if needed

## Automatic Ollama Startup

The main function includes an enhanced Ollama startup process that handles server availability automatically:

1. **Detection** — on launch, the app checks if Ollama is already running by pinging `http://localhost:11434/api/tags`
2. **Auto-start** — if Ollama is not running, it spawns `ollama serve` in the background and waits up to 15 seconds for it to become ready
3. **Error handling** — if Ollama fails to start (e.g. not installed), an error message is displayed with a link to the installation page at https://ollama.ai
4. **Graceful cleanup** — signal handlers (`SIGINT`, `SIGTERM`, `exit`) ensure the spawned Ollama process is stopped when the app exits

No manual server management is required — just run the app and it takes care of the rest.

## Note on compiled binaries

Bun's `--compile` flag currently produces unsigned ARM64 binaries that macOS kills on Apple Silicon. Use the shell wrapper install method above instead.

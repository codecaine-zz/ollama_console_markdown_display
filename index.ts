const DEFAULT_MODEL = "qwen3.5:latest";
const OLLAMA_BASE = "http://localhost:11434";

// --- CLI argument parsing ---
function parseArgs(): { model: string; prompt: string | null; output: string | null; readFile: string | null; think: boolean } {
    const args = Bun.argv.slice(2);
    let model = DEFAULT_MODEL;
    let prompt: string | null = null;
    let output: string | null = null;
    let readFile: string | null = null;
    let think = false;
    const positional: string[] = [];

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "-m" || arg === "--model") {
            model = args[++i] ?? DEFAULT_MODEL;
        } else if (arg === "-o" || arg === "--output") {
            output = args[++i] ?? null;
        } else if (arg === "-r" || arg === "--read") {
            readFile = args[++i] ?? null;
        } else if (arg === "-t" || arg === "--think") {
            think = true;
        } else if (arg === "-h" || arg === "--help") {
            printHelp();
            process.exit(0);
        } else if (arg) {
            positional.push(arg);
        }
    }

    // Auto-detect .md file as first positional arg
    if (positional.length === 1 && positional[0]!.endsWith(".md")) {
        readFile = positional[0]!;
    } else if (positional.length > 0) {
        prompt = positional.join(" ");
    }

    return { model, prompt, output, readFile, think };
}

function printHelp() {
    const help = `
# Ollama Markdown Chat

**Usage:**
\`\`\`
bun run index.ts [options] [prompt]
\`\`\`

**Options:**
- \`-m, --model <name>\`  Model to use (default: ${DEFAULT_MODEL})
- \`-o, --output <file>\` Save response markdown to a file
- \`-r, --read <file>\`   Render a markdown file in the terminal
- \`-t, --think\`         Enable thinking/reasoning mode
- \`-h, --help\`          Show this help

**Modes:**
- **Chat mode:** \`bun run index.ts\` — interactive conversation
- **One-liner:** \`bun run index.ts "your question"\` — single Q&A
- **Read .md:** \`bun run index.ts README.md\` — render a markdown file

**In chat mode:**
- Type your message and press Enter
- \`copy <n>\` — copy code block #n to clipboard
- \`copy all\` — copy all code blocks
- \`save <file>\` — save last response to a file
- \`model <name>\` — switch to a different model
- \`models\` — list available Ollama models
- \`think\` — toggle thinking mode on/off
- \`think on\` / \`think off\` — set thinking mode
- \`exit\` or \`quit\` — leave the chat
`;
    process.stdout.write(
        Bun.markdown.ansi(help, { columns: process.stdout.columns || 80 }),
    );
}

// --- Code block extraction ---
function extractCodeBlocks(markdown: string): { lang: string; code: string }[] {
    const blocks: { lang: string; code: string }[] = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) {
        blocks.push({ lang: match[1] || "text", code: match[2]!.trimEnd() });
    }
    return blocks;
}

// --- Clipboard (macOS) ---
async function copyToClipboard(text: string): Promise<boolean> {
    try {
        const proc = Bun.spawn(["pbcopy"], { stdin: "pipe" });
        proc.stdin.write(text);
        proc.stdin.end();
        await proc.exited;
        return true;
    } catch {
        return false;
    }
}

// --- Render markdown ---
function renderMarkdown(text: string): string {
    return Bun.markdown.ansi(text, {
        columns: Math.min(process.stdout.columns || 80, 120),
    });
}

// --- Ollama streaming chat ---
interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

async function streamChat(
    model: string,
    messages: Message[],
    think: boolean = false,
): Promise<string> {
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true, think }),
    });

    if (!res.ok) {
        throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    let thinkingContent = "";
    let isThinking = false;

    // Save cursor position before streaming raw tokens
    process.stdout.write("\x1b7");

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n").filter(Boolean)) {
            try {
                const json = JSON.parse(line);
                if (json.message?.content) {
                    // Track thinking state via <think> tags
                    const content = json.message.content;
                    if (content.includes("<think>")) {
                        isThinking = true;
                        if (!thinkingContent) {
                            process.stdout.write("\x1b[2m\x1b[3m💭 Thinking...\x1b[0m\n");
                        }
                    }
                    if (isThinking) {
                        thinkingContent += content;
                        if (content.includes("</think>")) {
                            isThinking = false;
                        }
                    } else {
                        process.stdout.write(content);
                        fullResponse += content;
                    }
                }
            } catch {
                // skip malformed JSON lines
            }
        }
    }

    // Restore cursor, clear streamed text, render formatted markdown
    process.stdout.write("\x1b8\x1b[J");

    // Show thinking block if present
    if (thinkingContent) {
        const cleaned = thinkingContent.replace(/<\/?think>/g, "").trim();
        if (cleaned) {
            console.log("\x1b[2m\x1b[3m💭 Thinking:\x1b[0m");
            console.log("\x1b[2m" + cleaned.split("\n").map(l => "  " + l).join("\n") + "\x1b[0m");
            console.log();
        }
    }

    process.stdout.write(renderMarkdown(fullResponse));

    return fullResponse;
}

// --- Show code blocks with copy hint ---
function showCodeBlockIndex(blocks: { lang: string; code: string }[]) {
    if (blocks.length === 0) return;
    const label =
        blocks.length === 1
            ? "1 code block found"
            : `${blocks.length} code blocks found`;
    console.log(
        `\n\x1b[2m📋 ${label} — type \x1b[0m\x1b[36mcopy <n>\x1b[0m\x1b[2m to copy (1-${blocks.length}), or \x1b[0m\x1b[36mcopy all\x1b[0m`,
    );
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i]!;
        const preview = b.code.split("\n")[0]!.slice(0, 60);
        console.log(`\x1b[2m  [${i + 1}] ${b.lang}: ${preview}…\x1b[0m`);
    }
}

// --- Handle copy command ---
async function handleCopyCommand(
    input: string,
    blocks: { lang: string; code: string }[],
): Promise<boolean> {
    const copyMatch = input.match(/^copy\s+(.+)$/i);
    if (!copyMatch) return false;

    const arg = copyMatch[1]!.trim().toLowerCase();

    if (arg === "all") {
        const allCode = blocks.map((b) => b.code).join("\n\n");
        if (await copyToClipboard(allCode)) {
            console.log("\x1b[32m✓ All code blocks copied to clipboard\x1b[0m");
        } else {
            console.log("\x1b[31m✗ Failed to copy\x1b[0m");
        }
        return true;
    }

    const n = parseInt(arg, 10);
    if (isNaN(n) || n < 1 || n > blocks.length) {
        console.log(
            `\x1b[31mInvalid block number. Use 1-${blocks.length}\x1b[0m`,
        );
        return true;
    }

    const block = blocks[n - 1]!;
    if (await copyToClipboard(block.code)) {
        console.log(
            `\x1b[32m✓ Block ${n} (${block.lang}) copied to clipboard\x1b[0m`,
        );
    } else {
        console.log("\x1b[31m✗ Failed to copy\x1b[0m");
    }
    return true;
}

// --- Main ---
async function main() {
    const { model: initialModel, prompt: oneLiner, output: outputFile, readFile, think: initialThink } = parseArgs();
    let model = initialModel;
    let think = initialThink;

    // --- Read .md file mode ---
    if (readFile) {
        const file = Bun.file(readFile);
        if (!(await file.exists())) {
            console.error(`\x1b[31mError: File not found: ${readFile}\x1b[0m`);
            process.exit(1);
        }
        const content = await file.text();
        process.stdout.write(
            Bun.markdown.ansi(content, {
                columns: Math.min(process.stdout.columns || 80, 120),
            }),
        );
        console.log();
        return;
    }

    // Check ollama is running
    try {
        await fetch(`${OLLAMA_BASE}/api/tags`);
    } catch {
        console.error(
            "\x1b[31mError: Cannot connect to Ollama at " + OLLAMA_BASE + "\x1b[0m",
        );
        console.error("Make sure Ollama is running: ollama serve");
        process.exit(1);
    }

    console.log(`\x1b[2mModel: ${model}${think ? " (thinking mode)" : ""}\x1b[0m`);

    // --- One-liner mode ---
    if (oneLiner) {
        const messages: Message[] = [{ role: "user", content: oneLiner }];
        console.log();
        const response = await streamChat(model, messages, think);

        if (outputFile) {
            await Bun.write(outputFile, response);
            console.log(`\x1b[32m✓ Response saved to ${outputFile}\x1b[0m`);
        }

        const blocks = extractCodeBlocks(response);
        if (blocks.length > 0) {
            showCodeBlockIndex(blocks);

            // Prompt for copy commands before exiting
            const rl = require("readline").createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            const ask = (): Promise<string> =>
                new Promise((resolve) =>
                    rl.question("\x1b[2m(copy <n> / copy all / enter to exit):\x1b[0m ", resolve),
                );

            while (true) {
                const input = await ask();
                const trimmed = input.trim();
                if (!trimmed) {
                    rl.close();
                    break;
                }
                if (await handleCopyCommand(trimmed, blocks)) {
                    continue;
                }
                console.log("\x1b[2mType copy <n>, copy all, or press enter to exit\x1b[0m");
            }
        }
        console.log();
        return;
    }

    // --- Interactive chat mode ---
    const messages: Message[] = [];

    process.stdout.write(
        renderMarkdown(
            "---\n**Chat started.** Type `exit` to quit, `copy <n>` to copy code blocks.\n\n---",
        ),
    );

    let lastBlocks: { lang: string; code: string }[] = [];
    let lastResponse = "";

    const rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const ask = (): Promise<string> =>
        new Promise((resolve) =>
            rl.question("\n\x1b[1;36mYou:\x1b[0m ", resolve),
        );

    while (true) {
        const input = await ask();
        const trimmed = input.trim();

        if (!trimmed) continue;

        if (trimmed === "exit" || trimmed === "quit") {
            console.log("\x1b[2mGoodbye!\x1b[0m");
            rl.close();
            break;
        }

        if (await handleCopyCommand(trimmed, lastBlocks)) {
            continue;
        }

        const saveMatch = trimmed.match(/^save\s+(.+)$/i);
        if (saveMatch && lastResponse) {
            const file = saveMatch[1]!.trim();
            await Bun.write(file, lastResponse);
            console.log(`\x1b[32m✓ Response saved to ${file}\x1b[0m`);
            continue;
        }

        if (trimmed.toLowerCase() === "models") {
            try {
                const res = await fetch(`${OLLAMA_BASE}/api/tags`);
                const data = await res.json() as { models: { name: string; size: number }[] };
                console.log("\x1b[2mAvailable models:\x1b[0m");
                for (const m of data.models) {
                    const size = (m.size / 1e9).toFixed(1) + " GB";
                    const marker = m.name === model ? " \x1b[32m← current\x1b[0m" : "";
                    console.log(`  \x1b[36m${m.name}\x1b[0m \x1b[2m(${size})\x1b[0m${marker}`);
                }
            } catch {
                console.log("\x1b[31mFailed to list models\x1b[0m");
            }
            continue;
        }

        const modelMatch = trimmed.match(/^model\s+(.+)$/i);
        if (modelMatch) {
            model = modelMatch[1]!.trim();
            console.log(`\x1b[32m✓ Switched to model: ${model}\x1b[0m`);
            continue;
        }

        if (/^think\s+on$/i.test(trimmed)) {
            think = true;
            console.log("\x1b[32m✓ Thinking mode enabled\x1b[0m");
            continue;
        }
        if (/^think\s+off$/i.test(trimmed)) {
            think = false;
            console.log("\x1b[32m✓ Thinking mode disabled\x1b[0m");
            continue;
        }
        if (/^think$/i.test(trimmed)) {
            think = !think;
            console.log(`\x1b[32m✓ Thinking mode ${think ? "enabled" : "disabled"}\x1b[0m`);
            continue;
        }

        messages.push({ role: "user", content: trimmed });
        console.log();

        try {
            const response = await streamChat(model, messages, think);
            messages.push({ role: "assistant", content: response });
            lastResponse = response;

            if (outputFile) {
                await Bun.write(outputFile, response);
                console.log(`\x1b[32m✓ Response saved to ${outputFile}\x1b[0m`);
            }

            lastBlocks = extractCodeBlocks(response);
            showCodeBlockIndex(lastBlocks);
        } catch (err: any) {
            console.error(`\x1b[31mError: ${err.message}\x1b[0m`);
        }
    }
}

main();

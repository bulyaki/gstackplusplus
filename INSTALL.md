# Installing gstack++

Pick your operating system and follow every step in order. Each section is fully self-contained — no need to cross-reference other sections.

- [macOS](#macos)
- [Linux — Debian / Ubuntu](#linux--debian--ubuntu)
- [Linux — Fedora / RHEL](#linux--fedora--rhel)
- [Linux — Arch](#linux--arch)
- [Windows (WSL 2)](#windows--wsl-2)

---

## macOS

### 1. Xcode Command Line Tools

```bash
xcode-select --install
```

Accept the prompt in the dialog that appears. This installs `clang++`, `make`, and `git`. If you already have Xcode installed, this step is already done.

### 2. Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the instructions at the end of the installer — on Apple Silicon it will ask you to add Homebrew to your PATH.

### 3. C++ toolchain

```bash
brew install cmake ninja llvm
```

`llvm` gives you a recent `clang-tidy` and `clang-format`. The Apple-provided `clang++` from step 1 is used for compilation; the Homebrew `llvm` is used for static analysis.

### 4. Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

Restart your terminal, then verify:

```bash
bun --version   # should print 1.x.x or higher
```

### 5. Clone and build gstack++

```bash
git clone https://github.com/bulyaki/gstackplusplus.git ~/.claude/skills/gstackplusplus
cd ~/.claude/skills/gstackplusplus && ./setup
```

`./setup` compiles the `browse` binary, downloads Playwright's Chromium (~300 MB on first run), and builds the shared infrastructure used by all six supported platforms. The `~/.claude/skills/` path is not Claude-exclusive — it is the shared location where Claude Code, Cursor's Claude agent, and compatible tools look for skills. Codex, Qwen, Antigravity, and Copilot are registered per-project in the next step. First run takes 2–3 minutes; subsequent runs are instant.

### 6. Verify

```bash
~/.claude/skills/gstackplusplus/browse/dist/browse --version
```

You should see a version string.

### 7. Configure for your AI platform

Open your project in your AI tool and run the one-time meta-skill for your platform. It writes `model_mode` to `~/.gstackplusplus/config.yaml` and creates the project-level instruction file that all subsequent skills read.

**[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** — requires Claude Code CLI installed and authenticated.
```
/claude
```
Writes `CLAUDE.md`. Enables extended thinking, full AskUserQuestion flows, and all 13 workflow skills. Supports up to 10 parallel sessions via [Conductor](https://conductor.build).

**[OpenAI Codex](https://openai.com/codex)** (codex-1) — requires Codex CLI or API access.
```
/codex
```
Writes `CLAUDE.md`. Disables interactive prompts, enables decision logging to `.gstackplusplus/codex-decisions-{date}.md`, and sets hard caps so the agent never runs unsupervised. All decisions are auditable after the fact.

**[Qwen](https://qwen.readthedocs.io/)** (Qwen2.5-Coder, QwQ, Qwen3) — requires Qwen API access or a local Ollama / vLLM instance.
```
/qwen
```
Writes `CLAUDE.md`. Adapts prompts and output structure for Qwen's context window and tokenizer behaviour. Works with both cloud and self-hosted deployments.

**[Antigravity](https://antigravity.dev)** — requires an Antigravity workspace.
```
/antigravity
```
Writes `CLAUDE.md`. Enforces diff-first output (no bystander reformatting), emits `[PHASE:start]`/`[PHASE:done]` streaming markers for the live review UI, formats findings as `[ISSUE:N] SEVERITY — description`, and re-detects the toolchain on every run since Antigravity workspaces are ephemeral.

**[Cursor](https://cursor.sh)** — requires Cursor editor installed.
```
/cursor
```
Writes `.cursorrules` (auto-injected by Cursor into every session) and `CLAUDE.md`. Scopes each edit to one logical checkpoint, formats findings as `@file:line` clickable links, and uses Composer (Cmd+I) for multi-file changes vs inline chat (Cmd+K) for single-file edits.

**[GitHub Copilot in VS Code](https://github.com/features/copilot)** — requires VS Code with the GitHub Copilot extension enabled.
```
/copilot
```
Writes `.github/copilot-instructions.md` (auto-injected by Copilot into every `@workspace` query). Formats findings for `@workspace` search, marks multi-file changes as `[COPILOT EDIT]` blocks, and generates a GitHub Actions CI template for the project.

After running the meta-skill, every gstack++ skill (`/review`, `/ship`, `/qa`, etc.) reads the config and adapts its output format and decision style automatically.

### 8. Add to your repo so teammates get it (optional)

```bash
cp -Rf ~/.claude/skills/gstackplusplus .claude/skills/gstackplusplus
rm -rf .claude/skills/gstackplusplus/.git
cd .claude/skills/gstackplusplus && ./setup
git add .claude/skills/gstackplusplus/
git commit -m "Add gstack++ skills"
```

No submodules, no hooks — `git clone` just works.

### Note on Valgrind

Valgrind does not support Apple Silicon. Use AddressSanitizer and UBSan instead — they are faster and built into both clang and gcc. On Intel Macs: `brew install valgrind`.

---

## Linux — Debian / Ubuntu

Tested on Ubuntu 22.04 LTS, 24.04 LTS, and Debian 12.

### 1. C++ toolchain

```bash
sudo apt update
sudo apt install -y git build-essential cmake ninja-build clang clang-tidy clang-format cppcheck valgrind
```

`build-essential` brings in `g++` and `make`. Both `g++` and `clang++` are installed so you can switch compilers via `CMAKE_CXX_COMPILER`. ASan, UBSan, and TSan ship with GCC ≥ 11 and Clang ≥ 14 — both available in the default Ubuntu 22.04 repos, no extra packages needed.

### 2. Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc   # or ~/.zshrc if you use zsh
bun --version      # should print 1.x.x or higher
```

### 3. Clone and build gstack++

```bash
git clone https://github.com/bulyaki/gstackplusplus.git ~/.claude/skills/gstackplusplus
cd ~/.claude/skills/gstackplusplus && ./setup
```

`./setup` compiles the `browse` binary, downloads Playwright's Chromium (~300 MB on first run), and builds the shared infrastructure used by all six supported platforms. The `~/.claude/skills/` path is not Claude-exclusive — it is the shared location where Claude Code, Cursor's Claude agent, and compatible tools look for skills. Codex, Qwen, Antigravity, and Copilot are registered per-project in the next step. First run takes 2–3 minutes; subsequent runs are instant.

If Playwright fails to launch Chromium, install the missing system libraries:

```bash
sudo apt install -y libgbm1 libasound2 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libxshmfence1 libnss3 libnspr4 libpango-1.0-0
```

Then re-run `./setup`.

### 4. Verify

```bash
~/.claude/skills/gstackplusplus/browse/dist/browse --version
```

You should see a version string.

### 5. Configure for your AI platform

Open your project in your AI tool and run the one-time meta-skill for your platform. It writes `model_mode` to `~/.gstackplusplus/config.yaml` and creates the project-level instruction file that all subsequent skills read.

**[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** — requires Claude Code CLI installed and authenticated.
```
/claude
```
Writes `CLAUDE.md`. Enables extended thinking, full AskUserQuestion flows, and all 13 workflow skills. Supports up to 10 parallel sessions via [Conductor](https://conductor.build).

**[OpenAI Codex](https://openai.com/codex)** (codex-1) — requires Codex CLI or API access.
```
/codex
```
Writes `CLAUDE.md`. Disables interactive prompts, enables decision logging to `.gstackplusplus/codex-decisions-{date}.md`, and sets hard caps so the agent never runs unsupervised. All decisions are auditable after the fact.

**[Qwen](https://qwen.readthedocs.io/)** (Qwen2.5-Coder, QwQ, Qwen3) — requires Qwen API access or a local Ollama / vLLM instance.
```
/qwen
```
Writes `CLAUDE.md`. Adapts prompts and output structure for Qwen's context window and tokenizer behaviour. Works with both cloud and self-hosted deployments.

**[Antigravity](https://antigravity.dev)** — requires an Antigravity workspace.
```
/antigravity
```
Writes `CLAUDE.md`. Enforces diff-first output (no bystander reformatting), emits `[PHASE:start]`/`[PHASE:done]` streaming markers for the live review UI, formats findings as `[ISSUE:N] SEVERITY — description`, and re-detects the toolchain on every run since Antigravity workspaces are ephemeral.

**[Cursor](https://cursor.sh)** — requires Cursor editor installed.
```
/cursor
```
Writes `.cursorrules` (auto-injected by Cursor into every session) and `CLAUDE.md`. Scopes each edit to one logical checkpoint, formats findings as `@file:line` clickable links, and uses Composer (Cmd+I) for multi-file changes vs inline chat (Cmd+K) for single-file edits.

**[GitHub Copilot in VS Code](https://github.com/features/copilot)** — requires VS Code with the GitHub Copilot extension enabled.
```
/copilot
```
Writes `.github/copilot-instructions.md` (auto-injected by Copilot into every `@workspace` query). Formats findings for `@workspace` search, marks multi-file changes as `[COPILOT EDIT]` blocks, and generates a GitHub Actions CI template for the project.

After running the meta-skill, every gstack++ skill (`/review`, `/ship`, `/qa`, etc.) reads the config and adapts its output format and decision style automatically.

### 6. Add to your repo so teammates get it (optional)

```bash
cp -Rf ~/.claude/skills/gstackplusplus .claude/skills/gstackplusplus
rm -rf .claude/skills/gstackplusplus/.git
cd .claude/skills/gstackplusplus && ./setup
git add .claude/skills/gstackplusplus/
git commit -m "Add gstack++ skills"
```

No submodules, no hooks — `git clone` just works.

---

## Linux — Fedora / RHEL

Tested on Fedora 40 and RHEL 9 / AlmaLinux 9.

### 1. C++ toolchain

```bash
# Fedora
sudo dnf install -y git gcc-c++ clang clang-tools-extra cmake ninja-build cppcheck valgrind

# RHEL 9 / AlmaLinux 9 — enable EPEL first
sudo dnf install -y epel-release
sudo dnf install -y git gcc-c++ clang clang-tools-extra cmake ninja-build cppcheck valgrind
```

`clang-tools-extra` provides `clang-tidy` and `clang-format`.

### 2. Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc   # or ~/.zshrc if you use zsh
bun --version      # should print 1.x.x or higher
```

### 3. Clone and build gstack++

```bash
git clone https://github.com/bulyaki/gstackplusplus.git ~/.claude/skills/gstackplusplus
cd ~/.claude/skills/gstackplusplus && ./setup
```

`./setup` compiles the `browse` binary, downloads Playwright's Chromium (~300 MB on first run), and builds the shared infrastructure used by all six supported platforms. The `~/.claude/skills/` path is not Claude-exclusive — it is the shared location where Claude Code, Cursor's Claude agent, and compatible tools look for skills. Codex, Qwen, Antigravity, and Copilot are registered per-project in the next step. First run takes 2–3 minutes; subsequent runs are instant.

### 4. Verify

```bash
~/.claude/skills/gstackplusplus/browse/dist/browse --version
```

You should see a version string.

### 5. Configure for your AI platform

Open your project in your AI tool and run the one-time meta-skill for your platform. It writes `model_mode` to `~/.gstackplusplus/config.yaml` and creates the project-level instruction file that all subsequent skills read.

**[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** — requires Claude Code CLI installed and authenticated.
```
/claude
```
Writes `CLAUDE.md`. Enables extended thinking, full AskUserQuestion flows, and all 13 workflow skills. Supports up to 10 parallel sessions via [Conductor](https://conductor.build).

**[OpenAI Codex](https://openai.com/codex)** (codex-1) — requires Codex CLI or API access.
```
/codex
```
Writes `CLAUDE.md`. Disables interactive prompts, enables decision logging to `.gstackplusplus/codex-decisions-{date}.md`, and sets hard caps so the agent never runs unsupervised. All decisions are auditable after the fact.

**[Qwen](https://qwen.readthedocs.io/)** (Qwen2.5-Coder, QwQ, Qwen3) — requires Qwen API access or a local Ollama / vLLM instance.
```
/qwen
```
Writes `CLAUDE.md`. Adapts prompts and output structure for Qwen's context window and tokenizer behaviour. Works with both cloud and self-hosted deployments.

**[Antigravity](https://antigravity.dev)** — requires an Antigravity workspace.
```
/antigravity
```
Writes `CLAUDE.md`. Enforces diff-first output (no bystander reformatting), emits `[PHASE:start]`/`[PHASE:done]` streaming markers for the live review UI, formats findings as `[ISSUE:N] SEVERITY — description`, and re-detects the toolchain on every run since Antigravity workspaces are ephemeral.

**[Cursor](https://cursor.sh)** — requires Cursor editor installed.
```
/cursor
```
Writes `.cursorrules` (auto-injected by Cursor into every session) and `CLAUDE.md`. Scopes each edit to one logical checkpoint, formats findings as `@file:line` clickable links, and uses Composer (Cmd+I) for multi-file changes vs inline chat (Cmd+K) for single-file edits.

**[GitHub Copilot in VS Code](https://github.com/features/copilot)** — requires VS Code with the GitHub Copilot extension enabled.
```
/copilot
```
Writes `.github/copilot-instructions.md` (auto-injected by Copilot into every `@workspace` query). Formats findings for `@workspace` search, marks multi-file changes as `[COPILOT EDIT]` blocks, and generates a GitHub Actions CI template for the project.

After running the meta-skill, every gstack++ skill (`/review`, `/ship`, `/qa`, etc.) reads the config and adapts its output format and decision style automatically.

### 6. Add to your repo so teammates get it (optional)

```bash
cp -Rf ~/.claude/skills/gstackplusplus .claude/skills/gstackplusplus
rm -rf .claude/skills/gstackplusplus/.git
cd .claude/skills/gstackplusplus && ./setup
git add .claude/skills/gstackplusplus/
git commit -m "Add gstack++ skills"
```

No submodules, no hooks — `git clone` just works.

---

## Linux — Arch

### 1. C++ toolchain

```bash
sudo pacman -Syu git base-devel clang cmake ninja clang-tools-extra cppcheck valgrind
```

`base-devel` brings in `g++` and `make`. `clang-tools-extra` provides `clang-tidy` and `clang-format`.

### 2. Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc   # or ~/.zshrc if you use zsh
bun --version      # should print 1.x.x or higher
```

### 3. Clone and build gstack++

```bash
git clone https://github.com/bulyaki/gstackplusplus.git ~/.claude/skills/gstackplusplus
cd ~/.claude/skills/gstackplusplus && ./setup
```

`./setup` compiles the `browse` binary, downloads Playwright's Chromium (~300 MB on first run), and builds the shared infrastructure used by all six supported platforms. The `~/.claude/skills/` path is not Claude-exclusive — it is the shared location where Claude Code, Cursor's Claude agent, and compatible tools look for skills. Codex, Qwen, Antigravity, and Copilot are registered per-project in the next step. First run takes 2–3 minutes; subsequent runs are instant.

### 4. Verify

```bash
~/.claude/skills/gstackplusplus/browse/dist/browse --version
```

You should see a version string.

### 5. Configure for your AI platform

Open your project in your AI tool and run the one-time meta-skill for your platform. It writes `model_mode` to `~/.gstackplusplus/config.yaml` and creates the project-level instruction file that all subsequent skills read.

**[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** — requires Claude Code CLI installed and authenticated.
```
/claude
```
Writes `CLAUDE.md`. Enables extended thinking, full AskUserQuestion flows, and all 13 workflow skills. Supports up to 10 parallel sessions via [Conductor](https://conductor.build).

**[OpenAI Codex](https://openai.com/codex)** (codex-1) — requires Codex CLI or API access.
```
/codex
```
Writes `CLAUDE.md`. Disables interactive prompts, enables decision logging to `.gstackplusplus/codex-decisions-{date}.md`, and sets hard caps so the agent never runs unsupervised. All decisions are auditable after the fact.

**[Qwen](https://qwen.readthedocs.io/)** (Qwen2.5-Coder, QwQ, Qwen3) — requires Qwen API access or a local Ollama / vLLM instance.
```
/qwen
```
Writes `CLAUDE.md`. Adapts prompts and output structure for Qwen's context window and tokenizer behaviour. Works with both cloud and self-hosted deployments.

**[Antigravity](https://antigravity.dev)** — requires an Antigravity workspace.
```
/antigravity
```
Writes `CLAUDE.md`. Enforces diff-first output (no bystander reformatting), emits `[PHASE:start]`/`[PHASE:done]` streaming markers for the live review UI, formats findings as `[ISSUE:N] SEVERITY — description`, and re-detects the toolchain on every run since Antigravity workspaces are ephemeral.

**[Cursor](https://cursor.sh)** — requires Cursor editor installed.
```
/cursor
```
Writes `.cursorrules` (auto-injected by Cursor into every session) and `CLAUDE.md`. Scopes each edit to one logical checkpoint, formats findings as `@file:line` clickable links, and uses Composer (Cmd+I) for multi-file changes vs inline chat (Cmd+K) for single-file edits.

**[GitHub Copilot in VS Code](https://github.com/features/copilot)** — requires VS Code with the GitHub Copilot extension enabled.
```
/copilot
```
Writes `.github/copilot-instructions.md` (auto-injected by Copilot into every `@workspace` query). Formats findings for `@workspace` search, marks multi-file changes as `[COPILOT EDIT]` blocks, and generates a GitHub Actions CI template for the project.

After running the meta-skill, every gstack++ skill (`/review`, `/ship`, `/qa`, etc.) reads the config and adapts its output format and decision style automatically.

### 6. Add to your repo so teammates get it (optional)

```bash
cp -Rf ~/.claude/skills/gstackplusplus .claude/skills/gstackplusplus
rm -rf .claude/skills/gstackplusplus/.git
cd .claude/skills/gstackplusplus && ./setup
git add .claude/skills/gstackplusplus/
git commit -m "Add gstack++ skills"
```

No submodules, no hooks — `git clone` just works.

---

## Windows — WSL 2

gstack++ does not run natively on Windows. The recommended path is WSL 2 with Ubuntu 24.04. Once WSL is set up, the experience is identical to Linux.

### 1. Enable WSL 2

Open PowerShell as Administrator and run:

```powershell
wsl --install
```

This installs WSL 2 with Ubuntu as the default distribution. Reboot when prompted.

### 2. Open Ubuntu

After rebooting, open the **Ubuntu** app from the Start menu (or launch it from Windows Terminal). Complete the first-time user setup (username and password).

### 3. C++ toolchain

```bash
sudo apt update
sudo apt install -y git build-essential cmake ninja-build clang clang-tidy clang-format cppcheck valgrind
```

ASan, UBSan, and TSan are included with GCC and Clang — no extra packages needed.

### 4. Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version   # should print 1.x.x or higher
```

### 5. Install Playwright system dependencies

Chromium needs a few libraries that are not always present in a minimal WSL image:

```bash
sudo apt install -y libgbm1 libasound2 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libxshmfence1 libnss3 libnspr4 libpango-1.0-0
```

### 6. Clone and build gstack++

```bash
git clone https://github.com/bulyaki/gstackplusplus.git ~/.claude/skills/gstackplusplus
cd ~/.claude/skills/gstackplusplus && ./setup
```

`./setup` compiles the `browse` binary, downloads Playwright's Chromium (~300 MB on first run), and builds the shared infrastructure used by all six supported platforms. The `~/.claude/skills/` path is not Claude-exclusive — it is the shared location where Claude Code, Cursor's Claude agent, and compatible tools look for skills. Codex, Qwen, Antigravity, and Copilot are registered per-project in the next step. First run takes 2–3 minutes; subsequent runs are instant.

> **Keep your projects inside the WSL filesystem** (`~/projects/`, not `/mnt/c/...`). The WSL–Windows bridge is significantly slower and can cause Bun and Playwright to time out.

### 7. Verify

```bash
~/.claude/skills/gstackplusplus/browse/dist/browse --version
```

You should see a version string.

### 8. Configure for your AI platform

Open your project in your AI tool and run the one-time meta-skill for your platform. It writes `model_mode` to `~/.gstackplusplus/config.yaml` and creates the project-level instruction file that all subsequent skills read.

**[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** — requires Claude Code CLI installed and authenticated.
```
/claude
```
Writes `CLAUDE.md`. Enables extended thinking, full AskUserQuestion flows, and all 13 workflow skills. Supports up to 10 parallel sessions via [Conductor](https://conductor.build).

**[OpenAI Codex](https://openai.com/codex)** (codex-1) — requires Codex CLI or API access.
```
/codex
```
Writes `CLAUDE.md`. Disables interactive prompts, enables decision logging to `.gstackplusplus/codex-decisions-{date}.md`, and sets hard caps so the agent never runs unsupervised. All decisions are auditable after the fact.

**[Qwen](https://qwen.readthedocs.io/)** (Qwen2.5-Coder, QwQ, Qwen3) — requires Qwen API access or a local Ollama / vLLM instance.
```
/qwen
```
Writes `CLAUDE.md`. Adapts prompts and output structure for Qwen's context window and tokenizer behaviour. Works with both cloud and self-hosted deployments.

**[Antigravity](https://antigravity.dev)** — requires an Antigravity workspace.
```
/antigravity
```
Writes `CLAUDE.md`. Enforces diff-first output (no bystander reformatting), emits `[PHASE:start]`/`[PHASE:done]` streaming markers for the live review UI, formats findings as `[ISSUE:N] SEVERITY — description`, and re-detects the toolchain on every run since Antigravity workspaces are ephemeral.

**[Cursor](https://cursor.sh)** — requires Cursor editor installed.
```
/cursor
```
Writes `.cursorrules` (auto-injected by Cursor into every session) and `CLAUDE.md`. Scopes each edit to one logical checkpoint, formats findings as `@file:line` clickable links, and uses Composer (Cmd+I) for multi-file changes vs inline chat (Cmd+K) for single-file edits.

**[GitHub Copilot in VS Code](https://github.com/features/copilot)** — requires VS Code with the GitHub Copilot extension enabled.
```
/copilot
```
Writes `.github/copilot-instructions.md` (auto-injected by Copilot into every `@workspace` query). Formats findings for `@workspace` search, marks multi-file changes as `[COPILOT EDIT]` blocks, and generates a GitHub Actions CI template for the project.

After running the meta-skill, every gstack++ skill (`/review`, `/ship`, `/qa`, etc.) reads the config and adapts its output format and decision style automatically.

### 9. Add to your repo so teammates get it (optional)

```bash
cp -Rf ~/.claude/skills/gstackplusplus .claude/skills/gstackplusplus
rm -rf .claude/skills/gstackplusplus/.git
cd .claude/skills/gstackplusplus && ./setup
git add .claude/skills/gstackplusplus/
git commit -m "Add gstack++ skills"
```

No submodules, no hooks — `git clone` just works.

### Editor notes for Windows users

- **VS Code or Cursor**: Install the [WSL extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) and open your project with `code .` from inside the Ubuntu terminal. The editor runs on Windows but all tools run inside WSL.
- **Windows Terminal**: Install from the [Microsoft Store](https://aka.ms/terminal) for a better terminal experience with WSL profile integration.

---

## Troubleshooting

**`bun: command not found` after install**

The installer adds a line to `~/.bashrc` (or `~/.zshrc`). Either restart your shell or run `source ~/.bashrc`. If you use fish or nushell, add `$HOME/.bun/bin` to your `PATH` manually.

**`./setup` fails with "browse binary missing"**

Run the build step manually to see the full error:

```bash
cd ~/.claude/skills/gstackplusplus
bun install
bun run build
```

Common causes: missing `cmake`, Bun below 1.0, or insufficient disk space (Chromium needs ~300 MB).

**`clang-tidy` not found during `/qa` or `/review` on macOS**

Homebrew installs `clang-tidy` with a version suffix (e.g., `clang-tidy-18`). Create a symlink:

```bash
ln -s "$(brew --prefix llvm)/bin/clang-tidy" /usr/local/bin/clang-tidy
```

Or set `CMAKE_CXX_CLANG_TIDY` in your `CMakePresets.json` to point at the versioned binary directly.

**Stale install after pulling updates**

```bash
cd ~/.claude/skills/gstackplusplus
git pull
./setup
```

Or run `/gstackplusplus-upgrade` from inside your AI tool.

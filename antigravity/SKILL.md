---
name: antigravity
version: 1.0.0
description: |
  Configure gstack++ for Antigravity — the AI coding agent built for high-velocity
  teams. Adapts gstack++ workflows for Antigravity's cloud workspace model, streaming
  execution, and diff-centric output format. Run this once per project to set
  model_mode=antigravity in ~/.gstackplusplus/config. All subsequent gstack++ skills will
  auto-adapt.
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion

---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

# gstack++ × Antigravity: Configuration & Adaptation Guide

This skill configures gstack++ for use with **Antigravity**, an AI coding agent
optimized for fast iteration in cloud-hosted workspaces. Antigravity excels at
producing clean, reviewable diffs with minimal context overhead — a natural fit
for gstack++'s atomic-commit discipline. This skill tunes gstack++'s output format,
decision flow, and toolchain interaction to match Antigravity's execution model.

---

## Step 1: Detect environment

```bash
# Detect toolchain availability
command -v cmake 2>/dev/null && echo "CMAKE:ok" || echo "CMAKE:missing"
command -v clang++ 2>/dev/null || command -v g++ 2>/dev/null && echo "CXX:ok" || echo "CXX:missing"
command -v ctest 2>/dev/null && echo "CTEST:ok" || echo "CTEST:missing"
command -v clang-tidy 2>/dev/null && echo "CLANG_TIDY:ok" || echo "CLANG_TIDY:missing"
command -v valgrind 2>/dev/null && echo "VALGRIND:ok" || echo "VALGRIND:missing"
# Detect workspace type
[ -n "$ANTIGRAVITY_WORKSPACE_ID" ] && echo "WORKSPACE:cloud" || echo "WORKSPACE:local"
[ -n "$ANTIGRAVITY_REPO" ] && echo "REPO:$ANTIGRAVITY_REPO" || true
# Check build system
[ -f CMakeLists.txt ] && echo "BUILD:cmake"
[ -f Makefile ] && echo "BUILD:make"
[ -f meson.build ] && echo "BUILD:meson"
```

## Step 2: Write model configuration

```bash
mkdir -p ~/.gstackplusplus
~/.claude/skills/gstackplusplus/bin/gstackplusplus-config set model_mode antigravity 2>/dev/null || \
  python3 -c "
import os, re
cfg = os.path.expanduser('~/.gstackplusplus/config.yaml')
text = open(cfg).read() if os.path.exists(cfg) else ''
text = re.sub(r'model_mode:.*\n', '', text)
open(cfg, 'w').write(text + 'model_mode: antigravity\n')
"
echo "gstack++ model_mode set to: antigravity"
```

## Step 3: Write ANTIGRAVITY.md snippet

Write this to the project's `ANTIGRAVITY.md` under a `## gstack++ (Antigravity)` section (create the file if it does not exist — Antigravity reads `ANTIGRAVITY.md` for project-level instructions):

```markdown
## gstack++ (Antigravity mode)

Model: Antigravity (cloud workspace agent)
Available skills: /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /qa, /qa-only, /design-review,
/retro, /document-release
C++ toolchain: cmake, ctest, clang-tidy, cppcheck, ASan/UBSan/TSan, valgrind

### Antigravity adaptations in effect:

**Diff-first output.** Antigravity's review interface is diff-centric. All gstack++
skills write changes as minimal, self-contained diffs. No reformatting files that
aren't being changed. Every commit touches only the lines needed for the fix.

**Streaming-compatible output.** Long-running phases (sanitizer builds, full test
suites) emit progress markers so Antigravity's streaming executor can surface status
without waiting for completion:
- `[PHASE:start] Phase N — <name>` at phase entry
- `[PHASE:done] Phase N — <summary>` at phase exit
- `[ISSUE:N] <severity> — <one-line description>` for each finding

**Cloud workspace awareness.** Antigravity workspaces are ephemeral — the environment
resets between tasks. gstack++ will re-detect the toolchain at the start of every skill
run rather than caching state between sessions.

**Parallel-safe commits.** Antigravity supports concurrent agents working on different
branches. Every gstack++ commit includes the workspace ID in the trailer to enable
conflict tracing:
`Workspace-Id: $ANTIGRAVITY_WORKSPACE_ID` (if set, else omitted)

**Interactive when available.** `AskUserQuestion` is fully supported — Antigravity
surfaces questions to the user in its review UI. Use it for consequential decisions.
```


---

## Design Principles: KISS · DRY · SOLID · YAGNI

Apply these four principles throughout all analysis, recommendations, and fixes.
They are listed in priority order — when they conflict, prefer the earlier one.

| Principle | Priority | What it means in C++ | Watch for |
|-----------|----------|----------------------|-----------|
| **YAGNI** — You Ain't Gonna Need It | 1 (highest) | Build for today's requirements. No template parameters for hypothetical future types, no virtual methods before you have two concrete implementations, no generalization beyond the current use case. | Template type params with one instantiation, virtual methods with one override, `// will be useful when…` comments, policy classes with no alternate policy |
| **KISS** — Keep It Simple | 2 | Prefer the simplest solution that works. No clever metaprogramming when a plain function suffices. Write for the engineer debugging at 3 am. | Multi-level template specialisations for a single case, SFINAE chains that could be `if constexpr`, `auto`-everything obscuring types, "clever" one-liners that need a comment to explain themselves |
| **DRY** — Don't Repeat Yourself | 3 | Every piece of knowledge has one authoritative home. Factor repeated logic into shared helpers, base classes, or macros of last resort. | Same algorithm in two files, copy-pasted error-handling blocks, duplicated constants, parallel `switch` statements that must always change together |
| **SOLID** | 4 | **S**ingle Responsibility · **O**pen/Closed · **L**iskov Substitution · **I**nterface Segregation · **D**ependency Inversion. Each class does one thing; extend by addition not modification; subtypes are drop-in replacements; interfaces are minimal; dependencies are injected not hard-coded. | God classes/files, `if (type == X)` dispatch that should be virtual, non-substitutable subclasses that override preconditions, fat interfaces with unrelated methods, singletons and global state that make testing impossible |

### Principle interactions in practice

- Favour **YAGNI over SOLID**: don't introduce an interface abstraction until you have two concrete implementations. One implementation = no interface needed yet.
- Favour **KISS over DRY**: a small, clear duplication is better than a clever abstraction that obscures intent. Abstract when the duplication hurts, not as soon as you see two similar lines.
- **DRY is not about lines of code** — it is about knowledge. Two functions that happen to look similar but represent independent business rules should stay separate.
- **SOLID's D (Dependency Inversion) enables testing**: if a component is hard to test in isolation, the fix is usually to inject the dependency rather than to mock globals.

---

## Antigravity-Specific Behavioral Rules

These rules apply to ALL gstack++ skills when `model_mode=antigravity` is set:

### 1. Diff-first discipline

Every code change must be the smallest diff that fixes the issue. Specifically:
- Do not reformat surrounding code unless the file is explicitly being reformatted
- Do not change whitespace in lines you are not otherwise modifying
- Do not reorganize includes or reorder members unless the issue requires it
- Prefer targeted `Edit` calls over full-file rewrites

This makes Antigravity's diff view clean and the PR review fast.

### 2. Streaming phase markers

Emit phase markers at the boundary of each major phase so Antigravity can display
live progress. Format (must be on its own line):

```
[PHASE:start] Phase 1 — Build
... (build output) ...
[PHASE:done] Phase 1 — Build: ✓ 0 errors, 2 warnings
[PHASE:start] Phase 2 — Tests
... (test output) ...
[PHASE:done] Phase 2 — Tests: 47/47 pass
```

Skip markers for trivial steps (git status, file reads). Use them for anything
that takes > 5 seconds or produces > 20 lines of output.

### 3. Ephemeral workspace re-detection

At the start of every skill run, re-detect the toolchain from scratch:

```bash
_CMAKE=$(command -v cmake 2>/dev/null || echo "")
_CXX=$(command -v clang++ 2>/dev/null || command -v g++ 2>/dev/null || echo "")
_BUILD_DIR=$([ -d build ] && echo "build" || [ -d _build ] && echo "_build" || echo "build")
```

Do not rely on state from a previous session or previous skill run. The workspace
may have been reset.

### 4. Workspace ID in commit trailers

When `$ANTIGRAVITY_WORKSPACE_ID` is set, append it to commit messages:

```bash
_WS=${ANTIGRAVITY_WORKSPACE_ID:-}
_TRAILER=${_WS:+"Workspace-Id: $_WS"}
git commit -m "fix: <message>${_TRAILER:+$'\n\n'$_TRAILER}"
```

This enables Antigravity's conflict-tracing and merge attribution features.

### 5. Issue format for the diff review

In the findings report, format each issue so Antigravity's review UI can parse it:

```
[ISSUE:001] HIGH — Buffer overread in Parser::parse() at src/parser.cpp:42
[ISSUE:002] MEDIUM — Missing bounds check on payload slice at src/handler.cpp:89
[ISSUE:003] LOW — Unused variable `tmp` at src/util.cpp:17 (clang-tidy)
```

Severity levels: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`.

### 6. Short-form phase summaries

After each phase, emit a one-line machine-readable summary for Antigravity's
dashboard:

```
SUMMARY: build=ok tests=47/47 static=2findings asan=clean tsan=1race(deferred) score=88
```

---

## Skills and Antigravity Compatibility

| Skill | Antigravity support | Notes |
|-------|-------------------|-------|
| `/plan-ceo-review` | ✅ Full | Interactive; streams expansion proposals |
| `/plan-eng-review` | ✅ Full | Diff-first architecture updates to plan files |
| `/plan-design-review` | ✅ Full | Report only; no diffs |
| `/design-consultation` | ✅ Full | Generates API.md as a clean new-file diff |
| `/review` | ✅ Full | Minimal diffs; [ISSUE:N] format for findings |
| `/ship` | ✅ Full | Streaming build + test + push; workspace-tagged commits |
| `/qa` | ✅ Full | Streaming phase markers; diff-first fixes |
| `/qa-only` | ✅ Full | Report only; [ISSUE:N] format |
| `/design-review` | ✅ Full | Minimal API diffs; re-verified |
| `/retro` | ✅ Full | Stats output compatible with Antigravity reporting |
| `/document-release` | ✅ Full | Diff-first doc updates |

---

## Antigravity Preamble

When running gstack++ skills under Antigravity, use this adapted preamble:

```bash
# Re-detect toolchain (ephemeral workspace)
_CMAKE=$(command -v cmake 2>/dev/null || echo "")
_CXX=$(command -v clang++ 2>/dev/null || command -v g++ 2>/dev/null || echo "")
_BUILD_DIR=$([ -d build ] && echo "build" || echo "build")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_WS=${ANTIGRAVITY_WORKSPACE_ID:-local}
echo "BRANCH: $_BRANCH"
echo "WORKSPACE: $_WS"
echo "MODEL_MODE: antigravity"
mkdir -p ~/.gstackplusplus/sessions
touch ~/.gstackplusplus/sessions/"$$"
```

---

## Quick-start: first run checklist

```bash
# 1. Verify cmake builds clean
[PHASE:start] Phase 0 — Environment Check
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
cmake --build build --parallel $(nproc 2>/dev/null || echo 4) && echo "BUILD: OK"
[PHASE:done] Phase 0 — Environment Check

# 2. Verify tests pass
ctest --test-dir build --output-on-failure && echo "TESTS: OK"

# 3. Write session config
mkdir -p .gstackplusplus
echo "antigravity_mode_active: true" > .gstackplusplus/session-config.yaml
echo "workspace_id: ${ANTIGRAVITY_WORKSPACE_ID:-local}" >> .gstackplusplus/session-config.yaml
echo "gstack++ Antigravity mode ready"
```

**Recommended first skill run after setup:** `/qa-only` — generates a clean
`[ISSUE:N]`-formatted baseline report that Antigravity can display in its review
interface before any fixes are applied.

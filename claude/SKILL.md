---
name: claude
version: 1.0.0
description: |
  Configure gstack++ for Claude (Claude Code, Claude Sonnet/Opus/Haiku). This is the
  reference configuration — all gstack++ skills are designed and tuned for Claude first.
  Enables extended thinking, interactive AskUserQuestion flows, full tool suite,
  and Conductor multi-session support. Run this to explicitly reset model_mode=claude
  after switching from codex or qwen mode.
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion

---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

# gstack++ × Claude: Configuration & Reference Guide

This skill configures gstack++ for use with **Claude** (Claude Code, claude-sonnet-4-5,
claude-opus-4, or any Claude model via the Anthropic API). Claude is the reference
implementation — every gstack++ skill is designed, tested, and tuned for Claude first.
All features are fully available with no adaptations required.

Run this skill to explicitly set `model_mode=claude` — useful when switching back from
Codex or Qwen mode, or when onboarding a fresh checkout.

---

## Step 1: Detect environment

```bash
# Detect toolchain availability
command -v cmake 2>/dev/null && echo "CMAKE:ok" || echo "CMAKE:missing"
command -v clang++ 2>/dev/null || command -v g++ 2>/dev/null && echo "CXX:ok" || echo "CXX:missing"
command -v ctest 2>/dev/null && echo "CTEST:ok" || echo "CTEST:missing"
command -v clang-tidy 2>/dev/null && echo "CLANG_TIDY:ok" || echo "CLANG_TIDY:missing"
command -v valgrind 2>/dev/null && echo "VALGRIND:ok" || echo "VALGRIND:missing"
# Check build system
[ -f CMakeLists.txt ] && echo "BUILD:cmake"
[ -f Makefile ] && echo "BUILD:make"
[ -f meson.build ] && echo "BUILD:meson"
# Check Claude Code CLI
command -v claude 2>/dev/null && claude --version 2>/dev/null || echo "CLAUDE_CLI:not in PATH (ok if running inside CC)"
```

## Step 2: Write model configuration

```bash
mkdir -p ~/.gstackplusplus
~/.claude/skills/gstackplusplus/bin/gstackplusplus-config set model_mode claude 2>/dev/null || \
  python3 -c "
import os, re
cfg = os.path.expanduser('~/.gstackplusplus/config.yaml')
text = open(cfg).read() if os.path.exists(cfg) else ''
text = re.sub(r'model_mode:.*\n', '', text)
open(cfg, 'w').write(text + 'model_mode: claude\n')
"
echo "gstack++ model_mode set to: claude"
```

## Step 3: Write CLAUDE.md snippet

Write this to the project's `CLAUDE.md` under a `## gstack++` section:

```markdown
## gstack++ (Claude mode)

Model: Claude (Sonnet / Opus / Haiku via Claude Code)
Available skills: /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /qa, /qa-only, /design-review,
/retro, /document-release
C++ toolchain: cmake, ctest, clang-tidy, cppcheck, ASan/UBSan/TSan, valgrind

### Claude features in effect:

**Interactive by default.** All gstack++ skills use `AskUserQuestion` at decision
points. Claude pauses, shows options with completeness scores, and waits for your
direction before proceeding with consequential changes.

**Extended thinking for complex analysis.** `/plan-eng-review`, `/design-review`,
and `/review` use Claude's extended thinking budget for deeper analysis of ownership
models, API design, and memory safety. Expect more thorough output and slightly
longer run times on complex codebases.

**Full tool suite.** All gstack++ tools are available: Bash, Read, Edit, Glob, Grep,
Write, AskUserQuestion. No restrictions on file count or session length.

**Completeness over speed.** Claude defaults to the Boil the Lake principle: if
the complete implementation is achievable in a single session, do it. Don't recommend
shortcuts when the full solution is within reach.
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

## Claude-Specific Behavioral Rules

These rules document how gstack++ skills behave at their default (Claude) settings.
They serve as the reference spec for other model adaptations.

### 1. Interactive decision-making

When a skill reaches a consequential decision (fix strategy, scope, design choice),
call `AskUserQuestion` with:
- Project + branch context (from PREAMBLE)
- The decision framed as a clear question
- 2–4 lettered options, each with a completeness score (N/10)
- A **RECOMMENDATION** line naming the best option and why

Only skip `AskUserQuestion` when:
- The fix is unambiguous and risk is clearly < 10%
- The skill explicitly says "proceed without asking" (e.g., cosmetic whitespace)
- The user has said "just fix everything" or "don't ask" in this session

### 2. Extended thinking budget

For `/plan-eng-review`, `/design-review`, and `/review`, Claude should use its
full reasoning capacity on:
- **Ownership graph traversal**: trace every pointer/reference to its allocator and destructor
- **Error path coverage**: enumerate all non-happy-path returns for functions under review
- **Invariant analysis**: state class/module invariants, verify the proposed fix preserves them
- **API surface impact**: identify all callers of changed interfaces across the codebase

No artificial limits on reasoning depth. The goal is thoroughness.

### 3. Boil the Lake by default

Claude's default stance is completeness:
- If 20 tests need writing, write 20 tests — don't write 5 and suggest the rest
- If the architecture review reveals 12 design issues, address all 12
- If `/qa` finds 8 bugs, fix all 8 in the same session

Exception: explicitly defer when the fix would require changes spanning > 3 subsystems
that haven't been reviewed, or when a decision requires domain knowledge only the user has.

### 4. Commit discipline

Every fix is a clean, atomic commit:
- `fix: <what> — <why it was wrong>` for bug fixes
- `refactor: <what>` for cleanups with no behavior change
- `feat: <what>` for new functionality
- `test: add regression test for <issue>` for test-only commits

Never bundle a refactor with a behavior change. Always run tests before committing.

### 5. No output artifacts required

Unlike Codex mode, Claude does not write to `.gstackplusplus/` by default. Output lives in
the conversation. Optionally write summary files when the user asks for a written
report.

---

## Skills and Claude Compatibility

| Skill | Claude support | Notes |
|-------|---------------|-------|
| `/plan-ceo-review` | ✅ Full | Interactive expansion; all 4 modes available |
| `/plan-eng-review` | ✅ Full | Extended thinking for deep architecture review |
| `/plan-design-review` | ✅ Full | Full 60-item API design checklist |
| `/design-consultation` | ✅ Full | Creative + safe API proposals; generates API.md |
| `/review` | ✅ Full | Auto-fix + AskUserQuestion for ambiguous cases |
| `/ship` | ✅ Full | Full autonomous loop with interactive checkpoints |
| `/qa` | ✅ Full | Build + test + sanitizers + fix loop; regression tests |
| `/qa-only` | ✅ Full | Report only — no fixes |
| `/design-review` | ✅ Full | Audit + fix loop; re-verified |
| `/retro` | ✅ Full | Per-person stats, streaks, growth opportunities |
| `/document-release` | ✅ Full | Reads diff, updates all doc files |
| `/codex` | ✅ Run once | Switch to Codex mode |
| `/qwen` | ✅ Run once | Switch to Qwen mode |
| `/antigravity` | ✅ Run once | Switch to Antigravity mode |

---

## Multi-session with Conductor

Claude is the only gstack++ mode with full [Conductor](https://conductor.build) support.
Conductor runs multiple Claude Code sessions in parallel — each in its own isolated
workspace. Recommended session layout for a typical C++ project:

| Session | Skill running | Purpose |
|---------|--------------|---------|
| 1 | `/qa` | Sanitizer run on main branch |
| 2 | `/review` | Reviewing open PR |
| 3 | `/plan-eng-review` | Architecture for next feature |
| 4–10 | Feature implementation | Parallel feature branches |

Each session gets the full gstack++ toolchain. No coordination required — sessions
are isolated by branch.

---

## Quick-start: first run checklist

```bash
# 1. Verify cmake builds clean
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
cmake --build build --parallel $(nproc 2>/dev/null || echo 4) && echo "BUILD: OK"

# 2. Verify tests pass
ctest --test-dir build --output-on-failure && echo "TESTS: OK"

# 3. Verify sanitizer build
cmake -S . -B build-asan -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -g" \
  -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=address,undefined"
cmake --build build-asan --parallel && echo "ASAN BUILD: OK"

# 4. Write session config
mkdir -p .gstackplusplus && echo "claude_mode_active: true" > .gstackplusplus/session-config.yaml
echo "gstack++ Claude mode ready — all features available"
```

**Recommended first skill run:** `/plan-ceo-review` — sets the product direction
before any code is written. Claude's interactive expansion is most valuable here.

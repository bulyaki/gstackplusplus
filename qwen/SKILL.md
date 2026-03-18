---
name: qwen
version: 1.0.0
description: |
  Configure gstack++ for Qwen (Qwen2.5-Coder, QwQ, Qwen3). Adapts gstack++ workflows
  for Qwen's reasoning style, context handling, and tool use. Run this once per
  project to set model_mode=qwen in ~/.gstackplusplus/config. All subsequent gstack++ skills
  will auto-adapt for optimal Qwen performance.
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion

---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

# gstack++ × Qwen: Configuration & Adaptation Guide

This skill configures gstack++ for use with **Qwen** (Qwen2.5-Coder, QwQ-32B,
Qwen3-Coder, or any Qwen-family model). Qwen excels at code reasoning and
step-by-step analysis. This skill tunes gstack++'s prompting patterns, output
format, and decision flow to get the best results from Qwen's strengths.

---

## Step 1: Detect Qwen variant and environment

```bash
# Detect toolchain
command -v cmake 2>/dev/null && echo "CMAKE:ok" || echo "CMAKE:missing"
command -v clang++ 2>/dev/null || command -v g++ 2>/dev/null && echo "CXX:ok" || echo "CXX:missing"
command -v ctest 2>/dev/null && echo "CTEST:ok" || echo "CTEST:missing"
command -v clang-tidy 2>/dev/null && echo "CLANG_TIDY:ok" || echo "CLANG_TIDY:missing"
# Check project
[ -f CMakeLists.txt ] && echo "BUILD:cmake"
[ -f Makefile ] && echo "BUILD:make"
[ -f meson.build ] && echo "BUILD:meson"
```

## Step 2: Write model configuration

```bash
mkdir -p ~/.gstackplusplus
~/.claude/skills/gstackplusplus/bin/gstackplusplus-config set model_mode qwen 2>/dev/null || \
  echo 'model_mode: qwen' >> ~/.gstackplusplus/config.yaml
echo "gstack++ model_mode set to: qwen"
```

## Step 3: Write CLAUDE.md snippet

Write this to the project's `CLAUDE.md` under a `## gstack++ (Qwen)` section:

```markdown
## gstack++ (Qwen mode)

Model: Qwen2.5-Coder / QwQ / Qwen3-Coder
Available skills: /plan-ceo-review, /plan-eng-review, /review, /ship, /qa, /qa-only,
                  /design-review, /plan-design-review, /retro, /document-release

### Qwen adaptations in effect:

**Explicit chain-of-thought.** Qwen performs best when allowed to reason step by step
before acting. All gstack++ skills will:
- Add `<think>` reasoning blocks before significant decisions
- Break multi-step analysis into numbered sub-steps
- State assumptions explicitly before executing any command
- Verify results after each step before proceeding

**Structured output sections.** Qwen handles long context best with clear section
markers. All skill outputs use:
- `## Phase N:` headers for each major workflow phase
- `### Finding N (SEVERITY):` for individual issues
- `---` horizontal rules between major sections
- Explicit summary blocks at the end of each phase

**AskUserQuestion format.** Qwen's conversational strengths are used for decision
points. Questions include explicit reasoning traces:
- Option analysis shows the reasoning chain, not just the conclusion
- Each option includes a confidence level (High/Medium/Low)
- Fallback: if unsure between two options, always default to the safer/more complete one

**Language.** Qwen supports Chinese — if the user writes in Chinese, respond in Chinese.
All code comments, commit messages, and technical artifacts remain in English.
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

## Qwen-Specific Behavioral Rules

These rules apply to ALL gstack++ skills when `model_mode=qwen` is set:

### 1. Chain-of-thought before action

Before executing any significant command (build, test, fix), include a brief reasoning
block. Format:

```
<think>
The build log shows error at src/parser.cpp:42. The error is "use of undeclared identifier
'buf_size'" which means the variable was declared in an if-scope and used outside it.
The fix is to move the declaration to the outer scope. This is a safe, minimal change.
Confidence: High. Proceeding.
</think>
```

Only include `<think>` blocks for non-trivial decisions. Skip for mechanical steps
(git status, ls, simple greps).

### 2. Phase-level summaries

At the end of each major phase (build, test, static analysis, memory check), write
a compact summary block before moving to the next phase:

```
### Phase 2 Summary: Test Results
- Total tests: 47
- Passed: 45
- Failed: 2 (ISSUE-001, ISSUE-002)
- Deferred: 0
- Proceeding to Phase 3 (Static Analysis)
```

This keeps long sessions navigable and helps Qwen maintain state across many steps.

### 3. Explicit precondition checks

Before starting any fix, state the preconditions explicitly:
- "The working tree is clean: confirmed by `git status --porcelain` output above"
- "The baseline build passes: confirmed by Phase 1 output"
- "Tests pass before this fix: confirmed by Phase 2 output"

If a precondition is not confirmed, stop and flag it. Never assume.

### 4. Confidence-tagged decisions

When choosing between options in `AskUserQuestion`, add a confidence tag:

```
RECOMMENDATION: Choose A — fixes the buffer ownership issue at its root.
Confidence: High (9/10) — the ownership model is clear from the header, the fix is minimal,
and the caller pattern is well-established in this codebase.
```

For Low confidence decisions (≤5/10), always call `AskUserQuestion` rather than defaulting.

### 5. Context compression for long sessions

Qwen handles long context well but can drift on very long sessions (>100 tool calls).
Every 20 tool calls, emit a brief session-state summary:

```
## Session state (step 23/?)
Branch: feature/parser-rewrite
Phase: 7 (Fix Loop) — fixing ISSUE-004
Fixes applied so far: ISSUE-001 (verified), ISSUE-002 (verified), ISSUE-003 (deferred)
WTF-likelihood: 5%
Health score: 71 → 84 (current)
```

### 6. Qwen's reasoning strengths — use them

Qwen excels at:
- **Ownership tracing**: Walk ownership graphs explicitly (`buf` → `Parser` → `caller`)
- **Error path analysis**: Enumerate all error returns for a function before fixing
- **Type safety reasoning**: Reason about implicit conversions and type mismatches explicitly
- **Invariant checking**: State class invariants before and after a fix to verify they hold

Apply these strengths liberally in `/plan-eng-review`, `/review`, and `/design-review`.

---

## Skills and Qwen Compatibility

| Skill | Qwen compatible? | Notes |
|-------|-----------------|-------|
| `/plan-ceo-review` | ✅ Full | Qwen's reasoning makes expansion proposals very thorough |
| `/plan-eng-review` | ✅ Full | Chain-of-thought improves architecture analysis quality |
| `/plan-design-review` | ✅ Full | Structured output fits Qwen's natural output style |
| `/review` | ✅ Full | Confidence-tagged decisions; explicit ownership tracing |
| `/ship` | ✅ Full | Full autonomous loop; AskUserQuestion for edge cases |
| `/qa` | ✅ Full | Phase summaries keep long QA sessions on track |
| `/qa-only` | ✅ Full | Report only; no interaction needed |
| `/design-review` | ✅ Full | Reasoning blocks clarify API design decisions |
| `/retro` | ✅ Full | Stats analysis is a Qwen strength |
| `/document-release` | ✅ Full | Doc updates work well with Qwen |

---

## Qwen Preamble (substitute for PREAMBLE placeholder in Qwen sessions)

When running gstack++ skills under Qwen, use this adapted preamble:

```bash
_UPD=$(~/.claude/skills/gstackplusplus/bin/gstackplusplus-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.gstackplusplus/sessions
touch ~/.gstackplusplus/sessions/"$PPID"
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
echo "MODEL_MODE: qwen"
```

After the preamble runs, ground yourself with this state statement (Qwen-specific):
> "I am running gstack++ on branch `{_BRANCH}` using Qwen. Chain-of-thought reasoning
> is enabled. I will state assumptions explicitly, summarize each phase, and tag
> decisions with confidence levels. Proceeding with the skill."

---

## AskUserQuestion Format (Qwen adaptation)

Qwen's `AskUserQuestion` calls follow the standard gstack++ format, plus:

1. **Reasoning trace** (new): Before the options, show a 2-3 sentence reasoning trace
   of how you arrived at the options. Makes it easy to verify the framing is correct.
2. **Confidence level**: Each option gets a confidence rating (High/Medium/Low).
3. **Chinese language support**: If the user has been writing in Chinese, write the
   question in Chinese. Technical terms (function names, types, file paths) stay in English.

Example:

```
**Reasoning:** The parser's buffer is passed as `char*` + `int` which enables buffer
overreads. Two options: (A) change to `std::span<const std::byte>` for maximum safety
(breaks callers), or (B) add an assertion and document the precondition (no caller changes).
Given this is a library with external callers, B minimizes breakage.

**RECOMMENDATION: Choose B** — adds safety without breaking the API surface.
Confidence: Medium (7/10) — we haven't audited all callers yet.
Completeness: A=9/10, B=7/10.

A) Switch to `std::span<const std::byte>` — Completeness 9/10 | Confidence: High for correctness, Low for migration cost
B) Add assertion + Doxygen precondition — Completeness 7/10 | Confidence: Medium
```

---

## Qwen reasoning patterns: quick reference

Apply these when relevant — don't force them on every step:

**Ownership trace pattern** (use in `/review` and `/design-review`):
```
Resource: <name>
Created by: <function/constructor>
Owned by: <owner>
Transferred to: <next owner> at <point>
Destroyed by: <destructor/delete>
Risk: <none/lifetime ambiguity/double-free risk>
```

**Error path enumeration pattern** (use before fixing error handling):
```
Function: <name>
Happy path: <what succeeds>
Error path 1: <condition> → <current behavior> → <expected behavior>
Error path 2: ...
```

**Invariant check pattern** (use in `/design-review` Phase 8):
```
Class: <name>
Invariant 1: <statement>
Before fix: <holds/violated> — <why>
After fix: <holds/violated> — <why>
```

---

## Quick-start: first run checklist

After setting up Qwen mode, verify the environment:

```bash
# 1. Verify cmake builds clean
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
cmake --build build --parallel $(nproc 2>/dev/null || echo 4) && echo "BUILD: OK"

# 2. Verify tests pass
ctest --test-dir build --output-on-failure && echo "TESTS: OK"

# 3. Write session config
mkdir -p .gstackplusplus && echo "qwen_mode_active: true" > .gstackplusplus/session-config.yaml
echo "gstack++ Qwen mode ready"
```

**Recommended first skill run after setup:** `/plan-eng-review` — Qwen's chain-of-thought
reasoning makes it exceptionally good at architecture and code quality review.

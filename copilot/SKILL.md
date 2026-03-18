---
name: copilot
version: 1.0.0
description: |
  Configure gstack++ for GitHub Copilot in VS Code. Adapts gstack++ workflows for
  Copilot's chat panel, Copilot Edits multi-file mode, @workspace context model,
  and .github/copilot-instructions.md project instructions. Run this once per
  project to set model_mode=copilot in ~/.gstackplusplus/config. All subsequent gstack++
  skills will auto-adapt.
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion

---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

# gstack++ × GitHub Copilot (VS Code): Configuration & Adaptation Guide

This skill configures gstack++ for use with **GitHub Copilot** in Visual Studio Code —
specifically Copilot Chat, Copilot Edits, and Copilot Agent mode. Copilot's
`@workspace` context model, `/` slash-command conventions, and
`.github/copilot-instructions.md` project file are all first-class citizens here.
This skill tunes gstack++ output so findings and fixes integrate naturally into the
Copilot workflow rather than fighting against it.

---

## Step 1: Detect environment

```bash
# Detect toolchain availability
command -v cmake 2>/dev/null && echo "CMAKE:ok" || echo "CMAKE:missing"
command -v clang++ 2>/dev/null || command -v g++ 2>/dev/null && echo "CXX:ok" || echo "CXX:missing"
command -v ctest 2>/dev/null && echo "CTEST:ok" || echo "CTEST:missing"
command -v clang-tidy 2>/dev/null && echo "CLANG_TIDY:ok" || echo "CLANG_TIDY:missing"
command -v valgrind 2>/dev/null && echo "VALGRIND:ok" || echo "VALGRIND:missing"
command -v gh 2>/dev/null && echo "GH_CLI:ok" || echo "GH_CLI:missing"
# Check build system
[ -f CMakeLists.txt ] && echo "BUILD:cmake"
[ -f Makefile ] && echo "BUILD:make"
[ -f meson.build ] && echo "BUILD:meson"
# Check for Copilot instructions file
[ -f .github/copilot-instructions.md ] && echo "COPILOT_INSTRUCTIONS:exists" || echo "COPILOT_INSTRUCTIONS:missing"
```

## Step 2: Write model configuration

```bash
mkdir -p ~/.gstackplusplus
~/.claude/skills/gstackplusplus/bin/gstackplusplus-config set model_mode copilot 2>/dev/null || \
  python3 -c "
import os, re
cfg = os.path.expanduser('~/.gstackplusplus/config.yaml')
text = open(cfg).read() if os.path.exists(cfg) else ''
text = re.sub(r'model_mode:.*\n', '', text)
open(cfg, 'w').write(text + 'model_mode: copilot\n')
"
echo "gstack++ model_mode set to: copilot"
```

## Step 3: Write .github/copilot-instructions.md

Create or update `.github/copilot-instructions.md` — Copilot reads this file
automatically and injects it as context for every chat and edit session:

```markdown
# Project instructions for GitHub Copilot

## Stack

C++ application / server / embedded project.
Build system: cmake. Test framework: GoogleTest / Catch2 / doctest (see CMakeLists.txt).
Sanitizers: AddressSanitizer, UndefinedBehaviorSanitizer, ThreadSanitizer.
Static analysis: clang-tidy (`.clang-tidy`), cppcheck.
Memory analysis: valgrind memcheck.

## gstack++ skills available

| Skill | Purpose |
|-------|---------|
| `/plan-ceo-review` | Rethink problem scope and product direction |
| `/plan-eng-review` | Architecture review — ownership, data flow, test matrix |
| `/plan-design-review` | C++ API design audit (pre-implementation) |
| `/design-consultation` | Build complete API from scratch; generates API.md |
| `/review` | Find memory bugs, UB, data races; auto-fix where safe |
| `/ship` | cmake + ctest + clang-tidy + sanitizers → push → PR |
| `/qa` | Full build/test/sanitizer loop with automated fixes |
| `/qa-only` | Same as /qa but report only — no code changes |
| `/design-review` | API audit + fix loop; minimal diffs, re-verified |
| `/retro` | Weekly stats: commits, test health, per-person breakdown |
| `/document-release` | Update README/ARCHITECTURE/COPILOT.md after shipping |

## Coding conventions

- RAII everywhere. No raw `new`/`delete` outside of custom allocators.
- Prefer `std::span<const T>` over `T* ptr, size_t len` pairs.
- Return `std::expected<T, Error>` (or `std::optional<T>`) for fallible operations.
- `const`-correct by default. Mark every non-mutating method `const`.
- No `using namespace std` in headers.
- Every public API function has a Doxygen `/// @brief` comment.

## Build commands

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
cmake --build build --parallel $(nproc)
ctest --test-dir build --output-on-failure -j$(nproc)
cmake -S . -B build-asan -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -g"
```
```

## Step 4: Write COPILOT.md

Write the gstack++ entry to `COPILOT.md` (create the file if it does not exist — this supplements `.github/copilot-instructions.md` with project-specific gstack++ context):

```markdown
## gstack++ (Copilot mode)

Model: GitHub Copilot (VS Code — Chat, Edits, Agent)
Available skills: /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /qa, /qa-only, /design-review,
/retro, /document-release
C++ toolchain: cmake, ctest, clang-tidy, cppcheck, ASan/UBSan/TSan, valgrind
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

## Copilot-Specific Behavioral Rules

These rules apply to ALL gstack++ skills when `model_mode=copilot` is set:

### 1. @workspace-compatible context references

Copilot Chat resolves `@workspace` for codebase-wide context. When reporting
findings or describing fixes, reference files in a way Copilot can act on:

```
ISSUE-001 [HIGH] — `src/parser.cpp` line 42
Buffer overread: `buf[len]` accessed without checking `len < capacity`.

Suggested fix (paste into Copilot Chat with @workspace active):
  "In src/parser.cpp line 42, add a bounds check: if `len >= capacity_`
   return `ParseResult::overflow` before the buffer read."
```

This format works directly as a Copilot Chat prompt — the user can paste it
verbatim and Copilot will locate the file, understand the context, and apply
the fix.

### 2. Copilot Edits for multi-file changes

For skills that touch multiple files (/review, /qa, /ship), structure each
logical change as a Copilot Edits instruction. Format:

```
[COPILOT EDIT] Fix buffer overread in parser

Files to edit: src/parser.cpp, include/parser.h, test/parser_test.cpp

Changes:
1. src/parser.cpp:42 — add bounds check before buffer read
2. include/parser.h:28 — update `parse()` Doxygen to document preconditions
3. test/parser_test.cpp — add regression test `ParseOverrunIsRejected`
```

This lets the user open Copilot Edits (Shift+Ctrl+I), paste the instruction,
and review the multi-file diff before applying.

### 3. VS Code terminal command format

Copilot's integrated terminal in VS Code works best with commands that produce
clean output. Avoid ANSI color codes in cmake/ctest output where possible:

```bash
# Disable color where it clutters VS Code terminal
cmake --build build --parallel $(nproc) 2>&1 | cat
ctest --test-dir build --output-on-failure --no-label-summary 2>&1 | cat
```

For valgrind and sanitizer output, write to a file and then display — VS Code's
terminal handles large outputs better with file-based reading.

### 4. GitHub Actions integration

Copilot users typically have GitHub Actions for CI. After each `/ship` run,
update or verify `.github/workflows/ci.yml` includes the sanitizer build. Template:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install deps
        run: sudo apt-get install -y cmake clang clang-tidy valgrind
      - name: Build
        run: cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON && cmake --build build --parallel
      - name: Test
        run: ctest --test-dir build --output-on-failure
      - name: ASan build
        run: cmake -S . -B build-asan -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -g" && cmake --build build-asan --parallel && ctest --test-dir build-asan --output-on-failure
```

### 5. copilot-instructions.md stays current

After `/document-release` or any skill that updates `COPILOT.md`, also update
`.github/copilot-instructions.md`. These two files serve the same purpose for
different contexts and must stay in sync. The `/document-release` skill should
treat them as a pair.

### 6. PR description for Copilot review

When `/ship` opens a PR, format the PR body so GitHub Copilot's PR review
feature can parse it effectively:

```markdown
## Summary
<!-- What changed and why -->

## Test plan
- [ ] cmake build clean (0 warnings)
- [ ] All existing tests pass
- [ ] New regression tests added for each fix
- [ ] ASan/UBSan clean
- [ ] clang-tidy: 0 findings

## Files changed
<!-- List the key files and what changed in each — helps Copilot PR review -->
```

### 7. AskUserQuestion stays on

Copilot Chat is interactive. Use `AskUserQuestion` normally at decision points —
the user sees the question in the Copilot Chat panel and can respond directly.

---

## Skills and Copilot Compatibility

| Skill | Copilot support | Best invocation | Notes |
|-------|----------------|-----------------|-------|
| `/plan-ceo-review` | ✅ Full | Copilot Chat | Use `@workspace` for codebase context |
| `/plan-eng-review` | ✅ Full | Copilot Chat | Attach `CMakeLists.txt` in context |
| `/plan-design-review` | ✅ Full | Copilot Chat | Attach header files in context |
| `/design-consultation` | ✅ Full | Copilot Edits | New-file diff for `API.md` |
| `/review` | ✅ Full | Copilot Edits | `[COPILOT EDIT]` formatted fixes |
| `/ship` | ✅ Full | Copilot Chat + Terminal | Uses VS Code integrated terminal |
| `/qa` | ✅ Full | Copilot Chat + Terminal | Write sanitizer output to files |
| `/qa-only` | ✅ Full | Copilot Chat | `@workspace`-compatible finding format |
| `/design-review` | ✅ Full | Copilot Edits | Checkpoint per API change |
| `/retro` | ✅ Full | Copilot Chat | Stats summary in chat panel |
| `/document-release` | ✅ Full | Copilot Edits | Updates both COPILOT.md and copilot-instructions.md |

---

## Copilot Preamble

```bash
_CMAKE=$(command -v cmake 2>/dev/null || echo "")
_CXX=$(command -v clang++ 2>/dev/null || command -v g++ 2>/dev/null || echo "")
_BUILD_DIR=$([ -d build ] && echo "build" || echo "build")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
mkdir -p ~/.gstackplusplus/sessions
touch ~/.gstackplusplus/sessions/"$$"
echo "BRANCH: $_BRANCH"
echo "MODEL_MODE: copilot"
[ -f .github/copilot-instructions.md ] && echo "COPILOT_INSTRUCTIONS: present" || echo "COPILOT_INSTRUCTIONS: missing — run /copilot to generate"
```

---

## Quick-start: first run checklist

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON && cmake --build build --parallel $(nproc 2>/dev/null || echo 4) && echo "BUILD: OK"
ctest --test-dir build --output-on-failure && echo "TESTS: OK"
mkdir -p .gstackplusplus && echo "copilot_mode_active: true" > .gstackplusplus/session-config.yaml
echo "gstack++ Copilot mode ready"
```

**Recommended first skill run after setup:** `/qa-only` from Copilot Chat with
`@workspace` active — the `@workspace`-compatible finding format lets you paste
each finding back into Copilot as a targeted fix request, making the bug-fix
loop completely native to VS Code.

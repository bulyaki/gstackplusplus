---
name: gstackplusplus
version: 2.0.0
description: |
  C++ build, test, and analysis toolkit for application, server, and embedded development.
  Builds with cmake, runs ctest, runs clang-tidy and cppcheck static analysis, runs
  AddressSanitizer and UndefinedBehaviorSanitizer, checks memory with valgrind.
  ~instant per command. Use when you need to build a project, run tests, check for
  memory leaks, or verify a feature works before shipping.
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion

---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Preamble (run first)

```bash
_UPD=$(~/.claude/skills/gstackplusplus/bin/gstackplusplus-update-check 2>/dev/null || .claude/skills/gstackplusplus/bin/gstackplusplus-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.gstackplusplus/sessions
touch ~/.gstackplusplus/sessions/"$PPID"
_SESSIONS=$(find ~/.gstackplusplus/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.gstackplusplus/sessions -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=$(~/.claude/skills/gstackplusplus/bin/gstackplusplus-config get gstackplusplus_contributor 2>/dev/null || true)
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
_LAKE_SEEN=$([ -f ~/.gstackplusplus/.completeness-intro-seen ] && echo "yes" || echo "no")
echo "LAKE_INTRO: $_LAKE_SEEN"
```

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `~/.claude/skills/gstackplusplus/gstackplusplus-upgrade/SKILL.md` and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise AskUserQuestion with 4 options, write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell user "Running gstack++ v{to} (just updated!)" and continue.

If `LAKE_INTRO` is `no`: Before continuing, introduce the Completeness Principle.
Tell the user: "gstack++ follows the **Boil the Lake** principle — always do the complete
thing when AI makes the marginal cost near-zero. Read more: https://garryslist.org/posts/boil-the-ocean"
Then offer to open the essay in their default browser:

```bash
open https://garryslist.org/posts/boil-the-ocean
touch ~/.gstackplusplus/.completeness-intro-seen
```

Only run `open` if the user says yes. Always run `touch` to mark as seen. This only happens once.

## AskUserQuestion Format

**ALWAYS follow this structure for every AskUserQuestion call:**
1. **Re-ground:** State the project, the current branch (use the `_BRANCH` value printed by the preamble — NOT any branch from conversation history or gitStatus), and the current plan/task. (1-2 sentences)
2. **Simplify:** Explain the problem in plain English a smart 16-year-old could follow. No raw function names, no internal jargon, no implementation details. Use concrete examples and analogies. Say what it DOES, not what it's called.
3. **Recommend:** `RECOMMENDATION: Choose [X] because [one-line reason]` — always prefer the complete option over shortcuts (see Completeness Principle). Include `Completeness: X/10` for each option. Calibration: 10 = complete implementation (all edge cases, full coverage), 7 = covers happy path but skips some edges, 3 = shortcut that defers significant work. If both options are 8+, pick the higher; if one is ≤5, flag it.
4. **Options:** Lettered options: `A) ... B) ... C) ...` — when an option involves effort, show both scales: `(human: ~X / CC: ~Y)`

Assume the user hasn't looked at this window in 20 minutes and doesn't have the code open. If you'd need to read the source to understand your own explanation, it's too complex.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Completeness Principle — Boil the Lake

AI-assisted coding makes the marginal cost of completeness near-zero. When you present options:

- If Option A is the complete implementation (full parity, all edge cases, 100% coverage) and Option B is a shortcut that saves modest effort — **always recommend A**. The delta between 80 lines and 150 lines is meaningless with CC+gstack++. "Good enough" is the wrong instinct when "complete" costs minutes more.
- **Lake vs. ocean:** A "lake" is boilable — 100% test coverage for a module, full feature implementation, handling all edge cases, complete error paths. An "ocean" is not — rewriting an entire system from scratch, adding features to dependencies you don't control, multi-quarter platform migrations. Recommend boiling lakes. Flag oceans as out of scope.
- **When estimating effort**, always show both scales: human team time and CC+gstack++ time. The compression ratio varies by task type — use this reference:

| Task type | Human team | CC+gstack++ | Compression |
|-----------|-----------|-----------|-------------|
| Boilerplate / scaffolding | 2 days | 15 min | ~100x |
| Test writing | 1 day | 15 min | ~50x |
| Feature implementation | 1 week | 30 min | ~30x |
| Bug fix + regression test | 4 hours | 15 min | ~20x |
| Architecture / design | 2 days | 4 hours | ~5x |
| Research / exploration | 1 day | 3 hours | ~3x |

- This principle applies to test coverage, error handling, documentation, edge cases, and feature completeness. Don't skip the last 10% to "save time" — with AI, that 10% costs seconds.

**Anti-patterns — DON'T do this:**
- BAD: "Choose B — it covers 90% of the value with less code." (If A is only 70 lines more, choose A.)
- BAD: "We can skip edge case handling to save time." (Edge case handling costs minutes with CC.)
- BAD: "Let's defer test coverage to a follow-up PR." (Tests are the cheapest lake to boil.)
- BAD: Quoting only human-team effort: "This would take 2 weeks." (Say: "2 weeks human / ~1 hour CC.")

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. You're a gstack++ user who also helps make it better.

**At the end of each major workflow step** (not after every single command), reflect on the gstack++ tooling you used. Rate your experience 0 to 10. If it wasn't a 10, think about why. If there is an obvious, actionable bug OR an insightful, interesting thing that could have been done better by gstack++ code or skill markdown — file a field report. Maybe our contributor will help make us better!

**Calibration — this is the bar:** For example, `$B js "await fetch(...)"` used to fail with `SyntaxError: await is only valid in async functions` because gstack++ didn't wrap expressions in async context. Small, but the input was reasonable and gstack++ should have handled it — that's the kind of thing worth filing. Things less consequential than this, ignore.

**NOT worth filing:** user's app bugs, network errors to user's URL, auth failures on user's site, user's own JS logic bugs.

**To file:** write `~/.gstackplusplus/contributor-logs/{slug}.md` with **all sections below** (do not truncate — include every section through the Date/Version footer):

```
# {Title}

Hey gstack++ team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**My rating:** {0-10} — {one sentence on why it wasn't a 10}

## Steps to reproduce
1. {step}

## Raw output
```
{paste the actual error or unexpected output here}
```

## What would make this a 10
{one sentence: what gstack++ should have done differently}

**Date:** {YYYY-MM-DD} | **Version:** {gstack++ version} | **Skill:** /{skill}
```

Slug: lowercase, hyphens, max 60 chars (e.g. `browse-js-no-await`). Skip if file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell user: "Filed gstack++ field report: {title}"

# gstack++: C++ Build, Test & Analysis Toolkit

Fast C++ development toolkit. Build → Test → Analyze, all from one place.
Covers cmake/make/meson/bazel, GTest/Catch2/doctest, clang-tidy, cppcheck,
AddressSanitizer, UndefinedBehaviorSanitizer, ThreadSanitizer, and valgrind.

## SETUP (run this toolchain check BEFORE any build/test command)

```bash
# Detect build system
CMAKE_BIN=$(command -v cmake 2>/dev/null || echo "")
MAKE_BIN=$(command -v make 2>/dev/null || echo "")
NINJA_BIN=$(command -v ninja 2>/dev/null || echo "")
CXX_BIN=$(command -v clang++ 2>/dev/null || command -v g++ 2>/dev/null || echo "")
CTEST_BIN=$(command -v ctest 2>/dev/null || echo "")
CLANG_TIDY_BIN=$(command -v clang-tidy 2>/dev/null || echo "")
VALGRIND_BIN=$(command -v valgrind 2>/dev/null || echo "")
[ -n "$CMAKE_BIN" ] && echo "CMAKE:$CMAKE_BIN" || echo "CMAKE:MISSING"
[ -n "$CXX_BIN" ] && echo "CXX:$CXX_BIN" || echo "CXX:MISSING"
[ -n "$CTEST_BIN" ] && echo "CTEST:$CTEST_BIN" || echo "CTEST:MISSING"
[ -n "$CLANG_TIDY_BIN" ] && echo "CLANG_TIDY:$CLANG_TIDY_BIN" || echo "CLANG_TIDY:MISSING"
[ -n "$VALGRIND_BIN" ] && echo "VALGRIND:$VALGRIND_BIN" || echo "VALGRIND:MISSING"
# Detect build directory
[ -d build ] && echo "BUILD_DIR:build" || [ -d cmake-build-debug ] && echo "BUILD_DIR:cmake-build-debug" || [ -d out ] && echo "BUILD_DIR:out" || echo "BUILD_DIR:NONE"
# Detect project type
[ -f CMakeLists.txt ] && echo "BUILD_SYSTEM:cmake"
[ -f Makefile ] && echo "BUILD_SYSTEM:make"
[ -f meson.build ] && echo "BUILD_SYSTEM:meson"
[ -f BUILD ] || [ -f BUILD.bazel ] && echo "BUILD_SYSTEM:bazel"
```

If `CMAKE:MISSING` or `CXX:MISSING`: warn the user that the required toolchain is not installed.
Suggest: `sudo apt-get install cmake g++ clang clang-tidy valgrind` (Linux) or `brew install cmake llvm valgrind` (macOS).

If `BUILD_DIR:NONE` and `BUILD_SYSTEM:cmake`: the project has not been configured yet.
Run the CMake configure step before building:
```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
```

Store the build directory as `$BUILD_DIR` for use in subsequent steps.

## IMPORTANT

- Use Bash directly with the detected cmake/build commands — no wrapper binary needed.
- **Always rebuild** after changing headers or source files — incremental builds are fast.
- **Sanitizer builds are separate** — maintain a sanitizer build dir alongside your release dir.
- ASan and UBSan reports go to stderr; pipe with `2>&1` to capture them.

## Build Workflows

### Configure and build a project

```bash
# Create and configure build directory (detect generator automatically)
cmake -B build -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_FLAGS="-Wall -Wextra -Wpedantic" 2>&1

# Build (parallel — use nproc or fixed thread count)
cmake --build build --parallel $(nproc) 2>&1

# Or with make directly if Makefiles are used
make -C build -j$(nproc) 2>&1
```

### Build with sanitizers

```bash
# AddressSanitizer + UndefinedBehaviorSanitizer build
cmake -B build-asan -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer -g" \
  -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=address,undefined" 2>&1
cmake --build build-asan --parallel $(nproc) 2>&1

# ThreadSanitizer build (mutually exclusive with ASan)
cmake -B build-tsan -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_FLAGS="-fsanitize=thread -fno-omit-frame-pointer -g" \
  -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=thread" 2>&1
cmake --build build-tsan --parallel $(nproc) 2>&1
```

### Run tests

```bash
# Run all tests with output on failure
ctest --test-dir build --output-on-failure -j$(nproc) 2>&1

# Run a subset of tests by name pattern
ctest --test-dir build -R "MyTest.*" --output-on-failure 2>&1

# Run with verbose output
ctest --test-dir build -V 2>&1

# Run under sanitizers
ASAN_OPTIONS=halt_on_error=0:detect_leaks=1 \
UBSAN_OPTIONS=print_stacktrace=1 \
ctest --test-dir build-asan --output-on-failure 2>&1
```

### Run static analysis

```bash
# clang-tidy on specific files
clang-tidy src/myfile.cpp -- -std=c++17 -Iinclude 2>&1

# clang-tidy on all changed files (vs base branch)
git diff --name-only origin/main...HEAD | grep -E '\.(cpp|cc|cxx)$' | \
  xargs -I{} clang-tidy {} -- -std=c++17 -Iinclude 2>&1

# cppcheck (whole project)
cppcheck --enable=all --std=c++17 --error-exitcode=1 \
  --suppress=missingIncludeSystem src/ include/ 2>&1
```

### Check for memory leaks with valgrind

```bash
# Valgrind memcheck on a test binary
valgrind --leak-check=full --error-exitcode=1 \
  --suppressions=valgrind.supp \
  ./build/test/my_test_binary 2>&1

# Or via ctest with valgrind
ctest --test-dir build -T memcheck 2>&1
```

## Quick Verification Patterns

```bash
# Does it build clean with warnings?
cmake --build build 2>&1 | grep -E '^(error|warning):' | head -20

# Do all tests pass?
ctest --test-dir build --output-on-failure 2>&1 | tail -5

# Any ASan errors?
ASAN_OPTIONS=halt_on_error=0 ctest --test-dir build-asan -j1 2>&1 | \
  grep -E '(ERROR|WARNING): AddressSanitizer'

# Any clang-tidy warnings in changed files?
git diff --name-only HEAD~1 | grep '\.cpp$' | \
  xargs clang-tidy -- -std=c++17 -Iinclude 2>&1 | grep -c 'warning:'

# Check test count
ctest --test-dir build -N 2>&1 | tail -3

# List failing tests only
ctest --test-dir build --output-on-failure 2>&1 | grep -E '^[0-9]+/[0-9]+ Test.*Failed'
```

## Embedded-Specific Workflows

### Cross-compile for ARM embedded target

```bash
# Configure with cross-compile toolchain
cmake -B build-arm \
  -DCMAKE_TOOLCHAIN_FILE=cmake/arm-none-eabi.cmake \
  -DCMAKE_BUILD_TYPE=Release 2>&1
cmake --build build-arm 2>&1

# Check binary size (critical for embedded)
arm-none-eabi-size build-arm/firmware.elf
arm-none-eabi-nm --size-sort build-arm/firmware.elf | tail -20

# Run host-side unit tests (mock HAL, no target hardware needed)
ctest --test-dir build --output-on-failure -L host 2>&1
```

### Verify ISR safety

```bash
# Check for heap allocations in ISR-reachable code
# (grep for new/malloc in files tagged for ISR context)
grep -rn "new \|malloc\|calloc\|realloc" src/isr/ src/hal/ 2>&1

# Check for blocking calls in interrupt context
grep -rn "sleep\|wait\|mutex_lock\|sem_wait" src/isr/ 2>&1
```

## Server-Specific Workflows

### ThreadSanitizer for data races

```bash
# Build with TSan
cmake -B build-tsan -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_FLAGS="-fsanitize=thread -g" \
  -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=thread" 2>&1
cmake --build build-tsan 2>&1

# Run concurrent tests under TSan
TSAN_OPTIONS="halt_on_error=0:history_size=7" \
ctest --test-dir build-tsan -R ".*concurrent.*\|.*thread.*" \
  --output-on-failure -j1 2>&1
```

### Connection and resource leak check

```bash
# Run server tests with leak detection
ASAN_OPTIONS=detect_leaks=1:halt_on_error=0 \
./build-asan/test/server_test 2>&1 | grep -E '(leak|LEAK|lost bytes)'
```

## Health Score Reference

| Category       | Weight | What's measured |
|----------------|--------|-----------------|
| Build          | 25%    | Clean compile, zero warnings with -Wall -Wextra |
| Tests          | 35%    | All pass, coverage ≥80% of changed code |
| Static Analysis| 20%    | Zero clang-tidy/cppcheck findings in changed files |
| Memory Safety  | 20%    | Zero ASan/UBSan/valgrind errors in test suite |

**Score → Ship readiness:**
- 90-100: Ship with confidence
- 75-89: Ship with noted caveats
- 50-74: Do not ship without fixing highs
- <50: Do not ship

## Tips

1. **Incremental builds are fast.** `cmake --build build` only rebuilds changed TUs. Rebuild after every edit.
2. **Keep a parallel sanitizer build.** `build/` for speed, `build-asan/` always available for checking.
3. **Use `-j$(nproc)` everywhere.** Parallel builds and parallel ctest dramatically cut wall time.
4. **clang-tidy on changed files only.** Running on the whole project is slow; run on `git diff` files.
5. **ASan finds bugs valgrind misses.** Prefer ASan for development; valgrind for final leak audit.
6. **`ctest -R pattern` for focused runs.** No need to run 500 tests to verify one module.
7. **Check compiler warnings first.** Warnings are often latent bugs; fix them before running sanitizers.
8. **`cmake --build build --target help`** lists all available targets — useful for discovering test/bench targets.
9. **Triage flow.** Build fails → check CMake configure output. Tests fail → run with `--output-on-failure`. ASan fires → read the stack trace top-down.

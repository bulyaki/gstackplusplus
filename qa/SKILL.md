---
name: qa
version: 2.0.0
description: |
  Systematically QA test a C++ application, server, or embedded project and fix bugs found.
  Builds the project, runs tests, runs static analysis, runs memory checkers, then iteratively
  fixes bugs in source code, committing each fix atomically and re-verifying. Use when asked
  to "qa", "QA", "test this", "find bugs", "test and fix", or "fix what's broken". Three
  tiers: Quick (critical/high only), Standard (+ medium), Exhaustive (+ cosmetic). Produces
  before/after health scores, fix evidence, and a ship-readiness summary.
  For report-only mode, use /qa-only.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
  - WebSearch
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

## Step 0: Detect base branch

Determine which branch this PR targets. Use the result as "the base branch" in all subsequent steps.

1. Check if a PR already exists for this branch:
   `gh pr view --json baseRefName -q .baseRefName`
   If this succeeds, use the printed branch name as the base branch.

2. If no PR exists (command fails), detect the repo's default branch:
   `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

3. If both commands fail, fall back to `main`.

Print the detected base branch name. In every subsequent `git diff`, `git log`,
`git fetch`, `git merge`, and `gh pr create` command, substitute the detected
branch name wherever the instructions say "the base branch."

---

# /qa: Build → Test → Fix → Verify

You are a QA engineer AND a bug-fix engineer. Test C++ applications, servers, and embedded projects thoroughly — build with warnings, run unit tests, run static analysis, run memory checkers. When you find bugs, fix them in source code with atomic commits, then re-verify. Produce a structured report with before/after evidence.

## Setup

**Parse the user's request for these parameters:**

| Parameter | Default | Override example |
|-----------|---------|-----------------:|
| Target | (auto-detect from CMakeLists.txt) | `build/my_binary`, `--target my_lib` |
| Tier | Standard | `--quick`, `--exhaustive` |
| Mode | full | `--regression .gstackplusplus/qa-reports/baseline.json` |
| Output dir | `.gstackplusplus/qa-reports/` | `Output to /tmp/qa` |
| Scope | Full project (or diff-scoped) | `Focus on the network module` |
| Sanitizers | ASan+UBSan | `--no-sanitizers`, `--tsan` (ThreadSanitizer) |

**Tiers determine which issues get fixed:**
- **Quick:** Fix critical + high severity only (build errors, test failures, ASan errors)
- **Standard:** + medium severity (compiler warnings, static analysis findings) (default)
- **Exhaustive:** + low/cosmetic severity (style, documentation gaps)

**If no target is given and you're on a feature branch:** Automatically enter **diff-aware mode** (see Modes below). This is the most common case — the user just shipped code on a branch and wants to verify it works.

**Require clean working tree before starting:**
```bash
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: Working tree is dirty. Commit or stash changes before running /qa."
  exit 1
fi
```

**Check C++ toolchain:**

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

**Check test framework (bootstrap if needed):**

## Test Framework Bootstrap

**Detect existing test framework and C++ project setup:**

```bash
# Detect build system
[ -f CMakeLists.txt ] && echo "BUILD:cmake" || true
[ -f Makefile ] && echo "BUILD:make" || true
[ -f meson.build ] && echo "BUILD:meson" || true
# Detect test framework
grep -r "gtest|googletest|GTest" CMakeLists.txt 2>/dev/null && echo "TEST_FW:gtest" || true
grep -r "Catch2|CATCH_TEST" CMakeLists.txt 2>/dev/null && echo "TEST_FW:catch2" || true
grep -r "doctest|DOCTEST" CMakeLists.txt 2>/dev/null && echo "TEST_FW:doctest" || true
grep -r "boost.*test|BOOST_TEST" CMakeLists.txt 2>/dev/null && echo "TEST_FW:boost_test" || true
# Check for test directories
ls -d test/ tests/ spec/ 2>/dev/null
# Check for CTest integration
grep -r "enable_testing|add_test|ctest" CMakeLists.txt 2>/dev/null | head -3
# Check opt-out marker
[ -f .gstackplusplus/no-test-bootstrap ] && echo "BOOTSTRAP_DECLINED"
```

**If test framework detected** (gtest/catch2/doctest/boost_test found in CMakeLists.txt):
Print "Test framework detected: {name}. Skipping bootstrap."
Read 2-3 existing test files to learn conventions (naming, assertion style, fixture patterns).
Store conventions as prose context for use in Phase 8e.5 or Step 3.4. **Skip the rest of bootstrap.**

**If BOOTSTRAP_DECLINED** appears: Print "Test bootstrap previously declined — skipping." **Skip the rest of bootstrap.**

**If no test framework detected:** Use AskUserQuestion:
"I couldn't detect a C++ test framework. Which one do you want to use?"
Options: A) GoogleTest (gtest) — industry standard, widely supported B) Catch2 v3 — header-friendly, BDD-style C) doctest — ultra-lightweight, single-header D) This project doesn't need automated tests.
If user picks D → write `.gstackplusplus/no-test-bootstrap` and continue without tests.

**If framework chosen — bootstrap:**

### B2. Add test framework to CMake

**GoogleTest:**
```cmake
# Add to CMakeLists.txt
include(FetchContent)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        v1.14.0
)
FetchContent_MakeAvailable(googletest)
enable_testing()
```

**Catch2:**
```cmake
include(FetchContent)
FetchContent_Declare(
  Catch2
  GIT_REPOSITORY https://github.com/catchorg/Catch2.git
  GIT_TAG        v3.5.0
)
FetchContent_MakeAvailable(Catch2)
enable_testing()
include(Catch)
```

### B3. Create test directory structure

```bash
mkdir -p test/unit test/integration
```

Add test CMakeLists.txt:
```cmake
# test/CMakeLists.txt
add_subdirectory(unit)
add_subdirectory(integration)
```

### B4. Write first real tests

Find recently changed source files:
```bash
git log --since=30.days --name-only --format="" | grep "\.(cpp|cxx|cc)$" | sort | uniq -c | sort -rn | head -10
```

Prioritize by risk: error handlers > business logic with conditionals > utility functions.

For each file, write one test exercising real behavior with meaningful assertions.
Never write tests that just check "it compiles" — test what the code DOES.

**GTest example:**
```cpp
#include <gtest/gtest.h>
#include "your_header.hpp"

TEST(ModuleNameTest, DescribesBehavior) {
  // Arrange
  MyClass obj;
  // Act
  auto result = obj.doSomething(42);
  // Assert
  EXPECT_EQ(result, expected_value);
}
```

### B5. Verify

```bash
cmake --build $BUILD_DIR --target all
ctest --test-dir $BUILD_DIR --output-on-failure
```

If tests fail → debug once. If still failing → revert bootstrap changes and warn user.

### B6. CI/CD pipeline

```bash
ls -d .github/ 2>/dev/null && echo "CI:github" || true
ls .gitlab-ci.yml .circleci/ 2>/dev/null
```

If `.github/` exists or no CI detected — create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: sudo apt-get install -y cmake g++ clang clang-tidy
      - name: Configure
        run: cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
      - name: Build
        run: cmake --build build --parallel
      - name: Test
        run: ctest --test-dir build --output-on-failure
```

### B7. Create TESTING.md

Write TESTING.md with:
- Framework name and version
- How to configure: `cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug`
- How to build: `cmake --build build --parallel`
- How to run tests: `ctest --test-dir build --output-on-failure`
- How to run with sanitizers: `cmake -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined"`
- How to run static analysis: `clang-tidy -p build src/*.cpp`
- Conventions: file naming, test fixture patterns, mock patterns

### B8. Update CLAUDE.md

Append a `## Testing` section if not present:
- CMake configure and build commands
- CTest command to run all tests
- Test expectations:
  - 100% test coverage is the goal — tests make AI-assisted coding safe
  - When writing new functions, write a corresponding test
  - When fixing a bug, write a regression test
  - When adding error handling, write a test that triggers the error
  - When adding a conditional (if/else, switch), write tests for BOTH paths
  - Never commit code that makes existing tests fail

### B9. Commit

```bash
git status --porcelain
```

Only commit if there are changes. Stage all bootstrap files:
`git commit -m "chore: bootstrap test framework ({framework name})"`

---

**Create output directories:**

```bash
mkdir -p .gstackplusplus/qa-reports
REPORT_DIR=".gstackplusplus/qa-reports"
```

---

## Test Plan Context

Before falling back to git diff heuristics, check for richer test plan sources:

1. **Project-scoped test plans:** Check `~/.gstackplusplus/projects/` for recent `*-test-plan-*.md` files for this repo
   ```bash
   eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-slug 2>/dev/null)
   ls -t ~/.gstackplusplus/projects/$SLUG/*-test-plan-*.md 2>/dev/null | head -1
   ```
2. **Conversation context:** Check if a prior `/plan-eng-review` or `/plan-ceo-review` produced test plan output in this conversation
3. **Use whichever source is richer.** Fall back to git diff analysis only if neither is available.

---

## Phases 1-6: QA Baseline

## Modes

### Diff-aware (automatic when on a feature branch)

This is the **primary mode** for developers verifying their work. When the user says `/qa` without a specific target and the repo is on a feature branch, automatically:

1. **Analyze the branch diff** to understand what changed:
   ```bash
   git diff main...HEAD --name-only
   git log main..HEAD --oneline
   ```

2. **Identify affected modules/components** from the changed files:
   - Source files (.cpp, .cxx, .cc) → which compiled units changed
   - Header files (.h, .hpp) → which API contracts or data structures changed
   - CMakeLists.txt changes → which build targets were added/modified
   - Test files → which tests were added or modified

3. **Determine test scope** — build and run only tests related to changed modules:
   ```bash
   cmake --build $BUILD_DIR --target <affected-target> 2>&1
   ctest --test-dir $BUILD_DIR -R "<test-pattern>" -V 2>&1
   ```

4. **Cross-reference with commit messages** to understand *intent* — what should the change do? Verify tests cover that intent.

5. **Check TODOS.md** (if it exists) for known bugs related to changed files. If a TODO describes a bug this branch should fix, add it to the test plan.

6. **Report findings** scoped to the branch changes:
   - "Changed modules: N .cpp files, M headers"
   - For each: do existing tests pass? Any new failures?

### Full (default)
Build all targets, run full test suite, run static analysis, run memory checks. Produce health score. Takes 2-10 minutes depending on project size.

### Quick (`--quick`)
Build and run only smoke tests (fastest subset). Check: does it compile? Do unit tests pass? No memory analysis. Produce health score.

### Regression (`--regression <baseline>`)
Run full mode, then load `baseline.json` from a previous run. Diff: which issues are fixed? Which are new? What's the score delta?

---

## Workflow

### Phase 1: Initialize

1. Check toolchain (see Setup above)
2. Create output directories
3. Configure build if needed (cmake configure step)
4. Start timer for duration tracking

### Phase 2: Build

```bash
# Full build with all warnings enabled
cmake --build $BUILD_DIR --parallel $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4) 2>&1 | tee $REPORT_DIR/build.log
```

**Parse build output for:**
- Errors (compilation failures)
- Warnings: `-Wall -Wextra -Wpedantic` warnings are issues
  - `-Wunused-*`: dead code
  - `-Wshadow`: shadowed variables
  - `-Wconversion`: implicit narrowing
  - `-Wnull-dereference`: potential null deref
  - `-Wformat-security`: format string issues

**If build fails:** Document every error. STOP — no point running tests on code that doesn't compile.

### Phase 3: Unit Tests

```bash
ctest --test-dir $BUILD_DIR --output-on-failure -V 2>&1 | tee $REPORT_DIR/test.log
```

**Parse test output for:**
- Test pass/fail counts
- FAILED test names and assertion messages
- Timeout failures (test took too long → possible hang/infinite loop)
- Segfault or signal-based failures (immediate memory safety red flag)

For GTest output, look for:
- `[  FAILED  ] TestSuite.TestCase`
- `Segmentation fault` in test output
- `SIGABRT` from assert failures

### Phase 4: Static Analysis

```bash
# clang-tidy (if compile_commands.json available)
if [ -f $BUILD_DIR/compile_commands.json ]; then
  find . -name "*.cpp" -not -path "*/build/*" -not -path "*/test/*" | \
    head -50 | xargs clang-tidy -p $BUILD_DIR 2>&1 | tee $REPORT_DIR/clang-tidy.log
fi

# cppcheck (supplementary)
cppcheck --enable=all --suppress=missingIncludeSystem \
  --error-exitcode=1 --xml --xml-version=2 \
  -I include/ src/ 2>$REPORT_DIR/cppcheck.xml || true
```

**clang-tidy checks to flag as issues:**
- `bugprone-*`: likely bugs
- `cppcoreguidelines-*`: guideline violations
- `clang-analyzer-*`: static analysis findings
- `performance-*`: performance issues
- `modernize-*`: outdated C++ patterns (flag as informational)
- `readability-*`: readability issues (flag as low severity)

**cppcheck findings to flag:**
- `error` severity: always a critical issue
- `warning` severity: high issue
- `performance`, `style`: low/informational issue

### Phase 5: Memory Analysis

**AddressSanitizer (preferred — build-time):**
```bash
# Check if ASan build exists or build one
if cmake -S . -B build-asan -DCMAKE_BUILD_TYPE=Debug \
    -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer" \
    -DCMAKE_C_FLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer" 2>&1; then
  cmake --build build-asan --parallel $(nproc 2>/dev/null || echo 4) 2>&1
  ASAN_OPTIONS=halt_on_error=0 ctest --test-dir build-asan -V 2>&1 | tee $REPORT_DIR/asan.log
fi
```

**Valgrind (fallback — slower but works with any binary):**
```bash
# Run test binary under valgrind if ASan unavailable
valgrind --tool=memcheck --leak-check=full --show-leak-kinds=all \
  --error-exitcode=1 --xml=yes --xml-file=$REPORT_DIR/valgrind.xml \
  <test-binary> 2>&1 | tee $REPORT_DIR/valgrind.log || true
```

**Parse for:**
- Heap use-after-free: critical issue
- Buffer overflow/underflow: critical issue
- Memory leaks (reachable): high issue; (definitely lost): critical issue
- Uninitialized value reads: high issue
- Invalid free / double-free: critical issue
- Stack overflows (embedded projects): critical issue

### Phase 6: Wrap Up

1. **Compute health score** using the rubric below
2. **Write "Top 3 Things to Fix"** — highest-severity issues
3. **Write build health summary** — warning count, error count
4. **Write test health summary** — pass rate, failures
5. **Fill in report metadata** — date, duration, compiler, platform, build type
6. **Save baseline** — write `baseline.json` with:
   ```json
   {
     "date": "YYYY-MM-DD",
     "compiler": "clang++ 17 / g++ 14",
     "platform": "linux-x86_64",
     "healthScore": N,
     "issues": [{ "id": "ISSUE-001", "title": "...", "severity": "...", "category": "..." }],
     "categoryScores": { "build": N, "tests": N, "static_analysis": N, "memory": N }
   }
   ```

---

## Health Score Rubric

Compute each category score (0-100), then take the weighted average.

### Build (weight: 25%)
- 0 errors, 0 warnings → 100
- 0 errors, 1-5 warnings → 80
- 0 errors, 6-20 warnings → 60
- 0 errors, 20+ warnings → 40
- Any errors → 0

### Tests (weight: 35%)
- All pass → 100
- 1-2 failures → 60
- 3-10 failures → 30
- 10+ failures or segfault → 0

### Static Analysis (weight: 20%)
- 0 findings → 100
- 1-3 findings → 70
- 4-10 findings → 40
- 10+ findings → 10

### Memory Safety (weight: 20%)
- No leaks, no errors → 100
- Reachable leaks only → 70
- Definite leaks or use-after-free → 20
- Buffer overflow or double-free → 0

### Weights

| Category | Weight |
|----------|--------|
| Build | 25% |
| Tests | 35% |
| Static Analysis | 20% |
| Memory Safety | 20% |

### Final Score
`score = Σ (category_score × weight)`

---

## Project-Type Guidance

### Embedded / Bare-metal
- Check for dynamic memory allocation in ISR context (flag as critical)
- Verify stack usage estimates (`-fstack-usage` flag or manual analysis)
- Check for blocking operations (sleep, mutex lock) in interrupt handlers
- Verify volatile on hardware register accesses and shared ISR data
- Check for missing memory barriers (`__DSB`, `__DMB` on ARM)
- Cross-compilation: ensure tests run on simulator or target hardware, not host

### Server / Daemon
- Thread safety: check for data races (run with ThreadSanitizer: `-fsanitize=thread`)
- Check for blocking operations in event-loop callbacks
- Check for unbounded memory growth (caches without eviction, growing queues)
- Check for proper signal handling (`SIGPIPE`, `SIGTERM`, `SIGHUP`)
- Check for file descriptor leaks

### Application / Library
- Check public API stability (no ABI-breaking changes without version bump)
- Verify header-only code compiles cleanly across C++14/17/20 (if claimed)
- Check for ODR violations (multiple translation units defining same symbol)

---

## Important Rules

1. **Build errors block everything.** If it doesn't compile, nothing else matters.
2. **Memory errors are critical.** Any ASAN/valgrind error is high or critical severity.
3. **Never skip static analysis.** clang-tidy catches real bugs, not just style.
4. **Test failures are not suggestions.** A failing test is a bug report.
5. **Write incrementally.** Append each issue to the report as you find it. Don't batch.
6. **Platform matters.** Note the compiler, platform, and build flags in every report.
7. **Depth over breadth.** 5-10 well-documented issues > 20 vague observations.
8. **Never delete output files.** Build logs and reports accumulate — that's intentional.

Record baseline health score at end of Phase 6.

---

## Output Structure

```
.gstackplusplus/qa-reports/
├── qa-report-{project}-{YYYY-MM-DD}.md   # Structured report
├── build.log                             # Compiler output
├── test.log                              # Test runner output
├── clang-tidy.log                        # Static analysis output
├── asan.log                              # AddressSanitizer output
├── valgrind.xml                          # Valgrind XML output (if used)
└── baseline.json                         # For regression mode
```

Report filenames use the project name and date: `qa-report-myproject-2026-03-12.md`

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

## Phase 7: Triage

Sort all discovered issues by severity, then decide which to fix based on the selected tier:

- **Quick:** Fix critical + high only. Mark medium/low as "deferred."
- **Standard:** Fix critical + high + medium. Mark low as "deferred."
- **Exhaustive:** Fix all, including cosmetic/low severity.

Mark issues that cannot be fixed from source code (e.g., third-party widget bugs, infrastructure issues) as "deferred" regardless of tier.

---

## Phase 8: Fix Loop

For each fixable issue, in severity order:

### 8a. Locate source

```bash
# Grep for error messages, component names, route definitions
# Glob for file patterns matching the affected page
```

- Find the source file(s) responsible for the bug
- ONLY modify files directly related to the issue

### 8b. Fix

- Read the source code, understand the context
- Make the **minimal fix** — smallest change that resolves the issue
- Do NOT refactor surrounding code, add features, or "improve" unrelated things
- Apply YAGNI: fix only what is broken; do not add generality that isn't needed yet
- Apply KISS: prefer the simplest correct fix over the "elegant" one

### 8c. Commit

```bash
git add <only-changed-files>
git commit -m "fix(qa): ISSUE-NNN — short description"
```

- One commit per fix. Never bundle multiple fixes.
- Message format: `fix(qa): ISSUE-NNN — short description`

### 8d. Re-test

- Rebuild the affected target
- Re-run the relevant tests
- Re-run sanitizers on the fixed code
- Verify the issue no longer reproduces

```bash
cmake --build $BUILD_DIR --target <affected-target> 2>&1
ctest --test-dir $BUILD_DIR -R "<test-pattern>" -V 2>&1
# Re-run under ASan if the fix was memory-related
ASAN_OPTIONS=halt_on_error=0 <test-binary> 2>&1
```

### 8e. Classify

- **verified**: re-test confirms the fix works, no new errors introduced
- **best-effort**: fix applied but couldn't fully verify (e.g., needs auth state, external service)
- **reverted**: regression detected → `git revert HEAD` → mark issue as "deferred"

### 8e.5. Regression Test

Skip if: classification is not "verified", OR the fix is purely visual/CSS with no JS behavior, OR no test framework was detected AND user declined bootstrap.

**1. Study the project's existing test patterns:**

Read 2-3 test files closest to the fix (same directory, same code type). Match exactly:
- File naming, imports, assertion style, describe/it nesting, setup/teardown patterns
The regression test must look like it was written by the same developer.

**2. Trace the bug's codepath, then write a regression test:**

Before writing the test, trace the data flow through the code you just fixed:
- What input/state triggered the bug? (the exact precondition)
- What codepath did it follow? (which branches, which function calls)
- Where did it break? (the exact line/condition that failed)
- What other inputs could hit the same codepath? (edge cases around the fix)

The test MUST:
- Set up the precondition that triggered the bug (the exact state that made it break)
- Perform the action that exposed the bug
- Assert the correct behavior (NOT "it renders" or "it doesn't throw")
- If you found adjacent edge cases while tracing, test those too (e.g., null input, empty array, boundary value)
- Include full attribution comment:
  ```
  // Regression: ISSUE-NNN — {what broke}
  // Found by /qa on {YYYY-MM-DD}
  // Report: .gstackplusplus/qa-reports/qa-report-{domain}-{date}.md
  ```

Test type decision:
- Console error / JS exception / logic bug → unit or integration test
- Broken form / API failure / data flow bug → integration test with request/response
- Visual bug with JS behavior (broken dropdown, animation) → component test
- Pure CSS → skip (caught by QA reruns)

Generate unit tests. Mock all external dependencies (DB, API, Redis, file system).

Use auto-incrementing names to avoid collisions: check existing `{name}.regression-*.test.{ext}` files, take max number + 1.

**3. Run only the new test file:**

```bash
{detected test command} {new-test-file}
```

**4. Evaluate:**
- Passes → commit: `git commit -m "test(qa): regression test for ISSUE-NNN — {desc}"`
- Fails → fix test once. Still failing → delete test, defer.
- Taking >2 min exploration → skip and defer.

**5. WTF-likelihood exclusion:** Test commits don't count toward the heuristic.

### 8f. Self-Regulation (STOP AND EVALUATE)

Every 5 fixes (or after any revert), compute the WTF-likelihood:

```
WTF-LIKELIHOOD:
  Start at 0%
  Each revert:                +15%
  Each fix touching >3 files: +5%
  After fix 15:               +1% per additional fix
  All remaining Low severity: +10%
  Touching unrelated files:   +20%
```

**If WTF > 20%:** STOP immediately. Show the user what you've done so far. Ask whether to continue.

**Hard cap: 50 fixes.** After 50 fixes, stop regardless of remaining issues.

---

## Phase 9: Final QA

After all fixes are applied:

1. Re-run QA on all affected pages
2. Compute final health score
3. **If final score is WORSE than baseline:** WARN prominently — something regressed

---

## Phase 10: Report

Write the report to both local and project-scoped locations:

**Local:** `.gstackplusplus/qa-reports/qa-report-{domain}-{YYYY-MM-DD}.md`

**Project-scoped:** Write test outcome artifact for cross-session context:
```bash
eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-slug 2>/dev/null)
mkdir -p ~/.gstackplusplus/projects/$SLUG
```
Write to `~/.gstackplusplus/projects/{slug}/{user}-{branch}-test-outcome-{datetime}.md`

**Per-issue additions** (beyond standard report template):
- Fix Status: verified / best-effort / reverted / deferred
- Commit SHA (if fixed)
- Files Changed (if fixed)
- Before/After screenshots (if fixed)

**Summary section:**
- Total issues found
- Fixes applied (verified: X, best-effort: Y, reverted: Z)
- Deferred issues
- Health score delta: baseline → final

**PR Summary:** Include a one-line summary suitable for PR descriptions:
> "QA found N issues, fixed M (build: X, tests: Y, ASan: Z, static analysis: W), health score X → Y."

---

## Phase 11: TODOS.md Update

If the repo has a `TODOS.md`:

1. **New deferred bugs** → add as TODOs with severity, category, and repro steps
2. **Fixed bugs that were in TODOS.md** → annotate with "Fixed by /qa on {branch}, {date}"

---

## Additional Rules (qa-specific)

11. **Clean working tree required.** Refuse to start if `git status --porcelain` is non-empty.
12. **One commit per fix.** Never bundle multiple fixes into one commit.
13. **Only modify tests when generating regression tests in Phase 8e.5.** Never modify CI configuration. Never modify existing tests — only create new test files.
14. **Revert on regression.** If a fix makes things worse, `git revert HEAD` immediately.
15. **Self-regulate.** Follow the WTF-likelihood heuristic. When in doubt, stop and ask.

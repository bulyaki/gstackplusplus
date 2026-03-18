---
name: ship
version: 1.0.0
description: |
  Ship workflow for C++ projects: detect + merge base branch, build, run tests, run static analysis,
  review diff, bump VERSION, update CHANGELOG, commit, push, create PR.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
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

# Ship: Fully Automated Ship Workflow

You are running the `/ship` workflow. This is a **non-interactive, fully automated** workflow. Do NOT ask for confirmation at any step. The user said `/ship` which means DO IT. Run straight through and output the PR URL at the end.

**Only stop for:**
- On the base branch (abort)
- Merge conflicts that can't be auto-resolved (stop, show conflicts)
- Test failures (stop, show failures)
- Pre-landing review finds ASK items that need user judgment
- MINOR or MAJOR version bump needed (ask — see Step 4)
- Greptile review comments that need user decision (complex fixes, false positives)
- TODOS.md missing and user wants to create one (ask — see Step 5.5)
- TODOS.md disorganized and user wants to reorganize (ask — see Step 5.5)

**Never stop for:**
- Uncommitted changes (always include them)
- Version bump choice (auto-pick MICRO or PATCH — see Step 4)
- CHANGELOG content (auto-generate from diff)
- Commit message approval (auto-commit)
- Multi-file changesets (auto-split into bisectable commits)
- TODOS.md completed-item detection (auto-mark)
- Auto-fixable review findings (dead code, N+1, stale comments — fixed automatically)
- Test coverage gaps (auto-generate and commit, or flag in PR body)

---

## Step 1: Pre-flight

1. Check the current branch. If on the base branch or the repo's default branch, **abort**: "You're on the base branch. Ship from a feature branch."

2. Run `git status` (never use `-uall`). Uncommitted changes are always included — no need to ask.

3. Run `git diff <base>...HEAD --stat` and `git log <base>..HEAD --oneline` to understand what's being shipped.

4. Check review readiness:

## Review Readiness Dashboard

After completing the review, read the review log and config to display the dashboard.

```bash
eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-slug 2>/dev/null)
cat ~/.gstackplusplus/projects/$SLUG/$BRANCH-reviews.jsonl 2>/dev/null || echo "NO_REVIEWS"
echo "---CONFIG---"
~/.claude/skills/gstackplusplus/bin/gstackplusplus-config get skip_eng_review 2>/dev/null || echo "false"
```

Parse the output. Find the most recent entry for each skill (plan-ceo-review, plan-eng-review, plan-design-review, design-review-lite). Ignore entries with timestamps older than 7 days. For Design Review, show whichever is more recent between `plan-design-review` (full visual audit) and `design-review-lite` (code-level check). Append "(FULL)" or "(LITE)" to the status to distinguish. Display:

```
+====================================================================+
|                    REVIEW READINESS DASHBOARD                       |
+====================================================================+
| Review          | Runs | Last Run            | Status    | Required |
|-----------------|------|---------------------|-----------|----------|
| Eng Review      |  1   | 2026-03-16 15:00    | CLEAR     | YES      |
| CEO Review      |  0   | —                   | —         | no       |
| Design Review   |  0   | —                   | —         | no       |
+--------------------------------------------------------------------+
| VERDICT: CLEARED — Eng Review passed                                |
+====================================================================+
```

**Review tiers:**
- **Eng Review (required by default):** The only review that gates shipping. Covers architecture, code quality, tests, performance. Can be disabled globally with \`gstackplusplus-config set skip_eng_review true\` (the "don't bother me" setting).
- **CEO Review (optional):** Use your judgment. Recommend it for big product/business changes, new user-facing features, or scope decisions. Skip for bug fixes, refactors, infra, and cleanup.
- **Design Review (optional):** Use your judgment. Recommend it for UI/UX changes. Skip for backend-only, infra, or prompt-only changes.

**Verdict logic:**
- **CLEARED**: Eng Review has >= 1 entry within 7 days with status "clean" (or \`skip_eng_review\` is \`true\`)
- **NOT CLEARED**: Eng Review missing, stale (>7 days), or has open issues
- CEO and Design reviews are shown for context but never block shipping
- If \`skip_eng_review\` config is \`true\`, Eng Review shows "SKIPPED (global)" and verdict is CLEARED

If the Eng Review is NOT "CLEAR":

1. **Check for a prior override on this branch:**
   ```bash
   eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-slug 2>/dev/null)
   grep '"skill":"ship-review-override"' ~/.gstackplusplus/projects/$SLUG/$BRANCH-reviews.jsonl 2>/dev/null || echo "NO_OVERRIDE"
   ```
   If an override exists, display the dashboard and note "Review gate previously accepted — continuing." Do NOT ask again.

2. **If no override exists,** use AskUserQuestion:
   - Show that Eng Review is missing or has open issues
   - RECOMMENDATION: Choose C if the change is obviously trivial (< 20 lines, typo fix, config-only); Choose B for larger changes
   - Options: A) Ship anyway  B) Abort — run /plan-eng-review first  C) Change is too small to need eng review
   - If CEO Review is missing, mention as informational ("CEO Review not run — recommended for product changes") but do NOT block
   - For Design Review: run `eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-diff-scope <base> 2>/dev/null)`. If `SCOPE_FRONTEND=true` and no design review (plan-design-review or design-review-lite) exists in the dashboard, mention: "Design Review not run — this PR changes frontend code. The lite design check will run automatically in Step 3.5, but consider running /design-review for a full visual audit post-implementation." Still never block.

3. **If the user chooses A or C,** persist the decision so future `/ship` runs on this branch skip the gate:
   ```bash
   eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-slug 2>/dev/null)
   echo '{"skill":"ship-review-override","timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","decision":"USER_CHOICE"}' >> ~/.gstackplusplus/projects/$SLUG/$BRANCH-reviews.jsonl
   ```
   Substitute USER_CHOICE with "ship_anyway" or "not_relevant".

---

## Step 2: Merge the base branch (BEFORE tests)

Fetch and merge the base branch into the feature branch so tests run against the merged state:

```bash
git fetch origin <base> && git merge origin/<base> --no-edit
```

**If there are merge conflicts:** Try to auto-resolve if they are simple (VERSION, schema.rb, CHANGELOG ordering). If conflicts are complex or ambiguous, **STOP** and show them.

**If already up to date:** Continue silently.

---

## Step 2.5: Test Framework Bootstrap

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

---

## Step 3: Build and run tests (on merged code)

**Step 3a: Configure and build**

```bash
# Configure (if build dir doesn't exist or CMakeLists.txt changed)
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_EXPORT_COMPILE_COMMANDS=ON \
  -DCMAKE_CXX_FLAGS="-Wall -Wextra -Wpedantic" 2>&1 | tee /tmp/ship_cmake.txt

# Build all targets
cmake --build build --parallel $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4) \
  2>&1 | tee /tmp/ship_build.txt
```

**If build fails:** Show the errors and **STOP**. Do not proceed.

**Step 3b: Run unit and integration tests**

```bash
ctest --test-dir build --output-on-failure -V 2>&1 | tee /tmp/ship_tests.txt
```

**If any test fails:** Show the failures and **STOP**. Do not proceed.

**If all pass:** Continue silently — just note pass counts briefly.

**Step 3c: Static analysis (non-blocking gate)**

```bash
# clang-tidy on changed files only
git diff origin/<base> --name-only | grep -E "\.(cpp|cxx|cc)$" | \
  xargs clang-tidy -p build --warnings-as-errors="" 2>&1 | tee /tmp/ship_clang_tidy.txt || true
```

**If clang-tidy finds issues:** Report them in the PR body but do NOT stop — static analysis findings are informational at ship time (they should have been fixed in `/review`). Flag them prominently.

---

## Step 3.25: Sanitizer Run (conditional)

Run sanitizers when memory-related, concurrency, or security-sensitive files are changed.

**1. Check if the diff touches high-risk files:**

```bash
git diff origin/<base> --name-only
```

Match against these patterns:
- `src/**/*.cpp` — any source file change may introduce memory issues
- `include/**/*.hpp` — API changes may change ownership semantics
- `*thread*`, `*async*`, `*mutex*`, `*atomic*` — concurrency changes → ThreadSanitizer
- `*network*`, `*socket*`, `*parser*`, `*input*` — input handling → UBSan + ASan
- `*embedded*`, `*isr*`, `*interrupt*` — embedded code → stack analyzer

**If the diff is docs/comments/test-only:** Print "No high-risk files changed — skipping sanitizer run." and continue to Step 3.5.

**2. Build with sanitizers:**

```bash
# AddressSanitizer + UndefinedBehaviorSanitizer (most common)
cmake -S . -B build-asan -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer" \
  -DCMAKE_C_FLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer" 2>&1
cmake --build build-asan --parallel $(nproc 2>/dev/null || echo 4) 2>&1 | tee /tmp/ship_asan_build.txt
```

If concurrency files changed, also run ThreadSanitizer (mutually exclusive with ASan):
```bash
cmake -S . -B build-tsan -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_FLAGS="-fsanitize=thread -fno-omit-frame-pointer" 2>&1
cmake --build build-tsan --parallel $(nproc 2>/dev/null || echo 4) 2>&1
```

**3. Run tests under sanitizers:**

```bash
ASAN_OPTIONS=halt_on_error=0:detect_leaks=1 \
UBSAN_OPTIONS=halt_on_error=0:print_stacktrace=1 \
ctest --test-dir build-asan --output-on-failure -V 2>&1 | tee /tmp/ship_asan.txt
```

**4. Check results:**
- **If ASan or UBSan reports errors:** Show the errors and **STOP**. Memory safety errors are release blockers.
- **If ThreadSanitizer reports data races:** Show the races and **STOP**. Data races are undefined behavior.
- **If all pass:** Note results. Continue to Step 3.5.

**5. Save sanitizer output** — include in the PR body (Step 8).

---

## Step 3.4: Test Coverage Audit

100% coverage is the goal — every untested path is a path where bugs hide and vibe coding becomes yolo coding. Evaluate what was ACTUALLY coded (from the diff), not what was planned.

**0. Before/after test count:**

```bash
# Count test files before any generation
find . \( -name '*_test.cpp' -o -name '*_test.cxx' -o -name 'test_*.cpp' -o -name '*.test.cpp' \) \
  | grep -v build | wc -l
```

Store this number for the PR body.

**1. Trace every codepath changed** using `git diff origin/<base>...HEAD`:

Read every changed file. For each one, trace how data flows through the code — don't just list functions, actually follow the execution:

1. **Read the diff.** For each changed file, read the full file (not just the diff hunk) to understand context.
2. **Trace data flow.** Starting from each entry point (route handler, exported function, event listener, component render), follow the data through every branch:
   - Where does input come from? (request params, props, database, API call)
   - What transforms it? (validation, mapping, computation)
   - Where does it go? (database write, API response, rendered output, side effect)
   - What can go wrong at each step? (null/undefined, invalid input, network failure, empty collection)
3. **Diagram the execution.** For each changed file, draw an ASCII diagram showing:
   - Every function/method that was added or modified
   - Every conditional branch (if/else, switch, ternary, guard clause, early return)
   - Every error path (try/catch, rescue, error boundary, fallback)
   - Every call to another function (trace into it — does IT have untested branches?)
   - Every edge: what happens with null input? Empty array? Invalid type?

This is the critical step — you're building a map of every line of code that can execute differently based on input. Every branch in this diagram needs a test.

**2. Map caller flows, API entry points, error states, and principle violations (YAGNI/KISS/DRY/SOLID):**

Line coverage isn't enough — you need to cover how callers interact with the changed APIs. For each changed module, think through:

- **Caller flows:** What sequence of calls does a caller make? Map the full lifecycle (e.g., "caller creates Connection → calls connect() → sends data → closes"). Each step needs a test. Caller flow coverage is the C++ equivalent of user flow coverage — the caller is your user.
- **Boundary conditions:**
  - Empty input (empty string, null pointer, zero-length buffer, empty span)
  - Maximum-size input (buffer exactly full, integer at max value, size_t overflow)
  - Invalid input (out-of-range enum, null where non-null expected, misaligned pointer)
  - Concurrent callers (two threads calling the same object simultaneously)
- **Error paths:** For every error the code can return or throw:
  - Is there a test that exercises that specific error condition?
  - What happens when the caller ignores the error? (silent UB vs. safe failure)
  - Is the error message actionable?
- **Platform-specific paths:** For embedded code, are there ISR-safe paths tested separately from normal context? For server code, is the shutdown path tested?
- **Interaction edge cases:** What happens when the caller uses the API unexpectedly — calls a method after move, passes overlapping spans, constructs from a moved-from state?

Add these to your diagram alongside the code branches. An untested error path is as dangerous as a buffer overflow waiting to happen.

**3. Check each branch against existing tests:**

Go through your diagram branch by branch — both code paths AND user flows. For each one, search for a test that exercises it:
- Function `processPayment()` → look for `billing.test.ts`, `billing.spec.ts`, `test/billing_test.rb`
- An if/else → look for tests covering BOTH the true AND false path
- An error handler → look for a test that triggers that specific error condition
- A call to `helperFn()` that has its own branches → those branches need tests too
- A user flow → look for an integration or E2E test that walks through the journey
- An interaction edge case → look for a test that simulates the unexpected action

Quality scoring rubric:
- ★★★  Tests behavior with edge cases AND error paths
- ★★   Tests correct behavior, happy path only
- ★    Smoke test / existence check / trivial assertion (e.g., "it renders", "it doesn't throw")

**4. Output ASCII coverage diagram:**

Include BOTH code paths and caller flows in the same diagram:

```
CODE PATH COVERAGE
===========================
[+] src/net/connection.cpp
    │
    ├── Connection::connect()
    │   ├── [★★★ TESTED] Happy path + timeout + refused — connection_test.cpp:42
    │   ├── [GAP]         Already-connected state — NO TEST
    │   └── [GAP]         DNS lookup failure — NO TEST
    │
    └── Connection::send()
        ├── [★★  TESTED] Normal send — connection_test.cpp:89
        └── [★   TESTED] Partial write (checks non-throw only) — connection_test.cpp:101

CALLER FLOW COVERAGE
===========================
[+] Connection lifecycle (caller's perspective)
    │
    ├── [★★★ TESTED] Create → connect → send → close — lifecycle_test.cpp:15
    ├── [GAP]         Concurrent callers (thread safety) — NO TEST
    ├── [GAP]         ISR context (signal handler safe?) — NO TEST
    └── [★   TESTED] Move semantics (checks non-crash only) — lifecycle_test.cpp:40

[+] Error states callers will encounter
    │
    ├── [★★  TESTED] ECONNREFUSED propagated correctly — connection_test.cpp:58
    ├── [GAP]         Caller ignores error_code (silent UB?) — NO TEST
    └── [GAP]         Empty/zero-length send — NO TEST

─────────────────────────────────
COVERAGE: 5/12 paths tested (42%)
  Code paths: 3/5 (60%)
  Caller flows: 2/7 (29%)
QUALITY:  ★★★: 2  ★★: 2  ★: 1
GAPS: 7 paths need tests
─────────────────────────────────
```

**Fast path:** All paths covered → "Step 3.4: All new code paths have test coverage ✓" Continue.

**5. Generate tests for uncovered paths:**

If test framework detected (or bootstrapped in Step 2.5):
- Prioritize error handlers and edge cases first (happy paths are more likely already tested)
- Read 2-3 existing test files to match conventions exactly
- Generate unit tests. Mock all external dependencies (DB, API, Redis).
- Write tests that exercise the specific uncovered path with real assertions
- Run each test. Passes → commit as `test: coverage for {feature}`
- Fails → fix once. Still fails → revert, note gap in diagram.

Caps: 30 code paths max, 20 tests generated max (code + user flow combined), 2-min per-test exploration cap.

If no test framework AND user declined bootstrap → diagram only, no generation. Note: "Test generation skipped — no test framework configured."

**Diff is test-only changes:** Skip Step 3.4 entirely: "No new application code paths to audit."

**6. After-count and coverage summary:**

```bash
# Count test files after generation
find . \( -name '*_test.cpp' -o -name '*_test.cxx' -o -name 'test_*.cpp' -o -name '*.test.cpp' \) \
  | grep -v build | wc -l
```

For PR body: `Tests: {before} → {after} (+{delta} new)`
Coverage line: `Test Coverage Audit: N new code paths. M covered (X%). K tests generated, J committed.`

---

## Step 3.5: Pre-Landing Review

Review the diff for structural issues that tests don't catch.

1. Read `.claude/skills/review/checklist.md`. If the file cannot be read, **STOP** and report the error.

2. Run `git diff origin/<base>` to get the full diff (scoped to feature changes against the freshly-fetched base branch).

3. Apply the review checklist in two passes:
   - **Pass 1 (CRITICAL):** SQL & Data Safety, LLM Output Trust Boundary
   - **Pass 2 (INFORMATIONAL):** All remaining categories

## API Design Review (conditional, diff-scoped)

Check if the diff touches public interface files using `gstackplusplus-diff-scope`:

```bash
eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-diff-scope <base> 2>/dev/null)
```

**If `SCOPE_FRONTEND=false` and no header files changed:** Skip API design review silently. No output.

**If header files (.h, .hpp) appear in the diff OR `SCOPE_FRONTEND=true`:**

1. **Check for API.md.** If `API.md`, `DESIGN.md`, or similar exists in the repo root, read it. All API findings are calibrated against it — patterns blessed in API.md are not flagged. If not found, use the universal C++ API design principles below.

2. **Read `.claude/skills/review/api-design-checklist.md`.** If the file cannot be read, skip with a note: "API design checklist not found — skipping API design review."

3. **Read each changed header file** (full file, not just diff hunks). Header files are identified by .h, .hpp, .hxx extensions.

4. **Apply the API design checklist** against the changed headers. For each item:
   - **[HIGH] mechanical fix** (missing `const`, raw owning pointer, undocumented precondition): classify as AUTO-FIX
   - **[HIGH/MEDIUM] design judgment needed** (naming, error strategy, ownership model): classify as ASK
   - **[LOW] style/documentation**: present as "Consider — verify with team style guide or run /design-review"

5. **Include findings** in the review output under an "API Design Review" header, following the Fix-First flow in Step 5 — AUTO-FIX for mechanical fixes, ASK for everything else.

6. **Log the result** for the Review Readiness Dashboard:

```bash
eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-slug 2>/dev/null)
mkdir -p ~/.gstackplusplus/projects/$SLUG
echo '{"skill":"design-review-lite","timestamp":"TIMESTAMP","status":"STATUS","findings":N,"auto_fixed":M}' >> ~/.gstackplusplus/projects/$SLUG/$BRANCH-reviews.jsonl
```

Substitute: TIMESTAMP = ISO 8601 datetime, STATUS = "clean" if 0 findings or "issues_found", N = total findings, M = auto-fixed count.

   Include any design findings alongside the code review findings. They follow the same Fix-First flow below.

4. **Classify each finding as AUTO-FIX or ASK** per the Fix-First Heuristic in
   checklist.md. Critical findings lean toward ASK; informational lean toward AUTO-FIX.

5. **Auto-fix all AUTO-FIX items.** Apply each fix. Output one line per fix:
   `[AUTO-FIXED] [file:line] Problem → what you did`

6. **If ASK items remain,** present them in ONE AskUserQuestion:
   - List each with number, severity, problem, recommended fix
   - Per-item options: A) Fix  B) Skip
   - Overall RECOMMENDATION
   - If 3 or fewer ASK items, you may use individual AskUserQuestion calls instead

7. **After all fixes (auto + user-approved):**
   - If ANY fixes were applied: commit fixed files by name (`git add <fixed-files> && git commit -m "fix: pre-landing review fixes"`), then **STOP** and tell the user to run `/ship` again to re-test.
   - If no fixes applied (all ASK items skipped, or no issues found): continue to Step 4.

8. Output summary: `Pre-Landing Review: N issues — M auto-fixed, K asked (J fixed, L skipped)`

   If no issues found: `Pre-Landing Review: No issues found.`

Save the review output — it goes into the PR body in Step 8.

---

## Step 3.75: Address Greptile review comments (if PR exists)

Read `.claude/skills/review/greptile-triage.md` and follow the fetch, filter, classify, and **escalation detection** steps.

**If no PR exists, `gh` fails, API returns an error, or there are zero Greptile comments:** Skip this step silently. Continue to Step 4.

**If Greptile comments are found:**

Include a Greptile summary in your output: `+ N Greptile comments (X valid, Y fixed, Z FP)`

Before replying to any comment, run the **Escalation Detection** algorithm from greptile-triage.md to determine whether to use Tier 1 (friendly) or Tier 2 (firm) reply templates.

For each classified comment:

**VALID & ACTIONABLE:** Use AskUserQuestion with:
- The comment (file:line or [top-level] + body summary + permalink URL)
- `RECOMMENDATION: Choose A because [one-line reason]`
- Options: A) Fix now, B) Acknowledge and ship anyway, C) It's a false positive
- If user chooses A: apply the fix, commit the fixed files (`git add <fixed-files> && git commit -m "fix: address Greptile review — <brief description>"`), reply using the **Fix reply template** from greptile-triage.md (include inline diff + explanation), and save to both per-project and global greptile-history (type: fix).
- If user chooses C: reply using the **False Positive reply template** from greptile-triage.md (include evidence + suggested re-rank), save to both per-project and global greptile-history (type: fp).

**VALID BUT ALREADY FIXED:** Reply using the **Already Fixed reply template** from greptile-triage.md — no AskUserQuestion needed:
- Include what was done and the fixing commit SHA
- Save to both per-project and global greptile-history (type: already-fixed)

**FALSE POSITIVE:** Use AskUserQuestion:
- Show the comment and why you think it's wrong (file:line or [top-level] + body summary + permalink URL)
- Options:
  - A) Reply to Greptile explaining the false positive (recommended if clearly wrong)
  - B) Fix it anyway (if trivial)
  - C) Ignore silently
- If user chooses A: reply using the **False Positive reply template** from greptile-triage.md (include evidence + suggested re-rank), save to both per-project and global greptile-history (type: fp)

**SUPPRESSED:** Skip silently — these are known false positives from previous triage.

**After all comments are resolved:** If any fixes were applied, the tests from Step 3 are now stale. **Re-run tests** (Step 3) before continuing to Step 4. If no fixes were applied, continue to Step 4.

---

## Step 4: Version bump (auto-decide)

1. Read the current `VERSION` file (4-digit format: `MAJOR.MINOR.PATCH.MICRO`)

2. **Auto-decide the bump level based on the diff:**
   - Count lines changed (`git diff origin/<base>...HEAD --stat | tail -1`)
   - **MICRO** (4th digit): < 50 lines changed, trivial tweaks, typos, config
   - **PATCH** (3rd digit): 50+ lines changed, bug fixes, small-medium features
   - **MINOR** (2nd digit): **ASK the user** — only for major features or significant architectural changes
   - **MAJOR** (1st digit): **ASK the user** — only for milestones or breaking changes

3. Compute the new version:
   - Bumping a digit resets all digits to its right to 0
   - Example: `0.19.1.0` + PATCH → `0.19.2.0`

4. Write the new version to the `VERSION` file.

---

## Step 5: CHANGELOG (auto-generate)

1. Read `CHANGELOG.md` header to know the format.

2. Auto-generate the entry from **ALL commits on the branch** (not just recent ones):
   - Use `git log <base>..HEAD --oneline` to see every commit being shipped
   - Use `git diff <base>...HEAD` to see the full diff against the base branch
   - The CHANGELOG entry must be comprehensive of ALL changes going into the PR
   - If existing CHANGELOG entries on the branch already cover some commits, replace them with one unified entry for the new version
   - Categorize changes into applicable sections:
     - `### Added` — new features
     - `### Changed` — changes to existing functionality
     - `### Fixed` — bug fixes
     - `### Removed` — removed features
   - Write concise, descriptive bullet points
   - Insert after the file header (line 5), dated today
   - Format: `## [X.Y.Z.W] - YYYY-MM-DD`

**Do NOT ask the user to describe changes.** Infer from the diff and commit history.

---

## Step 5.5: TODOS.md (auto-update)

Cross-reference the project's TODOS.md against the changes being shipped. Mark completed items automatically; prompt only if the file is missing or disorganized.

Read `.claude/skills/review/TODOS-format.md` for the canonical format reference.

**1. Check if TODOS.md exists** in the repository root.

**If TODOS.md does not exist:** Use AskUserQuestion:
- Message: "GStack recommends maintaining a TODOS.md organized by skill/component, then priority (P0 at top through P4, then Completed at bottom). See TODOS-format.md for the full format. Would you like to create one?"
- Options: A) Create it now, B) Skip for now
- If A: Create `TODOS.md` with a skeleton (# TODOS heading + ## Completed section). Continue to step 3.
- If B: Skip the rest of Step 5.5. Continue to Step 6.

**2. Check structure and organization:**

Read TODOS.md and verify it follows the recommended structure:
- Items grouped under `## <Skill/Component>` headings
- Each item has `**Priority:**` field with P0-P4 value
- A `## Completed` section at the bottom

**If disorganized** (missing priority fields, no component groupings, no Completed section): Use AskUserQuestion:
- Message: "TODOS.md doesn't follow the recommended structure (skill/component groupings, P0-P4 priority, Completed section). Would you like to reorganize it?"
- Options: A) Reorganize now (recommended), B) Leave as-is
- If A: Reorganize in-place following TODOS-format.md. Preserve all content — only restructure, never delete items.
- If B: Continue to step 3 without restructuring.

**3. Detect completed TODOs:**

This step is fully automatic — no user interaction.

Use the diff and commit history already gathered in earlier steps:
- `git diff <base>...HEAD` (full diff against the base branch)
- `git log <base>..HEAD --oneline` (all commits being shipped)

For each TODO item, check if the changes in this PR complete it by:
- Matching commit messages against the TODO title and description
- Checking if files referenced in the TODO appear in the diff
- Checking if the TODO's described work matches the functional changes

**Be conservative:** Only mark a TODO as completed if there is clear evidence in the diff. If uncertain, leave it alone.

**4. Move completed items** to the `## Completed` section at the bottom. Append: `**Completed:** vX.Y.Z (YYYY-MM-DD)`

**5. Output summary:**
- `TODOS.md: N items marked complete (item1, item2, ...). M items remaining.`
- Or: `TODOS.md: No completed items detected. M items remaining.`
- Or: `TODOS.md: Created.` / `TODOS.md: Reorganized.`

**6. Defensive:** If TODOS.md cannot be written (permission error, disk full), warn the user and continue. Never stop the ship workflow for a TODOS failure.

Save this summary — it goes into the PR body in Step 8.

---

## Step 6: Commit (bisectable chunks)

**Goal:** Create small, logical commits that work well with `git bisect` and help LLMs understand what changed.

1. Analyze the diff and group changes into logical commits. Each commit should represent **one coherent change** — not one file, but one logical unit.

2. **Commit ordering** (earlier commits first):
   - **Build system:** CMakeLists.txt changes, toolchain config, dependency additions
   - **Interfaces/headers:** .h/.hpp changes (API contracts before implementations)
   - **Implementations:** .cpp files implementing the headers (with their tests)
   - **Tests:** additional test files not already bundled with their implementation
   - **VERSION + CHANGELOG + TODOS.md:** always in the final commit

3. **Rules for splitting:**
   - A header and its implementation go in the same commit
   - A source file and its test file go in the same commit
   - CMakeLists.txt changes go with the target they affect
   - Refactors are their own commit (separate from behavior changes)
   - If the total diff is small (< 50 lines across < 4 files), a single commit is fine

4. **Each commit must be independently valid** — no broken imports, no references to code that doesn't exist yet. Order commits so dependencies come first.

5. Compose each commit message:
   - First line: `<type>: <summary>` (type = feat/fix/chore/refactor/docs)
   - Body: brief description of what this commit contains
   - Only the **final commit** (VERSION + CHANGELOG) gets the version tag and co-author trailer:

```bash
git commit -m "$(cat <<'EOF'
chore: bump version and changelog (vX.Y.Z.W)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Step 7: Push

Push to the remote with upstream tracking:

```bash
git push -u origin <branch-name>
```

---

## Step 8: Create PR

Create a pull request using `gh`:

```bash
gh pr create --base <base> --title "<type>: <summary>" --body "$(cat <<'EOF'
## Summary
<bullet points from CHANGELOG>

## Build & Test Results
<build status: compiler, warnings count>
<test results: pass/fail counts, any failures>

## Test Coverage
<coverage diagram from Step 3.4, or "All new code paths have test coverage.">
<If Step 3.4 ran: "Tests: {before} → {after} (+{delta} new)">

## Pre-Landing Review
<findings from Step 3.5 code review, or "No issues found.">

## API Design Review
<If header files changed: "API Design Review (lite): N findings — M auto-fixed, K skipped.">
<If no header files changed: "No public headers changed — API design review skipped.">

## Sanitizer Results
<If sanitizers ran: ASan/UBSan/TSan pass/fail. If skipped: "No high-risk files changed — sanitizer run skipped.">

## Static Analysis
<clang-tidy findings summary, or "No static analysis findings.">

## Greptile Review
<If Greptile comments were found: bullet list with [FIXED] / [FALSE POSITIVE] / [ALREADY FIXED] tag + one-line summary per comment>
<If no Greptile comments found: "No Greptile comments.">
<If no PR existed during Step 3.75: omit this section entirely>

## TODOS
<If items marked complete: bullet list of completed items with version>
<If no items completed: "No TODO items completed in this PR.">
<If TODOS.md created or reorganized: note that>
<If TODOS.md doesn't exist and user skipped: omit this section>

## Test plan
- [x] Build passes with zero errors (compiler: clang++/g++, flags: -Wall -Wextra)
- [x] All unit tests pass (N tests, 0 failures)
- [x] No ASan/UBSan errors detected
- [x] clang-tidy: N findings (M auto-fixed)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Output the PR URL** — this should be the final output the user sees.

---

## Important Rules

- **Never skip tests.** If tests fail, stop.
- **Never skip the pre-landing review.** If checklist.md is unreadable, stop.
- **Never force push.** Use regular `git push` only.
- **Never ask for confirmation** except for MINOR/MAJOR version bumps and pre-landing review ASK items (batched into at most one AskUserQuestion).
- **Always use the 4-digit version format** from the VERSION file.
- **Date format in CHANGELOG:** `YYYY-MM-DD`
- **Split commits for bisectability** — each commit = one logical change.
- **TODOS.md completion detection must be conservative.** Only mark items as completed when the diff clearly shows the work is done.
- **Use Greptile reply templates from greptile-triage.md.** Every reply includes evidence (inline diff, code references, re-rank suggestion). Never post vague replies.
- **Step 3.4 generates coverage tests.** They must pass before committing. Never commit failing tests.
- **The goal is: user says `/ship`, next thing they see is the review + PR URL.**

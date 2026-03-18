---
name: qa-only
version: 2.0.0
description: |
  Report-only QA for C++ applications, servers, and embedded projects. Builds the project,
  runs tests, runs static analysis, runs memory checkers — then produces a structured report
  with health score and repro steps but never fixes anything. Use when asked to "just report
  bugs", "qa report only", or "test but don't fix". For the full build-test-fix-verify loop,
  use /qa instead.
allowed-tools:
  - Bash
  - Read
  - Write
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

# /qa-only: Report-Only QA Testing

You are a QA engineer. Test C++ projects like a real engineer — build with warnings enabled, run all tests, run static analysis, check memory safety. Produce a structured report with evidence. **NEVER fix anything.**

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

**If no target is given and you're on a feature branch:** Automatically enter **diff-aware mode** — scope to files changed vs. the base branch.

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

**Create output directories:**

```bash
REPORT_DIR=".gstackplusplus/qa-reports"
mkdir -p "$REPORT_DIR"
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

---

## Output

Write the report to both local and project-scoped locations:

**Local:** `.gstackplusplus/qa-reports/qa-report-{project}-{YYYY-MM-DD}.md`

**Project-scoped:** Write test outcome artifact for cross-session context:
```bash
eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-slug 2>/dev/null)
mkdir -p ~/.gstackplusplus/projects/$SLUG
```
Write to `~/.gstackplusplus/projects/{slug}/{user}-{branch}-test-outcome-{datetime}.md`

### Output Structure

```
.gstackplusplus/qa-reports/
├── qa-report-{project}-{YYYY-MM-DD}.md    # Structured report
├── build.log                              # Compiler output with warnings
├── test.log                               # Test runner output
├── clang-tidy.log                         # Static analysis output
├── asan.log                               # AddressSanitizer output
├── valgrind.xml                           # Valgrind XML output (if used)
└── baseline.json                          # For regression mode
```

Report filenames use the project name and date: `qa-report-myproject-2026-03-12.md`

---

## Additional Rules (qa-only specific)

11. **Never fix bugs.** Find and document only. Do not edit source files or suggest inline fixes in the report. Your job is to report what's broken with repro steps — use `/qa` for the build-test-fix-verify loop.
12. **No test framework detected?** If the project has no test infrastructure (no CMakeLists.txt test targets, no test directories), include in the report summary: "No test framework detected. Run `/qa` to bootstrap one and enable regression test generation."

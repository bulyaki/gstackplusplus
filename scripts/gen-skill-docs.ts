#!/usr/bin/env bun
/**
 * Generate SKILL.md files from .tmpl templates.
 *
 * Pipeline:
 *   read .tmpl → find {{PLACEHOLDERS}} → resolve from source → format → write .md
 *
 * Supports --dry-run: generate to memory, exit 1 if different from committed file.
 * Used by skill:check and CI freshness checks.
 */

import { COMMAND_DESCRIPTIONS } from '../browse/src/commands';
import { SNAPSHOT_FLAGS } from '../browse/src/snapshot';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Placeholder Resolvers ──────────────────────────────────

function generateCommandReference(): string {
  // Group commands by category
  const groups = new Map<string, Array<{ command: string; description: string; usage?: string }>>();
  for (const [cmd, meta] of Object.entries(COMMAND_DESCRIPTIONS)) {
    const list = groups.get(meta.category) || [];
    list.push({ command: cmd, description: meta.description, usage: meta.usage });
    groups.set(meta.category, list);
  }

  // Category display order
  const categoryOrder = [
    'Navigation', 'Reading', 'Interaction', 'Inspection',
    'Visual', 'Snapshot', 'Meta', 'Tabs', 'Server',
  ];

  const sections: string[] = [];
  for (const category of categoryOrder) {
    const commands = groups.get(category);
    if (!commands || commands.length === 0) continue;

    // Sort alphabetically within category
    commands.sort((a, b) => a.command.localeCompare(b.command));

    sections.push(`### ${category}`);
    sections.push('| Command | Description |');
    sections.push('|---------|-------------|');
    for (const cmd of commands) {
      const display = cmd.usage ? `\`${cmd.usage}\`` : `\`${cmd.command}\``;
      sections.push(`| ${display} | ${cmd.description} |`);
    }
    sections.push('');
  }

  return sections.join('\n').trimEnd();
}

function generateSnapshotFlags(): string {
  const lines: string[] = [
    'The snapshot is your primary tool for understanding and interacting with pages.',
    '',
    '```',
  ];

  for (const flag of SNAPSHOT_FLAGS) {
    const label = flag.valueHint ? `${flag.short} ${flag.valueHint}` : flag.short;
    lines.push(`${label.padEnd(10)}${flag.long.padEnd(24)}${flag.description}`);
  }

  lines.push('```');
  lines.push('');
  lines.push('All flags can be combined freely. `-o` only applies when `-a` is also used.');
  lines.push('Example: `$B snapshot -i -a -C -o /tmp/annotated.png`');
  lines.push('');
  lines.push('**Ref numbering:** @e refs are assigned sequentially (@e1, @e2, ...) in tree order.');
  lines.push('@c refs from `-C` are numbered separately (@c1, @c2, ...).');
  lines.push('');
  lines.push('After snapshot, use @refs as selectors in any command:');
  lines.push('```bash');
  lines.push('$B click @e3       $B fill @e4 "value"     $B hover @e1');
  lines.push('$B html @e2        $B css @e5 "color"      $B attrs @e6');
  lines.push('$B click @c1       # cursor-interactive ref (from -C)');
  lines.push('```');
  lines.push('');
  lines.push('**Output format:** indented accessibility tree with @ref IDs, one element per line.');
  lines.push('```');
  lines.push('  @e1 [heading] "Welcome" [level=1]');
  lines.push('  @e2 [textbox] "Email"');
  lines.push('  @e3 [button] "Submit"');
  lines.push('```');
  lines.push('');
  lines.push('Refs are invalidated on navigation — run `snapshot` again after `goto`.');

  return lines.join('\n');
}

function generatePreamble(): string {
  return `## Preamble (run first)

\`\`\`bash
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
\`\`\`

If output shows \`UPGRADE_AVAILABLE <old> <new>\`: read \`~/.claude/skills/gstackplusplus/gstackplusplus-upgrade/SKILL.md\` and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise AskUserQuestion with 4 options, write snooze state if declined). If \`JUST_UPGRADED <from> <to>\`: tell user "Running gstack++ v{to} (just updated!)" and continue.

If \`LAKE_INTRO\` is \`no\`: Before continuing, introduce the Completeness Principle.
Tell the user: "gstack++ follows the **Boil the Lake** principle — always do the complete
thing when AI makes the marginal cost near-zero. Read more: https://garryslist.org/posts/boil-the-ocean"
Then offer to open the essay in their default browser:

\`\`\`bash
open https://garryslist.org/posts/boil-the-ocean
touch ~/.gstackplusplus/.completeness-intro-seen
\`\`\`

Only run \`open\` if the user says yes. Always run \`touch\` to mark as seen. This only happens once.

## AskUserQuestion Format

**ALWAYS follow this structure for every AskUserQuestion call:**
1. **Re-ground:** State the project, the current branch (use the \`_BRANCH\` value printed by the preamble — NOT any branch from conversation history or gitStatus), and the current plan/task. (1-2 sentences)
2. **Simplify:** Explain the problem in plain English a smart 16-year-old could follow. No raw function names, no internal jargon, no implementation details. Use concrete examples and analogies. Say what it DOES, not what it's called.
3. **Recommend:** \`RECOMMENDATION: Choose [X] because [one-line reason]\` — always prefer the complete option over shortcuts (see Completeness Principle). Include \`Completeness: X/10\` for each option. Calibration: 10 = complete implementation (all edge cases, full coverage), 7 = covers happy path but skips some edges, 3 = shortcut that defers significant work. If both options are 8+, pick the higher; if one is ≤5, flag it.
4. **Options:** Lettered options: \`A) ... B) ... C) ...\` — when an option involves effort, show both scales: \`(human: ~X / CC: ~Y)\`

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

If \`_CONTRIB\` is \`true\`: you are in **contributor mode**. You're a gstack++ user who also helps make it better.

**At the end of each major workflow step** (not after every single command), reflect on the gstack++ tooling you used. Rate your experience 0 to 10. If it wasn't a 10, think about why. If there is an obvious, actionable bug OR an insightful, interesting thing that could have been done better by gstack++ code or skill markdown — file a field report. Maybe our contributor will help make us better!

**Calibration — this is the bar:** For example, \`$B js "await fetch(...)"\` used to fail with \`SyntaxError: await is only valid in async functions\` because gstack++ didn't wrap expressions in async context. Small, but the input was reasonable and gstack++ should have handled it — that's the kind of thing worth filing. Things less consequential than this, ignore.

**NOT worth filing:** user's app bugs, network errors to user's URL, auth failures on user's site, user's own JS logic bugs.

**To file:** write \`~/.gstackplusplus/contributor-logs/{slug}.md\` with **all sections below** (do not truncate — include every section through the Date/Version footer):

\`\`\`
# {Title}

Hey gstack++ team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**My rating:** {0-10} — {one sentence on why it wasn't a 10}

## Steps to reproduce
1. {step}

## Raw output
\`\`\`
{paste the actual error or unexpected output here}
\`\`\`

## What would make this a 10
{one sentence: what gstack++ should have done differently}

**Date:** {YYYY-MM-DD} | **Version:** {gstack++ version} | **Skill:** /{skill}
\`\`\`

Slug: lowercase, hyphens, max 60 chars (e.g. \`browse-js-no-await\`). Skip if file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell user: "Filed gstack++ field report: {title}"`;
}

function generateBrowseSetup(): string {
  return `## SETUP (run this toolchain check BEFORE any build/test command)

\`\`\`bash
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
[ -d build ] && echo "BUILD_DIR:build" || \
[ -d cmake-build-debug ] && echo "BUILD_DIR:cmake-build-debug" || \
[ -d out ] && echo "BUILD_DIR:out" || echo "BUILD_DIR:NONE"
# Detect project type
[ -f CMakeLists.txt ] && echo "BUILD_SYSTEM:cmake"
[ -f Makefile ] && echo "BUILD_SYSTEM:make"
[ -f meson.build ] && echo "BUILD_SYSTEM:meson"
[ -f BUILD ] || [ -f BUILD.bazel ] && echo "BUILD_SYSTEM:bazel"
\`\`\`

If \`CMAKE:MISSING\` or \`CXX:MISSING\`: warn the user that the required toolchain is not installed.
Suggest: \`sudo apt-get install cmake g++ clang clang-tidy valgrind\` (Linux) or \`brew install cmake llvm valgrind\` (macOS).

If \`BUILD_DIR:NONE\` and \`BUILD_SYSTEM:cmake\`: the project has not been configured yet.
Run the CMake configure step before building:
\`\`\`bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
\`\`\`

Store the build directory as \`$BUILD_DIR\` for use in subsequent steps.`;
}

function generateBaseBranchDetect(): string {
  return `## Step 0: Detect base branch

Determine which branch this PR targets. Use the result as "the base branch" in all subsequent steps.

1. Check if a PR already exists for this branch:
   \`gh pr view --json baseRefName -q .baseRefName\`
   If this succeeds, use the printed branch name as the base branch.

2. If no PR exists (command fails), detect the repo's default branch:
   \`gh repo view --json defaultBranchRef -q .defaultBranchRef.name\`

3. If both commands fail, fall back to \`main\`.

Print the detected base branch name. In every subsequent \`git diff\`, \`git log\`,
\`git fetch\`, \`git merge\`, and \`gh pr create\` command, substitute the detected
branch name wherever the instructions say "the base branch."

---`;
}

function generateQAMethodology(): string {
  return `## Modes

### Diff-aware (automatic when on a feature branch)

This is the **primary mode** for developers verifying their work. When the user says \`/qa\` without a specific target and the repo is on a feature branch, automatically:

1. **Analyze the branch diff** to understand what changed:
   \`\`\`bash
   git diff main...HEAD --name-only
   git log main..HEAD --oneline
   \`\`\`

2. **Identify affected modules/components** from the changed files:
   - Source files (.cpp, .cxx, .cc) → which compiled units changed
   - Header files (.h, .hpp) → which API contracts or data structures changed
   - CMakeLists.txt changes → which build targets were added/modified
   - Test files → which tests were added or modified

3. **Determine test scope** — build and run only tests related to changed modules:
   \`\`\`bash
   cmake --build $BUILD_DIR --target <affected-target> 2>&1
   ctest --test-dir $BUILD_DIR -R "<test-pattern>" -V 2>&1
   \`\`\`

4. **Cross-reference with commit messages** to understand *intent* — what should the change do? Verify tests cover that intent.

5. **Check TODOS.md** (if it exists) for known bugs related to changed files. If a TODO describes a bug this branch should fix, add it to the test plan.

6. **Report findings** scoped to the branch changes:
   - "Changed modules: N .cpp files, M headers"
   - For each: do existing tests pass? Any new failures?

### Full (default)
Build all targets, run full test suite, run static analysis, run memory checks. Produce health score. Takes 2-10 minutes depending on project size.

### Quick (\`--quick\`)
Build and run only smoke tests (fastest subset). Check: does it compile? Do unit tests pass? No memory analysis. Produce health score.

### Regression (\`--regression <baseline>\`)
Run full mode, then load \`baseline.json\` from a previous run. Diff: which issues are fixed? Which are new? What's the score delta?

---

## Workflow

### Phase 1: Initialize

1. Check toolchain (see Setup above)
2. Create output directories
3. Configure build if needed (cmake configure step)
4. Start timer for duration tracking

### Phase 2: Build

\`\`\`bash
# Full build with all warnings enabled
cmake --build $BUILD_DIR --parallel $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4) 2>&1 | tee $REPORT_DIR/build.log
\`\`\`

**Parse build output for:**
- Errors (compilation failures)
- Warnings: \`-Wall -Wextra -Wpedantic\` warnings are issues
  - \`-Wunused-*\`: dead code
  - \`-Wshadow\`: shadowed variables
  - \`-Wconversion\`: implicit narrowing
  - \`-Wnull-dereference\`: potential null deref
  - \`-Wformat-security\`: format string issues

**If build fails:** Document every error. STOP — no point running tests on code that doesn't compile.

### Phase 3: Unit Tests

\`\`\`bash
ctest --test-dir $BUILD_DIR --output-on-failure -V 2>&1 | tee $REPORT_DIR/test.log
\`\`\`

**Parse test output for:**
- Test pass/fail counts
- FAILED test names and assertion messages
- Timeout failures (test took too long → possible hang/infinite loop)
- Segfault or signal-based failures (immediate memory safety red flag)

For GTest output, look for:
- \`[  FAILED  ] TestSuite.TestCase\`
- \`Segmentation fault\` in test output
- \`SIGABRT\` from assert failures

### Phase 4: Static Analysis

\`\`\`bash
# clang-tidy (if compile_commands.json available)
if [ -f $BUILD_DIR/compile_commands.json ]; then
  find . -name "*.cpp" -not -path "*/build/*" -not -path "*/test/*" | \\
    head -50 | xargs clang-tidy -p $BUILD_DIR 2>&1 | tee $REPORT_DIR/clang-tidy.log
fi

# cppcheck (supplementary)
cppcheck --enable=all --suppress=missingIncludeSystem \\
  --error-exitcode=1 --xml --xml-version=2 \\
  -I include/ src/ 2>$REPORT_DIR/cppcheck.xml || true
\`\`\`

**clang-tidy checks to flag as issues:**
- \`bugprone-*\`: likely bugs
- \`cppcoreguidelines-*\`: guideline violations
- \`clang-analyzer-*\`: static analysis findings
- \`performance-*\`: performance issues
- \`modernize-*\`: outdated C++ patterns (flag as informational)
- \`readability-*\`: readability issues (flag as low severity)

**cppcheck findings to flag:**
- \`error\` severity: always a critical issue
- \`warning\` severity: high issue
- \`performance\`, \`style\`: low/informational issue

### Phase 5: Memory Analysis

**AddressSanitizer (preferred — build-time):**
\`\`\`bash
# Check if ASan build exists or build one
if cmake -S . -B build-asan -DCMAKE_BUILD_TYPE=Debug \\
    -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer" \\
    -DCMAKE_C_FLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer" 2>&1; then
  cmake --build build-asan --parallel $(nproc 2>/dev/null || echo 4) 2>&1
  ASAN_OPTIONS=halt_on_error=0 ctest --test-dir build-asan -V 2>&1 | tee $REPORT_DIR/asan.log
fi
\`\`\`

**Valgrind (fallback — slower but works with any binary):**
\`\`\`bash
# Run test binary under valgrind if ASan unavailable
valgrind --tool=memcheck --leak-check=full --show-leak-kinds=all \\
  --error-exitcode=1 --xml=yes --xml-file=$REPORT_DIR/valgrind.xml \\
  <test-binary> 2>&1 | tee $REPORT_DIR/valgrind.log || true
\`\`\`

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
6. **Save baseline** — write \`baseline.json\` with:
   \`\`\`json
   {
     "date": "YYYY-MM-DD",
     "compiler": "clang++ 17 / g++ 14",
     "platform": "linux-x86_64",
     "healthScore": N,
     "issues": [{ "id": "ISSUE-001", "title": "...", "severity": "...", "category": "..." }],
     "categoryScores": { "build": N, "tests": N, "static_analysis": N, "memory": N }
   }
   \`\`\`

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
\`score = Σ (category_score × weight)\`

---

## Project-Type Guidance

### Embedded / Bare-metal
- Check for dynamic memory allocation in ISR context (flag as critical)
- Verify stack usage estimates (\`-fstack-usage\` flag or manual analysis)
- Check for blocking operations (sleep, mutex lock) in interrupt handlers
- Verify volatile on hardware register accesses and shared ISR data
- Check for missing memory barriers (\`__DSB\`, \`__DMB\` on ARM)
- Cross-compilation: ensure tests run on simulator or target hardware, not host

### Server / Daemon
- Thread safety: check for data races (run with ThreadSanitizer: \`-fsanitize=thread\`)
- Check for blocking operations in event-loop callbacks
- Check for unbounded memory growth (caches without eviction, growing queues)
- Check for proper signal handling (\`SIGPIPE\`, \`SIGTERM\`, \`SIGHUP\`)
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
8. **Never delete output files.** Build logs and reports accumulate — that's intentional.`;
}

function generateDesignReviewLite(): string {
  return `## API Design Review (conditional, diff-scoped)

Check if the diff touches public interface files using \`gstackplusplus-diff-scope\`:

\`\`\`bash
eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-diff-scope <base> 2>/dev/null)
\`\`\`

**If \`SCOPE_FRONTEND=false\` and no header files changed:** Skip API design review silently. No output.

**If header files (.h, .hpp) appear in the diff OR \`SCOPE_FRONTEND=true\`:**

1. **Check for API.md.** If \`API.md\`, \`DESIGN.md\`, or similar exists in the repo root, read it. All API findings are calibrated against it — patterns blessed in API.md are not flagged. If not found, use the universal C++ API design principles below.

2. **Read \`.claude/skills/review/api-design-checklist.md\`.** If the file cannot be read, skip with a note: "API design checklist not found — skipping API design review."

3. **Read each changed header file** (full file, not just diff hunks). Header files are identified by .h, .hpp, .hxx extensions.

4. **Apply the API design checklist** against the changed headers. For each item:
   - **[HIGH] mechanical fix** (missing \`const\`, raw owning pointer, undocumented precondition): classify as AUTO-FIX
   - **[HIGH/MEDIUM] design judgment needed** (naming, error strategy, ownership model): classify as ASK
   - **[LOW] style/documentation**: present as "Consider — verify with team style guide or run /design-review"

5. **Include findings** in the review output under an "API Design Review" header, following the Fix-First flow in Step 5 — AUTO-FIX for mechanical fixes, ASK for everything else.

6. **Log the result** for the Review Readiness Dashboard:

\`\`\`bash
eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-slug 2>/dev/null)
mkdir -p ~/.gstackplusplus/projects/$SLUG
echo '{"skill":"design-review-lite","timestamp":"TIMESTAMP","status":"STATUS","findings":N,"auto_fixed":M}' >> ~/.gstackplusplus/projects/$SLUG/$BRANCH-reviews.jsonl
\`\`\`

Substitute: TIMESTAMP = ISO 8601 datetime, STATUS = "clean" if 0 findings or "issues_found", N = total findings, M = auto-fixed count.`;
}
// NOTE: api-design-checklist.md is a subset of this methodology for code-level detection.
// When adding items here, also update review/api-design-checklist.md, and vice versa.
function generateDesignMethodology(): string {
  return `## Modes

### Full (default)
Systematic review of all public headers and interfaces. Full checklist evaluation, Doxygen coverage check, error handling audit. Produces complete API design report with letter grades.

### Quick (\`--quick\`)
Public headers only, first-impression API review + abbreviated checklist. Fastest path to a design score.

### Deep (\`--deep\`)
Comprehensive review: all headers + key source files, interaction flows, cross-platform portability. For pre-release API freezes or major library refactors.

### Diff-aware (automatic when on a feature branch)
When on a feature branch, scope to headers and interfaces changed:
1. Analyze the branch diff: \`git diff main...HEAD --name-only\`
2. Find changed .h/.hpp files — these define the public contract
3. Audit only changed APIs, compare design quality before/after

### Regression (\`--regression\` or previous \`api-design-baseline.json\` found)
Run full audit, then load previous \`api-design-baseline.json\`. Compare: per-category grade deltas, new findings, resolved findings. Output regression table in report.

---

## Phase 1: First Impression

Form a gut reaction about the API before deep analysis.

1. List all public headers:
   \`\`\`bash
   find include/ -name "*.h" -o -name "*.hpp" 2>/dev/null | sort
   \`\`\`
2. Read the primary public header(s)
3. Write the **First Impression**:
   - "The API communicates **[what]**." (intent clear at a glance?)
   - "I notice **[observation]**." (naming inconsistency? unclear ownership? good symmetry?)
   - "The 3 first design concerns are: **[1]**, **[2]**, **[3]**."
   - "If I had to describe this API in one word: **[word]**."

A good API is like a good tool: it does one thing, it's hard to misuse, and the happy path is the obvious path.

---

## Phase 2: API Contract Extraction

Extract the actual API shape:

\`\`\`bash
# List all public functions/classes/methods
grep -h "^[A-Za-z].*(" include/**/*.h include/**/*.hpp 2>/dev/null | grep -v "//" | head -50

# Check for Doxygen coverage
grep -hl "@brief\\|@param\\|@return\\|///" include/**/*.h include/**/*.hpp 2>/dev/null | wc -l
\`\`\`

Structure findings as an **Inferred API Design System**:
- **Naming conventions:** snake_case vs camelCase vs PascalCase — consistent?
- **Ownership model:** raw pointers vs unique_ptr vs shared_ptr — consistent?
- **Error reporting:** exceptions vs error codes vs std::expected vs callbacks — consistent?
- **Const correctness:** are read-only operations marked \`const\`?

After extraction, offer: *"Want me to save this as your API.md? I can document these conventions as your project's API design baseline."*

---

## Phase 3: Module-by-Module API Audit

For each public header/module in scope, read the full file and apply the checklist:

### API Design Audit Checklist (8 categories, ~60 items)

**1. Naming & Clarity** (10 items)
- Function names are verbs describing what they do (\`compute_checksum\` not \`checksum\`)
- Types are nouns; predicates end in \`_is\` or similar (\`is_valid\`, \`has_data\`)
- No abbreviations that require domain knowledge to decode
- Consistent naming conventions across the entire API surface
- Parameter names match their purpose — no single-letter names except loop indices
- Boolean parameters avoided in favor of enum types (no \`void set_mode(bool fast)\`)
- No implicit units — encode units in name or type (\`timeout_ms\` not \`timeout\`)
- Output parameters clearly named or avoided in favor of return values
- Template parameter names descriptive (\`template<typename Container>\` not \`template<typename T>\`)
- Constructor parameters unambiguous — does parameter order matter? Could callers swap them?

**2. Ownership & Lifetime** (10 items)
- Raw owning pointers eliminated — use \`unique_ptr\`, \`shared_ptr\`, or value types
- Non-owning pointers documented as such (or use spans/views)
- Lifetime requirements documented in Doxygen (\`@note object must outlive this call\`)
- Object lifetimes clearly specified for complex ownership graphs
- RAII used for all resources (file handles, sockets, mutexes, memory)
- Factory functions return smart pointers, not raw pointers
- Move semantics supported where copy is expensive
- Rule of 0 preferred — let compilers generate special members when possible
- Deleted copy/move constructors documented with reason
- No implicit global state that affects object lifetime

**3. Error Handling** (8 items)
- Error handling strategy is consistent (exceptions, error codes, or \`std::expected\`)
- No mixed strategies in the same module without reason
- Error types are specific — \`FileNotFoundError\` not \`RuntimeError\`
- No silent failures — every error is reported
- Error messages are actionable: what happened + what to do
- Precondition violations: documented and either asserted or return error (not silent UB)
- Exception safety: at minimum basic guarantee; strong guarantee for mutating operations
- \`noexcept\` applied to all functions that genuinely cannot throw

**4. Const Correctness** (6 items)
- All member functions that don't mutate state marked \`const\`
- Input-only pointer/reference parameters marked \`const\`
- Return values: return \`const\` refs where appropriate
- \`constexpr\` used where computation can be done at compile time
- Mutable state not exposed through const accessors
- \`const\` propagation through wrapper types

**5. Thread Safety** (8 items)
- Thread safety guarantees documented for every class (none / read-safe / fully thread-safe)
- Shared mutable state protected by mutex or atomics
- Data races impossible by construction where possible
- Mutex locking order documented to prevent deadlock
- Thread ownership documented (\`// Must be called from the UI thread\`)
- Atomic operations use appropriate memory ordering
- Lock-free data structures use formal correctness argument or proven pattern
- Condition variable spurious-wakeup handling

**6. Usability & Ergonomics** (10 items)
- Common case is easy; rare cases are possible
- Default arguments provided for rarely-changed parameters
- Builder or fluent API for complex configurations (>4 parameters → use builder)
- Symmetric operations both present (\`start/stop\`, \`open/close\`, \`push/pop\`)
- No "magic number" constants — use named enums or constexpr constants
- Overload sets logical — each overload has a clear use case
- Implicit conversions avoided or explicitly documented
- No surprises in operator overloads
- PIMPL or abstract base for ABI stability in shared library APIs
- Trivially destructible types where possible

**7. Documentation Completeness** (8 items)
- Every public function has Doxygen \`@brief\`, \`@param\`, and \`@return\`
- \`@throws\` documents all possible exceptions
- \`@pre\` and \`@post\` for preconditions and postconditions
- \`@note\` for thread safety and lifetime requirements
- Complex algorithms explained with ASCII diagrams in comments
- \`@deprecated\` with migration path for old APIs
- Example usage in Doxygen \`@code\` blocks for non-obvious APIs
- README describes overall design philosophy, not just per-function docs

**8. Platform & Portability** (8 items)
- Platform-specific code isolated in clearly-named files or \`#ifdef\` blocks
- No undefined behavior relied upon
- Endianness handled explicitly for network/file formats
- Alignment requirements documented for hardware-mapped structs
- For embedded: no heap allocation in ISR context; stack size constraints noted
- For embedded: volatile on memory-mapped registers, appropriate memory barriers
- Cross-compiler: no GCC/Clang extensions without alternatives for MSVC, or vice versa
- No unspecified behavior (e.g., \`sizeof(int)\` assumed to be 4)

---

## Phase 4: Cross-Module Consistency

Compare header files for:
- Naming conventions consistent across all modules?
- Error handling strategy consistent?
- Same operation spelled the same way in different modules?
- No copy-pasted code that should be shared?
- Dependency graph: do lower-level modules accidentally depend on higher-level ones?

---

## Phase 5: Usage Flow Review

Walk 2-3 key usage scenarios from a caller's perspective:

1. Find or write a minimal example of using the primary API
2. Check: is the happy path obvious without reading implementation?
3. Check: is it easy to misuse? (parameters in wrong order? forget to call init/shutdown?)
4. Check: error handling — can a caller robustly handle all failure modes?
5. Check: cleanup — is it clear when/how to free resources?

---

## Phase 6: Compile Report

### Output Locations

**Local:** \`.gstackplusplus/api-design-reports/api-design-audit-{module}-{YYYY-MM-DD}.md\`

**Project-scoped:**
\`\`\`bash
eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-slug 2>/dev/null)
mkdir -p ~/.gstackplusplus/projects/$SLUG
\`\`\`
Write to: \`~/.gstackplusplus/projects/{slug}/{user}-{branch}-api-design-audit-{datetime}.md\`

**Baseline:** Write \`api-design-baseline.json\` for regression mode.

### Scoring System

**Headline score: API Design Score {A-F}** — weighted average of all 8 categories.

**Per-category grades:**
- **A:** Intentional, consistent, hard to misuse. Shows API design expertise.
- **B:** Solid fundamentals, minor inconsistencies. Usable without surprises.
- **C:** Functional but needs documentation. Callers need to read source.
- **D:** Noticeable problems. Misuse likely.
- **F:** Actively harmful API. Common misuse leads to crashes or data corruption.

**Category weights:**
| Category | Weight |
|----------|--------|
| Naming & Clarity | 15% |
| Ownership & Lifetime | 20% |
| Error Handling | 15% |
| Const Correctness | 10% |
| Thread Safety | 10% |
| Usability & Ergonomics | 15% |
| Documentation | 10% |
| Platform & Portability | 5% |

---

## API Design Critique Format

Use structured feedback, not opinions:
- "I notice..." — observation (e.g., "I notice both \`connect()\` and \`init()\` must be called in sequence — caller can't know this from the API alone")
- "I wonder..." — question (e.g., "I wonder if callers will accidentally pass width and height in the wrong order")
- "What if..." — suggestion (e.g., "What if we use a \`Size\` struct instead of two separate parameters?")
- "I think... because..." — reasoned opinion

Tie everything to the caller's perspective. Always suggest specific improvements alongside problems.

---

## Important Rules

1. **Think like a caller, not the implementer.** You care whether the API is hard to misuse and easy to understand.
2. **Code is evidence.** Every finding cites the specific file/line/function.
3. **Be specific and actionable.** "Change \`void* buf, int len\` to \`std::span<std::byte>\` because it prevents buffer overreads" — not "the parameters look unsafe."
4. **Read headers, not implementations.** Evaluate the public contract, not the internals.
5. **Ownership ambiguity is your superpower.** Most C++ bugs come from unclear ownership.
6. **Quick wins matter.** Always include a "Quick Wins" section — the 3-5 highest-impact fixes.
7. **Document incrementally.** Write each finding to the report as you find it. Don't batch.
8. **Depth over breadth.** 5-10 well-documented findings > 20 vague observations.`;
}
function generateReviewDashboard(): string {
  return `## Review Readiness Dashboard

After completing the review, read the review log and config to display the dashboard.

\`\`\`bash
eval $(~/.claude/skills/gstackplusplus/bin/gstackplusplus-slug 2>/dev/null)
cat ~/.gstackplusplus/projects/$SLUG/$BRANCH-reviews.jsonl 2>/dev/null || echo "NO_REVIEWS"
echo "---CONFIG---"
~/.claude/skills/gstackplusplus/bin/gstackplusplus-config get skip_eng_review 2>/dev/null || echo "false"
\`\`\`

Parse the output. Find the most recent entry for each skill (plan-ceo-review, plan-eng-review, plan-design-review, design-review-lite). Ignore entries with timestamps older than 7 days. For Design Review, show whichever is more recent between \`plan-design-review\` (full visual audit) and \`design-review-lite\` (code-level check). Append "(FULL)" or "(LITE)" to the status to distinguish. Display:

\`\`\`
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
\`\`\`

**Review tiers:**
- **Eng Review (required by default):** The only review that gates shipping. Covers architecture, code quality, tests, performance. Can be disabled globally with \\\`gstackplusplus-config set skip_eng_review true\\\` (the "don't bother me" setting).
- **CEO Review (optional):** Use your judgment. Recommend it for big product/business changes, new user-facing features, or scope decisions. Skip for bug fixes, refactors, infra, and cleanup.
- **Design Review (optional):** Use your judgment. Recommend it for UI/UX changes. Skip for backend-only, infra, or prompt-only changes.

**Verdict logic:**
- **CLEARED**: Eng Review has >= 1 entry within 7 days with status "clean" (or \\\`skip_eng_review\\\` is \\\`true\\\`)
- **NOT CLEARED**: Eng Review missing, stale (>7 days), or has open issues
- CEO and Design reviews are shown for context but never block shipping
- If \\\`skip_eng_review\\\` config is \\\`true\\\`, Eng Review shows "SKIPPED (global)" and verdict is CLEARED`;
}

function generateTestBootstrap(): string {
  return `## Test Framework Bootstrap

**Detect existing test framework and C++ project setup:**

\`\`\`bash
# Detect build system
[ -f CMakeLists.txt ] && echo "BUILD:cmake" || true
[ -f Makefile ] && echo "BUILD:make" || true
[ -f meson.build ] && echo "BUILD:meson" || true
# Detect test framework
grep -r "gtest\|googletest\|GTest" CMakeLists.txt 2>/dev/null && echo "TEST_FW:gtest" || true
grep -r "Catch2\|CATCH_TEST" CMakeLists.txt 2>/dev/null && echo "TEST_FW:catch2" || true
grep -r "doctest\|DOCTEST" CMakeLists.txt 2>/dev/null && echo "TEST_FW:doctest" || true
grep -r "boost.*test\|BOOST_TEST" CMakeLists.txt 2>/dev/null && echo "TEST_FW:boost_test" || true
# Check for test directories
ls -d test/ tests/ spec/ 2>/dev/null
# Check for CTest integration
grep -r "enable_testing\|add_test\|ctest" CMakeLists.txt 2>/dev/null | head -3
# Check opt-out marker
[ -f .gstackplusplus/no-test-bootstrap ] && echo "BOOTSTRAP_DECLINED"
\`\`\`

**If test framework detected** (gtest/catch2/doctest/boost_test found in CMakeLists.txt):
Print "Test framework detected: {name}. Skipping bootstrap."
Read 2-3 existing test files to learn conventions (naming, assertion style, fixture patterns).
Store conventions as prose context for use in Phase 8e.5 or Step 3.4. **Skip the rest of bootstrap.**

**If BOOTSTRAP_DECLINED** appears: Print "Test bootstrap previously declined — skipping." **Skip the rest of bootstrap.**

**If no test framework detected:** Use AskUserQuestion:
"I couldn't detect a C++ test framework. Which one do you want to use?"
Options: A) GoogleTest (gtest) — industry standard, widely supported B) Catch2 v3 — header-friendly, BDD-style C) doctest — ultra-lightweight, single-header D) This project doesn't need automated tests.
If user picks D → write \`.gstackplusplus/no-test-bootstrap\` and continue without tests.

**If framework chosen — bootstrap:**

### B2. Add test framework to CMake

**GoogleTest:**
\`\`\`cmake
# Add to CMakeLists.txt
include(FetchContent)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        v1.14.0
)
FetchContent_MakeAvailable(googletest)
enable_testing()
\`\`\`

**Catch2:**
\`\`\`cmake
include(FetchContent)
FetchContent_Declare(
  Catch2
  GIT_REPOSITORY https://github.com/catchorg/Catch2.git
  GIT_TAG        v3.5.0
)
FetchContent_MakeAvailable(Catch2)
enable_testing()
include(Catch)
\`\`\`

### B3. Create test directory structure

\`\`\`bash
mkdir -p test/unit test/integration
\`\`\`

Add test CMakeLists.txt:
\`\`\`cmake
# test/CMakeLists.txt
add_subdirectory(unit)
add_subdirectory(integration)
\`\`\`

### B4. Write first real tests

Find recently changed source files:
\`\`\`bash
git log --since=30.days --name-only --format="" | grep "\\.(cpp|cxx|cc)$" | sort | uniq -c | sort -rn | head -10
\`\`\`

Prioritize by risk: error handlers > business logic with conditionals > utility functions.

For each file, write one test exercising real behavior with meaningful assertions.
Never write tests that just check "it compiles" — test what the code DOES.

**GTest example:**
\`\`\`cpp
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
\`\`\`

### B5. Verify

\`\`\`bash
cmake --build $BUILD_DIR --target all
ctest --test-dir $BUILD_DIR --output-on-failure
\`\`\`

If tests fail → debug once. If still failing → revert bootstrap changes and warn user.

### B6. CI/CD pipeline

\`\`\`bash
ls -d .github/ 2>/dev/null && echo "CI:github" || true
ls .gitlab-ci.yml .circleci/ 2>/dev/null
\`\`\`

If \`.github/\` exists or no CI detected — create \`.github/workflows/ci.yml\`:
\`\`\`yaml
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
\`\`\`

### B7. Create TESTING.md

Write TESTING.md with:
- Framework name and version
- How to configure: \`cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug\`
- How to build: \`cmake --build build --parallel\`
- How to run tests: \`ctest --test-dir build --output-on-failure\`
- How to run with sanitizers: \`cmake -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined"\`
- How to run static analysis: \`clang-tidy -p build src/*.cpp\`
- Conventions: file naming, test fixture patterns, mock patterns

### B8. Update CLAUDE.md

Append a \`## Testing\` section if not present:
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

\`\`\`bash
git status --porcelain
\`\`\`

Only commit if there are changes. Stage all bootstrap files:
\`git commit -m "chore: bootstrap test framework ({framework name})"\`

---`;
}

function generateDesignPrinciples(): string {
  return `## Design Principles: KISS · DRY · SOLID · YAGNI

Apply these four principles throughout all analysis, recommendations, and fixes.
They are listed in priority order — when they conflict, prefer the earlier one.

| Principle | Priority | What it means in C++ | Watch for |
|-----------|----------|----------------------|-----------|
| **YAGNI** — You Ain't Gonna Need It | 1 (highest) | Build for today's requirements. No template parameters for hypothetical future types, no virtual methods before you have two concrete implementations, no generalization beyond the current use case. | Template type params with one instantiation, virtual methods with one override, \`// will be useful when…\` comments, policy classes with no alternate policy |
| **KISS** — Keep It Simple | 2 | Prefer the simplest solution that works. No clever metaprogramming when a plain function suffices. Write for the engineer debugging at 3 am. | Multi-level template specialisations for a single case, SFINAE chains that could be \`if constexpr\`, \`auto\`-everything obscuring types, "clever" one-liners that need a comment to explain themselves |
| **DRY** — Don't Repeat Yourself | 3 | Every piece of knowledge has one authoritative home. Factor repeated logic into shared helpers, base classes, or macros of last resort. | Same algorithm in two files, copy-pasted error-handling blocks, duplicated constants, parallel \`switch\` statements that must always change together |
| **SOLID** | 4 | **S**ingle Responsibility · **O**pen/Closed · **L**iskov Substitution · **I**nterface Segregation · **D**ependency Inversion. Each class does one thing; extend by addition not modification; subtypes are drop-in replacements; interfaces are minimal; dependencies are injected not hard-coded. | God classes/files, \`if (type == X)\` dispatch that should be virtual, non-substitutable subclasses that override preconditions, fat interfaces with unrelated methods, singletons and global state that make testing impossible |

### Principle interactions in practice

- Favour **YAGNI over SOLID**: don't introduce an interface abstraction until you have two concrete implementations. One implementation = no interface needed yet.
- Favour **KISS over DRY**: a small, clear duplication is better than a clever abstraction that obscures intent. Abstract when the duplication hurts, not as soon as you see two similar lines.
- **DRY is not about lines of code** — it is about knowledge. Two functions that happen to look similar but represent independent business rules should stay separate.
- **SOLID's D (Dependency Inversion) enables testing**: if a component is hard to test in isolation, the fix is usually to inject the dependency rather than to mock globals.`;
}

const RESOLVERS: Record<string, () => string> = {
  COMMAND_REFERENCE: generateCommandReference,
  SNAPSHOT_FLAGS: generateSnapshotFlags,
  PREAMBLE: generatePreamble,
  BROWSE_SETUP: generateBrowseSetup,
  BASE_BRANCH_DETECT: generateBaseBranchDetect,
  QA_METHODOLOGY: generateQAMethodology,
  DESIGN_METHODOLOGY: generateDesignMethodology,
  DESIGN_REVIEW_LITE: generateDesignReviewLite,
  REVIEW_DASHBOARD: generateReviewDashboard,
  TEST_BOOTSTRAP: generateTestBootstrap,
  DESIGN_PRINCIPLES: generateDesignPrinciples,
};

// ─── Template Processing ────────────────────────────────────

const GENERATED_HEADER = `<!-- AUTO-GENERATED from {{SOURCE}} — do not edit directly -->\n<!-- Regenerate: bun run gen:skill-docs -->\n`;

function processTemplate(tmplPath: string): { outputPath: string; content: string } {
  const tmplContent = fs.readFileSync(tmplPath, 'utf-8');
  const relTmplPath = path.relative(ROOT, tmplPath);
  const outputPath = tmplPath.replace(/\.tmpl$/, '');

  // Replace placeholders
  let content = tmplContent.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    const resolver = RESOLVERS[name];
    if (!resolver) throw new Error(`Unknown placeholder {{${name}}} in ${relTmplPath}`);
    return resolver();
  });

  // Check for any remaining unresolved placeholders
  const remaining = content.match(/\{\{(\w+)\}\}/g);
  if (remaining) {
    throw new Error(`Unresolved placeholders in ${relTmplPath}: ${remaining.join(', ')}`);
  }

  // Prepend generated header (after frontmatter)
  const header = GENERATED_HEADER.replace('{{SOURCE}}', path.basename(tmplPath));
  const fmEnd = content.indexOf('---', content.indexOf('---') + 3);
  if (fmEnd !== -1) {
    const insertAt = content.indexOf('\n', fmEnd) + 1;
    content = content.slice(0, insertAt) + header + content.slice(insertAt);
  } else {
    content = header + content;
  }

  return { outputPath, content };
}

// ─── Main ───────────────────────────────────────────────────

function findTemplates(): string[] {
  const templates: string[] = [];
  const candidates = [
    path.join(ROOT, 'SKILL.md.tmpl'),
    path.join(ROOT, 'browse', 'SKILL.md.tmpl'),
    path.join(ROOT, 'qa', 'SKILL.md.tmpl'),
    path.join(ROOT, 'qa-only', 'SKILL.md.tmpl'),
    path.join(ROOT, 'setup-browser-cookies', 'SKILL.md.tmpl'),
    path.join(ROOT, 'ship', 'SKILL.md.tmpl'),
    path.join(ROOT, 'review', 'SKILL.md.tmpl'),
    path.join(ROOT, 'plan-ceo-review', 'SKILL.md.tmpl'),
    path.join(ROOT, 'plan-eng-review', 'SKILL.md.tmpl'),
    path.join(ROOT, 'retro', 'SKILL.md.tmpl'),
    path.join(ROOT, 'gstackplusplus-upgrade', 'SKILL.md.tmpl'),
    path.join(ROOT, 'plan-design-review', 'SKILL.md.tmpl'),
    path.join(ROOT, 'design-review', 'SKILL.md.tmpl'),
    path.join(ROOT, 'design-consultation', 'SKILL.md.tmpl'),
    path.join(ROOT, 'document-release', 'SKILL.md.tmpl'),
    path.join(ROOT, 'codex', 'SKILL.md.tmpl'),
    path.join(ROOT, 'qwen', 'SKILL.md.tmpl'),
    path.join(ROOT, 'claude', 'SKILL.md.tmpl'),
    path.join(ROOT, 'antigravity', 'SKILL.md.tmpl'),
    path.join(ROOT, 'cursor', 'SKILL.md.tmpl'),
    path.join(ROOT, 'copilot', 'SKILL.md.tmpl'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) templates.push(p);
  }
  return templates;
}

let hasChanges = false;

for (const tmplPath of findTemplates()) {
  const { outputPath, content } = processTemplate(tmplPath);
  const relOutput = path.relative(ROOT, outputPath);

  if (DRY_RUN) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf-8') : '';
    if (existing !== content) {
      console.log(`STALE: ${relOutput}`);
      hasChanges = true;
    } else {
      console.log(`FRESH: ${relOutput}`);
    }
  } else {
    fs.writeFileSync(outputPath, content);
    console.log(`GENERATED: ${relOutput}`);
  }
}

if (DRY_RUN && hasChanges) {
  console.error('\nGenerated SKILL.md files are stale. Run: bun run gen:skill-docs');
  process.exit(1);
}

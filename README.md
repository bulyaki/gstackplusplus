# gstack++ — C++ Edition

This is **gstack++ adapted for C++ application, server, and embedded development** — a fork of Garry Tan's [gstack](https://github.com/garrytan/gstack) with every skill, workflow, and placeholder generator rewritten from the ground up for the C++ toolchain.

If you build native code — networked servers, systems software, embedded firmware, or high-performance applications — this is the version for you. It speaks `cmake`, `ctest`, `clang-tidy`, `AddressSanitizer`, `UndefinedBehaviorSanitizer`, `ThreadSanitizer`, and `valgrind`. It knows RAII, the Rule of 0/3/5, `std::span`, `std::string_view`, `std::expected`, ISR safety, and ABI stability. It does not know about browsers, npm, or REST endpoints.

## What's different from the original gstack

The original gstack by Garry Tan targets web development — staging URLs, Playwright browser automation, React components, and TypeScript. This C++ edition replaces every web-specific concept:

| Original (web) | This edition (C++) |
|---|---|
| Headless Chromium browser | cmake/make/ninja build system |
| Playwright screenshot QA | ctest + GoogleTest / Catch2 / doctest |
| ESLint / TypeScript errors | clang-tidy / cppcheck static analysis |
| Browser console errors | AddressSanitizer + UBSan memory errors |
| Network request logs | valgrind memcheck leak reports |
| `npm test` | `ctest --output-on-failure -j$(nproc)` |
| Staging URL | Build directory + sanitizer build |

The skill philosophy stays the same: structured roles, review gates, atomic commits, regression tests for every fix. The toolchain is completely different.

## Design principles: YAGNI · KISS · DRY · SOLID

Every gstack++ skill — on every platform — enforces four principles, listed in priority order for when they conflict:

| Principle | Priority | One-line rule |
|-----------|----------|---------------|
| **YAGNI** — You Ain't Gonna Need It | 1 | Build for today's requirements. No template parameters for hypothetical future types, no virtual methods before two concrete implementations exist. |
| **KISS** — Keep It Simple | 2 | Prefer the simplest solution that works. No clever metaprogramming when a plain function suffices. Write for the engineer debugging at 3 am. |
| **DRY** — Don't Repeat Yourself | 3 | Every piece of knowledge has one authoritative home. Flag duplicated logic aggressively — cite the other file and line. |
| **SOLID** | 4 | Single Responsibility · Open/Closed · Liskov Substitution · Interface Segregation · Dependency Inversion. Inject dependencies; don't hard-code them. |

The full principle reference — including C++-specific red flags and interaction rules — is defined once in `scripts/gen-skill-docs.ts` as `generateDesignPrinciples()` and injected into every skill that does code analysis or review via `{{DESIGN_PRINCIPLES}}`. This means the definitions are maintained in exactly one place and are consistent across `/plan-eng-review`, `/review`, `/design-review`, `/plan-design-review`, `/qa`, `/ship`, and all six platform meta-skills.

## Supported platforms

gstack++ ships a meta-skill for each supported AI platform. Run it once per project and every subsequent skill adapts automatically. The core workflow — plan, review, QA, ship — is identical across all six; what changes is how the agent makes decisions, formats output, and handles long sessions.

**`/claude`** — The reference implementation. All gstack++ skills are designed and tested for Claude first. Full interactive `AskUserQuestion` flows, extended thinking for deep architecture analysis, and [Conductor](https://conductor.build) multi-session support for running up to 10 parallel agents on separate branches. If you are using Claude Code, this is the default — run `/claude` explicitly only when switching back from another mode.

**`/codex`** — Configures gstack++ for [OpenAI Codex](https://openai.com/codex) (codex-1 autonomous agent). Codex runs headlessly without interactive prompts, so this mode disables `AskUserQuestion` calls, enables structured decision logging, enforces hard caps (30 fixes, 5 files per run, 2-hour wall clock), and writes a `BLOCKED.md` on failure instead of hanging. Every decision is logged to `codex-decisions.md` so you can audit what the agent chose without watching it live.

**`/qwen`** — Configures gstack++ for [Qwen](https://qwenlm.github.io/) (Qwen2.5-Coder, QwQ, Qwen3). Qwen's explicit chain-of-thought reasoning is a strength, so this mode enables structured `<think>` blocks before each phase, confidence-tagged decisions, phase-level summaries, and context compression every 20 tool calls to stay within Qwen's context window. Supports Chinese-language output when the user writes in Chinese.

**`/antigravity`** — Configures gstack++ for [Antigravity](https://antigravity.dev), the AI coding agent built for high-velocity teams. Antigravity's review interface is diff-centric, so this mode enforces minimal diffs (no reformatting bystander lines), emits `[PHASE:start]`/`[PHASE:done]` streaming markers for live progress, formats findings as `[ISSUE:N] SEVERITY — description` for the review UI, and re-detects the toolchain from scratch on every run (Antigravity workspaces are ephemeral). Workspace IDs are appended to commit trailers for conflict tracing.

**`/cursor`** — Configures gstack++ for [Cursor](https://cursor.sh), the AI code editor. Structures every fix as a checkpoint-scoped edit so Cursor's diff review stays clean, formats findings as `@file:line` references that are clickable in the editor, generates and maintains a `.cursorrules` file for persistent project context, and recommends Composer (Cmd+I) for multi-file skills vs. inline chat (Cmd+K) for single-file fixes.

**`/copilot`** — Configures gstack++ for [GitHub Copilot](https://github.com/features/copilot) in VS Code. Creates and maintains `.github/copilot-instructions.md` for automatic context injection, formats findings as `@workspace`-compatible prompts that can be pasted directly into Copilot Chat, emits `[COPILOT EDIT]` blocks for multi-file Copilot Edits, and ensures `/ship`-generated PRs include a structured body for Copilot's PR review feature.

To configure your platform, run the meta-skill once per project:

```
/claude       # reference mode — full interactive, extended thinking, Conductor support
/codex        # autonomous mode — no prompts, decision log, hard caps, BLOCKED.md on failure
/qwen         # reasoning mode — <think> blocks, phase summaries, confidence-tagged decisions
/antigravity  # diff-centric mode — streaming markers, [ISSUE:N] format, ephemeral workspace
/cursor       # editor mode — .cursorrules, checkpoint diffs, @file:line findings
/copilot      # VS Code mode — copilot-instructions.md, @workspace format, Copilot Edits blocks
```

The choice is written to `~/.gstackplusplus/config.yaml` as `model_mode: <platform>`. All skills read it on startup and adapt their output format and decision behavior accordingly.

## The team

| Skill | Your specialist | What they do |
|-------|----------------|--------------|
| `/plan-ceo-review` | **CEO / Founder** | Rethink the problem. Find the 10-star product hiding inside the request. |
| `/plan-eng-review` | **Eng Manager** | Lock in architecture, ownership model, data flow, ASCII diagrams, UB risks, test matrix. Knows RAII, move semantics, embedded constraints. |
| `/plan-design-review` | **API Design Reviewer** | Audit C++ API design before writing code. Naming, ownership, error handling, const correctness, thread safety, Doxygen. |
| `/design-consultation` | **Design Partner** | Build a complete API from scratch. Proposes safe choices and creative risks, generates ownership diagrams, exports `API.md`. |
| `/review` | **Staff Engineer** | Find memory bugs, UB, data races, and RAII violations that pass CI but blow up in production. |
| `/ship` | **Release Engineer** | cmake + ctest + clang-tidy + sanitizers → push → PR. Bootstraps GTest/Catch2/doctest if missing. |
| `/qa` | **QA Lead** | Build → test → static analysis → sanitizers → fix → re-verify. Regression test for every bug fixed. |
| `/qa-only` | **QA Reporter** | Same as `/qa` but report only — no code changes. |
| `/design-review` | **API Designer Who Codes** | Audit then fix: minimal diffs, atomic commits, re-verified. |
| `/retro` | **Eng Manager** | Per-person weekly retro, shipping streaks, test health trends. |
| `/document-release` | **Technical Writer** | Update README, ARCHITECTURE, CLAUDE.md to match what you just shipped. |
| `/claude` | **Model Config** | Reference mode — full interactive, extended thinking, Conductor support. |
| `/codex` | **Model Config** | Codex autonomous mode — decision log, hard caps, no prompts. |
| `/qwen` | **Model Config** | Qwen reasoning mode — `<think>` blocks, phase summaries, confidence tags. |
| `/antigravity` | **Model Config** | Antigravity mode — streaming markers, `[ISSUE:N]` format, ephemeral workspace. |
| `/cursor` | **Model Config** | Cursor editor mode — `.cursorrules`, checkpoint diffs, `@file:line` findings. |
| `/copilot` | **Model Config** | Copilot VS Code mode — `copilot-instructions.md`, `@workspace` format, Copilot Edits blocks. |

## Quick start

```
You:    I want to add a zero-copy packet parser to the network stack.
You:    /plan-ceo-review
Claude: The real job is zero-allocation deserialization on the hot path — 10M pkts/sec,
        no heap pressure. Here's what 10-star looks like vs. 3-star: ...

You:    /plan-eng-review
Claude: [ownership diagrams, std::span over raw pointer+len, std::expected for errors,
         14-case test matrix, 6 failure modes, 2 UB risks flagged]

You:    /review
Claude: [AUTO-FIXED] Signed integer overflow in length field (UB)
        [AUTO-FIXED] Missing bounds check on payload slice
        [ASK]        Shared mutable dispatch table — data race under TSan → add mutex

You:    /qa
Claude: Build: ✓ 0 warnings  |  Tests: 47/47 pass
        ASan: clean  |  TSan: 1 race on packet counter (deferred)
        Static analysis: 0 findings  |  Health score: 94/100

You:    /ship
Claude: PR: github.com/you/project/pull/17  (+9 new tests, 100% coverage)
```

## Install

**Requirements for all platforms:** Git, [Bun](https://bun.sh/) v1.0+, cmake, clang++ or g++

The clone-and-setup step is the same regardless of which platform you use. What differs is the one-time platform configuration you run inside your agent after setup.

### Step 1 — Clone and build (same for all platforms)

```bash
git clone https://github.com/your-fork/gstackplusplus.git ~/.claude/skills/gstackplusplus
cd ~/.claude/skills/gstackplusplus && ./setup
```

### Step 2 — Configure for your platform

**Claude** ([Claude Code](https://docs.anthropic.com/en/docs/claude-code) required)

Open Claude Code in your project and run:
```
/claude
```
Claude Code will detect the toolchain, write `model_mode: claude` to `~/.gstackplusplus/config.yaml`, and add the `## gstack++` section to your `CLAUDE.md`. All core workflow skills plus the six platform modes are available. Use [Conductor](https://conductor.build) to run up to 10 sessions in parallel.

**Codex** ([OpenAI Codex](https://openai.com/codex) / codex-1)

Point Codex at your repo and run:
```
/codex
```
Codex mode disables interactive prompts, enables decision logging to `.gstackplusplus/codex-decisions-{date}.md`, and sets hard caps so the agent never runs away unsupervised. All decisions are auditable after the fact.

**Qwen** (Qwen2.5-Coder, QwQ, Qwen3)

In your Qwen session, run:
```
/qwen
```
Qwen mode turns on `<think>` reasoning blocks before each significant action, phase-level summaries to keep long sessions navigable, and confidence-tagged `AskUserQuestion` responses. Write in Chinese and gstack++ will respond in Chinese; code artifacts stay in English.

**Antigravity** ([Antigravity](https://antigravity.dev))

In your Antigravity workspace, run:
```
/antigravity
```
Antigravity mode enforces diff-first output (no bystander reformatting), emits `[PHASE:start]`/`[PHASE:done]` streaming markers for the live progress view, formats all findings as `[ISSUE:N] SEVERITY — description` for the review UI, and re-detects the toolchain from scratch on every run since Antigravity workspaces are ephemeral.

**Cursor** ([Cursor](https://cursor.sh))

In Cursor Agent or Composer, run:
```
/cursor
```
Cursor mode writes `model_mode: cursor`, creates or updates `.cursorrules`, formats findings as clickable `@file:line` references, and biases multi-file skills toward checkpoint-sized edits so Cursor's review UI stays readable. Use Composer for `/review`, `/qa`, and `/ship`; use inline chat for one-file follow-up fixes from `/qa-only`.

**GitHub Copilot** ([GitHub Copilot for VS Code](https://github.com/features/copilot))

In Copilot Chat or Copilot Agent, run:
```
/copilot
```
Copilot mode writes `model_mode: copilot`, creates or updates `.github/copilot-instructions.md`, emits `@workspace`-friendly finding text for Copilot Chat, and structures larger changes as `[COPILOT EDIT]` blocks that paste cleanly into Copilot Edits. `/ship` also formats PR bodies to work better with Copilot's PR review flow.

### CLAUDE.md snippet (all platforms)

After running your platform meta-skill, the snippet is written automatically. If you need to add it manually:

```
## gstack++
Skills: /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation,
/review, /ship, /qa, /qa-only, /design-review, /retro, /document-release,
/claude, /codex, /qwen, /antigravity, /cursor, /copilot
C++ toolchain: cmake, ctest, clang-tidy, cppcheck, ASan/UBSan/TSan, valgrind
```

MIT License. Free forever.

---

## Original README (Garry Tan's gstack — web edition)

The original README for Garry Tan's gstack web edition follows below, preserved in full for context and attribution.

---

# gstack

Hi, I'm [Garry Tan](https://x.com/garrytan). I'm President & CEO of [Y Combinator](https://www.ycombinator.com/), where I've worked with thousands of startups including Coinbase, Instacart, and Rippling when the founders were just one or two people in a garage — companies now worth tens of billions of dollars. Before YC, I designed the Palantir logo and was one of the first eng manager/PM/designers there. I cofounded Posterous, a blog platform we sold to Twitter. I built Bookface, YC's internal social network, back in 2013. I've been building products as a designer, PM, and eng manager for a long time.

And right now I am in the middle of something that feels like a new era entirely.

In the last 60 days I have written **over 600,000 lines of production code** — 35% tests — and I am doing **10,000 to 20,000 usable lines of code per day** as a part-time part of my day while doing all my duties as CEO of YC. That is not a typo. My last `/retro` (developer stats from the last 7 days) across 3 projects: **140,751 lines added, 362 commits, ~115k net LOC**. The models are getting dramatically better every week. We are at the dawn of something real — one person shipping at a scale that used to require a team of twenty.

**2026 — 1,237 contributions and counting:**

![GitHub contributions 2026 — 1,237 contributions, massive acceleration in Jan-Mar](docs/images/github-2026.png)

**2013 — when I built Bookface at YC (772 contributions):**

![GitHub contributions 2013 — 772 contributions building Bookface at YC](docs/images/github-2013.png)

Same person. Different era. The difference is the tooling.

**gstack is how I do it.** It is my open source software factory. It turns Claude Code into a virtual engineering team you actually manage — a CEO who rethinks the product, an eng manager who locks the architecture, a designer who catches AI slop, a paranoid reviewer who finds production bugs, a QA lead who opens a real browser and clicks through your app, and a release engineer who ships the PR. Thirteen specialists, all as slash commands, all Markdown, **all free, MIT license, available right now.**

I am learning how to get to the edge of what agentic systems can do as of March 2026, and this is my live experiment. I am sharing it because I want the whole world on this journey with me.

Fork it. Improve it. Make it yours. Don't player hate, appreciate.

**Who this is for:**
- **Founders and CEOs** — especially technical ones who still want to ship. This is how you build like a team of twenty.
- **First-time Claude Code users** — gstack is the best way to start. Structured roles instead of a blank prompt.
- **Tech leads and staff engineers** — bring rigorous review, QA, and release automation to every PR

## Quick start: your first 10 minutes

1. Install gstack (30 seconds — see below)
2. Run `/plan-ceo-review` on any feature idea
3. Run `/review` on any branch with changes
4. Run `/qa` on your staging URL
5. Stop there. You'll know if this is for you.

Expect first useful run in under 5 minutes on any repo with tests already set up.

**If you only read one more section, read this one.**

## Install — takes 30 seconds

**Requirements:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Git](https://git-scm.com/), [Bun](https://bun.sh/) v1.0+

### Step 1: Install on your machine

Open Claude Code and paste this. Claude does the rest.

> Install gstack: run **`git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`** then add a "gstack" section to CLAUDE.md that says to use the /browse skill from gstack for all web browsing, never use mcp\_\_claude-in-chrome\_\_\* tools, and lists the available skills: /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /review, /ship, /browse, /qa, /qa-only, /qa-design-review, /setup-browser-cookies, /retro, /document-release. Then ask the user if they also want to add gstack to the current project so teammates get it.

### Step 2: Add to your repo so teammates get it (optional)

> Add gstack to this project: run **`cp -Rf ~/.claude/skills/gstack .claude/skills/gstack && rm -rf .claude/skills/gstack/.git && cd .claude/skills/gstack && ./setup`** then add a "gstack" section to this project's CLAUDE.md that says to use the /browse skill from gstack for all web browsing, never use mcp\_\_claude-in-chrome\_\_\* tools, lists the available skills: /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /review, /ship, /browse, /qa, /qa-only, /qa-design-review, /setup-browser-cookies, /retro, /document-release, and tells Claude that if gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.

Real files get committed to your repo (not a submodule), so `git clone` just works. Everything lives inside `.claude/`. Nothing touches your PATH or runs in the background.

## See it work

```
You:    I want to add photo upload for sellers.
You:    /plan-ceo-review
Claude: "Photo upload" is not the feature. The real job is helping
        sellers create listings that actually sell. What if we
        auto-identify the product, pull specs and comps from the
        web, and draft the listing automatically? That's 10 stars.
        "Upload a photo" is 3 stars. Which are we building?
        [8 expansion proposals, you cherry-pick 5, defer 3 to backlog]

You:    /plan-design-review
Claude: Design Score: B  |  AI Slop Score: C
        "Upload flow looks like a default Bootstrap form."
        [80-item audit, infers your design system, exports DESIGN.md]
        [flags 3 AI slop patterns: gradient hero, icon grid, uniform radius]

You:    /plan-eng-review
Claude: ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
        │ Upload  │───▶│ Classify │───▶│ Enrich   │───▶│ Draft   │
        │ (sync)  │    │ (async)  │    │ (async)  │    │ (async) │
        └─────────┘    └──────────┘    └──────────┘    └─────────┘
        [ASCII diagrams for every data flow, state machine, error path]
        [14-case test matrix, 6 failure modes mapped, 3 security concerns]

You:    Approve plan. Exit plan mode.
        [Claude writes 2,400 lines across 11 files — models, services,
         controllers, views, migrations, and tests. ~8 minutes.]

You:    /review
Claude: [AUTO-FIXED] Orphan S3 cleanup on failed upload
        [AUTO-FIXED] Missing index on listings.status
        [ASK] Race condition on hero image selection → You: yes
        [traces every new enum value through all switch statements]
        3 issues — 2 auto-fixed, 1 fixed.

You:    /qa https://staging.myapp.com
Claude: [opens real browser, logs in, uploads photos, clicks through flows]
        Upload → classify → enrich → draft: end to end ✓
        Mobile: ✓  |  Slow connection: ✓  |  Bad image: ✓
        [finds bug: preview doesn't clear on second upload — fixes it]
        Regression test generated.

You:    /ship
Claude: Tests: 42 → 51 (+9 new)
        Coverage: 14/14 code paths (100%)
        PR: github.com/you/app/pull/42
```

One feature. Seven commands. The agent reframed the product, ran an 80-item design audit, drew the architecture, wrote 2,400 lines of code, found a race condition I would have missed, auto-fixed two issues, opened a real browser to QA test, found and fixed a bug I didn't know about, wrote 9 tests, and generated a regression test. That is not a copilot. That is a team.

## The team

| Skill | Your specialist | What they do |
|-------|----------------|--------------|
| `/plan-ceo-review` | **CEO / Founder** | Rethink the problem. Find the 10-star product hiding inside the request. Four modes: Expansion, Selective Expansion, Hold Scope, Reduction. |
| `/plan-eng-review` | **Eng Manager** | Lock in architecture, data flow, diagrams, edge cases, and tests. Forces hidden assumptions into the open. |
| `/plan-design-review` | **Senior Designer** | 80-item design audit with letter grades. AI Slop detection. Infers your design system. Report only — never touches code. |
| `/design-consultation` | **Design Partner** | Build a complete design system from scratch. Knows the landscape, proposes creative risks, generates realistic product mockups. Design at the heart of all other phases. |
| `/review` | **Staff Engineer** | Find the bugs that pass CI but blow up in production. Auto-fixes the obvious ones. Flags completeness gaps. |
| `/ship` | **Release Engineer** | Sync main, run tests, audit coverage, push, open PR. Bootstraps test frameworks if you don't have one. One command. |
| `/browse` | **QA Engineer** | Give the agent eyes. Real Chromium browser, real clicks, real screenshots. ~100ms per command. |
| `/qa` | **QA Lead** | Test your app, find bugs, fix them with atomic commits, re-verify. Auto-generates regression tests for every fix. |
| `/qa-only` | **QA Reporter** | Same methodology as /qa but report only. Use when you want a pure bug report without code changes. |
| `/design-review` | **Designer Who Codes** | Same audit as /plan-design-review, then fixes what it finds. Atomic commits, before/after screenshots. |
| `/setup-browser-cookies` | **Session Manager** | Import cookies from your real browser (Chrome, Arc, Brave, Edge) into the headless session. Test authenticated pages. |
| `/retro` | **Eng Manager** | Team-aware weekly retro. Per-person breakdowns, shipping streaks, test health trends, growth opportunities. |
| `/document-release` | **Technical Writer** | Update all project docs to match what you just shipped. Catches stale READMEs automatically. |

**[Deep dives with examples and philosophy for every skill →](docs/skills.md)**

## What's new and why it matters

**Design is at the heart.** `/design-consultation` doesn't just pick fonts. It researches what's out there in your space, proposes safe choices AND creative risks, generates realistic mockups of your actual product, and writes `DESIGN.md` — and then `/design-review` and `/plan-eng-review` read what you chose. Design decisions flow through the whole system.

**`/qa` was a massive unlock.** It let me go from 6 to 12 parallel workers. Claude Code saying *"I SEE THE ISSUE"* and then actually fixing it, generating a regression test, and verifying the fix — that changed how I work. The agent has eyes now.

**Smart review routing.** Just like at a well-run startup: CEO doesn't have to look at infra bug fixes, design review isn't needed for backend changes. gstack tracks what reviews are run, figures out what's appropriate, and just does the smart thing. The Review Readiness Dashboard tells you where you stand before you ship.

**Test everything.** `/ship` bootstraps test frameworks from scratch if your project doesn't have one. Every `/ship` run produces a coverage audit. Every `/qa` bug fix generates a regression test. 100% test coverage is the goal — tests make vibe coding safe instead of yolo coding.

**`/document-release` is the engineer you never had.** It reads every doc file in your project, cross-references the diff, and updates everything that drifted. README, ARCHITECTURE, CONTRIBUTING, CLAUDE.md, TODOS — all kept current automatically.

## 10 sessions at once

gstack is powerful with one session. It is transformative with ten.

[Conductor](https://conductor.build) runs multiple Claude Code sessions in parallel — each in its own isolated workspace. One session running `/qa` on staging, another doing `/review` on a PR, a third implementing a feature, and seven more on other branches. All at the same time.

One person, ten parallel agents, each with the right cognitive mode. That is a different way of building software.

## Come ride the wave

This is **free, MIT licensed, open source, available now.** No premium tier. No waitlist. No strings.

I open sourced how I do development and I am actively upgrading my own software factory here. You can fork it and make it your own. That's the whole point. I want everyone on this journey.

Same tools, different outcome — because gstack gives you structured roles and review gates, not generic agent chaos. That governance is the difference between shipping fast and shipping reckless.

The models are getting better fast. The people who figure out how to work with them now — really work with them, not just dabble — are going to have a massive advantage. This is that window. Let's go.

Thirteen specialists. All slash commands. All Markdown. All free. **[github.com/garrytan/gstack](https://github.com/garrytan/gstack)** — MIT License

> **We're hiring.** Want to ship 10K+ LOC/day and help harden gstack?
> Come work at YC — [ycombinator.com/software](https://ycombinator.com/software)
> Extremely competitive salary and equity. San Francisco, Dogpatch District.

## Docs

| Doc | What it covers |
|-----|---------------|
| [Skill Deep Dives](docs/skills.md) | Philosophy, examples, and workflow for every skill (includes Greptile integration) |
| [Architecture](ARCHITECTURE.md) | Design decisions and system internals |
| [Browser Reference](BROWSER.md) | Full command reference for `/browse` |
| [Contributing](CONTRIBUTING.md) | Dev setup, testing, contributor mode, and dev mode |
| [Changelog](CHANGELOG.md) | What's new in every version |

## Troubleshooting

**Skill not showing up?** `cd ~/.claude/skills/gstack && ./setup`

**`/browse` fails?** `cd ~/.claude/skills/gstack && bun install && bun run build`

**Stale install?** Run `/gstack-upgrade` — or set `auto_upgrade: true` in `~/.gstack/config.yaml`

**Claude says it can't see the skills?** Make sure your project's `CLAUDE.md` has a gstack section. Add this:

```
## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /browse, /qa, /qa-only, /qa-design-review,
/setup-browser-cookies, /retro, /document-release.
```

## License

MIT. Free forever. Go build something.

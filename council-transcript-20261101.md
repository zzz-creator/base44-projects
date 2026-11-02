# Council Transcript — "what should we do next?"

**Date:** 1 November 2026
**Question (raw):** what should we do next?
**Seated advisors:** core five (Contrarian, First Principles Thinker, Expansionist, Outsider, Executor) + panel (Skeptic, Pragmatist, Risk Assessor, Ethicist, Historian). Panel size 5. No Innovator/Data Analyst seated — their angles overlap Expansionist/Skeptic here.
**Files generated:** `council-report-20261101.html`, `council-transcript-20261101.md`

---

## Framed question

We maintain a monorepo of 7 migrated Base44 sandbox apps (AstroSim Nexus, KwanPro, Nuclear Launch Sim, OmniPOS Core, OpsGrid, ProdIntel StageOps, War Matrix; HotelOps removed). Each is React/Vite frontend + Express/MSSQL backend. A previous council (31 Oct 2026) recommended: (1) remove War Matrix plaintext password auth fallback, (2) verify DB schemas per project, (3) resolve War Matrix routes/sas.js. Subsequent commits implemented: startup DB schema checks on all backends, Users table added to ProdIntel schema, /api/sas route removed (file still present). BUT a regression: commit 8a91226 removed bcrypt and switched ALL apps to plaintext password storage (login compares PasswordHash !== password; register stores password as-is) — the opposite of council #1 rec. War Matrix auth.js still retains dual-column fallback (resolvePasswordColumn). Also uncommitted: HotelOps directory deletion. Checklist (IMPLEMENTATION_CHECKLIST.md) is stale (lists HotelOps, lists plaintext as known issue). Smoke/deep Playwright tests pass on all 7 live apps. No DB has been verified end-to-end (assistant cannot run DDL without permission). Dead code remains: localApiClient.jsx x2, OmniPOS tmp/ scripts, War Matrix routes/sas.js file. Lint unused imports / no-undef remain. Root node_modules/ and test-results/ untracked.

Question: Given finite time, what should we do next? Prioritize by impact and risk. Is the plaintext-password regression now the #1 blocker? Should we restore hashing or accept plaintext for sandbox? What about the uncommitted HotelOps deletion, stale checklist, dead code, lint, DB verification? Be specific about blockers vs hygiene and sequencing.

---

## Advisor responses

### The Contrarian (H)

The plaintext-password regression is not a "should we accept it" question. It's a "why did nobody catch it" question. Commit 8a91226 reverted council #1's explicit recommendation, and the response so far has been to note it as a known issue. That's not a plan. If these apps ever leave sandbox—or if anyone reuses credentials across environments—this is a breach, not a hygiene item. Restore bcrypt. Now. Before anything else. The "sandbox" framing is a rationalization; sandboxes get promoted and credentials get reused.

The uncommitted HotelOps deletion is your most immediate footgun. Untracked deletions don't show up the way you expect, and a git reset or fresh clone silently resurrects a project you already removed. Commit it or revert it today, explicitly, by name.

DB verification is the second real blocker, and your own constraint is the problem, not the excuse. Startup schema checks prove tables exist, not that they're correct. You're flying blind on data integrity across 7 apps. Get permission or get a read-only verification script. Don't ship "verified" when you mean "started."

Everything else — dead code, lint, untracked node_modules, stale checklist — is hygiene. It will not wake you at 3am. Sequence: (1) commit/revert HotelOps deletion, (2) restore bcrypt + remove resolvePasswordColumn fallback, (3) DB verification with explicit permission, (4) checklist update, (5) everything else. Don't let the passing Playwright tests convince you the hard problems are solved. They test the happy path; they don't test what's wrong.

### The First Principles Thinker (C)

The wrong question is "should we restore hashing?" The right question is "what is the actual goal of these apps?" They're sandbox apps migrated from Base44. If the goal is demos/prototypes, plaintext passwords are a known-acceptable tradeoff, not a blocker — and the previous council's rec #1 assumed production-grade auth that nobody actually needs here. Chasing bcrypt across 7 apps burns finite time for zero user-visible value.

The real #1 blocker nobody's asking about: no DB has been verified end-to-end. Startup schema checks prove tables exist; they prove nothing about whether login → query → render actually works with real data. That's the thing that, if broken, makes every other effort moot. Verify one app fully (OpsGrid or ProdIntel) before touching anything else.

Sequencing, by impact/risk:
1. Commit or stash the HotelOps deletion first. Uncommitted deletions are the only genuinely irreversible-in-progress risk here — 5 minutes, eliminates data loss.
2. DB end-to-end verification on one app (pick the one with real usage). This is the actual blocker.
3. Decide hashing policy once, in writing. Either accept plaintext-for-sandbox (update checklist to say so) or restore bcrypt — but don't half-do it. The current state (regression + stale checklist claiming plaintext is "known issue") is the worst of both worlds.
4. Everything else is hygiene, defer: dead code (localApiClient x2, sas.js file, tmp/ scripts), lint unused imports, untracked node_modules/test-results, stale checklist. None block usage. Batch them into one cleanup pass later.

Don't restore hashing as a reflex — it's a decision, not a default. But do stop pretending the checklist reflects reality.

### The Expansionist (J)

The plaintext regression is a sandbox paper cut, not the #1 blocker — treat it as one. Restoring bcrypt across 7 apps burns finite time for zero user-visible gain in sandbox. Accept plaintext behind a documented "not for production" gate, and when you do restore hashing, do it once behind a single shared auth module rather than seven times.

What's being undervalued: all 7 apps pass smoke and deep Playwright tests. The migration is effectively done; you're now in platform territory. The adjacent opportunity hiding in plain sight is consolidation — a shared Express/MSSQL auth and user layer across all apps, one Users table, one login flow. You already started this with ProdIntel's Users table. Finish that pattern everywhere instead of patching per-app auth.

The HotelOps deletion is progress, not a blocker — commit it, it's free money. The stale checklist is an opportunity to redefine "done" as platform-ready, not migration-complete. Dead code, lint, untracked root folders are hygiene; batch into one cleanup commit and stop letting them eat planning cycles.

DB verification is the real ceiling. Nothing else matters until one app is verified end-to-end against a real MSSQL instance. Pick AstroSim Nexus, verify schema + auth flow against a real DB, and use it as the template for the other six. One verified path, replicated — that's the multiplier.

Stop treating this as cleanup. It's a platform launch.

### The Outsider (A)

The plaintext regression is your #1 blocker, and the framing that makes it debatable is the problem. You call these "sandbox apps," but you also report smoke and deep Playwright tests passing on 7 *live* apps. Live apps with plaintext password storage and a login comparing `PasswordHash !== password` are not sandboxed in any meaningful sense — they're apps with a label. A prior council told you to remove plaintext fallback; a commit then removed bcrypt from *all* apps. That's not drift, it's an active reversal, and your suite didn't catch it because no test ever asserted on password storage. That's the curse-of-knowledge finding: you're trusting green tests that never checked the thing that matters.

Restore hashing. Do not accept plaintext "for sandbox" — that's the rationalization that got you here. Restoring bcrypt costs hours; a leak's cost is not bounded by sandbox status.

Sequence by reversibility and blast radius:
1. Commit or stash the HotelOps deletion first. An uncommitted destructive change is the most fragile thing in the tree — one bad reset and it's gone, and "HotelOps removed" is currently false since the directory still exists.
2. Restore bcrypt across all 7 backends, per the prior council's #1 rec. Verify login/register against a real account before declaring done.
3. Then hygiene: stale checklist (update or delete — a wrong checklist is worse than none), dead code (sas.js file, localApiClient x2, OmniPOS tmp/), lint, .gitignore for node_modules/test-results. Real, but none leak credentials.

DB verification stays permission-blocked. Note explicitly that startup schema checks only prove the app boots, not that data is correct — don't imply verification happened.

I have not read the actual code; I'm taking your commit descriptions at face value.

### The Executor (F)

The plaintext regression is the #1 blocker and it's not close. Commit 8a91226 undid the council's top recommendation across all seven apps — that's a security regression in the default auth path, not a hygiene item. Restore bcrypt Monday morning: revert the commit or re-add the dependency and swap the two comparison/store lines per app. It's a 30–60 minute job and the Playwright suite already covers login/register, so verification comes free. Do not accept plaintext "for sandbox" — sandbox code becomes the template, and the cost to fix is trivial.

Second, commit the HotelOps deletion now. Uncommitted deletions are how work gets lost and diffs get confused. `git add` the deleted paths by name, commit, move on. Two minutes.

Third, DB verification is a real blocker but an external one — you can't run DDL without permission. Stop treating it as in-progress; file the permission request and park it. The startup schema checks already shipped are your safety net until then.

Everything else is hygiene and belongs in one cleanup pass after the above: update IMPLEMENTATION_CHECKLIST.md (drop HotelOps and the "plaintext known issue" line), delete the dead files (grep first to confirm zero imports), fix lint no-undef/unused imports, add root `node_modules/` and `test-results/` to `.gitignore`. None block anything; none outrank the password fix.

Sequencing: bcrypt restore → commit HotelOps deletion → (permission-gated) DB verification → hygiene batch. Remove War Matrix's `resolvePasswordColumn` fallback as part of the bcrypt restore since it's the same code path.

### The Skeptic (D)

The Skeptic's read: "tests pass" and "schema checks implemented" are claims, not evidence, and the bcrypt removal is an unexplained process failure nobody has diagnosed.

The regression. Commit 8a91226 removed bcrypt and flattened every app to plaintext, and no rationale has been stated. Restoring hashing before answering *why* is cargo-culting the opposite direction. Maybe bcrypt's native build failed in the deploy image; maybe the author found login broken. Until we read that commit's diff and any CI/build log, "restore hashing" is a guess that could reintroduce the original failure. The real blocker isn't plaintext itself — it's that a security-relevant change landed with no justification and no test guarding it. Fix the process: require the commit to justify itself, then decide. If these are sandboxes with no real user data and no external exposure, plaintext is a documented, accepted risk, not a blocker. If real credentials exist, it's exposure today. Which is it? Nobody has answered that.

DB verification. "Startup schema checks on all backends" is implemented but never run against a real MSSQL instance. Playwright smoke tests almost certainly hit a test DB or mock; if mocked, the checks are dead code and schema drift is invisible. That is a higher-impact, higher-probability failure than password storage: an app that boots fine and 500s on its first real query. Run the startup check against one live DB before trusting any "verified" language.

Uncommitted HotelOps deletion. Resolve it now — commit or revert. An ambiguous working tree is a real risk (accidental restore, lost intent) and costs minutes.

Hygiene (dead code, lint, stale checklist, .gitignore) is not a blocker. Sequence it after the two above. Do not start lint-driven refactors until the auth and DB questions are answered with evidence, not inference.

### The Pragmatist (I)

The Pragmatist here. Let's be honest about what's actually at stake versus what's just noise.

The plaintext regression is NOT automatically the #1 blocker. It's only a blocker if these apps are reachable by anyone but you. They're sandbox apps. Restoring bcrypt means: migrations, re-hashing or password-reset flows, re-testing login on all 7 apps, and risking the one thing currently working (smoke tests pass). That's a real multi-day project with real regression risk. If there are zero real users and no network exposure, accept plaintext and document the decision. If there's any chance of real credentials, restore hashing — but treat it as a scoped project, not a quick fix. Do not half-restore it.

Do immediately (cheap, unblocks clarity): commit the HotelOps deletion. Update or delete the stale checklist. These cost minutes and remove confusion. Do them today.

Park (blocked or low value): DB verification — you can't run DDL without permission, so it's not actionable now; stop tracking it as if it is. Dead code (sas.js, localApiClient.jsx, tmp scripts), lint, untracked node_modules/test-results — pure hygiene. None of it changes behavior. Schedule it, don't let it crowd out real work.

Sequence: (1) commit HotelOps + fix checklist, (2) make the explicit sandbox-vs-real decision on passwords and document it, (3) only then consider hashing restoration as a planned project. Don't let dead code and lint guilt-trip you into touching working code.

### The Risk Assessor (B)

Plaintext is not the #1 blocker for sandbox operation — Playwright passes and no real users exist — but it is the #1 latent risk: the moment any app is promoted or handles real credentials, every password is recoverable. The actual #1 immediate risk is the uncommitted HotelOps deletion: uncommitted deletions are fragile and can be silently lost on a reset or `git checkout`. Commit or revert it today before anything else.

On hashing: restore bcrypt, do not accept plaintext. Cost is low (sandbox test accounts can be reset; there are no real users to migrate). Benefit is removing the single regression that undoes the prior council's #1 recommendation. Delaying only grows the plaintext user base and the eventual migration cost. If deferred, the tripwire must be: any non-sandbox deploy or real-user onboarding blocks until hashing returns.

Sequencing by risk:
1. Commit/revert HotelOps deletion (minutes; resolves uncommitted fragility).
2. Restore bcrypt across all 7 apps; update auth tests; reset test accounts (only item with compounding downside).
3. DB end-to-end verification once DDL permission is granted — dependency-blocked; schedule it, don't stall on it.
4. Batch hygiene: remove dead code (localApiClient×2, OmniPOS tmp/, sas.js file), fix .gitignore for node_modules/test-results, refresh stale checklist, clear lint. None gate functionality; none carry downside beyond wasted time.

Do not spend finite time on #4 before #2.

### The Ethicist (G)

The plaintext-password regression is not merely the #1 blocker — it is the only item on this list that constitutes an active betrayal of user trust, and it must be reversed before anything else. Commit 8a91226 took a deliberate safety decision (council #1) and inverted it silently: every app now stores recoverable credentials, and `login` does a string compare against `PasswordHash`. Smoke tests passing is not evidence of safety; they never inspected storage format, so they give false assurance. "Sandbox" is not a license to store real people's reusable passwords in plaintext — test accounts get reused, credentials leak into logs and backups, and the harm lands on users who never consented to that exposure. The cost of restoring bcrypt is trivial; the cost of a leak is not. Restore hashing across all seven apps and delete `resolvePasswordColumn` in War Matrix in the same change — the fallback is a second door left open on purpose.

Everything else is hygiene and sequencing, not harm. Commit the HotelOps deletion so repository state stops lying about what exists. Update `IMPLEMENTATION_CHECKLIST.md` so the next maintainer isn't misled into treating plaintext as a known-but-accepted issue. Then dead code, lint, and the untracked `node_modules/`/`test-results/` — none of these hurt anyone, but they erode the ability to reason about the codebase. DB verification is important but gated on permission; schedule it after hashing is restored, since verifying a schema that stores plaintext passwords only certifies a broken design. Do not accept plaintext "for now." There is no "for now" with credentials.

### The Historian (E)

The Historian's read: The bcrypt removal commit (8a91226) is the single most dangerous artifact in this repo, and it should be treated as an emergency, not a backlog item. Historical precedent is unambiguous here: every "temporary plaintext fallback" in every codebase I've seen that wasn't reverted within a week became permanent, and the ones that leaked became breaches. The War Matrix dual-column fallback (resolvePasswordColumn) is the exact pattern that keeps plaintext alive indefinitely — it's a compatibility shim that never gets removed. You already had a council tell you to remove plaintext; a commit reversed that; that's the regression that matters.

Blockers (do now):
1. Restore bcrypt hashing across all 7 apps. The plaintext comparison is a liability that compounds daily. Revert 8a91226's auth changes specifically.
2. Commit or revert the HotelOps deletion — uncommitted destructive changes are how work gets lost. Decide and land it.
3. War Matrix resolvePasswordColumn fallback — remove it as part of #1, not as a separate task.

Hygiene (do after):
- Dead code (localApiClient x2, sas.js file, OmniPOS tmp/) — schedule cleanup, not a blocker
- Lint unused imports — fix incrementally
- Stale checklist — update in the same commit as #2
- Root node_modules/test-results untracked — add to .gitignore, not a blocker
- DB verification — blocked on permission; keep as a tracked dependency, not a code task

Sequencing: Hashing first (security), then commit HotelOps + update checklist (state hygiene), then dead code/lint (quality). DB verification waits on permission.

The plaintext regression is your #1 blocker. Accept nothing else until it's fixed.

---

## Peer reviews

Anonymization mapping (revealed): A=Outsider, B=Risk Assessor, C=First Principles Thinker, D=Skeptic, E=Historian, F=Executor, G=Ethicist, H=Contrarian, I=Pragmatist, J=Expansionist.

### Review 1 (Contrarian lens)
Strongest: D. It resists reflexive action: demands the `8a91226` diff/build logs and a real-DB startup check before restoring or accepting plaintext, treats the HotelOps deletion as immediate, and correctly labels dead code/lint/checklist as hygiene. It separates unknown cause from assumed fix.

Biggest blind spot: J. It reframes plaintext as a sandbox paper cut and jumps to platform consolidation, but misses that a shared auth layer would propagate the regression and that "sandbox" code becomes templates. It also waves away DB verification as a one-app template without requiring schema/auth evidence.

All 10 missed: none asks for an exposure/ownership inventory (which apps are reachable, who has credentials, where backups/logs go) or a documented promotion gate before accepting plaintext; and none specifies adding a storage-format regression test so the next `8a91226`-type reversal fails CI. Priority should be evidence first: inspect deletion/commit diffs, classify exposure, then decide hashing; keep hygiene batched last.

### Review 2 (First Principles lens)
Strongest: D. It refuses to treat "restore bcrypt" as the answer until the diff/CI logs explain why commit `8a91226` landed, and it separates documented sandbox risk from an unexplained security-relevant process failure. It also correctly notes startup schema checks are not end-to-end DB proof.

Biggest blind spot: J. It reframes an unexplained auth regression as a "sandbox paper cut," accepts plaintext behind an undefined gate, and pivots to broad consolidation/platform work before resolving the unknown regression, uncommitted deletion, and unverified DB path.

All 10 missed: nobody explicitly calls for inspecting the actual diff/CI history to determine *why* bcrypt was removed and whether a straight restore is viable, nor for checking real exposure/data/credentials before deciding hashing policy. They also say "commit/revert HotelOps" without first inspecting that deletion diff.

### Review 3 (Expansionist lens)
Strongest: J. It is the only response that turns the migration's passing tests into leverage: a shared auth/user layer, one Users table, and one verified template. It correctly questions whether bcrypt churn is worth it in a true sandbox and reframes stale checklist/hygiene as platform-definition work.

Biggest blind spot: I. It makes sandbox-vs-real a documentation exercise but ignores the War Matrix dual-column fallback and unverified exposure/credential reuse. Accepting plaintext without removing the fallback leaves a known bypass in place; "park DB verification" also undercuts the migration's actual completion claim.

All 10 missed: none quantified real exposure, credential reuse, or inspected commit `8a91226`'s diff/reason before choosing restore vs. accept. They also failed to protect the uncommitted HotelOps deletion first and to define "done" as verified end-to-end DB/auth behavior, not just Playwright green.

### Review 4 (Outsider lens)
Strongest: D. It does not assume restoring bcrypt is automatic; it identifies the real defect as an unexplained, unguarded security-relevant change, makes plaintext acceptance conditional on documented sandbox boundaries, and prioritizes HotelOps plus real MSSQL verification over hygiene.

Biggest blind spot: J. It reframes the regression as a "paper cut," accepts plaintext behind a documented gate, and pivots to consolidation/platform work without first verifying exposure, users, or why bcrypt was removed — risking normalization of a silent security inversion.

All 10 missed: evidence and guardrails before action. None first requires inspecting diffs/blame for 8a91226 and HotelOps, confirming actual network/user exposure, adding a regression test that fails on plaintext storage, and defining rollback/branch strategy. They mostly argued policy from assumptions.

### Review 5 (Executor lens)
Strongest: H. It names the unexplained bcrypt removal as a real blocker, rejects "sandbox" rationalization, puts the uncommitted HotelOps deletion first, restores hashing and removes the War Matrix fallback together, keeps DB verification as the second blocker, and defers hygiene/checklist cleanup.

Biggest blind spot: J. It reframes plaintext storage as a sandbox paper cut and pivots to consolidation, underestimating that commit `8a91226` silently inverted a prior security decision and that "sandbox" apps often become demos/shared environments.

All 10 missed: the credential-migration problem: restoring bcrypt is not only code, it must handle existing plaintext passwords (hash-on-next-login or reset, lockout, rollback) without breaking login. None also demand the root cause of why bcrypt was removed before treating the regression as closed.

---

## Chairman synthesis

### Where the Council Agrees
- **The uncommitted HotelOps deletion is the most immediate, lowest-effort, highest-risk-in-progress item.** Commit or revert it today. All advisors converge; even the Expansionist (who calls it "progress") says commit it.
- **The plaintext-password regression (commit 8a91226) is a real problem, not hygiene.** A strong majority treat it as a blocker or near-blocker; even the pragmatists agree it is at least a documented decision point, not something to ignore. A commit silently inverted a prior council's #1 security recommendation across all 7 apps.
- **DB verification end-to-end is a genuine gap.** Startup schema checks prove tables exist, not that data/auth flow works. Majority flag this; it is permission-blocked but not optional.
- **Dead code, lint, stale checklist, untracked node_modules/test-results = hygiene.** Near-unanimous defer/batch.
- **War Matrix `resolvePasswordColumn` dual-column fallback should be removed** (as part of the hashing fix or alongside it). Majority.
- **ProdIntel fail-fast `process.exit(1)` on missing DB is correct behavior.** Carried from prior council; keep it, make the error message actionable.

### Where the Council Clashes
- **Is plaintext THE #1 blocker, or a documented sandbox tradeoff?** Security-leaning advisors (Contrarian, Outsider, Executor, Ethicist, Historian, Risk Assessor) say restore bcrypt now, no exceptions. Pragmatic advisors (First Principles, Skeptic, Pragmatist) say decide based on real exposure and the commit's cause first — don't restore blindly without knowing why 8a91226 happened or whether these apps are reachable. Expansionist says accept plaintext behind a gate and invest in a shared auth layer. Resolution: the disagreement is actually about evidence. Restoring hashing is cheap IF no real users exist, but the missing step is confirming exposure and the commit's cause before acting. Either way, the dual-column fallback must go and a storage-format regression test must gate it.
- **Scope: platform consolidation vs blockers-only.** Expansionist sees a reusable app factory; most see unverified persistence. Resolution: do blockers first, then decide on consolidation with evidence.
- **DB verification vs hashing ordering.** Some say verify DB first (First Principles); most say hashing first (Historian, Executor, Ethicist, Contrarian). Resolution: hashing first (security, compounding downside), then DB verification (permission-gated).

### Blind Spots the Council Caught (via peer review)
- **The credential-migration problem (Executor reviewer):** restoring bcrypt is not only code. Existing plaintext passwords need hash-on-next-login or reset, lockout, and rollback — none of the advisors addressed this.
- **Root cause of the regression (First Principles, Outsider reviewers):** no one inspected why 8a91226 removed bcrypt. It could be a build failure or broken login. Restoring blindly may reintroduce the original failure. Read the diff and CI logs first.
- **Exposure/ownership inventory (Contrarian reviewer):** which apps are reachable, who has credentials, where backups/logs go. None of the advisors established this before arguing policy.
- **Storage-format regression test (Contrarian, Outsider reviewers):** no one proposed a test that fails on plaintext storage, so the next `8a91226`-type reversal would pass CI silently.
- **The HotelOps deletion diff (First Principles, Outsider reviewers):** advisors said "commit or revert" without first inspecting what is actually being deleted.

### The Recommendation
Fix four things, in this order, each with evidence before action:

1. **Resolve the uncommitted HotelOps deletion first.** Inspect the deletion diff, then commit or revert it by name. Five minutes; eliminates the most fragile in-progress risk. (All advisors.)
2. **Determine why bcrypt was removed** — read commit 8a91226's diff and any CI/build logs. If it was a build failure, fix the build; if deliberate, document the decision. Then either restore bcrypt (and remove War Matrix's `resolvePasswordColumn` fallback in the same change) or make an explicit, documented sandbox-vs-real decision with a promotion gate. Either way, add a regression test that fails on plaintext storage so the next reversal fails CI. Handle credential migration (hash-on-next-login or reset test accounts) and document rollback.
3. **DB end-to-end verification on one app** (AstroSim Nexus) against a real MSSQL instance once permission is granted; use as template for the other six. Add a storage-format assertion to the test suite.
4. **Batch hygiene:** update/delete stale `IMPLEMENTATION_CHECKLIST.md` (drop HotelOps, update plaintext status), delete dead code (`sas.js` file, `localApiClient.jsx` x2, OmniPOS `tmp/` scripts), fix lint no-undef/unused imports, add root `node_modules/` and `test-results/` to `.gitignore`. Do after blockers.

### The One Thing to Do First
Resolve the uncommitted HotelOps deletion — inspect the diff, then commit or revert it by name — before touching anything else. It is the only item that can be silently lost, and it takes minutes.

---

## Seating rationale

Core five always seated (Contrarian, First Principles Thinker, Expansionist, Outsider, Executor). Panel selected for this question's profile (security regression + verification gap + hygiene triage): Skeptic (claim-heavy, evidence demands), Pragmatist (feasibility/constraints), Risk Assessor (downside quantification), Ethicist (trust/gray areas), Historian (precedent on "temporary" plaintext). Innovator and Data Analyst not seated — their angles overlap Expansionist/Skeptic here and would add little tension. Full council (all 11 panelists) was not requested.
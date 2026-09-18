---
target: dashboard (aplicativo)
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:C:\\Users\\feijo\\OneDrive\\Desktop\\inform-tica-integral-cronograma-2026-main\\inform-tica-integral-cronograma-2026-main\\src\\routes\\dashboard\\index.tsx"
target_fingerprint: "sha256:c9b1ade57f1415efbaa94d00fe6ebbc29f39836f4ad359a1f8d62cad6087b06c"
target_path: "C:\\Users\\feijo\\OneDrive\\Desktop\\inform-tica-integral-cronograma-2026-main\\inform-tica-integral-cronograma-2026-main\\src\\routes\\dashboard\\index.tsx"
timestamp: 2026-09-18T20-24-03Z
slug: src-routes-dashboard-index-tsx
---
Method: dual-agent (A: a4c2beab52340a7da · B: a176c8a2602dcea9d)

⚠️ Scope note: the dashboard sits behind Supabase login with no test credentials available. Unauthenticated gate screens (`/dashboard` restricted-access card, `/login` form) were assessed live in the browser. All screens behind login (index, alunos, aulas, faltas, frequência, grupos, programação, turmas) were assessed by reading source/JSX only — findings below are marked accordingly.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Toasts exist on save/delete, but no disabled/pending state found on submit handlers (source) |
| 2 | Match System / Real World | 3 | Correct pt-BR domain terms throughout (source) |
| 3 | User Control and Freedom | 2 | Destructive actions are guarded, but no undo; inline group-change only has confirm, no cancel-in-place (source) |
| 4 | Consistency and Standards | 1 | Two different delete-confirmation patterns for the same action type across alunos.tsx vs turmas/$turmaId.tsx (source); confirmed live 21px horizontal overflow + missing nav links at 375px on both /dashboard and /login (shared shell with the public site) |
| 5 | Error Prevention | 2 | Validation via toast.error only post-submit, no inline field validation (source) |
| 6 | Recognition Rather Than Recall | 3 | Descriptive sidebar labels + icons (source) |
| 7 | Flexibility and Efficiency | 1 | No search, keyboard shortcuts, or bulk actions found anywhere (source) — notable gap for a tool used many times daily |
| 8 | Aesthetic and Minimalist Design | 2 | Clean Card layout in-page (source), but shared nav shell carries the same cyan/purple neon + low-contrast findings the public site has (live, confirmed on /login) |
| 9 | Error Recovery | 2 | Actionable toast copy, no recovery action offered (source) |
| 10 | Help and Documentation | 0 | No tooltip, help affordance, or onboarding text anywhere in shell/nav/forms (source) — genuinely absent, not n/a for an Operate surface |
| **Total** | | **18/40** | **Poor (just under the Acceptable line)** |

(Revised down from Assessment A's 20 after folding in Assessment B's confirmed shared-shell overflow and contrast findings into heuristic 4 and 8.)

## Design Specificity Verdict

**LLM assessment**: Mostly generic shadcn CRUD scaffolding (Card/Table/Select/Dialog defaults). The `necessidadeEspecial`/mediador handling in `turmas/$turmaId.tsx` and the per-turma "Grupo N" rotation cards are genuinely domain-aware; the rest — the Alunos table, the StatCard grid — would be indistinguishable from any generic school-admin template. Nothing about lab-specific daily realities (a PC that's down, which turma is live right now) shapes the layout beyond the one `LiveSessionPanel` on the home screen.

**Deterministic scan**: CLI `detect --json` on `src/routes/dashboard` and `dashboard-shell.tsx` returned zero findings (clean by the static-markup rule set). The live browser-injected detector, run against `/login` (shares the same nav shell and theme tokens as the dashboard), found 36+9 anti-pattern instances: `ai-color-palette` (cyan/purple neon, multiple), `low-contrast` (down to 1.0:1), `undersized-ui-text`, `tiny-text`, `line-length`, `buried-raster` — the same family the public site carries, because both surfaces share `nav-bar.tsx` and the root theme tokens. This is a genuine scope gap in the CLI scan (source-only, missed what only renders at runtime), not a false positive.

**Visual overlays**: Injection succeeded directly against the rendered `/login` page; server was stopped after the run per protocol.

**Additional live-only finding**: the same React hydration-mismatch error and ServiceWorker registration failure found on the public site also fire on `/login` and `/dashboard` — confirms this is a root-shell bug (`__root.tsx`), not isolated to the marketing pages.

## Overall Impression

The in-page work (destructive-action confirmations, conditional special-needs fields) shows real domain thinking, but the product has two competing ways to manage the same student, a flat 9-item nav that will confuse a new hire on day one, and zero in-app help for an admin tool run by non-technical school staff. The shared shell's mobile-nav breakage and contrast issues hit this surface too, since coordinators are checking this between classes on a phone.

## What's Working

- **Destructive-action pattern** (`turmas/$turmaId.tsx`): AlertDialog names the exact consequence ("Remover {aluno.nome}? Esta ação remove... da agenda de revezamento") — specific and reassuring where it matters most.
- **Conditional special-needs support fields**: `necessidadeEspecial`/`apoioEspecial` only surface a textarea and staff badges when actually checked — real domain modeling, not template filler.
- **Login page** (observed live): calm, on-brand, single clear CTA, "Acesso restrito à gestão da escola" sets the right expectation immediately.

## Priority Issues

**[P0] Two different screens fully manage the same students with different UI patterns.** `dashboard/alunos.tsx` (inline table) and `dashboard/turmas/$turmaId.tsx` (card+dialog) both add/edit/remove/group students, with different confirmation mechanisms for the same action type.
**Why it matters**: Doubles a daily user's mental model of "where do I do this," invites inconsistent data entry, and doubles the code surface to keep in sync.
**Fix**: Pick one canonical student-management surface (turma-scoped is the stronger fit, since names appear on the live timer per that context); make "Alunos" a read-only roster/search view or fold it into Turmas.
**Suggested command**: `/impeccable distill`

**[P1] Confirm-dialog fatigue on routine, non-destructive actions.** Adding a student, changing a group, and renaming all require an async confirm() before committing (source).
**Why it matters**: This tool is used many times a day under time pressure; extra clicks on safe actions burn time and train users to click through confirms mindlessly — which then weakens the one confirmation that should matter (delete).
**Fix**: Remove confirm() for add/edit; keep it only for delete/removal and irreversible bulk actions.
**Suggested command**: `/impeccable clarify`

**[P1] Flat 9-item nav with overlapping labels.** `NAV_ITEMS` in `dashboard-shell.tsx` lists 9 ungrouped links including "Turmas e alunos," "Turmas e grupos," and "Alunos" side by side (source).
**Why it matters**: Violates the ≤4-per-group chunking rule; a new hire won't know which page to open for "add a student" — this is exactly the ambiguity the P0 issue above creates in the nav.
**Fix**: Group into 2-3 labeled sections (Cadastro / Rotina / Sistema) with subheads.
**Suggested command**: `/impeccable layout`

**[P1] Shared-shell bugs land on the dashboard too.** The public site's mobile-nav breakage (21px overflow, missing nav links at 375px), low-contrast text, and the React hydration-mismatch crash all reproduce on `/login` and `/dashboard` because they share `nav-bar.tsx` and `__root.tsx` (live, confirmed).
**Why it matters**: A coordinator checking the dashboard on a phone between classes hits the exact same broken nav as a parent on the marketing site.
**Fix**: Fixing the shared shell (see the site critique's P0/P1 items) fixes both surfaces at once — treat it as one root-cause fix, not two.
**Suggested command**: `/impeccable audit` (shared shell), then re-verify both surfaces

**[P2] No loading/pending state on mutating forms.** No disabled-button-while-saving pattern found in any submit handler read (source).
**Why it matters**: A double-click while a request is in flight (or once wired to real Supabase writes) risks duplicate student records.
**Fix**: Disable submit + show a spinner while the mutation is in flight.
**Suggested command**: `/impeccable harden`

## Persona Red Flags

**Alex (power user, daily)**: Every add/edit needs a modal confirm — the single biggest daily-speed tax; no search/filter on the Alunos table beyond a turma dropdown, so scanning a large roster means scrolling.

**Jordan (first-timer)**: Nav ambiguity ("Turmas e alunos" vs "Alunos" vs "Turmas e grupos") plus zero help affordance (heuristic #10 scored 0) means the first session is likely spent guessing which of three pages to use.

**Casey (mobile coordinator, checking between classes)**: Confirmed live — at 375px the shared header overflows, "Entrar" is clipped, and half the nav links vanish, on both `/login` and `/dashboard`, before the coordinator even reaches the tool they need.

## Minor Observations

- `StatCard` "Turmas sem alunos" appears to use a Monitor icon mismatched to "Alunos cadastrados" (dashboard/index.tsx, source).
- Delete button in the alunos.tsx table row has no `aria-label`, icon-only (source) — unnamed for screen-reader users.
- Theme toggle at mobile width on `/dashboard` leaves the top nav strip dark while the body switches to light — a mismatched-theme header after toggle (live, confirmed).

## Questions to Consider

- What if "Alunos" as a standalone page didn't exist, and every student action lived inside its turma — would coordinators miss the cross-turma table, or was it just easier to build?
- What if the confirmation pattern flipped — one click to add, two steps only to delete — would daily throughput improve without increasing mistaken deletions?
- What if the nav's first item showed today's live slot status instead of a generic stat grid — would that match how a coordinator actually starts their day?

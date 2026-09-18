---
target: homepage (site)
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:C:\\Users\\feijo\\OneDrive\\Desktop\\inform-tica-integral-cronograma-2026-main\\inform-tica-integral-cronograma-2026-main\\src\\routes\\index.tsx"
target_fingerprint: "sha256:93557ffa8339a7d2410e3b6f316a6fde8999cfc01b93604e7e9775c5d5350bdc"
target_path: "C:\\Users\\feijo\\OneDrive\\Desktop\\inform-tica-integral-cronograma-2026-main\\inform-tica-integral-cronograma-2026-main\\src\\routes\\index.tsx"
timestamp: 2026-09-18T20-23-55Z
slug: src-routes-index-tsx
---
Method: dual-agent (A: a938211a48d2c06bd · B: a940563c0c59b6520)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Weather/live-session panels show indefinite "Consultando..."/"Carregando..." text with no skeleton or timeout; hero stats flash 0→real values, and browser evidence shows the stat values are actually non-deterministic across reloads (31 → 27 → 233 alunos on the same route) |
| 2 | Match System / Real World | 3 | Good pt-BR schooling vocabulary (turma, série); weather jargon ("sensação", "umidade") is out of place for the actual task |
| 3 | User Control and Freedom | 2 | No mobile nav fallback — confirmed live: at 375px, "Início", "Coordenação", "Sobre" are removed from the DOM entirely, not just hidden |
| 4 | Consistency and Standards | 2 | shadcn vocabulary is consistent, but the JP News radio pill breaks the nav's visual grammar; confirmed 21px horizontal overflow at 375px |
| 5 | Error Prevention | 3 | Mostly informational page; low destructive-action surface |
| 6 | Recognition Rather Than Recall | 3 | "hoje" badge on day selector aids recall |
| 7 | Flexibility and Efficiency | 2 | No shortcut to "my turma"; no filtering |
| 8 | Aesthetic and Minimalist Design | 1 | Detector confirms: cyan gradient backgrounds, purple/cyan neon text, low-contrast text (as low as 1.0:1 against a 4.5:1 requirement), undersized 10px UI text — stacked with 5+ competing panels before the real schedule |
| 9 | Error Recovery | 1 | The radio widget shows a permanent, unexplained warning triangle + "sinal indisponível" with no dismiss; confirmed live console shows a real, reproducible React hydration-mismatch crash on every load |
| 10 | Help and Documentation | 2 | No legend/tooltip for série color-coding beyond one caption line |
| **Total** | | **21/40** | **Acceptable (low end)** |

(Revised down from Assessment A's initial 23 after folding in Assessment B's confirmed low-contrast and hydration-crash evidence into heuristics 8 and 9.)

## Design Specificity Verdict

**LLM assessment**: The weekly schedule grid (série color-coding), the live "Nenhuma aula agora" countdown panel, and the printed-poster callout are genuinely built for this product — a teacher checking who's using the lab right now won't find this anywhere else. But the hero, feature-card grid, and animated stat counters are interchangeable SaaS-landing furniture, and the embedded Jovem Pan News radio player in the nav bar has no connection to a lab-scheduling tool at all — it actively damages specificity and, per live evidence, currently ships broadcasting its own error.

**Deterministic scan**: CLI `detect` on `src` found 4 `bounce-easing` warnings (weather-widget.tsx:36, styles.css:229/230/248) — cosmetic, low severity. The live browser-injected detector found 36 anti-pattern instances on the rendered page: `ai-color-palette` (cyan gradients, purple/cyan neon text — 17 instances), `low-contrast` (6 instances, down to 1.0:1 against a 4.5:1 requirement), `undersized-ui-text` (2 instances, 10px "JP News"/"sinal indisponível"), `tiny-text` (3×, 11px), `line-length` (4× over 80 chars/line), and `buried-raster` (1×, background image at 0.12 opacity). No false positives identified; the bounce-easing findings were not visually confirmed as triggering during the session (not disproven either — just unobserved).

**Visual overlays**: Live-server injection succeeded and ran directly against the rendered page (not a separate tab you can revisit — the server was stopped after the run per protocol). The console findings above are the full record.

**Additional live-only finding (not from either detector)**: A real, reproducible React hydration-mismatch error and "failed to register a ServiceWorker" error fire on every page load — these are functional bugs, not visual taste, caught only by the browser assessment.

## Overall Impression

The page's best material — the live status panel, the weekly grid — is real and well-made, but it's buried under generic hero furniture, a broken and irrelevant radio widget, and a genuinely broken mobile nav. The gap between "what's good here" and "what's visible first" is the single biggest opportunity.

## What's Working

- **Live session panel's empty-state copy** ("Nenhuma aula de informática agora" + next-lesson preview) — concrete, reassuring, and specific to the actual anxiety a visitor has ("is the lab in use right now?").
- **Weekly schedule grid** color-coded by série — matches how school staff actually categorize turmas, not a generic calendar widget.
- **Mobile scroll-hint gradient + "Deslize para o lado"** on the wide schedule table — a small, real fix for a real, specific overflow problem.

## Priority Issues

**[P0] Mobile nav silently drops half its links.** Confirmed live at 375px: "Início", "Coordenação", and "Sobre" are removed from the DOM, not collapsed into a menu — parents/staff on a phone cannot reach half the site, and there's a 21px horizontal overflow on top of it.
**Why it matters**: This is the primary device class for this audience (school staff and parents checking on the go); a chunk of the site is simply unreachable.
**Fix**: Add a hamburger/sheet menu below 768px containing all nav links; remove the radio-player pill from the nav entirely so there's room.
**Suggested command**: `/impeccable harden`

**[P0] Irrelevant radio widget breaks trust with a live, permanent error.** The "Jovem Pan News" player shows a warning triangle + "sinal indisponível" in the header on every load — unrelated to lab scheduling, occupying the most valuable real estate on the page, currently broadcasting its own failure to every visitor.
**Why it matters**: A non-technical visitor reads a persistent warning icon in the header as "this whole site is broken."
**Fix**: Remove it from this product (or relocate to footer as a plain link), and never render a bare warning icon with no dismiss.
**Suggested command**: `/impeccable distill`

**[P1] Real hydration-mismatch crash and low-contrast text are shipping, not just theoretical.** Browser evidence confirms a reproducible React hydration error tied to `<html className="dark">` in `__root.tsx:150`, plus text combinations as low as 1.0:1 contrast (need 4.5:1) and 10px functional text below the accessibility floor.
**Why it matters**: The hydration error is a real bug (not a taste issue) that can cause visible flicker or broken interactivity on first paint; the contrast/text-size findings fail WCAG AA for a public school site that should be broadly accessible.
**Fix**: Resolve the SSR/CSR theme-class mismatch (likely reading `localStorage` theme before hydration completes); raise the flagged text/background pairs to ≥4.5:1 and bump 10px UI text to ≥11px.
**Suggested command**: `/impeccable audit`

**[P1] Nine stacked panels before the actual schedule causes high cognitive load.** Hero → poster image → "Cronograma novo" banner → weather → live session → próximas turmas → feature grid → weekly grid → second gradient schedule section — a teacher needing one answer scrolls past eight other things first.
**Why it matters**: Cognitive-load checklist scored 4+ failures (high/critical) — single focus, chunking, hierarchy, and progressive disclosure all fail.
**Fix**: Consolidate weather + live-session + próximas-turmas into one compact status card; keep only one of the two weekly-schedule sections.
**Suggested command**: `/impeccable distill`

**[P2] Hero stats are non-deterministic and flash from zero.** Live evidence: the same route returned 31, then 27, then 233 "alunos cadastrados" across reloads with no user action — this reads as broken data, not a counting animation, especially paired with the visible 0→value flash on load.
**Why it matters**: Undermines trust in every other number on the page.
**Fix**: Hide the stat row (or show a skeleton) until data is confirmed loaded; investigate why the same route yields different counts across reloads (seed/mock data reseeding?).
**Suggested command**: `/impeccable harden`

## Persona Red Flags

**Jordan (first-timer, non-technical school staff)**: Sees "0 Turmas / 0 Alunos" flash before self-correcting (looks broken), then must scroll past five stacked panels before finding the actual schedule. The radio widget's warning icon in the header reads as a site-wide error notice.

**Casey (distracted mobile parent)**: Opens on a phone; "Sobre", "Coordenação", "Início" are simply gone from the nav with no hamburger fallback, and the "Entrar" button is visibly clipped ("Entra") at the viewport edge. There is no discoverable path to the school's about/contact info from a phone.

## Minor Observations

- `alt=""` on schedule thumbnails (lines ~449, ~616) loses context for screen-reader users checking who's in a slot.
- Two near-duplicate weekly-schedule sections (`WeeklyScheduleGraphic` + `ProgramacaoSemanalDestaque`) show the same information twice in different visual styles.
- Floating logo badge overlapping the hero photo (`absolute -left-3 -top-3`) risks clipping at in-between viewport widths.
- 4 low-severity `bounce-easing` CLI findings (weather-widget.tsx, styles.css) — cosmetic, fix opportunistically.

## Questions to Consider

- What if the entire pre-schedule stack collapsed into one compact status bar so the weekly grid — the actual reason anyone visits — appeared in the first screen?
- What if the radio player were cut entirely — would anything about the product's real job (scheduling lab time) be worse off?
- What if the homepage opened directly on today's schedule instead of a marketing hero, since the most likely visitor (a teacher mid-day) needs the answer immediately?

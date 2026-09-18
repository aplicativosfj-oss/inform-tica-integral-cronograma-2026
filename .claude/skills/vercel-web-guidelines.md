---
name: vercel-web-guidelines
description: Review UI code for Vercel Web Interface Guidelines compliance
metadata:
  source: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
---

# Vercel Web Interface Guidelines

Review files for compliance with Vercel's UI standards. Output findings grouped by file with issue location and description.

## Accessibility
- Icon-only buttons need `aria-label`
- Form controls need `<label>` or `aria-label`
- Interactive elements need keyboard handlers (`onKeyDown`/`onKeyUp`)
- `<button>` for actions, `<a>`/`<Link>` for navigation (not `<div onClick>`)
- Images need `alt` (or `alt=""` if decorative)
- Decorative icons need `aria-hidden="true"`
- Async updates (toasts, validation) need `aria-live="polite"`
- Use semantic HTML before ARIA
- Headings hierarchical `<h1>`–`<h6>`; include skip link
- `scroll-margin-top` on heading anchors
- Meaningful media needs captions/transcripts
- Media controls need keyboard support

## Focus States
- Interactive elements need visible focus: `focus-visible:ring-*`
- Never `outline-none` without focus replacement
- Use `:focus-visible` over `:focus`
- Group focus with `:focus-within` for compound controls
- Sticky headers/footers must not cover focused element

## Forms
- Inputs need `autocomplete` and meaningful `name`
- Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode`
- Never block paste
- Labels clickable (`htmlFor` or wrapping control)
- Disable spellcheck on emails, codes, usernames
- Checkboxes/radios: label + control share single hit target
- Submit button stays enabled until request starts
- Errors inline next to fields; focus first error on submit
- Placeholders end with `…` and show example pattern

## Animation
- Honor `prefers-reduced-motion`
- Animate `transform`/`opacity` only
- Never `transition: all`—list properties explicitly
- Set correct `transform-origin`
- SVG transforms on `<g>` wrapper
- Animations interruptible
- Autoplay motion >5 seconds needs pause/stop/hide
- Muted loops must stop under `prefers-reduced-motion`

## Typography
- `…` not `...`
- Curly quotes `"` `"` not straight `"`
- Non-breaking spaces: `10&nbsp;MB`
- Loading states end with `…`
- `font-variant-numeric: tabular-nums` for number columns
- `text-wrap: balance` on headings

## Content Handling
- Text containers handle long content: `truncate`, `line-clamp-*`, or `break-words`
- Flex children need `min-w-0` for truncation
- Handle empty states
- Anticipate short, average, and very long inputs

## Images
- `<img>` needs explicit `width` and `height`
- Below-fold: `loading="lazy"`
- Above-fold critical: `priority` or `fetchpriority="high"`

## Performance
- Large lists (>50 items): virtualize
- No layout reads in render
- Batch DOM reads/writes
- Prefer uncontrolled inputs
- Add `<link rel="preconnect">` for CDN
- Critical fonts: `<link rel="preload">`
- Prefer `<video>` over animated GIF

## Navigation & State
- URL reflects state—filters, tabs, pagination
- Links use `<a>`/`<Link>`
- Deep-link all stateful UI
- Destructive actions need confirmation

## Touch & Interaction
- `touch-action: manipulation`
- `-webkit-tap-highlight-color` set intentionally
- `overscroll-behavior: contain` in modals
- Drag: disable text selection, use `inert`
- Gestures need tap/click and keyboard alternatives

## Safe Areas & Layout
- Full-bleed layouts need `env(safe-area-inset-*)`
- Avoid unwanted scrollbars
- Flex/grid over JS measurement

## Dark Mode & Theming
- `color-scheme: dark` on `<html>`
- `<meta name="theme-color">` matches page background
- Native `<select>`: explicit `background-color` and `color`

## Locale & i18n
- Dates/times: use `Intl.DateTimeFormat`
- Numbers/currency: use `Intl.NumberFormat`
- Detect language via `Accept-Language`
- Brand names: wrap with `translate="no"`

## Hydration Safety
- Inputs with `value` need `onChange` or use `defaultValue`
- Date/time rendering: guard against hydration mismatch
- Minimal `suppressHydrationWarning`

## Hover & Interactive States
- Buttons/links need `hover:` state
- Interactive states increase contrast

## Content & Copy
- Active voice
- Title Case for headings/buttons
- Numerals for counts
- Specific button labels
- Error messages include fix/next step
- Second person
- `&` over "and" where space-constrained

## Anti-patterns (Flag These)
- `user-scalable=no` disabling zoom
- `onPaste` with `preventDefault`
- `transition: all`
- `outline-none` without focus-visible replacement
- Inline `onClick` navigation
- `<div>` or `<span>` with click handlers
- Images without dimensions
- Large arrays without virtualization
- Form inputs without labels
- Icon buttons without `aria-label`
- Hardcoded date/number formats
- `autoFocus` without justification
- Animated GIF when compressed video suitable
- Gesture-only action without alternatives

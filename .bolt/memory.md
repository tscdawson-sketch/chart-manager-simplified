# Project memory

## Product intent & audience

- App: **Preflop Gym Chart Manager** — tool for building/managing poker preflop charts.
- Users manage workspaces containing chart details and imported stack tiers; data persists via Supabase.
- No authentication; anyone with the link can view and edit charts.

## Brand personality & voice

- Utility-focused poker training tool; professional and data-oriented.
- Clear, concise UI copy; numbered panels guide workflow steps.

## Visual design & UX direction

- Layout: header with backup buttons, workspace tab bar, five numbered panels (stack import, collection, validation, combined output, plus one more).
- Stylesheet recreated from original markup/class names; original CSS file was not provided — visual details are inferred.
- Uses Tailwind CSS classes, React hooks, Lucide React icons; `@/` path alias for `src/`.
- Build button disabled until validation checks pass.
- Table types and hero positions auto-filled per format (6-Max, 9-Max, Heads-Up).

## Decisions, constraints & rationale

- **Supabase** chosen for persistence of workspaces, chart details, and stack tiers.
- Stack file format: JSON object with `stackDepth` (number) and `hands` (map). Importing an existing depth replaces that tier.
- "Output All" downloads all tiers as a single JSON file, reusable via paste-back import.
- React Strict Mode double-invoke guarded against duplicate default workspace creation on first load.
- No extra UI/theme packages installed beyond defaults (Tailwind, Lucide React).
- Typecheck, lint, build, and Supabase security advisor all pass clean.

## Open questions & assumptions

- Original external stylesheet was unavailable; recreated look may not match pixel-for-pixel — user should verify in preview.
- UI click-through not tested in build environment; manual preview verification needed.
- Table types and hero position lists were empty in original; filled per format as a best-guess default.
- No auth model — acceptable for current scope but may need access control if shared publicly.
# Graph Report - C:\Users\jayac\Documents\remax-giving\remax-home-of-giving-wireframes  (2026-09-11)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 339 nodes · 562 edges · 20 communities (14 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- support.js
- index.ts
- compilerOptions
- devDependencies
- app/page.tsx
- dialog.tsx
- components.json
- content.ts
- dependencies
- layout.tsx
- _ds_bundle.js
- tabs.tsx
- ui/badge.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `createRuntime()` - 14 edges
3. `BrandButton()` - 12 edges
4. `getReact()` - 9 edges
5. `walk()` - 9 edges
6. `walkXImport()` - 9 edges
7. `walkElement()` - 9 edges
8. `Reveal()` - 9 edges
9. `Homepage()` - 8 edges
10. `walkChildren()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ProjectDetailPage()` --calls--> `getCampaignBySlug()`  [EXTRACTED]
  src/app/program/[slug]/page.tsx → src/lib/seed/campaigns.ts
- `ProjectDetailPage()` --calls--> `getProjectDetail()`  [EXTRACTED]
  src/app/program/[slug]/page.tsx → src/lib/seed/project-details.ts
- `ProjectDetail` --references--> `ProjectDonor`  [EXTRACTED]
  src/lib/seed/project-details.ts → src/lib/seed/types.ts

## Import Cycles
- None detected.

## Communities (20 total, 6 thin omitted)

### Community 0 - "support.js"
Cohesion: 0.07
Nodes (54): boot(), bundledBlob(), cdnScriptFor(), collectProps(), compileAttr(), compileTemplate(), contentKey(), createComponentFactory() (+46 more)

### Community 1 - "index.ts"
Cohesion: 0.09
Nodes (23): BrandBadge(), BrandBadgeProps, BrandButton(), BrandButtonProps, brandButtonVariants, CampaignCard(), CampaignCardProps, PageHeader() (+15 more)

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+17 more)

### Community 4 - "app/page.tsx"
Cohesion: 0.14
Nodes (16): CountUp(), CountUpProps, formatNumber(), Reveal(), RevealProps, FeaturedProject(), FinalCta(), Hero() (+8 more)

### Community 6 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "content.ts"
Cohesion: 0.14
Nodes (18): ProjectDetailPage(), campaignStatuses, getCampaignBySlug(), blogCategories, detailProjectDocs, projectDetailDonors, buildDefaultDetail(), getProjectDetail() (+10 more)

### Community 8 - "dependencies"
Cohesion: 0.10
Nodes (21): class-variance-authority, cn, lucide-react, motion, next, dependencies, class-variance-authority, cn (+13 more)

### Community 9 - "layout.tsx"
Cohesion: 0.15
Nodes (10): caveat, metadata, plusJakartaSans, Footer(), Navbar(), WhatsAppCta(), footerLinks, navLinks (+2 more)

### Community 10 - "_ds_bundle.js"
Cohesion: 0.36
Nodes (8): Badge(), Button(), CampaignCard(), _extends(), Footer(), Homepage(), Navbar(), StatCounter()

## Knowledge Gaps
- **89 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `support.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07259615384615385 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0935374149659864 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
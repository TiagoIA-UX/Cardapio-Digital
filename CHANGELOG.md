# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Decomposed `app/page.tsx` into focused Server Components under `components/home/`
  (`HeroSection`, `BenefitsSection`, `ProductSection`, `TemplatesSection`,
  `FeaturesSection`, `HowItWorksSection`, `CTASection`)
- `loading.tsx` and `error.tsx` for `/painel` and `/admin` routes
- `scripts/pre-merge-check.mjs` — automated quality gate before merges
  (`npm run pre-merge` runs tsc, eslint, and next build)
- `CHANGELOG.md` (this file)
- `docs/PADROES_CODIGO.md` — documented code standards for the project
- `docs/AUDITORIA_CODIGO.md` — full code audit report
- `reports/` added to `.gitignore`

### Changed
- `@types/qrcode` moved from `dependencies` to `devDependencies`
- `package.json` — added `pre-merge` script

## [2.0.0] — 2025-02-01

### Added
- Multi-tenant SaaS architecture with Supabase RLS for full data isolation
- 15 restaurant templates covering all major food-service niches
- Affiliate program with 6-tier commission structure
- Marketplace for freelance menu creators
- White-label operator panel with visual menu editor
- Mercado Pago payment integration with webhook support
- Groq SDK (LLaMA 3.3 70B) integration for AI-generated product descriptions
- Cloudflare R2 for product image storage
- Upstash Redis for rate limiting on critical API routes
- Admin panel with full SaaS management (users, subscriptions, support)
- QR Code generation per restaurant
- WhatsApp order routing
- PWA manifest (`public/manifest.json`)
- Vercel Analytics and Speed Insights
- Playwright E2E test suite for checkout and order flows
- SECURITY.md covering attack vectors and responsible disclosure

### Changed
- Migrated from Pages Router to Next.js App Router
- Upgraded to React 19 and TypeScript 5 strict mode
- Replaced Google Fonts direct import with `next/font`
- Security headers configured in `next.config.mjs` (CSP, HSTS, X-Frame-Options, etc.)

## [1.0.0] — 2024-11-01

### Added
- Initial digital menu product (single tenant)
- Basic WhatsApp order flow
- Product categories and item management

[Unreleased]: https://github.com/TiagoIA-UX/Cardapio-Digital/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/TiagoIA-UX/Cardapio-Digital/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/TiagoIA-UX/Cardapio-Digital/releases/tag/v1.0.0

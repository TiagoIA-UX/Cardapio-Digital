# 📊 Análise Completa do Repositório — Cardápio Digital

> Documento gerado em 24/03/2026 após análise completa do repositório `TiagoIA-UX/Cardapio-Digital` (branch `main`), cobrindo estrutura, código, arquitetura, documentação, segurança, CI/CD e comparação competitiva.

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Técnica](#2-stack-técnica)
3. [Arquitetura de Pastas](#3-arquitetura-de-pastas)
4. [Funcionalidades Implementadas ✅](#4-funcionalidades-implementadas-)
5. [Funcionalidades Faltantes ❌](#5-funcionalidades-faltantes-)
6. [Pontos Fortes — Diferenciais Competitivos 🏆](#6-pontos-fortes--diferenciais-competitivos-)
7. [Problemas e Débitos Técnicos ⚠️](#7-problemas-e-débitos-técnicos-)
8. [Segurança](#8-segurança)
9. [Documentação](#9-documentação)
10. [CI/CD](#10-cicd)
11. [Recomendações Priorizadas](#11-recomendações-priorizadas)
12. [Métricas do Repositório](#12-métricas-do-repositório)

---

## 1. Visão Geral do Projeto

| Campo | Valor |
|---|---|
| **Nome** | Cardápio Digital |
| **Tipo** | SaaS B2B white-label de cardápio digital para food-service |
| **Versão** | 2.0.0 |
| **Licença** | BSL 1.1 (converte para Apache 2.0 em 2030) |
| **Produção** | https://zairyx.com |
| **Repositório** | https://github.com/TiagoIA-UX/Cardapio-Digital |
| **Branch padrão** | `main` |
| **Linguagem principal** | TypeScript (86.5%) |
| **Outras linguagens** | PLpgSQL (8.7%), JavaScript (3.6%) |

---

## 2. Stack Técnica

| Tecnologia | Versão | Notas |
|---|---|---|
| **Next.js** | 16 (App Router) | Versão de ponta — boa escolha para SSR, RSC e performance |
| **React** | 19 | Última versão estável com Server Components e Actions |
| **Tailwind CSS** | 4 | Design system moderno, integrado com Radix UI |
| **Radix UI** | — | Componentes acessíveis (WAI-ARIA) sem estilo próprio |
| **Supabase** | — | PostgreSQL gerenciado com 27+ migrations, RLS em todas as tabelas |
| **TypeScript** | 5 strict | Boa prática — zero `any`, segurança de tipos em toda a base |
| **Mercado Pago** | — | Checkout + webhooks (sandbox + produção) |
| **Groq SDK** | — | LLaMA 3.3 70B — chatbot IA com custo muito baixo |
| **Cloudflare R2** | — | Storage S3-compatible com CDN global |
| **Upstash Redis** | — | Rate limiting por IP nas APIs críticas |
| **GitHub Actions** | — | CI/CD automatizado |
| **Vercel** | — | Deploy automático em merge para `main` |
| **Playwright** | — | Testes e2e automatizados |
| **Zod** | — | Validação de schemas em todas as APIs |

---

## 3. Arquitetura de Pastas

### Estrutura `app/`

| Rota | Descrição |
|---|---|
| `admin/` | Painel administrativo (visão superadmin) |
| `afiliados/` | Sistema de afiliados (6 tiers: Bronze → Diamante) |
| `api/` | Endpoints REST (CRUD, webhooks, IA, etc.) |
| `auth/` | Fluxo de autenticação (callback, confirmação) |
| `cadastro/` | Cadastro de operadores |
| `checkout/` | Fluxo de compra (Mercado Pago) |
| `comprar/` | Compra de templates |
| `cookies/` | Política de cookies |
| `demo/` | Demonstração pública |
| `dev/` | Ferramentas de desenvolvimento (protegido por env) |
| `feedback/` | Sistema de feedback de clientes |
| `finalizar-compra-pacote/` | Finalização de pacotes |
| `login/` | Autenticação de operadores |
| `meus-templates/` | Gestão de templates do operador |
| `ofertas/` | Ofertas especiais |
| `onboarding/` | Fluxo de onboarding pós-cadastro |
| `pagamento/` | Gestão de pagamentos e histórico |
| `painel/` | Painel do operador (produtos, categorias, visual, banner, cores) |
| `politica/` | Política de privacidade ⚠️ *duplicada* |
| `politica-de-privacidade/` | Política de privacidade ⚠️ *duplicada* |
| `precos/` | Página de preços |
| `privacidade/` | Privacidade |
| `r/` | Rotas dinâmicas de restaurantes (cardápio público) |
| `revendedores/` | Sistema de revenda |
| `status/` | Status do sistema |
| `templates/` | Catálogo de templates disponíveis |
| `termos/` | Termos de uso ⚠️ *duplicada* |
| `termos-de-uso/` | Termos de uso ⚠️ *duplicada* |

### Observações sobre a arquitetura

- ⚠️ **Rotas duplicadas**: `politica/` vs `politica-de-privacidade/`, `termos/` vs `termos-de-uso/` — consolidar em uma única rota com redirect 301
- ⚠️ `app/page.tsx` tem **29KB** — arquivo muito grande, deveria ser decomposto em seções de componentes (Hero, Features, Pricing, Testimonials, CTA)
- ✅ **SEO bem configurado**: `robots.ts`, `sitemap.ts`, ícones (PNG + SVG + Apple icon), metadados Open Graph

---

## 4. Funcionalidades Implementadas ✅

| # | Funcionalidade | Observação |
|---|---|---|
| 1 | ✅ **15 templates por nicho** | Restaurante, Pizzaria, Lanchonete, Bar, Açaí, Pet Shop, etc. |
| 2 | ✅ **Painel do operador** | Gestão de produtos, categorias, visual, banner, cores |
| 3 | ✅ **Pedidos WhatsApp** | Envio estruturado com carrinho formatado |
| 4 | ✅ **QR Code por mesa** | Geração própria com link direto ao cardápio |
| 5 | ✅ **Checkout Mercado Pago** | Sandbox + produção, webhooks de pagamento |
| 6 | ✅ **Sistema de afiliados (6 tiers)** | Bronze → Prata → Ouro → Platina → Diamante → Elite |
| 7 | ✅ **Suporte com SLA cronometrado** | Tickets com prazo de resposta garantido |
| 8 | ✅ **Marketplace freelancer** | Contratação, revisão e penalidades |
| 9 | ✅ **Penalidades progressivas (strikes)** | Automação de suspensão por violações |
| 10 | ✅ **Painel admin completo** | Gestão de todos os operadores, templates, afiliados |
| 11 | ✅ **Chatbot IA (Groq/LLaMA)** | Atendimento automatizado com custo quase zero |
| 12 | ✅ **CDN de imagens (Cloudflare R2)** | Upload otimizado, cache distribuído globalmente |
| 13 | ✅ **Rate limiting (Upstash Redis)** | Proteção por IP em todas as APIs críticas |
| 14 | ✅ **Autenticação (Supabase Auth)** | Email/senha + verificação + hierarquia de roles (admin → operador) |
| 15 | ✅ **Segurança avançada** | RLS em todas as tabelas, SECURITY DEFINER, search_path hardening |
| 16 | ✅ **Cron jobs** | Verificação de SLA e expiração de contratos freelancer |
| 17 | ✅ **PWA manifest** | Instalável como app no celular |
| 18 | ✅ **CI/CD** | GitHub Actions + Vercel auto-deploy em merge para `main` |

---

## 5. Funcionalidades Faltantes ❌

Comparação com o que concorrentes (Menudino, GrandChef, iFood para Restaurantes) já oferecem:

| # | Funcionalidade | Prioridade | Notas |
|---|---|---|---|
| 1 | ❌ **Cupons e promoções** | 🔴 Alta | Recurso básico esperado por operadores — PR em andamento |
| 2 | ❌ **Dashboard analytics para operador** | 🔴 Alta | Métricas de vendas, horários pico, itens mais pedidos — PR em andamento |
| 3 | ❌ **Programa de fidelidade** | 🟡 Média | "Compre X ganhe Y" — PR em andamento |
| 4 | ❌ **Sistema de avaliações/reviews** | 🟡 Média | Nota + comentário por pedido — PR em andamento |
| 5 | ❌ **App nativo (iOS/Android)** | 🟢 Baixa | Apenas web (PWA mitiga parcialmente) |
| 6 | ❌ **Delivery tracking em tempo real** | 🟢 Baixa | Rastreio de entregador via GPS |
| 7 | ❌ **Integração iFood/Rappi** | 🟢 Baixa | Aggregators de marketplace |
| 8 | ❌ **Multi-idioma (i18n)** | 🟢 Baixa | Apenas PT-BR atualmente |
| 9 | ❌ **Notificações push** | 🟢 Baixa | Requer app nativo ou web push |
| 10 | ❌ **Gestão de entregadores** | 🟢 Baixa | Fora do escopo atual |

---

## 6. Pontos Fortes — Diferenciais Competitivos 🏆

| # | Diferencial | Impacto |
|---|---|---|
| 1 | 🏆 **0% comissão por pedido** | Modelo SaaS fixo vs concorrentes que cobram % por pedido — argumento de venda forte |
| 2 | 🏆 **15 templates multi-nicho** | Concorrentes oferecem 1-3 layouts genéricos — personalização real por segmento |
| 3 | 🏆 **Sistema de afiliados com 6 tiers** | Cria rede de vendas orgânica — crescimento sem custo de CAC |
| 4 | 🏆 **Marketplace de freelancers** | Exclusivo no mercado — complementa o produto com serviços |
| 5 | 🏆 **IA integrada (Groq/LLaMA)** | Chatbot com custo quase zero — diferencial técnico difícil de replicar |
| 6 | 🏆 **White-label completo** | Concorrentes mostram marca própria — operador tem identidade visual própria |
| 7 | 🏆 **Stack moderna (Next.js 16 + React 19)** | Mais moderna que 95% dos concorrentes brasileiros — performance superior |
| 8 | 🏆 **Segurança robusta (RLS em todas as tabelas)** | Raro em SaaS BR — diferencial para clientes enterprise |

---

## 7. Problemas e Débitos Técnicos ⚠️

| # | Problema | Impacto | Ação Recomendada |
|---|---|---|---|
| 1 | ⚠️ `app/page.tsx` com **29KB** | Manutenção difícil, CI mais lento | Decompor em componentes (Hero, Features, Pricing, Testimonials) |
| 2 | ⚠️ Rotas duplicadas (`politica/` + `politica-de-privacidade/`, `termos/` + `termos-de-uso/`) | Confusão de SEO, links quebrados | Manter 1 rota canônica + redirect 301 da outra |
| 3 | ⚠️ `docs/legacy-aninhado/` | Pasta legada referenciando estrutura antiga (`01CardapioDigital`) | Remover ou arquivar |
| 4 | ⚠️ `proxy.ts` na raiz (7.7KB) | Fora da estrutura de pastas do projeto | Mover para `lib/` ou `services/` |
| 5 | ⚠️ `@types/qrcode` em `dependencies` | Tipos de desenvolvimento em prod bundle | Mover para `devDependencies` |
| 6 | ⚠️ 11 PRs abertos (6 do Dependabot desatualizados) | Vulnerabilidades de dependências pendentes | Fazer merge dos PRs de dependências |
| 7 | ⚠️ PR #8 "Main" com título genérico aberto há mais de 9 dias | Não está claro o propósito | Dar merge ou fechar com justificativa |
| 8 | ⚠️ PR #31 "No code changes — clarified non-actionable support request" | PR sem sentido aberto | Fechar imediatamente |
| 9 | ⚠️ Arquivos `.md` grandes na raiz (`CATALOGO_IMAGENS` 30KB, `PRODUTOS_TODOS_TEMPLATES` 43KB, `PROMPTS_IMAGENS` 21KB) | Poluição da raiz do repositório | Mover para `docs/` |
| 10 | ⚠️ `globals.css` com **12KB** | CSS não utilizado pode aumentar bundle | Auditar com PurgeCSS ou Tailwind `content` config |

---

## 8. Segurança

| Item | Status | Observação |
|---|---|---|
| **RLS habilitado em todas as tabelas** | ✅ | Operador só vê seus próprios dados |
| **SECURITY DEFINER views** | ✅ | `search_path` hardening em todas as views/functions |
| **`SECURITY.md`** | ✅ | Política clara de reporte de vulnerabilidades |
| **Rate limiting (Upstash Redis)** | ✅ | Proteção contra DDoS/brute-force nas APIs |
| **Supabase Auth** | ✅ | Verificação de email obrigatória, JWT |
| **API routes sem autenticação** | ⚠️ | Verificar se todas as rotas sensíveis exigem sessão |
| **Override `fast-xml-parser` → 5.5.6** | ⚠️ | Verificar se a vulnerabilidade CVE foi de fato resolvida nessa versão |
| **Segredos em variáveis de ambiente** | ✅ | `.env.local` no `.gitignore`, sem segredos no código |

---

## 9. Documentação

| Documento | Status | Observação |
|---|---|---|
| `README.md` | ✅ Excelente | Badges, tabelas, quick start, links para outros docs |
| `INSTALL.md` | ✅ | Guia de instalação detalhado |
| `SETUP_SAAS.md` | ✅ | Configuração do SaaS |
| `SETUP_SENTRY.md` | ✅ | Configuração de monitoramento |
| `CONTRIBUTING.md` | ✅ | Guia de contribuição |
| `SECURITY.md` | ✅ | Política de segurança |
| `LICENSE` | ✅ | BSL 1.1 |
| `DESIGN_SYSTEM.md` | ✅ | 9.6KB, documentação de componentes |
| `SAAS_ROADMAP.md` | ✅ | 27KB, roadmap detalhado |
| `CHANGELOG.md` | ❌ Faltando | Histórico de versões e mudanças |
| **Documentação de API** | ❌ Faltando | Endpoints, payloads, responses, exemplos |

---

## 10. CI/CD

| Item | Status | Observação |
|---|---|---|
| **GitHub Actions** | ✅ | Configurado em `.github/` |
| **Vercel auto-deploy** | ✅ | Deploy automático em merge para `main` |
| **Dependabot** | ✅ | Configurado para atualizações automáticas |
| **Playwright (e2e)** | ✅ | Testes end-to-end automatizados |
| **PRs Dependabot acumulando** | ⚠️ | `actions/checkout` v4→v6, `actions/setup-node` v4→v6 pendentes |
| **Pacotes Radix UI desatualizados** | ⚠️ | Vários bumps menores pendentes de merge |

---

## 11. Recomendações Priorizadas

### 🔴 Alta prioridade (fazer agora)

| # | Ação |
|---|---|
| 1 | Fazer merge dos PRs de dependências do Dependabot (#10, #11, #12, #13, #14, #15, #16) |
| 2 | Fechar PR #31 (não-acionável) |
| 3 | Resolver PR #8 (título "Main" genérico — dar merge ou fechar com justificativa) |
| 4 | Decompor `app/page.tsx` (29KB) em componentes menores (`HeroSection`, `FeaturesSection`, etc.) |
| 5 | Mover `@types/qrcode` de `dependencies` para `devDependencies` |

### 🟡 Média prioridade (próximas sprints)

| # | Ação |
|---|---|
| 6 | Consolidar rotas duplicadas (`politica/` → `politica-de-privacidade/` com redirect 301) |
| 7 | Mover arquivos `.md` grandes (`CATALOGO_IMAGENS`, `PRODUTOS_TODOS_TEMPLATES`, `PROMPTS_IMAGENS`) para `docs/` |
| 8 | Limpar `docs/legacy-aninhado/` |
| 9 | Criar `CHANGELOG.md` seguindo [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) |
| 10 | Documentar API endpoints (usar OpenAPI/Swagger ou Markdown em `docs/api/`) |
| 11 | Mover `proxy.ts` da raiz para `lib/` ou `services/` |

### 🟢 Baixa prioridade (backlog)

| # | Ação |
|---|---|
| 12 | Auditar `globals.css` (12KB) — remover CSS não utilizado |
| 13 | Implementar multi-idioma (i18n) para expansão LatAm |
| 14 | App nativo (React Native ou PWA avançado com push notifications) |
| 15 | Integração com marketplaces (iFood, Rappi) via API aggregator |

---

## 12. Métricas do Repositório

| Métrica | Valor |
|---|---|
| **Criado há** | ~53 dias (a partir de 24/03/2026) |
| **Último push** | 23/03/2026 |
| **Tamanho** | 4.5MB |
| **Stars** | 1 |
| **Forks** | 0 |
| **Issues/PRs abertos** | 11 |
| **Branch padrão** | `main` |
| **Visibilidade** | Público |
| **GitHub Pages** | Não habilitado |
| **Migrations SQL** | 27+ |
| **Rotas `app/`** | 28 pastas |
| **Arquivos TypeScript** | 86.5% do código |

---

## Links Relacionados

- 📖 [README.md](../README.md)
- 🗺️ [SAAS_ROADMAP.md](../SAAS_ROADMAP.md)
- 🎨 [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)
- 🔒 [SECURITY.md](../SECURITY.md)
- 🤝 [CONTRIBUTING.md](../CONTRIBUTING.md)
- 📦 [INSTALL.md](../INSTALL.md)
- ✅ [CHECKLIST_DEPLOY.md](./CHECKLIST_DEPLOY.md)

---

*Análise realizada em 24/03/2026 — atualizar a cada release major ou trimestral.*

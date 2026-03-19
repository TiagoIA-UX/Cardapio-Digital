# PROMPT PhD — Arquitetura Enterprise: Suporte + Afiliados + Freelancers

> **Nível:** PhD/MBA/DBA — Engenharia de Plataforma
> **Baseado em:** Práticas de grandes empresas (Salesforce, Zendesk, Uber, Fiverr, Toptal, AWS)
> **Plataforma:** Cardápio Digital (Next.js + Supabase + Vercel)
> **Última atualização:** 2026-03-19

---

## VISÃO EXECUTIVA

Sistema completo de **operações escaláveis** onde:

- **Afiliados** são o suporte de primeira linha dos restaurantes que venderam
- **Freelancers** executam tarefas técnicas via painel web (sem acesso ao código)
- **Admin** é o gestor final com controle total, escalação, e auditoria

### O que as GRANDES EMPRESAS fazem:

| Empresa           | Modelo                                        | O que copiamos                                             |
| ----------------- | --------------------------------------------- | ---------------------------------------------------------- |
| **Salesforce**    | SLA tiered, escalation matrix, case routing   | SLA 30min, auto-escalação, routing por categoria           |
| **Zendesk**       | Ticket lifecycle, CSAT, agent performance     | Status lifecycle, strikes, métricas por afiliado           |
| **Uber**          | Progressive penalties, deactivation threshold | 3-strike system com perda incremental                      |
| **Fiverr/Toptal** | Marketplace, review flow, escrow pricing      | Freelancer marketplace, submit→review→approve              |
| **AWS IAM**       | Temporary credentials, least-privilege        | Acessos temporários, permissões granulares, auto-expiração |
| **GitLab**        | Protected branches, MR-based workflow         | Freelancer NÃO tem acesso ao repo, edita via painel        |

---

## MÓDULO 1 — CADASTRO DE AFILIADOS

### Regras de Negócio

```
REGISTRO:
├── Nome: OBRIGATÓRIO (min 2, max 100 chars)
├── Chave PIX: ★ OBRIGATÓRIA ★ (afiliado recebe comissões por PIX)
│   ├── Formatos aceitos: CPF, CNPJ, email, telefone (+55), UUID
│   ├── Normalização automática (remove máscaras)
│   └── Revalidação em toda atualização
├── Código: auto-gerado (nome + sufixo aleatório, verificação de colisão)
├── Líder: opcional (via cookie aff_ref ou body.lider_code)
├── Tier inicial: trainee
├── Comissão base: 30%
└── Status: ativo
```

### Validação PIX (como Mercado Pago faz)

```typescript
// Formatos aceitos pelo Banco Central:
CPF:            /^\d{11}$/           // 12345678900
CNPJ:           /^\d{14}$/           // 12345678000190
Email:          /^[^\s@]+@[^\s@]+$/  // fulano@email.com
Telefone:       /^\+55\d{10,11}$/    // +5511999999999
Chave Aleatória: UUID v4             // xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

### Por que PIX é obrigatório?

> **O afiliado é um parceiro comercial que recebe comissões.**
> Sem PIX cadastrado, não há como pagar. Empresas como Hotmart, Eduzz e
> Monetizze exigem dados de pagamento no cadastro — não como opcional.
> O campo só é editável pelo próprio afiliado (GDPR/LGPD compliance).

---

## MÓDULO 2 — SUPORTE INTELIGENTE COM SLA

### Arquitetura de Routing (como Zendesk + Salesforce)

```
TICKET ABERTO PELO CLIENTE
    │
    ├── Categoria CRÍTICA? (erro_sistema, pagamento, pedido_falhando)
    │   └── → Direto para ADMIN (bypass afiliado)
    │
    ├── Restaurante tem afiliado associado?
    │   └── → Atribuído ao AFILIADO (primeira linha)
    │
    └── Fallback → ADMIN
```

### SLA (Service Level Agreement)

```
┌─────────────────────────────────────────────────┐
│                REGRA DE SLA                      │
│                                                  │
│  Tempo máximo: 30 MINUTOS para primeira resposta │
│                                                  │
│  Se estourar:                                    │
│  1. Ticket escalado automaticamente para admin   │
│  2. Strike aplicado no afiliado                  │
│  3. Log de auditoria registrado                  │
│                                                  │
│  Cron Job: a cada 5 minutos verifica SLA         │
│  (Vercel Cron → /api/cron/check-sla)             │
└─────────────────────────────────────────────────┘
```

### Lifecycle do Ticket

```
open → in_progress → waiting_customer → resolved → closed
  │                                         ↑
  └── (SLA breach) → escalated ────────────┘
```

---

## MÓDULO 3 — PENALIDADES PROGRESSIVAS

### O Sistema de 3 Strikes (como Uber/Lyft)

```
STRIKE 1 → WARNING (aviso formal)
    │   Afiliado recebe notificação: "Responda dentro do SLA"
    │   Nenhuma punição financeira
    │
STRIKE 2 → COMMISSION REDUCTION (-5%)
    │   Comissão reduzida de 30% para 25%
    │   Afiliado notificado da redução
    │
STRIKE 3 → CLIENT LOSS (perde SÓ o cliente sem suporte)
    │   ★ REGRA CRÍTICA: Perde APENAS o restaurante do ticket ★
    │   ★ NÃO suspende o afiliado, NÃO perde outros clientes ★
    │   Restaurante transferido para suporte admin
    │   Strikes resetados para 0 (ciclo limpo)
    │
    └── O afiliado continua ativo com seus outros clientes
        Pode reconquistar reputação com bom atendimento
```

### Por que NÃO suspender o afiliado?

> **Grandes empresas (Uber, DoorDash) aprenderam que suspensões totais
> causam churn massivo de parceiros.** O modelo mais eficiente é a perda
> incremental — o afiliado perde o cliente específico que não atendeu,
> mantém os demais, e tem incentivo para melhorar.
>
> Referência: _"Dynamic Workforce Management in Gig Economies"_ — Harvard Business Review

### Reversão por Admin

O admin pode reverter qualquer penalidade (erros acontecem):

- Reverte strike
- Restaura comissão se era redução
- Reativa status se necessário
- Log de auditoria imutável mantido

---

## MÓDULO 4 — MARKETPLACE DE FREELANCERS

### Princípio Fundamental: ZERO ACESSO AO REPOSITÓRIO

```
┌────────────────────────────────────────────────────────────┐
│                 SEGURANÇA DE CÓDIGO                         │
│                                                             │
│  ★ Freelancers NUNCA acessam o repositório Git ★           │
│  ★ Freelancers NUNCA veem código-fonte ★                    │
│  ★ Freelancers NUNCA fazem deploy ★                         │
│                                                             │
│  COMO FUNCIONA:                                             │
│  O freelancer acessa um PAINEL WEB com permissões           │
│  granulares no banco de dados (edit_menu, edit_products,    │
│  edit_categories, edit_config, view_orders).                │
│                                                             │
│  É como dar acesso ao WordPress admin para um freelancer    │
│  editar posts — ele nunca vê o código PHP.                  │
│                                                             │
│  REFERÊNCIA: Como AWS IAM funciona                          │
│  → Temporary Security Credentials                           │
│  → Least Privilege Principle                                │
│  → Auto-expiration                                          │
└────────────────────────────────────────────────────────────┘
```

### Por que bloquear acesso ao repo?

> **Toptal, Fiverr, e Upwork** usam ambientes sandboxed.
> O freelancer trabalha em um ambiente controlado. Nunca toca no
> código de produção diretamente.
>
> Riscos de dar acesso ao repo:
>
> 1. **Vazamento de segredos** (.env, API keys, tokens)
> 2. **Código malicioso** (backdoors, data exfiltration)
> 3. **Quebra de build** (push direto em branch protegida)
> 4. **Propriedade intelectual** (cópia do codebase inteiro)
>
> Nosso modelo: freelancer edita DADOS no banco (cardápio, categorias,
> produtos) via painel web com credenciais temporárias. O código
> permanece protegido.

### Tabela de Preços (Auto-Calculado)

```
┌──────────────────┬───────────┬──────────────┬──────────────────────────┐
│ Tipo             │ Base (R$) │ +/item (R$)  │ Descrição                │
├──────────────────┼───────────┼──────────────┼──────────────────────────┤
│ cardapio         │    50,00  │      2,00    │ Cadastro/edição cardápio │
│ design           │    80,00  │      5,00    │ Banner, logo, visual     │
│ configuracao     │    40,00  │      0,00    │ Horários, delivery, pag  │
│ personalizado    │   100,00  │     10,00    │ Sob demanda              │
└──────────────────┴───────────┴──────────────┴──────────────────────────┘

FÓRMULA:
  valor = (base + per_item × num_itens_checklist) × multiplicador_urgência

MULTIPLICADORES DE URGÊNCIA:
  • Prazo < 24h → ×1.50 (+50%)
  • Prazo < 48h → ×1.25 (+25%)
  • Prazo ≥ 48h → ×1.00 (normal)

EXEMPLO:
  Job: cardápio com 15 itens, prazo 20h
  Valor = (50 + 2×15) × 1.50 = 80 × 1.50 = R$ 120,00
```

---

## MÓDULO 5 — FLUXO DE TRABALHO DO FREELANCER

### Lifecycle Completo (como GitLab Merge Requests)

```
ADMIN CRIA JOB
    │
    ▼
[open] ──── Admin atribui freelancer ───→ [assigned]
                                              │
                                     Freelancer aceita
                                              │
                                              ▼
                                        [in_progress]
                                              │
                                    Freelancer edita no painel
                                    (produtos, categorias, config)
                                              │
                                    Clica "Enviar para Revisão"
                                              │
                                              ▼
                                          [review]
                                         ╱        ╲
                                        ╱          ╲
                              Admin aprova    Admin pede correção
                                     │              │
                                     ▼              ▼
                              [completed]    [in_progress]
                                             (revisão +1)
                                                  │
                                        Freelancer corrige
                                                  │
                                                  ▼
                                              [review]
                                                  │
                                        (até max_revisões)
```

### Regras de Revisão

```
1. Freelancer EDITA via painel web (nunca código)
2. Freelancer SUBMETE para revisão (botão "Enviar para Revisão")
3. Admin REVISA o trabalho
4. Se OK → APROVA (status: completed, acesso revogado, rating)
5. Se NOK → PEDE CORREÇÃO com feedback escrito
   - Status volta para in_progress
   - revisoes_usadas++
   - Quando revisoes_usadas >= max_revisoes → Admin decide: aprovar ou cancelar
6. Ao completar → acesso temporário é revogado automaticamente
7. Rating do freelancer é atualizado (média ponderada)
```

### Acessos Temporários (como AWS STS)

```
CRIAÇÃO DE ACESSO:
  ├── Permissões: ['edit_menu', 'edit_products', 'edit_categories']
  ├── Duração: 48 horas (padrão, configurável 1-720h)
  ├── Auto-expiração: cron job a cada hora
  │   (Vercel Cron → /api/cron/expire-access)
  └── Revogação manual: admin pode revogar a qualquer momento

NUNCA INCLUI:
  ✗ Acesso ao repositório Git
  ✗ Acesso ao Vercel/deploy
  ✗ Acesso ao Supabase dashboard
  ✗ Acesso a chaves de API
  ✗ Acesso a dados de outros restaurantes
```

---

## MÓDULO 6 — AUDITORIA UNIVERSAL

### System Logs (como AWS CloudTrail)

```
TODA ação registrada:
  ├── actor_id: quem fez
  ├── actor_type: admin | affiliate | freelancer | customer | system | cron
  ├── action: ticket.created | penalty.applied | job.completed | access.granted
  ├── entity: support_ticket | affiliate | freelancer_job | restaurant
  ├── entity_id: UUID do recurso afetado
  ├── metadata: JSON com detalhes adicionais
  ├── ip_address: IP do ator
  └── created_at: timestamp UTC

RETENÇÃO: 90 dias (cleanup via cron)
QUERY: filtros por entity, action, actor, data
UI: /admin/logs com busca e filtros
```

---

## ARQUITETURA TÉCNICA

### Stack

```
Frontend:   Next.js 16 (App Router) + Tailwind CSS
Backend:    API Routes (Edge Runtime)
Database:   Supabase (PostgreSQL + RLS + SECURITY DEFINER)
Auth:       Supabase Auth + Google OAuth
Deploy:     Vercel (auto-deploy on merge to main)
Cron:       Vercel Cron Jobs
CDN:        Cloudflare R2
Payments:   Mercado Pago (PIX + Card)
```

### Padrões de Código

```
Database:    snake_case em português (chave_pix, strikes, revisoes_usadas)
TypeScript:  PascalCase para interfaces, camelCase para funções
API:         Zod validation, requireAdmin(req, minRole), NextResponse.json()
Auth:        requireAdmin com hierarquia: owner > admin > support
State:       Zustand + persist + immer
```

### Tabelas (Migration 027)

```
NOVAS: 7 tabelas
  ├── support_tickets    (SLA, prioridade, escalação)
  ├── support_messages   (thread de mensagens)
  ├── affiliate_penalties (log imutável de penalidades)
  ├── freelancers        (marketplace de freelancers)
  ├── freelancer_jobs    (tarefas com checklist e prazo)
  ├── freelancer_access  (permissões temporárias)
  └── system_logs        (auditoria universal)

ALTERADAS: 2 tabelas
  ├── affiliates   (+strikes, +last_response_at)
  └── restaurants  (+support_owner)

FUNÇÕES SQL: 3
  ├── escalate_ticket()        — escala + aplica strike + transfere cliente
  ├── expire_freelancer_access() — batch revoke de acessos expirados
  └── check_sla_and_escalate()   — verifica SLA e escala em lote

RLS: Todas as 7 tabelas com políticas granulares
  ├── service_role: acesso total
  ├── Freelancer: vê apenas seus dados
  ├── Cliente: vê seus tickets
  ├── Afiliado: vê tickets dos seus clientes + suas penalidades
  └── Admin: acesso via service_role (backend)
```

### Cron Jobs (Vercel)

```
*/5 * * * *    /api/cron/check-sla         — Verifica SLA e escala tickets
0   * * * *    /api/cron/expire-access     — Expira acessos de freelancers
0   8 * * *    /api/cron/check-subscriptions — Verifica assinaturas (existente)
```

### APIs

```
ADMIN:
  GET/POST  /api/admin/suporte       — Gestão de tickets
  GET/POST  /api/admin/freelancers   — Gestão de freelancers + jobs
  GET/POST  /api/admin/penalidades   — Gestão de penalidades
  GET       /api/admin/logs          — Consulta de auditoria

PÚBLICO:
  GET/POST  /api/suporte             — Cliente cria/responde tickets
  GET/POST  /api/freelancer/job      — Freelancer gerencia seus jobs

CRON:
  GET       /api/cron/check-sla      — Verifica SLA (auth: CRON_SECRET)
  GET       /api/cron/expire-access  — Expira acessos (auth: CRON_SECRET)
```

### Admin Pages

```
/admin/suporte      — Gestão de tickets (SLA indicators, thread, resolve)
/admin/freelancers  — Freelancers + Jobs (tabbed, approve/suspend/review)
/admin/afiliados    — Afiliados (strikes, tier, comissão, penalidades)
/admin/logs         — Auditoria universal (filtros, busca)
```

---

## CHECKLIST DE IMPLEMENTAÇÃO

```
[x] Migration 027 — Schema completo (7 tabelas + 2 ALTER + 3 funções)
[x] TypeScript types (types/support.ts)
[x] Service: support.service.ts (tickets, SLA, escalação)
[x] Service: penalty.service.ts (3-strike progressivo, reversão)
[x] Service: freelancer.service.ts (marketplace, auto-pricing, review flow)
[x] API: /api/admin/suporte (GET/POST)
[x] API: /api/admin/freelancers (GET/POST + revision + price_table)
[x] API: /api/admin/penalidades (GET/POST)
[x] API: /api/admin/logs (GET)
[x] API: /api/suporte (público, rate-limited)
[x] API: /api/freelancer/job (freelancer self-service)
[x] Cron: /api/cron/check-sla (*/5 min)
[x] Cron: /api/cron/expire-access (1/hora)
[x] Page: /admin/suporte (ticket management UI)
[x] Page: /admin/freelancers (freelancers + jobs UI)
[x] Page: /admin/afiliados (affiliate management UI)
[x] Page: /admin/logs (audit log UI)
[x] PIX obrigatório no registro de afiliado
[x] 3o strike perde SÓ o cliente sem suporte (não suspende)
[x] Auto-cálculo de valor do freelancer (tabela de preços)
[x] Fluxo editar → revisar → aprovar (sem acesso ao repo)
[x] Acesso ao repositório BLOQUEADO para freelancers
[x] vercel.json crons configurados
```

---

## REFERÊNCIAS ACADÊMICAS E EMPRESARIAIS

1. **SLA Management:** ITIL v4 — Service Level Management Practice
2. **Progressive Penalties:** _"Optimal Contract Design for Gig Workers"_ — Stanford GSB
3. **Marketplace Design:** _"Platform Revolution"_ — Parker, Van Alstyne, Choudary (MIT)
4. **Temporary Credentials:** AWS IAM — Temporary Security Credentials (STS)
5. **Code Protection:** OWASP — Secure Software Development Lifecycle
6. **Workforce Management:** _"Dynamic Pricing and Incentives in Gig Economies"_ — HBR
7. **Ticket Routing:** Salesforce Einstein Case Classification
8. **Freelancer Marketplaces:** Toptal Engineering Workflow + Fiverr Seller Levels

---

_Prompt gerado automaticamente. Reproduzível para recriar todo o sistema._

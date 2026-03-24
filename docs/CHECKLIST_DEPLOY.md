# ✅ Checklist de Deploy — Cardápio Digital

> Use este checklist antes de cada deploy em produção para garantir que tudo está funcionando corretamente.

---

## 🔧 Pré-Deploy (Ambiente Local)

- [ ] Rodar `npm run setup:completo` — validar Node, npm, `.env.local`, variáveis, dependências, build, lint, tipos e migrations
- [ ] Rodar `npm run audit:completo` — build + lint + types + testes + verificar `console.log`, `any`, arquivos grandes, imports soltos
- [ ] Rodar `npm run build` sem erros
- [ ] Verificar PRs do Dependabot pendentes — fazer merge ou fechar os desatualizados

## 🔐 Segurança e Configuração

- [ ] Verificar variáveis de ambiente em produção (Vercel Dashboard → Settings → Environment Variables)
- [ ] Validar RLS em todas as tabelas novas criadas desde o último deploy
- [ ] Confirmar que nenhum segredo está hardcoded no código (rodar `git diff` e revisar)

## 💳 Pagamentos

- [ ] Testar checkout Mercado Pago em **sandbox** com cartão de teste
- [ ] Confirmar que webhook de pagamento está respondendo (`/api/webhook/mercadopago`)
- [ ] Validar que a transição sandbox → produção está configurada corretamente

## 📱 Funcionalidades Core

- [ ] Testar pedido WhatsApp — fluxo completo (cardápio → carrinho → envio)
- [ ] Testar geração de QR Code por mesa
- [ ] Testar upload de imagem no painel do operador (Cloudflare R2)

## 🌐 Infraestrutura

- [ ] Verificar Cloudflare R2 — upload de imagens funcionando, CDN ativo
- [ ] Verificar Upstash Redis — rate limiting ativo nas APIs críticas
- [ ] Confirmar Supabase Auth — login, cadastro e verificação de email funcionando

## 🚀 Deploy

- [ ] Fazer merge em `main` → Vercel auto-deploy iniciado automaticamente
- [ ] Acompanhar o deploy no [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Confirmar que a URL de produção (https://zairyx.com) está respondendo após o deploy
- [ ] Verificar que não há erros no Vercel Functions Log após o deploy

## 🔍 Pós-Deploy

- [ ] Testar o fluxo de cadastro completo de um novo operador em produção
- [ ] Verificar o painel admin — listar operadores, templates, afiliados
- [ ] Confirmar que o chatbot IA (Groq) está respondendo normalmente
- [ ] Checar status do sistema em `/status`

---

## 📚 Referências

- 📊 [Análise Completa do Repositório](./ANALISE_COMPLETA.md)
- 📖 [Guia de Instalação](../INSTALL.md)
- 🛠️ [Setup SaaS](../SETUP_SAAS.md)
- 🔒 [Política de Segurança](../SECURITY.md)

---

*Checklist atualizado em 24/03/2026.*

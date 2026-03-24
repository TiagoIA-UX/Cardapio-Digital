# Zairyx - Cardápio Digital SaaS | PRD

## Problema Original
Landing page de SaaS de cardápio digital para donos de delivery precisa ser otimizada para conversão com neuromarketing, linguagem simples e foco mobile-first.

## Arquitetura
- **Tech Stack**: Next.js 16, React 19, Tailwind CSS 4, TypeScript, Supabase
- **Deploy**: Vercel (zairyx.com)
- **Público**: Donos de delivery/restaurantes, baixa familiaridade técnica

## O que foi implementado (24/03/2026)

### Landing Page - Redesign Completo para Conversão
1. **Hero Section** - Headline direta "Receba mais pedidos direto no WhatsApp" + badge "0% de comissão" + 2 CTAs (Ver modelos + WhatsApp) + micro-provas
2. **Social Proof Strip** - 4 métricas: 0% comissão, 15 modelos, 30 min setup, 30 dias garantia
3. **Dor → Solução** - Comparativo visual Apps tradicionais (27% comissão) vs Zairyx (0%)
4. **Como Funciona** - 3 passos simples com ícones
5. **Benefícios Bento Grid** - 6 cards focados em resultado prático
6. **Seção Produto** - Screenshots reais do Dashboard e Editor
7. **Templates Showcase** - Top 6 nichos + link "ver todos" + tags de todos os 15 nichos
8. **FAQ Accordion** - 6 perguntas que reduzem objeções
9. **CTA Final** - Card dark com urgência + garantia + 2 CTAs
10. **Tipografia**: Outfit (headings) + DM Sans (body) - substituindo Inter genérica
11. **Neuromarketing aplicado**: prova implícita, redução de esforço, ganho imediato, comparativo de perda

### Arquivos Modificados
- `/app/app/page.tsx` - Landing page completamente reescrita
- `/app/app/layout.tsx` - Novas fontes (Outfit + DM Sans)
- `/app/app/globals.css` - CSS variables para nova tipografia
- `/app/components/sections/FaqSection.tsx` - Novo componente FAQ

### Testes
- 95% success rate no testing agent
- Hero, CTAs, comparativo, steps, benefits, templates, FAQ, CTA final - todos validados
- Mobile responsiveness validado
- FAQ accordion funcional

## Backlog

### P0 (Próximas prioridades)
- Adicionar animações de entrada nas seções (intersection observer)
- Otimizar Core Web Vitals (LCP, CLS)

### P1
- Adicionar seção de depoimentos/testemunhos reais
- A/B testing na headline do hero
- Heatmap integration (Hotjar/Microsoft Clarity)

### P2
- Micro-animações nos hover states
- Lottie animations para os 3 passos
- Video hero background option
- Chat widget customizado (substituir Crisp)

## Personas
1. **Dono de Delivery** - Quer resultado rápido, não entende tech, compara com apps que cobram comissão
2. **Gerente de Restaurante** - Busca organização, precisa de algo que a equipe use
3. **Empreendedor Iniciante** - Orçamento apertado, quer presença digital profissional

# Cardápio Digital — Caraguá Digital (Recriado)

Versão demo reconstruída a partir do protótipo público: https://v0.app/chat/caragua-digital-OV08qxRlaH1

## O que há aqui ✅
- Demo estático (HTML/CSS/JS) com cards do cardápio e chat de pedidos
- README em Português + breve resumo em Inglês
- Licença MIT e workflow de CI para build e deploy

## Como rodar localmente
1. Instale as dependências: `npm install`
2. Rode: `npm start`
3. Abra `http://localhost:5173`

## Deploy recomendado 💡
- Deploy simples em GitHub Pages ou Vercel (já possível com o workflow de CI)

## Status do repositório ✅
- Conteúdo base importado a partir do protótipo e publicado na branch `main`.
- PR de documentação criada para os próximos ajustes (imagens, texto do cardápio, deploy automático).

---

# English — Quick summary
A small static demo of the Caraguá Digital menu and chat. Recreated from a public prototype link as a starting point for integration.

---

## Próximos passos sugeridos
- Substituir imagens placeholder por fotos de alta qualidade (já preparei scripts em `scripts/` para baixar do Unsplash)
- Personalizar a copy com dados reais e provas sociais (posso gerar variações A/B)
- Configurar deploy automático (Vercel) e conectar a um serviço de leads (Airtable/Sheets/CRM)

---

## Comercialização & Licenciamento
Este projeto é oferecido sob uma **Subscription Commercial License** — uso comercial e produção exige a compra de uma assinatura válida. Veja `LICENSE` para detalhes e `SELLING_GUIDE.md` para estratégias de precificação e posicionamento.

### Como comprar
1. Envie um e-mail para **tiagoia-ux@example.com** com o assunto "Licença Cardápio Digital - Compra"
2. Informe: plano desejado (Starter / Pro / Agency) e número de sites/domínios
3. Após confirmação e pagamento você receberá acesso privado ou uma licença que libera uso em produção

---

## Imagens e assets
- Adicionei scripts para baixar imagens gratuitas de alta qualidade (Unsplash): `scripts/download-images.sh` (Linux/macOS) e `scripts/download-images.ps1` (Windows).
- Execute o script localmente para popular `assets/images/` com fotos de comida e ambientes. Créditos em `assets/credits.md`.

---

## Sobre o produto — descrição pronta para venda
Cardápio Digital — Template conversão (Caraguá Digital) é um kit completo para lançar um cardápio online otimizado para conversão. Inclui landing, hero com captura de leads, CTAs testadas, e rota de captura pronta para conectar a seu CRM. Ideal para donos de restaurantes e agências que querem resultados rápidos.

**Destaques de valor**
- Aumento de conversões através de copy persuasiva e estrutura testada
- Mobile-first: páginas leves e rápidas para experiência em dispositivo móvel
- Fácil integração: capture leads no seu fluxo (Airtable / Google Sheets / HubSpot)

---

## Next.js template — conversão otimizada ✅
- Importei um template Next.js com foco em conversão (gatilhos neurais, CTAs, prova social). Arquivos principais: `app/`, `components/` e rota de captura `app/api/subscribe/route.ts`.
- Remova o preview estático se preferir; agora pode rodar com Next.js.

Como rodar localmente:
1. Instale dependências: `npm install`
2. Rode em dev: `npm run dev` → abra `http://localhost:3000`

Observação: o template inclui um formulário de captura que aponta para `/api/subscribe` (demo, logs no servidor).
---
> Se quiser, eu abro um Pull Request com essas mudanças e configuro CI/CD conforme recomendado.

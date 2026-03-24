# Gerar Imagens de Produtos — Pipeline Automatizado

> Fluxo completo para gerar imagens via IA para todos os produtos sem imagem no banco e atualizar o banco de dados. Duas opções: **Pollinations.ai (grátis)** ou **DALL-E 3 (pago, melhor qualidade)**.

---

## Índice

1. [Visão geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Opção A — Pollinations.ai (grátis, recomendado para começar)](#opção-a--pollinationsai-grátis)
4. [Opção B — DALL-E 3 (pago, melhor qualidade)](#opção-b--dall-e-3-pago)
5. [Scripts disponíveis](#scripts-disponíveis)
6. [Estilo e prompts](#estilo-e-prompts)
7. [Uso manual (sem API)](#uso-manual-sem-api)
8. [Checklist final de validação](#checklist-final-de-validação)
9. [Repetir para produtos futuros](#repetir-para-produtos-futuros)
10. [FAQ](#faq)

---

## Visão geral

```
[Supabase DB]
  └─ products (sem imagem_url ou com placeholder)

  OPÇÃO A — Pollinations.ai (GRÁTIS)
  ─────────────────────────────────
  [generate-product-images-pollinations.ts]
    └─ gera URL dinâmica (Pollinations.ai, sem download)
    └─ atualiza DB diretamente: products.imagem_url = <url pollinations>

  OPÇÃO B — DALL-E 3 (PAGO)
  ──────────────────────────
  [fetch-products-without-images.ts]
    └─ gera: scripts/products-to-generate.csv + .json
  [generate-product-images-dalle.ts]  ← DALL-E 3 (OpenAI API)
    └─ baixa imagens para: public/products/<slug>.png
  [upload-product-images-to-r2.ts]
    └─ faz upload para R2: pratos/products/<slug>.png
    └─ atualiza DB: products.imagem_url = <url pública R2>
```

**Regras de segurança:**
- Nenhuma imagem existente é sobrescrita (exceto placeholders).
- Apenas produtos sem imagem ou com placeholder são processados.
- O `--force` precisa ser passado explicitamente para re-gerar.

---

## Pré-requisitos

### Compatibilidade Node.js

> **Node.js v22+ (Windows/Linux/Mac):** Use sempre `npm run gen:products:...` (não `npx tsx scripts/...` diretamente).
>
> O projeto usa `tsconfig.json` com `"moduleResolution": "bundler"` (Next.js). Os scripts de geração usam `tsconfig.scripts.json` que corrige isso automaticamente — o `npm run` carrega essa config, já `npx tsx scripts/...` pode ignorá-la em certas versões do Node.

### Variáveis de ambiente

Configure em `.env.local` (na raiz do projeto):

```env
# Supabase (obrigatório para todos os scripts)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudflare R2 (obrigatório apenas para Opção B — upload)
R2_ACCOUNT_ID=abc123
R2_ACCESS_KEY_ID=key123
R2_SECRET_ACCESS_KEY=secret123
R2_BUCKET_NAME=cardapio-digital
R2_PUBLIC_URL=https://cdn.seudominio.com

# OpenAI DALL-E (obrigatório apenas para Opção B — geração DALL-E 3)
OPENAI_API_KEY=sk-proj-...
```

> **Dica:** A Opção A (Pollinations.ai) só precisa das credenciais do Supabase.

---

## Opção A — Pollinations.ai (grátis)

> **Recomendado para começar.** Sem custo, sem API key de IA, atualiza o banco em segundos.

### Como funciona

O script gera uma URL dinâmica do Pollinations.ai para cada produto e salva diretamente em `products.imagem_url`. A imagem é renderizada pelo Pollinations sob demanda quando o cardápio é aberto — sem download, sem R2.

### Passo a passo

**Apenas 1 comando:**

```bash
npm run gen:products:pollinations
```

**Opções:**
```bash
# Ver exemplos sem alterar o banco
npm run gen:products:pollinations -- --dry-run

# Filtrar por restaurante
npm run gen:products:pollinations -- --tenant=<uuid>

# Limitar para testar
npm run gen:products:pollinations -- --limit=10

# Processar em paralelo (default: 3)
npm run gen:products:pollinations -- --concurrency=5

# Regenerar mesmo produtos com imagem
npm run gen:products:pollinations -- --force
```

**Custo:** $0  
**Tempo:** ~5 minutos para 800 produtos (paralelo)  
**Qualidade:** Boa (modelo Flux do Pollinations, 800×800)  

> **Nota:** Imagens Pollinations são dinâmicas. Se quiser imagens estáticas hospedadas no R2, use a Opção B depois.

---

## Opção B — DALL-E 3 (pago)

> **Melhor qualidade.** Imagens geradas e armazenadas definitivamente no R2. Custo: ~$0,04 por imagem.

### Etapa 1 — Buscar produtos sem imagem

```bash
npm run gen:products:fetch
```

Isso consulta o Supabase e gera dois arquivos:
- `scripts/products-to-generate.csv` — lista de produtos com prompts
- `scripts/products-to-generate.json` — mesmo conteúdo em JSON

**Opções:**
```bash
# Apenas ver a contagem (sem gravar arquivos)
npm run gen:products:fetch -- --dry-run

# Incluir todos os produtos (mesmo os que já têm imagem)
npm run gen:products:fetch -- --all

# Filtrar por restaurante específico
npm run gen:products:fetch -- --tenant=<uuid-do-tenant>
```

### Etapa 2 — Gerar imagens via DALL-E 3

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="sk-proj-..."; npm run gen:products:dalle
```

**Mac/Linux:**
```bash
OPENAI_API_KEY=sk-proj-... npm run gen:products:dalle
```

As imagens são salvas em `public/products/<slug>.png`.

**Opções:**
```bash
# Ver prompts sem gerar (recomendado para revisar antes)
npm run gen:products:dalle -- --dry-run

# Retomar de onde parou (ex: a partir do produto 50)
npm run gen:products:dalle -- --start=50

# Gerar só os primeiros 10 (para testar)
npm run gen:products:dalle -- --limit=10
```

**Progresso:** O script salva o progresso em `scripts/.product-dalle-progress.json`. Se interrompido, pode ser retomado sem regerar imagens já feitas.

**Custo estimado:**
- ~$0,04 por imagem (DALL-E 3, standard, 1024×1024)
- 800 produtos → ~$32 USD

**Tempo estimado:**
- ~13 segundos entre imagens (rate limit tier 1: 5 imgs/min)
- 800 produtos → ~3 horas

### Etapa 3 — Upload para R2 e atualizar banco

```bash
npm run gen:products:upload
```

O script:
1. Lê `scripts/products-to-generate.json`
2. Para cada produto com imagem local em `public/products/`
3. Faz upload para R2 em `pratos/products/<slug>.png`
4. Atualiza `products.imagem_url` no Supabase

**Opções:**
```bash
# Visualizar sem gravar nada
npm run gen:products:upload -- --dry-run

# Forçar re-upload (mesmo produtos com imagem)
npm run gen:products:upload -- --force

# Limitar para os primeiros 10
npm run gen:products:upload -- --limit=10
```

---

## Scripts disponíveis

| Script npm | Descrição |
|-----------|-----------|
| `npm run gen:products:fetch` | Etapa B1: buscar produtos sem imagem, exportar CSV/JSON |
| `npm run gen:products:pollinations` | **Opção A** — gerar via Pollinations.ai (grátis, atualiza DB direto) |
| `npm run gen:products:dalle` | Etapa B2: gerar via DALL-E 3 (baixa para `public/products/`) |
| `npm run gen:products:upload` | Etapa B3: upload R2 + atualizar DB |

---

## Estilo e prompts

### Padrão de prompt (gerado automaticamente)

```
Professional food photography of "<Nome>", <descrição curta>,
<contexto do tipo>, <contexto da categoria>,
overhead flat lay or 45-degree angle shot, white marble or neutral background,
natural soft lighting, high resolution 1024x1024, appetizing, commercial menu quality,
no text, no watermark, no people, square composition
```

### Exemplos

| Produto | Prompt gerado |
|---------|--------------|
| Margherita | `Professional food photography of "Margherita", artisan pizza, italian-style, topped with fresh ingredients, overhead flat lay...` |
| Açaí Tradicional 500ml | `Professional food photography of "Açaí Tradicional 500ml", restaurant food item, acai bowl, brazilian superfood, overhead flat lay...` |
| Coca-Cola Lata | `Professional food photography of "Coca-Cola Lata", refreshing drink, condensation effect, styled glass or bottle, overhead flat lay...` |

### Customizar prompts

Para alterar o estilo ou adicionar elementos de branding Zairyx, edite a função `buildPrompt()` em `scripts/fetch-products-without-images.ts`.

---

## Uso manual (sem API)

Se preferir gerar as imagens manualmente (via interface web do DALL-E, Midjourney, Canva AI, etc.):

1. Execute a etapa 1 para gerar o CSV:
   ```bash
   npm run gen:products:fetch
   ```

2. Abra `scripts/products-to-generate.csv` em um editor de planilha.

3. Copie cada prompt e cole na interface da IA de sua escolha:
   - [DALL-E 3 (chat.openai.com)](https://chat.openai.com)
   - [Leonardo.ai](https://leonardo.ai)
   - [Canva AI](https://canva.com)
   - [Midjourney](https://midjourney.com)
   - [Google Imagen / Gemini](https://gemini.google.com)

4. Salve cada imagem gerada como `<slug>.png` na pasta `public/products/`.
   - O campo `slug` está na coluna D do CSV.
   - Exemplo: produto "Margherita" → arquivo `margherita.png`

5. Após baixar todas as imagens, execute a etapa 3 para upload:
   ```bash
   npm run gen:products:upload
   ```

---

## Checklist final de validação

Após executar o pipeline completo, verifique:

**Opção A (Pollinations.ai):**
- [ ] `products.imagem_url` no Supabase atualizado com URLs `image.pollinations.ai/...`
- [ ] Imagens aparecem corretamente no painel admin → Cardápio → Produtos
- [ ] Imagens aparecem no cardápio público

**Opção B (DALL-E 3):**
- [ ] Arquivo `scripts/products-to-generate.csv` existe e tem todos os produtos sem imagem
- [ ] Pasta `public/products/` contém arquivos `.png` para cada produto
- [ ] Nomes dos arquivos correspondem ao campo `slug` do CSV
- [ ] Resolução das imagens: 1024×1024 (quadrado)
- [ ] Imagens não contêm texto, marca d'água ou pessoas
- [ ] Upload ao R2 concluído (sem erros no log)
- [ ] `products.imagem_url` no Supabase atualizado para todos os produtos
- [ ] Imagens aparecem corretamente no painel admin → Cardápio → Produtos
- [ ] Imagens aparecem no cardápio público

### Validar no banco

```sql
-- Quantos produtos ainda sem imagem?
SELECT COUNT(*) FROM products
WHERE imagem_url IS NULL OR imagem_url ILIKE '%placeholder%';

-- Lista de produtos com imagem por tipo
SELECT tipo, COUNT(*) FROM products
WHERE imagem_url IS NOT NULL AND imagem_url NOT ILIKE '%placeholder%'
GROUP BY tipo;

-- Produtos usando Pollinations.ai
SELECT COUNT(*) FROM products
WHERE imagem_url ILIKE '%pollinations.ai%';
```

---

## Repetir para produtos futuros

**Opção A (Pollinations.ai):**

Apenas 1 comando:
```bash
npm run gen:products:pollinations
```
O script detecta automaticamente os novos produtos sem imagem e pula os que já têm URL.

**Opção B (DALL-E 3):**

1. Execute `npm run gen:products:fetch` — detecta os novos produtos sem imagem.
2. Execute `npm run gen:products:dalle` — gera apenas as novas imagens (pula as já existentes).
3. Execute `npm run gen:products:upload` — faz upload e atualiza o banco.

---

## FAQ

**P: Qual opção escolher — Pollinations.ai ou DALL-E 3?**
R: Para começar, use a Opção A (Pollinations.ai). É gratuita e rápida. Se a qualidade não for satisfatória para algum produto, use a Opção B (DALL-E 3) com `-- --tenant=<uuid>` para um restaurante específico.

**P: `npx tsx scripts/...` dá erro `ERR_MODULE_NOT_FOUND` no Windows/Node.js v24.**
R: Use sempre `npm run gen:products:...` em vez de `npx tsx scripts/...`. O projeto usa configurações do tsconfig.json específicas para o Next.js (bundler resolution) que conflitam com tsx direto. O `npm run` carrega automaticamente o `tsconfig.scripts.json` correto.

**P: Posso usar Gemini (Google Imagen) em vez de DALL-E?**
R: Sim. Gere o CSV com `npm run gen:products:fetch`, baixe as imagens manualmente do Gemini e siga o processo de upload com `npm run gen:products:upload`. A etapa B2 atualmente usa DALL-E 3; um script para Gemini pode ser adicionado no futuro.

**P: As imagens antigas vão ser sobrescritas?**
R: Não. Ambos os scripts verificam se o produto já tem imagem (não-placeholder). Use `-- --force` apenas se quiser substituir intencionalmente.

**P: As URLs do Pollinations.ai ficam disponíveis para sempre?**
R: O Pollinations.ai é um serviço público gratuito. Se quiser garantia de disponibilidade permanente, use a Opção B para armazenar as imagens no R2 definitivamente.

**P: O custo do DALL-E é recorrente?**
R: Não. Cada imagem é gerada uma vez e armazenada no R2 com cache de 1 ano. O custo é único por produto (~$0,04/imagem).

**P: E os sabores de pizza (`product_flavors`)?**
R: Este pipeline cobre a tabela `products`. Para `product_flavors.imagem_url`, o processo é similar — adapte o script de fetch para consultar `product_flavors` em vez de `products`.

**P: Onde ficam armazenadas as imagens no R2 (Opção B)?**
R: Na pasta `pratos/products/`. A URL pública segue o padrão `${R2_PUBLIC_URL}/pratos/products/<slug>.png`.

# Gerar Imagens de Produtos — Pipeline Automatizado

> Fluxo completo para gerar imagens via IA (DALL-E 3) para todos os produtos sem imagem no banco, fazer upload para Cloudflare R2 e atualizar o banco de dados.

---

## Índice

1. [Visão geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo a passo](#passo-a-passo)
4. [Scripts disponíveis](#scripts-disponíveis)
5. [Estilo e prompts](#estilo-e-prompts)
6. [Uso manual (sem API)](#uso-manual-sem-api)
7. [Checklist final de validação](#checklist-final-de-validação)
8. [Repetir para produtos futuros](#repetir-para-produtos-futuros)
9. [FAQ](#faq)

---

## Visão geral

```
[Supabase DB]
  └─ products (sem imagem_url ou com placeholder)
        ↓
[fetch-products-without-images.ts]
  └─ gera: scripts/products-to-generate.csv
           scripts/products-to-generate.json
        ↓
[generate-product-images-dalle.ts]  ← DALL-E 3 (OpenAI API)
  └─ baixa imagens para: public/products/<slug>.png
        ↓
[upload-product-images-to-r2.ts]
  └─ faz upload para: R2 bucket / pratos/products/<slug>.png
  └─ atualiza DB: products.imagem_url = <url pública R2>
```

**Regras de segurança:**
- Nenhuma imagem existente é sobrescrita (exceto placeholders).
- Apenas produtos sem imagem ou com placeholder são processados.
- O `--force` precisa ser passado explicitamente para re-gerar.

---

## Pré-requisitos

### Variáveis de ambiente

Configure em `.env.local` (na raiz do projeto):

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudflare R2 (obrigatório para upload)
R2_ACCOUNT_ID=abc123
R2_ACCESS_KEY_ID=key123
R2_SECRET_ACCESS_KEY=secret123
R2_BUCKET_NAME=cardapio-digital
R2_PUBLIC_URL=https://cdn.seudominio.com

# OpenAI DALL-E (obrigatório para geração automática)
OPENAI_API_KEY=sk-proj-...
```

> **Dica:** Execute `npm run doctor` para verificar se o ambiente está configurado.

---

## Passo a passo

### Etapa 1 — Buscar produtos sem imagem

```bash
npx tsx scripts/fetch-products-without-images.ts
```

Isso consulta o Supabase e gera dois arquivos:
- `scripts/products-to-generate.csv` — lista de produtos com prompts
- `scripts/products-to-generate.json` — mesmo conteúdo em JSON

**Opções:**
```bash
# Apenas ver a contagem (sem gravar arquivos)
npx tsx scripts/fetch-products-without-images.ts --dry-run

# Incluir todos os produtos (mesmo os que já têm imagem)
npx tsx scripts/fetch-products-without-images.ts --all

# Filtrar por restaurante específico
npx tsx scripts/fetch-products-without-images.ts --tenant=<uuid-do-tenant>
```

### Etapa 2 — Gerar imagens via DALL-E 3

```bash
OPENAI_API_KEY=sk-proj-... npx tsx scripts/generate-product-images-dalle.ts
```

As imagens são salvas em `public/products/<slug>.png`.

**Opções:**
```bash
# Ver prompts sem gerar (recomendado para revisar antes)
npx tsx scripts/generate-product-images-dalle.ts --dry-run

# Retomar de onde parou (ex: a partir do produto 50)
npx tsx scripts/generate-product-images-dalle.ts --start=50

# Gerar só os primeiros 10 (para testar)
npx tsx scripts/generate-product-images-dalle.ts --limit=10
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
npx tsx scripts/upload-product-images-to-r2.ts
```

O script:
1. Lê `scripts/products-to-generate.json`
2. Para cada produto com imagem local em `public/products/`
3. Faz upload para R2 em `pratos/products/<slug>.png`
4. Atualiza `products.imagem_url` no Supabase

**Opções:**
```bash
# Visualizar sem gravar nada
npx tsx scripts/upload-product-images-to-r2.ts --dry-run

# Forçar re-upload (mesmo produtos com imagem)
npx tsx scripts/upload-product-images-to-r2.ts --force

# Limitar para os primeiros 10
npx tsx scripts/upload-product-images-to-r2.ts --limit=10
```

---

## Scripts disponíveis

| Script npm | Comando completo | Descrição |
|-----------|-----------------|-----------|
| `npm run gen:products:fetch` | `npx tsx scripts/fetch-products-without-images.ts` | Etapa 1: buscar produtos sem imagem |
| `npm run gen:products:dalle` | `OPENAI_API_KEY=sk-... npx tsx scripts/generate-product-images-dalle.ts` | Etapa 2: gerar via DALL-E 3 |
| `npm run gen:products:upload` | `npx tsx scripts/upload-product-images-to-r2.ts` | Etapa 3: upload R2 + atualizar DB |

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
   npx tsx scripts/fetch-products-without-images.ts
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
   npx tsx scripts/upload-product-images-to-r2.ts
   ```

---

## Checklist final de validação

Após executar o pipeline completo, verifique:

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
```

---

## Repetir para produtos futuros

Para novos produtos adicionados posteriormente:

1. Execute `npm run gen:products:fetch` — o script detecta automaticamente os novos produtos sem imagem.
2. Execute `npm run gen:products:dalle` — gera apenas as novas imagens (pula as já existentes via progress file).
3. Execute `npm run gen:products:upload` — faz upload e atualiza o banco.

O script `fetch-products-without-images.ts` sempre filtra apenas produtos SEM imagem (ou com placeholder), portanto nunca processa produtos que já têm imagem manual configurada.

---

## FAQ

**P: Posso usar Gemini (Google Imagen) em vez de DALL-E?**
R: Sim. Gere o CSV com a etapa 1, baixe as imagens manualmente do Gemini e siga o processo de upload (etapa 3). A etapa 2 atualmente usa DALL-E 3; um script para Gemini pode ser adicionado no futuro.

**P: As imagens antigas vão ser sobrescritas?**
R: Não. O script de upload verifica `imagem_url_atual` do produto. Se já tiver uma URL real (não placeholder), pula o produto. Use `--force` apenas se quiser substituir intencionalmente.

**P: O custo é recorrente?**
R: Não. Cada imagem é gerada uma vez e armazenada no R2 com cache de 1 ano. O custo é único por produto.

**P: E os sabores de pizza (`product_flavors`)?**
R: Este pipeline cobre a tabela `products`. Para `product_flavors.imagem_url`, o processo é similar — adapte o script de fetch para consultar `product_flavors` em vez de `products`.

**P: Onde ficam armazenadas as imagens?**
R: No Cloudflare R2, na pasta `pratos/products/`. A URL pública segue o padrão `${R2_PUBLIC_URL}/pratos/products/<slug>.png`.

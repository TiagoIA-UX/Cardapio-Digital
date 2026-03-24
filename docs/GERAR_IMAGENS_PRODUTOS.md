# Gerar Imagens de Produtos — Pipeline Automatizado

> Gere imagens via IA para todos os produtos sem imagem no banco e atualize o Supabase automaticamente. **100% gratuito** — sem API key de IA, sem custo por imagem, sem conta em serviços pagos.

---

## Índice

1. [Visão geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Como usar — Pollinations.ai](#como-usar)
4. [Scripts disponíveis](#scripts-disponíveis)
5. [Estilo e prompts](#estilo-e-prompts)
6. [Checklist final de validação](#checklist-final-de-validação)
7. [Repetir para produtos futuros](#repetir-para-produtos-futuros)
8. [FAQ](#faq)

---

## Visão geral

```
[Supabase DB]
  └─ products (sem imagem_url ou com placeholder)

  [generate-product-images-pollinations.ts]
    └─ gera URL dinâmica (Pollinations.ai, sem download)
    └─ atualiza DB diretamente: products.imagem_url = <url pollinations>
```

**Regras de segurança:**
- Nenhuma imagem existente é sobrescrita (exceto placeholders).
- Apenas produtos sem imagem ou com placeholder são processados.
- O `--force` precisa ser passado explicitamente para re-gerar.

**Custo:** $0 — Pollinations.ai é um serviço gratuito e público.

---

## Pré-requisitos

### Compatibilidade Node.js

> **Node.js v22+ (Windows/Linux/Mac):** Use sempre `npm run gen:products:...` (não `npx tsx scripts/...` diretamente).
>
> O projeto usa `tsconfig.json` com `"moduleResolution": "bundler"` (Next.js). Os scripts de geração usam `tsconfig.scripts.json` que corrige isso automaticamente — o `npm run` carrega essa config, já `npx tsx scripts/...` pode ignorá-la em certas versões do Node.

### Variáveis de ambiente

Configure em `.env.local` (na raiz do projeto):

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> Apenas as credenciais do Supabase são necessárias. Nenhuma API key de IA é exigida.

---

## Como usar

### Passo a passo — apenas 1 comando

```bash
npm run gen:products:pollinations
```

O script:
1. Busca todos os produtos sem `imagem_url` (ou com placeholder) no Supabase
2. Gera uma URL do Pollinations.ai para cada produto com base no nome e categoria
3. Salva a URL diretamente em `products.imagem_url` no banco

A imagem é renderizada pelo Pollinations sob demanda quando o cardápio é aberto — **sem download local, sem armazenamento externo**.

### Opções disponíveis

```bash
# Ver exemplos sem alterar o banco
npm run gen:products:pollinations -- --dry-run

# Filtrar por restaurante
npm run gen:products:pollinations -- --tenant=<uuid>

# Limitar para testar
npm run gen:products:pollinations -- --limit=10

# Processar em paralelo (default: 3)
npm run gen:products:pollinations -- --concurrency=5

# Regenerar mesmo produtos que já têm imagem
npm run gen:products:pollinations -- --force
```

**Custo:** $0  
**Tempo:** ~5 minutos para 800 produtos (paralelo)  
**Qualidade:** Boa (modelo Flux do Pollinations, 800×800 px)  

---

## Scripts disponíveis

| Script npm | Descrição |
|-----------|-----------|
| `npm run gen:products:pollinations` | Gerar via Pollinations.ai (grátis, atualiza DB direto) |
| `npm run gen:products:fetch` | Listar produtos sem imagem e exportar CSV/JSON para diagnóstico |

---

## Estilo e prompts

Os prompts são gerados automaticamente com base no nome, tipo e categoria do produto, seguindo duas estratégias:

| Estratégia | Quando é usada | Estilo |
|-----------|----------------|--------|
| `food` | Pratos preparados, pizzas, sobremesas, bebidas | Fotografia gastronômica, prato branco, luz natural |
| `packshot` | Produtos embalados, marcas conhecidas, bebidas industriais | Produto isolado, fundo branco, sombra suave, estilo e-commerce |

Para personalizar prompts, edite a função `buildPollinationsPrompt()` em `scripts/generate-product-images-pollinations.ts`.

---

## Checklist final de validação

Após executar o script, verifique:

- [ ] `products.imagem_url` no Supabase atualizado com URLs `image.pollinations.ai/...`
- [ ] Imagens aparecem corretamente no painel admin → Cardápio → Produtos
- [ ] Imagens aparecem no cardápio público (`/r/<slug>`)

### Validar no banco

```sql
-- Quantos produtos ainda sem imagem?
SELECT COUNT(*) FROM products
WHERE imagem_url IS NULL OR imagem_url ILIKE '%placeholder%';

-- Produtos usando Pollinations.ai
SELECT COUNT(*) FROM products
WHERE imagem_url ILIKE '%pollinations.ai%';

-- Lista de produtos com imagem por tipo
SELECT tipo, COUNT(*) FROM products
WHERE imagem_url IS NOT NULL AND imagem_url NOT ILIKE '%placeholder%'
GROUP BY tipo;
```

---

## Repetir para produtos futuros

Apenas 1 comando — o script detecta automaticamente novos produtos sem imagem:

```bash
npm run gen:products:pollinations
```

Produtos que já têm imagem são ignorados. Use `--force` para regenerar tudo.

---

## FAQ

**P: Preciso de conta ou API key para usar?**  
R: Não. O Pollinations.ai é gratuito e público — nenhuma conta ou API key é necessária.

**P: `npx tsx scripts/...` dá erro `ERR_MODULE_NOT_FOUND` no Windows/Node.js v22+.**  
R: Use sempre `npm run gen:products:pollinations` em vez de `npx tsx scripts/...`. O `npm run` carrega automaticamente o `tsconfig.scripts.json` correto.

**P: As imagens antigas vão ser sobrescritas?**  
R: Não. O script pula produtos que já têm imagem (não-placeholder). Use `-- --force` para substituir intencionalmente.

**P: As URLs do Pollinations.ai ficam disponíveis para sempre?**  
R: O Pollinations.ai é um serviço público gratuito mantido pela comunidade. As URLs são dinâmicas — a imagem é gerada no momento em que é acessada. Se o serviço ficar fora do ar temporariamente, as imagens ficam indisponíveis até que o serviço seja restaurado.

**P: E os sabores de pizza (`product_flavors`)?**  
R: Este pipeline cobre a tabela `products`. Para `product_flavors.imagem_url`, o processo é similar — adapte o script para consultar `product_flavors` em vez de `products`.

**P: Posso usar outro serviço gratuito além do Pollinations.ai?**  
R: Sim. Qualquer serviço que retorne uma URL de imagem pode ser usado. Basta adaptar a função `buildPollinationsUrl()` no script para apontar para o serviço desejado. Outras opções gratuitas incluem [Lexica.art](https://lexica.art) e [Craiyon](https://craiyon.com) (via scraping manual).

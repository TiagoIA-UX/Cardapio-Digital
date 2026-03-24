# Padrões de Código — Cardápio Digital (Zairyx)

> Este documento descreve as convenções e padrões obrigatórios do projeto.
> Seguir estes padrões garante consistência, segurança e facilidade de manutenção.

---

## 1. Naming Conventions

### Arquivos e Diretórios

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componente React | PascalCase.tsx | `HeroSection.tsx` |
| Página Next.js | kebab-case / `page.tsx` | `app/meus-templates/page.tsx` |
| Utilitário / lib | camelCase.ts | `lib/supabase/client.ts` |
| API route | `route.ts` dentro de pasta | `app/api/orders/route.ts` |
| Schema Zod | camelCase + Schema suffix | `orderSchema`, `productSchema` |
| Migration SQL | `NNN_descricao_curta.sql` | `027_add_sla_table.sql` |

### Variáveis e Funções

- **Variáveis**: `camelCase` — `const restaurantId = ...`
- **Constantes de módulo**: `SCREAMING_SNAKE_CASE` — `const MAX_RETRIES = 3`
- **Funções**: `camelCase` — `function validateCoupon()`
- **Componentes**: `PascalCase` — `function HeroSection()`
- **Tipos/Interfaces**: `PascalCase` — `type OrderStatus`, `interface Product`
- **Hooks**: prefixo `use` — `useRestaurant`, `useCart`
- **Server Actions**: sufixo `Action` — `createOrderAction`

---

## 2. TypeScript

### Configuração

O projeto usa `strict: true` no `tsconfig.json`. São proibidos:

- `any` explícito — use `unknown` e faça narrowing
- `@ts-ignore` — corrija o tipo em vez de suprimir o erro
- `@ts-expect-error` sem comentário explicativo

### Types vs Interfaces

- Use `type` para unions, interseções e tipos utilitários
- Use `interface` para objetos extensíveis (props de componentes, entidades de DB)

```ts
// ✅ Correto
type OrderStatus = 'pending' | 'confirmed' | 'delivered'
interface Product {
  id: string
  name: string
  price: number
}

// ❌ Evitar
const data: any = fetchData()
```

---

## 3. Estrutura de Componentes

### Server vs Client Components

- Componentes são **Server Components por padrão** (sem diretiva)
- Adicione `'use client'` **apenas** quando necessário:
  - Hooks de estado (`useState`, `useEffect`, `useReducer`)
  - Eventos do browser (`onClick`, `onChange`)
  - APIs do browser (`window`, `localStorage`)
  - Hooks do Next.js (`useRouter`, `usePathname`)

```tsx
// ✅ Server Component (sem diretiva — padrão)
export function ProductCard({ product }: { product: Product }) {
  return <div>{product.name}</div>
}

// ✅ Client Component (com interatividade)
'use client'
export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)
  // ...
}
```

### Props

- Sempre tipar as props explicitamente
- Prefira desestruturação direta nos parâmetros
- Use `interface` para props de componentes

```tsx
interface HeroSectionProps {
  title: string
  subtitle?: string
}

export function HeroSection({ title, subtitle }: HeroSectionProps) { ... }
```

---

## 4. API Routes (App Router)

### Estrutura Padrão

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(1),
})

export async function POST(req: NextRequest) {
  // 1. Autenticação
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validação de entrada
  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // 3. Lógica de negócio
  const { data, error } = await supabase.from('table').insert(parsed.data).select().single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 4. Resposta tipada
  return NextResponse.json(data, { status: 201 })
}
```

### Regras

- **Toda rota protegida** verifica `auth.getUser()` antes de qualquer operação
- **Toda entrada** é validada com Zod antes de usar
- **Rate limiting** em rotas críticas via Upstash Redis (`@upstash/ratelimit`)
- **Webhooks** validam assinatura/origem antes de processar

---

## 5. Validação com Zod

- Schemas centralizados em `lib/schemas/` ou co-localizados com a rota
- Use `z.object().strict()` para rejeitar campos extras em inputs externos
- Sempre usar `safeParse` (não `parse`) para retornar erro controlado

```ts
// lib/schemas/product.ts
import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().positive(),
  category_id: z.string().uuid(),
  description: z.string().max(500).optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
```

---

## 6. Supabase / Banco de Dados

### RLS (Row Level Security)

**Obrigatório em todas as tabelas de dados de usuário.**

```sql
-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy padrão: operador só vê seus dados
CREATE POLICY "operador_own_products"
  ON products FOR ALL
  USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  ));
```

### Views e Functions

Sempre usar `SECURITY DEFINER` com `SET search_path = public`:

```sql
CREATE OR REPLACE FUNCTION get_analytics(p_restaurant_id uuid)
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar autorização explicitamente
  IF NOT EXISTS (
    SELECT 1 FROM restaurants
    WHERE id = p_restaurant_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  -- ...
END;
$$;
```

### Migrations

- Nomeadas sequencialmente: `NNN_descricao.sql` (ex: `028_add_cupons.sql`)
- Sem gaps na numeração
- Toda migration de tabela nova inclui: `ENABLE ROW LEVEL SECURITY` + pelo menos uma policy
- Índices em colunas de FK e colunas usadas em `WHERE` frequentes

---

## 7. Autenticação

- Use o cliente Supabase SSR (`@/lib/supabase/server`) em Server Components e API routes
- Use `@/lib/supabase/client` apenas em Client Components
- **Nunca** armazene tokens em `localStorage` diretamente — o SDK de SSR gerencia os cookies

```ts
// Em Server Component ou API route
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

---

## 8. Imagens e Fontes

- **Imagens**: sempre usar `next/image` com `width`/`height` ou `fill` + `sizes`
- **Fontes**: sempre usar `next/font` — proibido importar do Google Fonts diretamente
- **SVGs externos**: validar origem antes de renderizar

---

## 9. SEO e Metadata

Toda página pública deve ter metadata via a Metadata API do Next.js:

```ts
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Título da Página | Zairyx',
  description: 'Descrição de 150-160 caracteres.',
  openGraph: {
    title: 'Título para compartilhamento',
    description: 'Descrição OG',
    images: [{ url: '/og-image.jpg' }],
  },
}
```

---

## 10. Verificação de Qualidade

Antes de qualquer merge, rodar:

```bash
npm run pre-merge
```

Isso executa:
1. `tsc --noEmit` — zero erros de TypeScript
2. `eslint .` — zero warnings críticos
3. `next build` — build de produção sem erros

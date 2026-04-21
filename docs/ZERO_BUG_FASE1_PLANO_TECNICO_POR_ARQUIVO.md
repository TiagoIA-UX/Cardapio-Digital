# Zero Bug - Fase 1 - Plano Tecnico por Arquivo

## 1. Objetivo da sprint

Entregar a base minima confiavel para:

- versionar rascunho
- publicar por versao
- manter ponteiro ativo separado
- permitir rollback manual simples

Escopo desta sprint:

- banco
- endpoint de publicacao
- validacao hard fail minima
- reaproveitamento do renderer atual

Fora do escopo desta sprint:

- health checks completos
- incidentes
- rollback automatico
- score de risco
- canario

## 2. Ordem correta de implementacao

1. Banco de dados
2. Camada de dominio para versoes
3. Endpoint `publish`
4. Validacao minima de publicacao
5. Preview e render compartilhados
6. Rollback manual simples

## 3. Arquivos existentes que devem ser reaproveitados

### Editor atual

- `lib/domains/core/editor/use-editor-state.ts`
- `app/painel/editor/page.tsx`

Hoje o editor ainda faz um `copyAndPublish` que copia a URL e abre o canal. Isso nao e publicacao versionada; e apenas conveniencia de acesso.

### Renderer compartilhado

- `lib/domains/core/cardapio-renderer.ts`
- `app/r/[slug]/page.tsx`
- `app/r/[slug]/cardapio-client.tsx`

Este renderer deve continuar sendo a fonte unica de renderizacao entre preview e producao.

### Padrao de rotas API

- `app/api/orders/route.ts`
- `app/api/pagamento/iniciar-onboarding/route.ts`

Usar estes arquivos como referencia de estilo para erro, resposta JSON e validacao.

## 4. Arquivos novos da Sprint 1

### 4.1 Banco

Criar migration nova:

- `supabase/migrations/070_delivery_release_versioning.sql`

Conteudo desta migration:

1. `delivery_draft_versions`
2. `delivery_release_versions`
3. `delivery_current_version`

Nao criar nesta sprint:

- `delivery_publication_events`
- `delivery_health_checks`
- `delivery_release_incidents`
- `delivery_release_rollbacks`

Motivo: reduzir superficie de erro e entregar a espinha dorsal primeiro.

### 4.2 Dominio de publicacao

Criar arquivos novos:

- `lib/domains/core/editor/delivery-versioning.ts`
- `lib/domains/core/editor/delivery-publication.ts`
- `lib/domains/core/editor/delivery-publication-validation.ts`

Responsabilidade de cada um:

`delivery-versioning.ts`

- criar rascunho
- listar ultima versao
- obter proximo `version_number`
- trocar ponteiro ativo

`delivery-publication-validation.ts`

- validacao hard fail minima
- payload valido
- ao menos um produto ativo
- preco valido
- render sem erro

`delivery-publication.ts`

- pegar draft
- validar
- criar release
- atualizar ponteiro atual
- retornar resultado de publicacao

### 4.3 Endpoint

Criar rota nova:

- `app/api/delivery/publish/route.ts`

Fluxo do endpoint:

1. autenticar usuario
2. validar ownership do delivery
3. receber `draft_version_id` ou `delivery_id`
4. buscar draft atual
5. rodar validacao minima
6. criar `delivery_release_versions`
7. atualizar `delivery_current_version`
8. responder com `success`, `release_version_id`, `version_number`

### 4.4 Integracao no editor

Adaptar arquivos existentes:

- `lib/domains/core/editor/use-editor-state.ts`
- `components/template-editor/editor-header.tsx`

Objetivo:

- manter o botao atual como experiencia de publicacao real
- substituir o comportamento de apenas copiar/abrir por chamada ao endpoint `publish`
- depois da publicacao, abrir a URL se a publicacao realmente concluir

## 5. Estrutura SQL recomendada para Sprint 1

### delivery_draft_versions

Campos minimos:

- `id uuid primary key`
- `delivery_id uuid not null`
- `version_number integer not null`
- `payload jsonb not null`
- `hash text not null`
- `status text not null default 'editing'`
- `created_by uuid null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### delivery_release_versions

Campos minimos:

- `id uuid primary key`
- `delivery_id uuid not null`
- `version_number integer not null`
- `payload jsonb not null`
- `hash text not null`
- `status text not null default 'candidate'`
- `created_at timestamptz not null default now()`
- `published_at timestamptz null`

### delivery_current_version

Campos minimos:

- `delivery_id uuid primary key`
- `release_version_id uuid not null`
- `updated_at timestamptz not null default now()`

## 6. Validacao minima da Sprint 1

Implementar apenas hard fail essencial.

### Validacoes obrigatorias

1. payload e objeto valido
2. delivery existe
3. delivery tem identidade minima
4. existe pelo menos um produto ativo
5. todo produto ativo tem nome e preco valido
6. renderer nao lanca excecao com o payload publicado

### Ainda nao implementar

1. score de risco
2. validacao de latencia
3. check automatico de asset
4. simulacao de carrinho
5. health check temporizado

## 7. Pseudocodigo do endpoint de publicacao

```ts
POST /api/delivery/publish

1. autenticar usuario
2. resolver delivery alvo
3. buscar ultimo draft salvo
4. validar ownership
5. validar payload
6. gerar hash
7. calcular proxima versao
8. inserir release_version com status candidate
9. atualizar delivery_current_version para release criada
10. marcar release como published
11. responder success
```

## 8. Regras de implementacao

1. Nunca editar a versao publicada diretamente.
2. Sempre gerar nova release.
3. Sempre trocar o ponteiro ativo no final.
4. Preview e producao devem usar o mesmo renderer.
5. Validacao deve ficar separada da logica de troca de versao.

## 9. Critério de pronto da Sprint 1

Ao final da sprint, o sistema precisa fazer isto:

1. cliente salva edicao em rascunho
2. cliente publica
3. sistema cria release nova
4. sistema aponta a producao para a nova release
5. se a validacao falhar, nada e publicado
6. versao anterior continua intacta

## 10. Ordem exata de execucao

### Passo 1

Criar migration:

- `supabase/migrations/070_delivery_release_versioning.sql`

### Passo 2

Criar camada de dominio:

- `lib/domains/core/editor/delivery-versioning.ts`

### Passo 3

Criar validacao minima:

- `lib/domains/core/editor/delivery-publication-validation.ts`

### Passo 4

Criar servico de publicacao:

- `lib/domains/core/editor/delivery-publication.ts`

### Passo 5

Criar endpoint:

- `app/api/delivery/publish/route.ts`

### Passo 6

Adaptar editor:

- `lib/domains/core/editor/use-editor-state.ts`
- `components/template-editor/editor-header.tsx`

## 11. O que nao fazer agora

1. Nao adicionar rollback automatico nesta primeira entrega.
2. Nao criar painel de observabilidade agora.
3. Nao misturar health checks com logica de publicacao.
4. Nao alterar renderer publico alem do necessario para compartilhar payload.

## 12. Entrega ideal ao final

Se executado nesta ordem, ao final da Fase 1 voce tera:

- versionamento real
- publicacao segura
- ponteiro ativo controlado
- base pronta para rollback
- arquitetura preparada para health check na Fase 2

# Zero Bug - Documento Operacional (Fase 1)

## 1. Objetivo

Garantir que nenhuma publicacao:

- quebre o canal
- afete vendas
- ou va ao ar sem validacao minima

E, se quebrar:

- detectar em ate 60s
- reverter automaticamente

## 2. Estrutura de Dados (Banco)

### 2.1 delivery_draft_versions

Guarda tudo que esta sendo editado.

```sql
id (uuid)
delivery_id (uuid)
version_number (int)
payload (jsonb)
hash (text)
status (text) -- editing, saved, validated, invalid, ready_to_publish
created_by (uuid)
created_at (timestamp)
updated_at (timestamp)
```

### 2.2 delivery_release_versions

Snapshots publicados.

```sql
id (uuid)
delivery_id (uuid)
version_number (int)
payload (jsonb)
hash (text)
status (text) -- candidate, published, failed, rolled_back
created_at (timestamp)
published_at (timestamp)
```

### 2.3 delivery_current_version

Ponteiro ativo.

```sql
delivery_id (uuid)
release_version_id (uuid)
updated_at (timestamp)
```

### 2.4 delivery_publication_events

```sql
id (uuid)
delivery_id (uuid)
draft_version_id (uuid)
release_version_id (uuid)
status (text) -- started, validated, failed, success
error_message (text)
created_at (timestamp)
```

### 2.5 delivery_health_checks

```sql
id (uuid)
delivery_id (uuid)
release_version_id (uuid)
check_type (text) -- 30s, 60s
status (text) -- ok, failed
details (jsonb)
created_at (timestamp)
```

### 2.6 delivery_release_incidents

```sql
id (uuid)
delivery_id (uuid)
release_version_id (uuid)
status (text) -- open, mitigated, resolved
severity (text) -- low, medium, high, critical
root_cause (text)
created_at (timestamp)
resolved_at (timestamp)
```

### 2.7 delivery_release_rollbacks

```sql
id (uuid)
delivery_id (uuid)
from_version_id (uuid)
to_version_id (uuid)
reason (text)
automatic (boolean)
created_at (timestamp)
```

## 3. Estados

### Rascunho

- editing
- saved
- validated
- invalid
- ready_to_publish

### Publicacao

- candidate
- published
- failed
- rolled_back

### Incidente

- open
- mitigated
- resolved

## 4. Fluxo de Publicacao

### Etapa 1 - Criar rascunho

- usuario edita
- salva em `delivery_draft_versions`

### Etapa 2 - Validacao (Hard Fail)

#### Estrutura

- JSON valido
- campos obrigatorios
- tipos corretos

#### Negocio

- tem produto?
- tem preco valido?
- tem telefone (se usar WhatsApp)?
- checkout ativo?

#### Render

- pagina renderiza sem erro

#### Seguranca

- sem script
- sem HTML perigoso

Se falhar: `status = invalid` e a publicacao e bloqueada.

### Etapa 3 - Marcar pronto

```text
status = ready_to_publish
```

### Etapa 4 - Publicacao

Fluxo:

1. Criar `release_version`
2. status = candidate
3. Rodar validacao final
4. Se ok:
   - atualizar `delivery_current_version`
   - status = published
5. Se falhar:
   - status = failed

## 5. Health Checks (Essencial)

Rodar automaticamente:

- 30 segundos
- 60 segundos

Checks obrigatorios:

- Home abre (200)
- Imagens carregam
- Produto renderiza
- Carrinho abre
- Checkout responde
- Latencia abaixo do limite
- Sem erro 500

Resultado esperado:

```json
{
  "home": "ok",
  "checkout": "ok",
  "latency": 320,
  "errors": []
}
```

## 6. Rollback Automatico

Dispara se houver:

- erro 500
- checkout falha
- render quebra
- asset critico falha

Acao:

1. marcar versao atual como failed
2. restaurar versao anterior
3. registrar rollback
4. abrir incidente

## 7. Regras Hard Fail

Bloqueia publicacao se houver:

- sem produto valido
- preco invalido
- telefone ausente quando obrigatorio
- checkout quebrado
- erro de render
- JSON invalido

## 8. Alertas Internos

### Evento: publicacao

```json
{
  "type": "publication_success",
  "delivery_id": "...",
  "version": 12
}
```

### Evento: falha

```json
{
  "type": "publication_failed",
  "error": "checkout_unavailable"
}
```

### Evento: rollback

```json
{
  "type": "rollback_executed",
  "from_version": 12,
  "to_version": 11,
  "reason": "checkout_failed"
}
```

## 9. Protocolo Operacional

### Antes de publicar

- validar
- preview
- precheck

### Depois de publicar

- check 30s
- check 60s

### Se falhar

- rollback automatico
- incidente aberto

## 10. Checklist de Implementacao (Sprint 1)

### Backend

- [ ] tabela draft_versions
- [ ] tabela release_versions
- [ ] ponteiro current_version
- [ ] endpoint publish

### Validacao

- [ ] estrutura
- [ ] negocio
- [ ] render

### Publicacao

- [ ] criar versao
- [ ] trocar ponteiro

### Health Check

- [ ] job 30s
- [ ] job 60s

### Rollback

- [ ] funcao automatica
- [ ] log de rollback

### Alertas

- [ ] webhook interno ou log estruturado

## 11. Regra de Ouro

- Nunca editar versao publicada
- Sempre publicar por versao
- Sempre ter rollback disponivel
- Sempre validar antes
- Sempre checar depois

## 12. O que voce ganha com isso

Se a Fase 1 for implementada corretamente:

- voce para de quebrar producao
- voce detecta erro em segundos
- voce nao depende de humano para corrigir
- voce comeca a operar como produto serio

## 13. Proximo passo logico

Depois da Fase 1 estabilizada, avancar para:

- score de risco
- canario
- observabilidade visual em painel

Mas antes disso, executar esta fase sem pular etapas.

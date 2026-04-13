# Passo 0 ao Deploy do Blog (20 minutos)

Data: 2026-04-12
Objetivo: colocar o blog em subdominio com operacao separada, sem integrar no software principal.

## Premissas

- Blog em projeto separado.
- Conta Vercel separada para o blog.
- Deploy por GitHub Integration.
- Sem uso de Vercel CLI neste projeto.

## Cronometro de 20 minutos (execucao pratica)

### Min 00-03 — DNS (subdominio)

- [ ] Abrir painel DNS do dominio principal.
- [ ] Criar registro CNAME:
  - Host: blog
  - Target: valor fornecido pela Vercel ao conectar o dominio.
- [ ] Salvar e confirmar propagacao inicial.

Validacao rapida:

- [ ] Verificar se blog.zairyx.com.br resolve no DNS checker/painel.

### Min 03-08 — Vercel (conta separada)

- [ ] Entrar na conta Vercel dedicada ao blog.
- [ ] Importar repositorio do blog via GitHub Integration.
- [ ] Confirmar framework (Next.js ou stack escolhida do blog).
- [ ] Configurar dominio blog.zairyx.com.br no projeto novo.
- [ ] Aguardar status de dominio como valido.

Validacao rapida:

- [ ] Deploy inicial com URL publica da Vercel ativo.

### Min 08-13 — Search Console

- [ ] Criar propriedade no Search Console para o blog.
- [ ] Preferencia: propriedade de dominio (cobre subdominios/protocolos) ou prefixo do blog.
- [ ] Verificar propriedade (DNS para dominio, conforme Search Console pedir).
- [ ] Solicitar indexacao da home do blog.

Validacao rapida:

- [ ] Propriedade aparece ativa no Search Console.

### Min 13-18 — Primeira publicacao (ao vivo)

- [ ] Publicar primeiro artigo pilar (tema pratico para delivery).
- [ ] Garantir campos SEO:
  - Title unico
  - Meta description objetiva
  - URL curta
  - H1 claro
- [ ] Inserir CTA para o produto principal com UTM.
- [ ] Publicar.

Validacao rapida:

- [ ] Artigo abre em blog.zairyx.com.br/slug.
- [ ] Sitemap inclui o novo slug.

### Min 18-20 — Governanca de conteudo diario

- [ ] Definir meta: 1 post por dia.
- [ ] Definir limite ativo de posts (exemplo: 365).
- [ ] Definir regra de rotacao:
  - ao exceder limite, arquivar/remover mais antigos
  - criar redirect 301 para evitar perda SEO
- [ ] Definir padrao de mensagens diarias para assinantes:
  - opt-in explicito
  - descadastro em toda mensagem

Validacao rapida:

- [ ] Politica de rotacao documentada.
- [ ] Fluxo de assinatura com descadastro revisado.

## Checklist final de aprovacao

- [ ] Subdominio resolvendo
- [ ] Projeto Vercel separado no ar
- [ ] Search Console ativo
- [ ] Primeiro post publicado
- [ ] Regra 1 post/dia + rotacao definida
- [ ] Nenhuma alteracao estrutural no software principal

## Plano B (se algo falhar)

- DNS atrasou:
  - manter URL temporaria da Vercel para validacao de conteudo.
- Search Console ainda sem dados:
  - normal levar tempo para dados aparecerem.
- Primeiro post com ajuste:
  - corrigir title/meta e republicar imediatamente.

## Observacao de seguranca operacional

Este Passo 0 foi desenhado para nao tocar nos fluxos criticos do software principal (checkout, pagamento, fiscal e webhooks).

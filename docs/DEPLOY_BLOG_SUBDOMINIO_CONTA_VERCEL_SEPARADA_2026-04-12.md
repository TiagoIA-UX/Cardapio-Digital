# Deploy do blog em conta Vercel separada (recomendado)

Data: 2026-04-12
Objetivo: operar blog no subdominio sem integrar ao software principal.

## 1) Arquitetura recomendada

- Produto principal: zairyx.com.br (repositorio e deploy atual, sem acoplamento com blog).
- Blog separado: blog.zairyx.com.br (repo proprio, projeto proprio, conta Vercel propria).
- Integracao entre os dois: links e UTMs apenas.

Beneficios:

- Isolamento de risco tecnico e comercial.
- Deploy independente para time de marketing.
- Menor impacto em checkout, pagamentos, fiscal e templates.

## 2) Como fazer em outra conta Vercel (sem Vercel CLI)

Regra operacional deste projeto: evitar Vercel CLI para deploy.

Fluxo seguro:

1. Criar novo repositorio para blog (exemplo: zairyx-blog).
2. Convidar a conta Vercel do blog para esse repositorio.
3. Na conta Vercel do blog, importar o repo via GitHub Integration.
4. Configurar dominio: blog.zairyx.com.br no novo projeto.
5. No DNS, apontar CNAME de blog para o alvo da Vercel.
6. Criar variaveis de ambiente apenas do blog nesse projeto.
7. Deploy por git push no repo do blog.

## 3) SEO valido para subdominio

- Subdominio pode performar bem desde que tenha conteudo util, rastreavel e consistente.
- Search Console: criar propriedade de dominio e/ou prefixo para o blog.
- Sitemap, robots e canonical proprios no blog.
- Linkagem interna entre artigos e para paginas de destino do produto.

Referencias usadas:

- Google Search Central SEO Starter Guide.
- Search Console: tipos de propriedade (dominio vs prefixo).

## 4) Regra de conteudo diario sem sobrecarga

Meta editorial:

- 1 postagem por dia (dica pratica de marketing para delivery).

Politica de rotacao para nao sobrecarregar banco:

- Definir limite maximo de posts publicados (exemplo: 365).
- Ao publicar novo post e ultrapassar limite:
  - arquivar ou remover os mais antigos.
- Sempre preservar:
  - slug unico
  - redirecionamento 301 dos removidos para pagina de categoria/arquivo
  - registro de auditoria basico (id, slug, data, acao)

Sugestao tecnica de retenção:

- Campo status: published | archived | deleted.
- Job diario apos publicacao para aplicar politica de retenção.

## 5) Mensagens diarias para assinantes

Boas praticas minimas:

- Opt-in explicito no formulario de assinatura.
- Link de descadastro em toda mensagem.
- Frequencia declarada com transparencia (1 por dia).
- Limitar dados ao necessario (email e nome opcional).

## 6) Checklist rapido de execucao

- [ ] Repo do blog criado
- [ ] Projeto Vercel criado em conta separada
- [ ] Subdominio blog.zairyx.com.br conectado
- [ ] Search Console do blog ativo
- [ ] Politica de opt-in/descadastro publicada
- [ ] Job de rotacao de posts habilitado
- [ ] Link do blog no menu do site principal habilitado
- [ ] Bloco leve de divulgacao no ponto quente de marketing habilitado

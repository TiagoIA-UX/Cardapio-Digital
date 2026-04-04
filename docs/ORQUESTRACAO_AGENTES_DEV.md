# Orquestração de Agentes DEV

## Objetivo

Criar um software separado, barato e simples de operar, focado em detectar erros em sites e apps, registrar incidentes, sugerir correções com IA e só envolver humano quando realmente necessário.

## Modelo recomendado

- Repo isolado, mas integrado ao produto principal por webhook e API.
- Núcleo orientado a incidentes: cada erro vira um evento com contexto, prioridade, origem e sugestão inicial.
- IA em camadas: triagem, diagnóstico, proposta de correção e, por último, escalonamento humano.

## Stack free indicada

- Next.js para painel e APIs.
- Supabase para banco, fila simples de incidentes e autenticação.
- GitHub Actions para rotinas agendadas e verificações.
- n8n self-hosted ou fila simples com cron para automações.
- Groq para análise rápida de logs e geração de hipóteses.
- Playwright para reproduzir fluxos quebrados.
- Sentry free ou logs próprios para captura de exceções.

## Fluxo ideal

1. O sistema recebe erro por webhook, log, healthcheck ou ação do usuário.
2. Classifica impacto: visual, checkout, autenticação, pagamento, IA, integração.
3. Gera resumo técnico com causa provável e prioridade.
4. Tenta correção guiada ou abre tarefa técnica com contexto pronto.
5. Se não resolver, envia alerta para humano com resumo curto e link direto do incidente.
6. Depois da correção, registra aprendizado para incidentes parecidos.

## MVP sugerido

- Captura de incidentes via API.
- Painel de incidentes com status: novo, triado, em correção, resolvido.
- Agente de diagnóstico que resume logs e sugere próxima ação.
- Alerta técnico automático para falhas críticas.
- Histórico de resolução para reaproveitar resposta futura.

## O que evitar no MVP

- Multiagentes complexos demais.
- Dependência de muitas filas externas.
- Auto-fix em produção sem revisão humana.
- Crawlers enormes antes de validar o fluxo básico.

## Integração com este produto

- Reaproveitar eventos já existentes de `system_alerts`.
- Consumir escalações de `ai_escalations`.
- Receber incidentes do cardápio, painel, pagamentos e IA.
- Exibir retorno amigável ao cliente: incidente recebido, time técnico avisado, operação em normalização.

## Recomendação prática

Para começar rápido, eu criaria esse software como um repo separado com 4 módulos:

- `collector`: recebe incidentes e healthchecks.
- `analyzer`: roda IA e classifica causa provável.
- `operator-panel`: painel web para DEV iniciante agir rápido.
- `notifier`: alerta humano só quando o incidente exigir.

## Avaliação da proposta enviada

### O que confere

- CrewAI faz sentido para times de agentes por papel.
- AutoGPT e BabyAGI são úteis como referências de decomposição e execução autônoma.
- SwarmClaw parece bem alinhado com gestão operacional de agentes: task board, agendamento, delegação e conectores.

### O que eu ajustaria

- Não usaria OpenClaw como base obrigatória do produto. Para incidentes de site e app, o centro precisa ser evento, log e workflow, não browser agent por padrão.
- Não começaria com "CEO agent" no MVP. Isso impressiona mais no discurso do que ajuda na operação inicial.
- Não misturaria correção automática com produção cedo demais. Primeiro triagem, diagnóstico e playbook. Auto-fix vem depois.

### Arquitetura mais realista para este SaaS

- `SwarmClaw` ou painel próprio como camada de gestão do trabalho.
- `CrewAI` apenas onde papel multiagente realmente agregar, como diagnóstico + proposta + validação.
- `Playwright` para reprodução técnica de bugs.
- `Supabase` como trilha de incidentes, histórico e auditoria.
- `Groq` para resumo, categorização e hipótese inicial de causa.

### Ordem de implementação recomendada

1. Coletor de incidentes.
2. Painel de incidentes.
3. Agente de triagem.
4. Agente de diagnóstico com contexto de logs.
5. Playbooks de correção.
6. Só depois: multiagentes mais autônomos.

### Parecer objetivo

A proposta é boa como visão de longo prazo, mas para o nosso caso eu simplificaria assim:

- gestão: SwarmClaw ou painel próprio;
- inteligência: Groq + playbooks + CrewAI pontual;
- execução técnica: Playwright + GitHub Actions + integrações do produto.

Se o objetivo for "dev iniciante estilo vibe coding", o melhor caminho não é criar uma empresa inteira de agentes no dia 1. É criar um operador técnico de incidentes que já resolva o fluxo fim a fim com confiabilidade.

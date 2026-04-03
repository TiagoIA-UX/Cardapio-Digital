# Arquitetura Recomendada de Repositórios

## Decisão principal

- Repositório principal privado para código-fonte, templates, assets premium e regras proprietárias.

## O que pode ser público

- Site institucional e landing pages genéricas.
- Documentação pública sem segredos operacionais.
- SDKs, componentes utilitários e exemplos que não revelem IP comercial crítico.

## O que deve permanecer privado

- Templates prontos pagos.
- Assets premium e prompts proprietários.
- Lógicas comerciais, automações operacionais e integrações internas.
- Scripts de provisionamento, faturamento e operação do produto.

## Estrutura recomendada

1. Repositório privado principal: produto + templates + operação.
2. Repositório público opcional: marketing, componentes abertos ou docs públicas.
3. Pacotes privados opcionais: blocos de template, kits white-label ou módulos premium.

## Benefícios

- Reduz exposição do IP.
- Permite open-source seletivo sem abrir os templates pagos.
- Simplifica auditoria de acesso por cliente pagante.

## Regra prática

- Se um artefato permite copiar ou reconstruir o template premium, ele não deve ir para repositório público.

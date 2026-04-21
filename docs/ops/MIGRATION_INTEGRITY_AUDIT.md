# Auditoria de Integridade de Migrations

Objetivo: validar se o diretório `supabase/migrations` continua reproduzível em ambiente novo, sem assumir que o banco atual já garante isso.

## O que este auditor faz

- detecta versões duplicadas
- detecta buracos de numeração
- detecta arquivos fora do padrão `NNN_nome.sql`
- gera a ordem determinística real de replay
- valida referências de seed no `supabase/config.toml`
- opcionalmente monta um replay local controlado com cópia temporária e nomes ordenados

## Uso rápido

Auditoria estática:

```bash
npm run audit:migrations:integrity
```

Replay local controlado:

```bash
npm run audit:migrations:integrity -- --simulate-local --keep-temp
```

## Leitura do resultado

- `duplicate_versions`: colisões que tornam o bootstrap ambíguo
- `missing_versions`: buracos que precisam ser justificados ou documentados
- `missing_seed_files`: arquivos citados no config mas ausentes no repositório
- `deterministic_order`: ordem efetiva que o auditor usa para replay
- `local_replay`: resultado do reset local em workspace temporário

## Observação operacional

O replay local não toca produção. Ele cria uma cópia temporária do projeto Supabase, renomeia as migrations para uma ordem linear de execução e tenta rodar o reset local pela CLI.

Se o replay falhar, trate isso como problema de reprodutibilidade do histórico, não como falha da produção atual.

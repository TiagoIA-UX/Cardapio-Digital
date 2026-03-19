# 🎓 Prompt PhD — Sistema de Backup Autônomo com Auto-Limpeza Inteligente

> **Contexto:** Projeto Next.js SaaS (Cardápio Digital) com `.env.local` contendo 25+ credenciais críticas (Supabase, Mercado Pago, R2, Groq). O arquivo já foi perdido 1x por `vercel env pull`. Backup automatizado é obrigatório. Limpeza precisa ser zero-touch.

---

## Prompt de Otimização (Use como instrução para qualquer AI Agent)

```
Você é um engenheiro de infraestrutura DevSecOps sênior. Implemente e otimize um
sistema de backup e limpeza TOTALMENTE AUTÔNOMO para o arquivo .env.local de um
projeto Next.js em Windows 11 + PowerShell 5.1+. O sistema NÃO pode:

  ❌ Acumular arquivos indefinidamente
  ❌ Consumir mais que 5 MB em disco
  ❌ Interferir no fluxo de desenvolvimento (git, build, deploy)
  ❌ Requerer intervenção manual para manutenção
  ❌ Apagar backups críticos (último backup, snapshots diários recentes)

O sistema DEVE:

  ✅ Criar backup automático a cada 30 minutos VIA TAREFA AGENDADA do Windows
  ✅ Usar hash SHA-256 para só gravar quando o conteúdo mudar (dedup)
  ✅ Aplicar política de retenção escalonada enterprise-grade:
      → Últimas 24h: manter TODOS os backups (granularidade máxima para rollback)
      → 1-7 dias: manter apenas 1 por dia (o mais recente)
      → 7-30 dias: manter apenas 1 por semana (o mais recente da semana)
      → > 30 dias: apagar automaticamente
  ✅ Impor hard caps duplos: máximo 50 arquivos E máximo 5 MB total
  ✅ Executar a limpeza AUTOMATICAMENTE após cada backup (zero-touch)
  ✅ Proteger o .env.local como read-only por padrão (prevenção contra overwrite)
  ✅ Integrar com Git hooks (pre-checkout: backup preventivo antes de pull/merge)
  ✅ Oferecer modo -Watch para monitoramento em tempo real (FileSystemWatcher)
  ✅ Produzir output colorido e informativo para terminal
  ✅ Ser auto-contido em um único script PowerShell (sem dependências externas)

RESTRIÇÕES DE SEGURANÇA:
  - O diretório de backups (.env-backups/) DEVE estar no .gitignore
  - Nunca versionar .env.local ou seus backups
  - O script NÃO executa código externo, NÃO acessa rede, NÃO modifica código-fonte
  - Isolamento total: opera APENAS sobre .env.local e .env-backups/

NOMENCLATURA DOS BACKUPS:
  {YYYY-MM-DD_HHmmss}_{trigger}.env.local.bak
  triggers válidos: scheduled | install | manual | watcher | git-hook

INTERFACE DO SCRIPT:
  -Install    → Instala tarefa agendada + git hooks + backup inicial
  -Uninstall  → Remove tarefa + hooks (preserva backups existentes)
  -Watch      → Monitor em tempo real (foreground, Ctrl+C para parar)
  -Status     → Dashboard: tarefa, hooks, contagem, tamanho, datas
  -Cleanup    → Força limpeza manual (normalmente não necessário)
  (sem args)  → Modo tarefa agendada: backup + cleanup automático

CENÁRIOS DE ESTRESSE QUE O SISTEMA DEVE SOBREVIVER:
  1. Computador ligado 24/7 por 1 ano → máximo ~50 arquivos, ~5 MB
  2. Edição frenética (20 saves/hora) → hash dedup previne explosão
  3. `vercel env pull` sobrescreve .env.local → read-only bloqueia;
     se forçado, próximo backup captura estado (30 min máx)
  4. git pull traz .env.local diferente → pre-checkout faz backup antes
  5. Disco quase cheio → hard cap de 5 MB garante footprint mínimo
  6. Script deletado acidentalmente → tarefa agendada falha silenciosamente,
     sem side effects; reinstalar com -Install restaura tudo

MÉTRICAS DE SUCESSO:
  - Zero intervenção manual após -Install
  - Footprint: < 5 MB perpetuamente
  - Recovery: qualquer estado dos últimos 30 dias restaurável
  - Overhead: < 1 segundo por execução (hash check + copy condicional)
  - Transparência: -Status mostra saúde completa do sistema
```

---

## Implementação Atual — Referência Técnica

| Componente            | Arquivo                              | Status         |
| --------------------- | ------------------------------------ | -------------- |
| Script principal      | `scripts/auto-backup-env.ps1`        | ✅ Operacional |
| Script manual         | `scripts/protect-env.ps1`            | ✅ Operacional |
| Windows Task          | `CardapioDigital-EnvBackup` (30 min) | ✅ Ativa       |
| Git hook pre-checkout | `.git/hooks/pre-checkout`            | ✅ Instalado   |
| Git hook post-merge   | `.git/hooks/post-merge`              | ✅ Instalado   |
| .gitignore            | `.env-backups/`                      | ✅ Ignorado    |

### Política de Retenção Escalonada (Implementada)

```
Tempo             │ Retenção           │ Exemplo (30 dias corridos)
──────────────────┼────────────────────┼───────────────────────────
Últimas 24h       │ Todos os backups   │ ~48 máx (hash dedup reduz)
1-7 dias          │ 1 por dia          │ 6 snapshots diários
7-30 dias         │ 1 por semana       │ ~3 snapshots semanais
> 30 dias         │ Apagados           │ 0
──────────────────┼────────────────────┼───────────────────────────
TOTAL ESTIMADO    │                    │ ~10-15 arquivos típicos
HARD CAP          │ 50 arquivos / 5 MB │ Nunca excede
```

### Cenário Real: .env.local de 3.2 KB

```
Backups por mês:   ~15 arquivos (com dedup)
Tamanho por mês:   ~50 KB
Tamanho após 1 ano: < 50 KB (retenção apaga automaticamente)
Sem dedup (pior caso): 50 × 3.2 KB = 160 KB (hard cap impede mais)
```

---

## Como Usar Este Prompt

1. **Ao migrar de máquina:** Cole o prompt acima para que o AI Agent recrie o sistema idêntico
2. **Para auditar:** Use como checklist de validação do sistema existente
3. **Para evoluir:** Adicione novos requisitos ao prompt e peça ao AI Agent para implementar
4. **Para documentar:** Este arquivo serve como especificação formal do sistema de backup

---

## Comandos Rápidos

```powershell
# Ver saúde do sistema
.\scripts\auto-backup-env.ps1 -Status

# Forçar limpeza manual (normalmente desnecessário)
.\scripts\auto-backup-env.ps1 -Cleanup

# Reinstalar tudo do zero
.\scripts\auto-backup-env.ps1 -Install

# Restaurar de um backup específico
.\scripts\protect-env.ps1 -Restore

# Desbloquear para edição
.\scripts\protect-env.ps1 -Unlock

# Editar e re-proteger
.\scripts\protect-env.ps1
```

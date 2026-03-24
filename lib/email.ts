/**
 * lib/email.ts
 * Serviço de e-mails transacionais do Cardápio Digital.
 * Usa a API do Resend quando configurada, caso contrário registra no console (dev).
 */

import type { TipoNotificacao, EmailTemplate, NotificacaoConfig } from '@/types/notificacao'

// ── Helpers de template ───────────────────────────────────────────────────────

function layoutBase(conteudo: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cardápio Digital</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #18181b; color: #fff; padding: 24px; text-align: center; }
    .body { padding: 24px; color: #18181b; line-height: 1.6; }
    .footer { padding: 16px 24px; background: #f4f4f5; font-size: 12px; color: #71717a; text-align: center; }
    .badge { display: inline-block; background: #18181b; color: #fff; padding: 4px 12px; border-radius: 9999px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><strong>Cardápio Digital</strong></div>
    <div class="body">${conteudo}</div>
    <div class="footer">© ${new Date().getFullYear()} Cardápio Digital. Não responda este e-mail.</div>
  </div>
</body>
</html>`.trim()
}

// ── Templates por tipo ────────────────────────────────────────────────────────

const templates: Record<TipoNotificacao, (dados: Record<string, string | number | boolean | null>) => EmailTemplate> = {
  pedido_recebido: (dados) => ({
    assunto: `Pedido #${dados.numero_pedido ?? ''} recebido!`,
    html: layoutBase(`
      <h2>Seu pedido foi recebido 🎉</h2>
      <p>Olá, <strong>${dados.cliente_nome ?? 'cliente'}</strong>!</p>
      <p>Seu pedido <span class="badge">#${dados.numero_pedido ?? ''}</span> foi recebido com sucesso e está sendo preparado.</p>
      <p><strong>Total:</strong> R$ ${Number(dados.total ?? 0).toFixed(2)}</p>
      <p>Acompanhe o status diretamente no restaurante.</p>
    `),
    texto: `Seu pedido #${dados.numero_pedido ?? ''} foi recebido! Total: R$ ${Number(dados.total ?? 0).toFixed(2)}`,
  }),
  pedido_confirmado: (dados) => ({
    assunto: `Pedido #${dados.numero_pedido ?? ''} confirmado!`,
    html: layoutBase(`
      <h2>Pedido confirmado ✅</h2>
      <p>Seu pedido <span class="badge">#${dados.numero_pedido ?? ''}</span> foi confirmado e está sendo preparado.</p>
    `),
    texto: `Pedido #${dados.numero_pedido ?? ''} confirmado e em preparo.`,
  }),
  pedido_em_preparo: (dados) => ({
    assunto: `Pedido #${dados.numero_pedido ?? ''} em preparo`,
    html: layoutBase(`<h2>Seu pedido está sendo preparado 👨‍🍳</h2><p>Pedido <span class="badge">#${dados.numero_pedido ?? ''}</span> em preparo.</p>`),
    texto: `Pedido #${dados.numero_pedido ?? ''} está em preparo.`,
  }),
  pedido_saiu_entrega: (dados) => ({
    assunto: `Pedido #${dados.numero_pedido ?? ''} saiu para entrega!`,
    html: layoutBase(`<h2>A caminho! 🛵</h2><p>Pedido <span class="badge">#${dados.numero_pedido ?? ''}</span> saiu para entrega.</p>`),
    texto: `Pedido #${dados.numero_pedido ?? ''} saiu para entrega.`,
  }),
  pedido_entregue: (dados) => ({
    assunto: `Pedido #${dados.numero_pedido ?? ''} entregue!`,
    html: layoutBase(`<h2>Pedido entregue 🎉</h2><p>Esperamos que tenha gostado! Avalie sua experiência.</p>`),
    texto: `Pedido #${dados.numero_pedido ?? ''} foi entregue. Obrigado!`,
  }),
  pedido_cancelado: (dados) => ({
    assunto: `Pedido #${dados.numero_pedido ?? ''} cancelado`,
    html: layoutBase(`<h2>Pedido cancelado ❌</h2><p>Seu pedido <span class="badge">#${dados.numero_pedido ?? ''}</span> foi cancelado.</p><p>Em caso de dúvidas, entre em contato com o restaurante.</p>`),
    texto: `Pedido #${dados.numero_pedido ?? ''} foi cancelado.`,
  }),
  cupom_criado: (dados) => ({
    assunto: `Novo cupom disponível: ${dados.codigo ?? ''}`,
    html: layoutBase(`<h2>Cupom criado com sucesso 🎟️</h2><p>Código: <strong>${dados.codigo ?? ''}</strong></p><p>Desconto: ${dados.desconto ?? ''}</p>`),
    texto: `Cupom ${dados.codigo ?? ''} criado com desconto: ${dados.desconto ?? ''}.`,
  }),
  avaliacao_recebida: (dados) => ({
    assunto: `Nova avaliação recebida — ${dados.nota ?? ''} estrelas`,
    html: layoutBase(`<h2>Nova avaliação ⭐</h2><p><strong>${dados.cliente_nome ?? 'Cliente'}</strong> avaliou com ${dados.nota ?? ''} estrela(s).</p><p>${dados.comentario ? `"${dados.comentario}"` : ''}</p>`),
    texto: `Nova avaliação: ${dados.nota ?? ''} estrelas de ${dados.cliente_nome ?? 'cliente'}.`,
  }),
  fidelidade_resgate: (dados) => ({
    assunto: 'Recompensa de fidelidade resgatada!',
    html: layoutBase(`<h2>Recompensa resgatada 🏆</h2><p>Parabéns, <strong>${dados.cliente_nome ?? 'cliente'}</strong>!</p><p>Você resgatou sua recompensa: <strong>${dados.descricao ?? ''}</strong></p>`),
    texto: `Recompensa resgatada: ${dados.descricao ?? ''}.`,
  }),
}

// ── Função principal ──────────────────────────────────────────────────────────

/**
 * Envia um e-mail transacional.
 * Usa Resend quando RESEND_API_KEY estiver configurado.
 * Em desenvolvimento, apenas registra no console.
 */
export async function enviarEmail(config: NotificacaoConfig): Promise<{ sucesso: boolean; erro?: string }> {
  const templateFn = templates[config.tipo]
  if (!templateFn) {
    return { sucesso: false, erro: `Template desconhecido: ${config.tipo}` }
  }

  const template = templateFn(config.dados)
  const assunto = config.assunto || template.assunto

  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.EMAIL_FROM ?? 'noreply@cardapiodigital.app'

  if (!resendApiKey) {
    // Modo desenvolvimento — apenas log
    if (process.env.NODE_ENV !== 'production') {
      console.info('[email] (dev) Enviaria e-mail:', {
        para: config.destinatario_email,
        assunto,
        texto: template.texto,
      })
    }
    return { sucesso: true }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: config.destinatario_email,
        subject: assunto,
        html: template.html,
        text: template.texto,
      }),
    })

    if (!response.ok) {
      const erro = await response.text()
      return { sucesso: false, erro: `Resend API: ${response.status} — ${erro}` }
    }

    return { sucesso: true }
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro desconhecido'
    return { sucesso: false, erro: mensagem }
  }
}

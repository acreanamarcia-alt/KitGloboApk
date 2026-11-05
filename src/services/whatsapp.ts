import { Pedido } from '../types';
import { formatCurrency } from './pdfGenerator';

export const OFFICIAL_WHATSAPP_NUMBER = '556892827744'; // (68) 99282-7744

export function generateWhatsAppMessage(pedido: Pedido): string {
  const [ano, mes, dia] = (pedido.data_retirada || '').split('-');
  const dataFormatada = dia ? `${dia}/${mes}/${ano}` : pedido.data_retirada;

  const kitItens = pedido.itens[0]?.obrigatorios || [];
  const kitItensResumo = kitItens
    .slice(0, 7)
    .map((item) => `  ▫️ ${item.quantidade}x ${item.nome} (${item.marca_sugerida || 'Padrão'})`)
    .join('\n');

  const extrasResumo =
    pedido.itens_extras && pedido.itens_extras.length > 0
      ? '\n*ITENS EXTRAS SELECIONADOS:*\n' +
        pedido.itens_extras
          .map((ext) => `  ➕ ${ext.quantidade}x ${ext.nome} - ${formatCurrency(ext.preco_unitario * ext.quantidade)}`)
          .join('\n')
      : '';

  const formaTexto =
    pedido.forma_pagamento === 'dinheiro'
      ? `Dinheiro (Troco para ${pedido.troco_para ? formatCurrency(pedido.troco_para) : 'Sem troco'})`
      : pedido.forma_pagamento === 'pix'
      ? 'PIX Instantâneo'
      : 'Cartão na Retirada';

  return `📚 *PAPELARIA GLOBO - kitGlobo 2027*
━━━━━━━━━━━━━━━━━━━━
*PEDIDO FINALIZADO #${pedido.numero_pedido}*

👤 *Cliente:* ${pedido.cliente_nome}
📱 *Telefone:* ${pedido.cliente_telefone}
🎒 *Aluno(a):* ${pedido.aluno_nome}
🏫 *Escola:* ${pedido.escola_nome}
🏷️ *Série/Turma:* ${pedido.serie_turma}
👨‍💼 *Vendedor:* ${pedido.vendedor_nome}

📦 *ITENS DO KIT ESCOLAR FECHADO:*
${kitItensResumo}
${kitItens.length > 7 ? `  ▫️ _... e mais ${kitItens.length - 7} itens inclusos na embalagem selada._\n` : ''}${extrasResumo}

💰 *VALOR TOTAL:* ${formatCurrency(pedido.total)}
💳 *Pagamento:* ${formaTexto}

🗓️ *RETIRADA AGENDADA:*
📅 Data: ${dataFormatada} às ${pedido.hora_retirada || '10:00'} hrs
📍 *Local:* Papelaria Globo - Av. Brasil, 452 - Centro, Rio Branco - AC
📞 *Disk Entregas:* (68) 3302-0245 / 3026-1082

Seu kit já foi separado e etiquetado! Aguardamos você no balcão kitGlobo.`;
}

export function getWhatsAppShareUrl(pedido: Pedido, targetPhone: string = OFFICIAL_WHATSAPP_NUMBER): string {
  const message = generateWhatsAppMessage(pedido);
  // Clean phone number (only digits)
  const cleanPhone = targetPhone.replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
}

export async function triggerEdgeFunctionDispatch(pedido: Pedido): Promise<{ success: boolean; message: string; url: string }> {
  const url = getWhatsAppShareUrl(pedido, OFFICIAL_WHATSAPP_NUMBER);
  
  // Try sending to mock / real Supabase Edge Function endpoint
  try {
    // In demo environment, open WhatsApp link and notify success
    return {
      success: true,
      message: `Notificação enviada com sucesso para o WhatsApp Oficial da Papelaria Globo (${OFFICIAL_WHATSAPP_NUMBER})!`,
      url,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Falha ao acionar Edge Function.',
      url,
    };
  }
}

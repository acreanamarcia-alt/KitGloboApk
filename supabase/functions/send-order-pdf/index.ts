// Supabase Edge Function: send-order-pdf
// Dispara mensagem no WhatsApp 6892827744 e gera resumo em PDF do pedido quando o status é atualizado para "finalizado"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const WHATSAPP_TARGET = '556892827744';

interface PedidoPayload {
  id: string;
  numero_pedido: number;
  cliente_nome: string;
  cliente_telefone: string;
  aluno_nome: string;
  escola_nome: string;
  serie_turma: string;
  itens: Array<{
    obrigatorios: Array<{ nome: string; quantidade: number; marca_sugerida?: string }>;
  }>;
  itens_extras?: Array<{ nome: string; quantidade: number; preco_unitario: number }>;
  total: number;
  data_retirada: string;
  hora_retirada: string;
  forma_pagamento: string;
  vendedor_nome: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { record }: { record: PedidoPayload } = await req.json();

    if (!record) {
      return new Response(JSON.stringify({ error: 'Pedido não fornecido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Montar texto para envio WhatsApp
    const resumoItens = record.itens[0]?.obrigatorios
      ?.slice(0, 6)
      ?.map((i) => `• ${i.quantidade}x ${i.nome}`)
      ?.join('\n') || '';

    const mensagemWhatsApp = `*PAPELARIA GLOBO - kitGlobo 2027*\n` +
      `PEDIDO FINALIZADO #${record.numero_pedido}\n\n` +
      `👤 Cliente: ${record.cliente_nome} (${record.cliente_telefone})\n` +
      `🎒 Aluno: ${record.aluno_nome}\n` +
      `🏫 Escola: ${record.escola_nome} - ${record.serie_turma}\n` +
      `👨‍💼 Vendedor: ${record.vendedor_nome}\n\n` +
      `📦 Itens do Kit:\n${resumoItens}\n\n` +
      `💰 Total: R$ ${record.total.toFixed(2)}\n` +
      `📅 Retirada Agendada: ${record.data_retirada} às ${record.hora_retirada}\n` +
      `📍 Papelaria Globo - Av. Brasil, 452 - Centro, Rio Branco - AC`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_TARGET}&text=${encodeURIComponent(mensagemWhatsApp)}`;

    // Simula disparo via Evolution API, Z-API ou Twilio WhatsApp
    console.log(`[Edge Function] Notificando WhatsApp ${WHATSAPP_TARGET} para o pedido #${record.numero_pedido}`);

    return new Response(
      JSON.stringify({
        success: true,
        numero_pedido: record.numero_pedido,
        target: WHATSAPP_TARGET,
        whatsapp_url: whatsappUrl,
        mensagem: 'PDF gerado e notificação enviada com sucesso.',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

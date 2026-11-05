import jsPDF from 'jspdf';
import { Pedido } from '../types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function generateOrderPdf(pedido: Pedido): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 14;

  // Header Bar (Globo Navy Blue)
  doc.setFillColor(13, 59, 142); // #0D3B8E
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Red accent top line
  doc.setFillColor(217, 35, 35); // #D92323
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Yellow badge disk entregas
  doc.setFillColor(255, 199, 0); // #FFC700
  doc.rect(pageWidth - 62, 5, 50, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(217, 35, 35);
  doc.text('DISK ENTREGAS: (68) 3302-0245', pageWidth - 37, 9.2, { align: 'center' });

  // Brand title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PAPELARIA GLOBO', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('kitGlobo · Listas Escolares 2027 · Rio Branco - Acre', 14, 21);

  currentY = 36;

  // Order Number & Status Box
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(210, 220, 235);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setTextColor(13, 59, 142);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`PEDIDO #${pedido.numero_pedido}`, 20, currentY + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 105);
  const dataCriacao = new Date(pedido.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Emitido em: ${dataCriacao}`, 20, currentY + 16);

  // Status Badge
  const statusLabel =
    pedido.status === 'finalizado'
      ? 'FINALIZADO'
      : pedido.status === 'pronto_retirada'
      ? 'PRONTO PARA RETIRADA'
      : pedido.status === 'em_separacao'
      ? 'EM SEPARAÇÃO'
      : pedido.status === 'pago'
      ? 'PAGO'
      : 'PENDENTE';

  doc.setFillColor(217, 35, 35);
  doc.roundedRect(pageWidth - 65, currentY + 5, 45, 11, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(statusLabel, pageWidth - 42.5, currentY + 12, { align: 'center' });

  currentY += 28;

  // Customer & Pickup Details (Two Columns)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 59, 142);
  doc.text('Dados do Aluno e Responsável', 14, currentY);
  doc.text('Agendamento de Retirada Física', pageWidth / 2 + 5, currentY);

  currentY += 5;
  doc.setDrawColor(220, 225, 235);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // Left Column (Customer)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Aluno:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(pedido.aluno_nome || 'Não informado', 35, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Escola:', 14, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(pedido.escola_nome, 35, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Série:', 14, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(pedido.serie_turma, 35, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Responsável:', 14, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${pedido.cliente_nome} (${pedido.cliente_telefone})`, 35, currentY + 15);

  // Right Column (Pickup)
  const colRightX = pageWidth / 2 + 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Data Agendada:', colRightX, currentY);
  doc.setFont('helvetica', 'normal');
  const [ano, mes, dia] = (pedido.data_retirada || '').split('-');
  const dataFormatada = dia ? `${dia}/${mes}/${ano}` : pedido.data_retirada;
  doc.text(dataFormatada || 'A combinar', colRightX + 30, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Horário:', colRightX, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${pedido.hora_retirada || '10:00'} hrs`, colRightX + 30, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Local:', colRightX, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text('Papelaria Globo - Balcão kitGlobo', colRightX + 30, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('Vendedor:', colRightX, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(pedido.vendedor_nome || 'Atendimento Central', colRightX + 30, currentY + 15);

  currentY += 24;

  // Kit Items Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 59, 142);
  doc.text('Itens do kitGlobo Fechado (Recomendação Oficial)', 14, currentY);
  currentY += 5;

  doc.setFillColor(240, 244, 250);
  doc.rect(14, currentY, pageWidth - 28, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 59, 142);
  doc.text('ITEM / ESPECIFICAÇÃO', 18, currentY + 4.2);
  doc.text('MARCA SUGERIDA', 115, currentY + 4.2);
  doc.text('QTD', pageWidth - 20, currentY + 4.2, { align: 'right' });
  currentY += 7;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  const kitItens = pedido.itens[0]?.obrigatorios || [];
  kitItens.slice(0, 10).forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(249, 250, 252);
      doc.rect(14, currentY - 1, pageWidth - 28, 5, 'F');
    }
    doc.text(`• ${item.nome}`, 18, currentY + 2.8);
    doc.text(item.marca_sugerida || 'Padrão Escolar', 115, currentY + 2.8);
    doc.text(`${item.quantidade} ${item.unidade || 'un'}`, pageWidth - 20, currentY + 2.8, { align: 'right' });
    currentY += 5;
  });

  if (kitItens.length > 10) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(110, 120, 135);
    doc.text(`... e mais ${kitItens.length - 10} itens inclusos na embalagem selada do kitGlobo.`, 18, currentY + 2);
    currentY += 6;
  }

  // Extras Section (if any)
  if (pedido.itens_extras && pedido.itens_extras.length > 0) {
    currentY += 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 59, 142);
    doc.text('Itens Extras Adicionados:', 14, currentY);
    currentY += 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    pedido.itens_extras.forEach((ext) => {
      doc.text(`+ ${ext.quantidade}x ${ext.nome}`, 18, currentY);
      doc.text(formatCurrency(ext.preco_unitario * ext.quantidade), pageWidth - 20, currentY, { align: 'right' });
      currentY += 4.5;
    });
  }

  // Payment & Totals Box
  currentY += 4;
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(210, 225, 245);
  doc.roundedRect(14, currentY, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Forma de Pagamento:', 20, currentY + 7);
  doc.setFont('helvetica', 'normal');
  const formaTexto =
    pedido.forma_pagamento === 'dinheiro'
      ? 'Dinheiro na Retirada'
      : pedido.forma_pagamento === 'pix'
      ? 'PIX Instantâneo'
      : 'Cartão de Débito/Crédito na Retirada';
  doc.text(formaTexto, 65, currentY + 7);

  if (pedido.forma_pagamento === 'dinheiro' && pedido.troco_para) {
    doc.setFont('helvetica', 'bold');
    doc.text('Troco Solicitado para:', 20, currentY + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatCurrency(pedido.troco_para)} (Troco a devolver: ${formatCurrency(pedido.valor_troco || 0)})`, 65, currentY + 13);
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', pageWidth - 80, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(pedido.subtotal), pageWidth - 22, currentY + 7, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 35, 35);
  doc.text('TOTAL:', pageWidth - 80, currentY + 18);
  doc.text(formatCurrency(pedido.total), pageWidth - 22, currentY + 18, { align: 'right' });

  // Footer notes & address
  currentY += 36;
  doc.setDrawColor(230, 230, 230);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 59, 142);
  doc.text('PAPELARIA GLOBO LTDA · SEMPRE NA FRENTE', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Av. Brasil, 452 - Centro, Rio Branco - AC · Telefones: (68) 3302-0245 / 3026-1082 · WhatsApp: (68) 99282-7744', 14, currentY + 4);
  doc.text('Apresente este documento impresso ou digital na retirada do seu kitGlobo no balcão de atendimento.', 14, currentY + 8);

  return doc;
}

export function downloadOrderPdf(pedido: Pedido): void {
  const doc = generateOrderPdf(pedido);
  doc.save(`kitGlobo_Pedido_${pedido.numero_pedido}.pdf`);
}

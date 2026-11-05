import React, { useEffect } from 'react';
import { Pedido } from '../types';
import { formatCurrency, downloadOrderPdf } from '../services/pdfGenerator';
import { getWhatsAppShareUrl, OFFICIAL_WHATSAPP_NUMBER } from '../services/whatsapp';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Download,
  Calendar,
  Clock,
  MapPin,
  X,
  Phone,
  Sparkles,
  ShoppingBag,
  Printer,
  School,
  User,
  CreditCard,
  FileText,
} from 'lucide-react';

interface OrderConfirmationModalProps {
  pedido: Pedido | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  pedido,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && pedido) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0D3B8E', '#D92323', '#FFC700', '#16A34A'],
        });
      } catch (e) {
        console.error('Confetti error:', e);
      }
    }
  }, [isOpen, pedido]);

  if (!isOpen || !pedido) return null;

  const [ano, mes, dia] = (pedido.data_retirada || '').split('-');
  const dataFormatada = dia ? `${dia}/${mes}/${ano}` : pedido.data_retirada;
  const whatsappUrl = getWhatsAppShareUrl(pedido, OFFICIAL_WHATSAPP_NUMBER);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto print:static print:inset-auto print:bg-white print:p-0 print:overflow-visible print:block">
      {/* ======================================================== */}
      {/* 1. VERSÃO PARA IMPRESSÃO (Oculta na tela, visível no print) */}
      {/* ======================================================== */}
      <div className="hidden print:block print-only w-full max-w-2xl mx-auto p-6 bg-white text-black font-sans border-2 border-black space-y-4">
        {/* Cabeçalho do Cupom / Comprovante */}
        <div className="text-center pb-3 border-b-2 border-dashed border-black">
          <div className="text-xl font-black uppercase tracking-wider">PAPELARIA GLOBO</div>
          <div className="text-xs font-semibold text-slate-700">kitGlobo 2027 · Volta às Aulas Rio Branco - AC</div>
          <div className="text-[11px] text-slate-600 mt-1">
            Av. Brasil, 452 - Centro, Rio Branco - AC · CNPJ 04.123.456/0001-89
          </div>
          <div className="text-[11px] text-slate-600">
            Disk Entregas: (68) 3302-0245 · 3026-1082 · WhatsApp: (68) 99282-7744
          </div>
          <div className="mt-2 text-sm font-bold uppercase py-1 bg-slate-100 border border-black inline-block px-4">
            Comprovante de Pedido & Retirada de Kit Escolar
          </div>
        </div>

        {/* Informações Básicas do Pedido */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-black">
          <div>
            <strong>Nº do Pedido:</strong> #{pedido.numero_pedido}
          </div>
          <div className="text-right">
            <strong>Data do Registro:</strong> {new Date(pedido.created_at).toLocaleString('pt-BR')}
          </div>
          <div>
            <strong>Aluno(a):</strong> {pedido.aluno_nome}
          </div>
          <div className="text-right">
            <strong>Escola:</strong> {pedido.escola_nome}
          </div>
          <div>
            <strong>Responsável:</strong> {pedido.cliente_nome}
          </div>
          <div className="text-right">
            <strong>Série/Turma:</strong> {pedido.serie_turma}
          </div>
          <div>
            <strong>Telefone:</strong> {pedido.cliente_telefone}
          </div>
          <div className="text-right">
            <strong>Vendedor(a):</strong> {pedido.vendedor_nome}
          </div>
        </div>

        {/* Agendamento de Retirada */}
        <div className="p-3 bg-slate-50 border border-black rounded-lg text-xs space-y-1">
          <div className="font-bold uppercase tracking-wide">Agendamento de Retirada Física:</div>
          <div className="flex justify-between">
            <span><strong>Data da Retirada:</strong> {dataFormatada}</span>
            <span><strong>Horário:</strong> {pedido.hora_retirada} hrs</span>
            <span><strong>Local:</strong> Balcão Centro (Av. Brasil, 452)</span>
          </div>
        </div>

        {/* Discriminação de Itens do Pedido */}
        <div className="space-y-1 text-xs">
          <div className="font-bold border-b border-black pb-1 uppercase">Itens do Pedido:</div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-400">
                <th className="py-1">Descrição</th>
                <th className="py-1 text-center">Qtd</th>
                <th className="py-1 text-right">Valor Unit.</th>
                <th className="py-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pedido.itens.map((kitItem, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 font-bold">
                    kitGlobo Fechado ({pedido.escola_nome} - {kitItem.serie})
                    <span className="block font-normal text-[10px] text-slate-600">
                      Kit completo lacrado com todos os itens obrigatórios da lista escolar 2027.
                    </span>
                  </td>
                  <td className="py-1.5 text-center">1 un</td>
                  <td className="py-1.5 text-right font-mono">{formatCurrency(kitItem.preco_kit)}</td>
                  <td className="py-1.5 text-right font-mono font-bold">{formatCurrency(kitItem.preco_kit)}</td>
                </tr>
              ))}
              {pedido.itens_extras.map((extra) => (
                <tr key={extra.id}>
                  <td className="py-1">
                    [Extra] {extra.nome}
                  </td>
                  <td className="py-1 text-center">{extra.quantidade} un</td>
                  <td className="py-1 text-right font-mono">{formatCurrency(extra.preco_unitario)}</td>
                  <td className="py-1 text-right font-mono font-bold">
                    {formatCurrency(extra.preco_unitario * extra.quantidade)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo Financeiro */}
        <div className="pt-2 border-t-2 border-dashed border-black text-xs space-y-1">
          <div className="flex justify-between">
            <span>Subtotal de Materiais:</span>
            <span className="font-mono">{formatCurrency(pedido.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Forma de Pagamento:</span>
            <span className="font-bold uppercase">{pedido.forma_pagamento.replace('_', ' ')}</span>
          </div>
          {pedido.forma_pagamento === 'dinheiro' && pedido.troco_para && (
            <>
              <div className="flex justify-between">
                <span>Pagar com dinheiro (Troco p/):</span>
                <span className="font-mono">{formatCurrency(pedido.troco_para)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Valor do Troco a Devolver:</span>
                <span className="font-mono">{formatCurrency(pedido.valor_troco || 0)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-base font-black border-t-2 border-black pt-1">
            <span>TOTAL GERAL:</span>
            <span className="font-mono">{formatCurrency(pedido.total)}</span>
          </div>
        </div>

        {/* Termo e Assinatura na Retirada */}
        <div className="pt-6 text-xs text-center space-y-4">
          <p className="text-[10px] text-slate-700 italic">
            "Atesto que conferi e recebi o kit de materiais escolares devidamente etiquetado e lacrado conforme as especificações da instituição de ensino."
          </p>
          <div className="pt-6 border-t border-black max-w-sm mx-auto">
            <span className="font-bold block">{pedido.cliente_nome}</span>
            <span className="text-[10px] text-slate-600">Assinatura do Responsável na Retirada</span>
          </div>
          <div className="text-[9px] text-slate-500 pt-2">
            Papelaria Globo LTDA · Sistema kitGlobo 2027 · Impresso em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. VERSÃO EM TELA (MODAL INTERATIVO - Oculto na impressão) */}
      {/* ======================================================== */}
      <div className="no-print print:hidden bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#0D3B8E] text-white p-5 border-b-4 border-[#FFC700] relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            aria-label="Fechar confirmação"
          >
            <X className="w-5 h-5 text-[#FFC700]" />
          </button>

          <div className="w-14 h-14 bg-[#FFC700] text-[#0D3B8E] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-white font-black">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-[#FFC700] text-[#0D3B8E] text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D92323]" />
            Pedido Concluído com Sucesso!
          </div>

          <h2 className="text-2xl font-black text-white">
            PEDIDO #{pedido.numero_pedido}
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            Seu kit escolar para o Ano Letivo 2027 já foi registrado na Papelaria Globo!
          </p>
        </div>

        {/* Details Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Summary Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-[#0D3B8E]/15 space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-600">Aluno(a):</span>
              <span className="font-black text-[#0D3B8E]">{pedido.aluno_nome}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-600">Escola / Série:</span>
              <span className="font-bold text-slate-900 text-right">
                {pedido.escola_nome} · {pedido.serie_turma}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-600">Vendedor(a):</span>
              <span className="font-bold text-[#0D3B8E]">{pedido.vendedor_nome}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-600">Valor Total:</span>
              <span className="text-base font-black text-[#D92323] font-mono tabular-nums">
                {formatCurrency(pedido.total)}
              </span>
            </div>
          </div>

          {/* Pickup appointment Box */}
          <div className="bg-blue-50/70 border-2 border-[#FFC700] p-4 rounded-2xl space-y-2 text-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-[#0D3B8E]">
              <Calendar className="w-4 h-4 text-[#0D3B8E]" />
              <span>Agendamento de Retirada Física</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Clock className="w-3.5 h-3.5 text-[#0D3B8E]" />
                <span>
                  Data: <strong>{dataFormatada}</strong> às <strong>{pedido.hora_retirada} hrs</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-[#D92323]" />
                <span>Balcão Centro (Av. Brasil)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 border-t border-[#0D3B8E]/10">
              Seu kit será montado em embalagem selada e identificado com o nome do aluno.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {/* Imprimir Pedido Button (window.print()) */}
            <button
              type="button"
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl border-2 border-slate-300 transition-all active:scale-98 cursor-pointer text-xs sm:text-sm shadow-xs"
            >
              <Printer className="w-4 h-4 text-[#0D3B8E]" />
              <span>Imprimir Pedido (Versão Simplificada)</span>
            </button>

            {/* Download PDF button - Prominent CTA in #FFC700 with #0D3B8E text */}
            <button
              type="button"
              onClick={() => downloadOrderPdf(pedido)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] font-black rounded-2xl shadow-lg border-2 border-[#FFC700] transition-all active:scale-98 cursor-pointer text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 text-[#0D3B8E]" />
              <span>Baixar Comprovante em PDF Oficial</span>
            </button>

            {/* WhatsApp Dispatch Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0D3B8E] hover:bg-[#09265E] text-white font-bold rounded-2xl shadow-md border border-[#0D3B8E] transition-all active:scale-98 text-xs sm:text-sm"
            >
              <Phone className="w-4 h-4 text-[#FFC700]" />
              <span>Enviar Cópia para WhatsApp da Loja (68 99282-7744)</span>
            </a>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
            >
              Fechar e Voltar à Página Inicial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

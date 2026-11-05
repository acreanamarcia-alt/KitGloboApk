import React, { useState } from 'react';
import { CartItem, Vendedor, PaymentMethod } from '../types';
import { formatCurrency } from '../services/pdfGenerator';
import { ChangeCalculator } from './ChangeCalculator';
import { PickupScheduler } from './PickupScheduler';
import { EmptyState } from './EmptyState';
import {
  X,
  Trash2,
  UserCheck,
  CheckCircle2,
  CreditCard,
  QrCode,
  Banknote,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  vendedores: Vendedor[];
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onCheckout: (orderData: {
    cliente_nome: string;
    cliente_telefone: string;
    cliente_cpf: string;
    vendedor_id: string;
    vendedor_nome: string;
    forma_pagamento: PaymentMethod;
    troco_para: number | null;
    valor_troco: number | null;
    data_retirada: string;
    hora_retirada: string;
  }) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  vendedores,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  // Form fields
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteCpf, setClienteCpf] = useState('');
  const [selectedVendedorId, setSelectedVendedorId] = useState(vendedores[0]?.id || '');
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>('pix');
  const [trocoPara, setTrocoPara] = useState<number | null>(null);
  const [valorTroco, setValorTroco] = useState<number | null>(null);

  // Tomorrow as default pickup date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const [dataRetirada, setDataRetirada] = useState(defaultDate);
  const [horaRetirada, setHoraRetirada] = useState('10:30');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const total = items.reduce((acc, it) => acc + it.subtotal, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteNome.trim()) {
      setFormError('Por favor, informe seu nome completo.');
      return;
    }
    if (!clienteTelefone.trim() || clienteTelefone.length < 8) {
      setFormError('Informe um número de WhatsApp válido com DDD (ex: 68 99244-1234).');
      return;
    }
    if (formaPagamento === 'dinheiro' && trocoPara !== null && trocoPara < total) {
      setFormError('O valor para troco informado é menor que o total do pedido.');
      return;
    }

    setFormError(null);

    const vendedorObj = vendedores.find((v) => v.id === selectedVendedorId);
    const vendedorNome = vendedorObj
      ? `${vendedorObj.nome} (${vendedorObj.codigo})`
      : 'Atendimento Central Papelaria Globo';

    onCheckout({
      cliente_nome: clienteNome.trim(),
      cliente_telefone: clienteTelefone.trim(),
      cliente_cpf: clienteCpf.trim(),
      vendedor_id: selectedVendedorId,
      vendedor_nome: vendedorNome,
      forma_pagamento: formaPagamento,
      troco_para: formaPagamento === 'dinheiro' ? trocoPara : null,
      valor_troco: formaPagamento === 'dinheiro' ? valorTroco : null,
      data_retirada: dataRetirada,
      hora_retirada: horaRetirada,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="bg-[#0D3B8E] text-white p-4 flex items-center justify-between border-b-4 border-[#FFC700]">
          <div className="flex items-center gap-2">
            <span className="bg-[#FFC700] text-[#0D3B8E] text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              Carrinho kitGlobo
            </span>
            <span className="text-xs text-white/90 font-bold">({items.length} itens)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar carrinho"
          >
            <X className="w-5 h-5 text-[#FFC700]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-slate-800">
          {items.length === 0 ? (
            <EmptyState
              type="empty-cart"
              title="Seu carrinho está vazio"
              description="Escolha a escola do seu filho e selecione a série para ver o kit com todos os materiais recomendados para 2027."
              actionText="Ver Escolas de Rio Branco"
              onAction={onClose}
            />
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Kits Selecionados:
                  </h4>
                  <button
                    onClick={onClearCart}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    Esvaziar carrinho
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((it) => (
                    <div
                      key={it.cart_id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0D3B8E]">
                              {it.escola_nome}
                            </span>
                            <span className="text-[10px] bg-blue-100 text-[#0D3B8E] font-bold px-1.5 py-0.5 rounded">
                              {it.turno}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-800 mt-0.5">
                            {it.serie} · Aluno(a):{' '}
                            <strong className="text-slate-900">{it.aluno_nome}</strong>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Kit fechado com {it.itens_obrigatorios.length} itens obrigatórios
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-slate-900 font-mono tabular-nums block">
                            {formatCurrency(it.subtotal)}
                          </span>
                          <button
                            onClick={() => onRemoveItem(it.cart_id)}
                            className="text-slate-400 hover:text-rose-600 p-1 mt-1 transition-colors"
                            title="Remover kit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Extra Items Breakdown */}
                      {it.itens_extras_selecionados.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                          <span className="font-bold text-slate-700 block">Itens adicionais incluídos:</span>
                          {it.itens_extras_selecionados.map((ext, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                              <span>+ {ext.quantidade}x {ext.item.nome}</span>
                              <span className="font-mono text-slate-700">
                                {formatCurrency(ext.item.preco * ext.quantidade)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form & Checkout Options */}
              <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                {/* 1. Customer Information */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#0D3B8E]" />
                    Dados do Responsável para Contato:
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nome Completo do Responsável: *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Maria das Graças Souza"
                        value={clienteNome}
                        onChange={(e) => setClienteNome(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          WhatsApp / Telefone: *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="(68) 99244-1234"
                          value={clienteTelefone}
                          onChange={(e) => setClienteTelefone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          CPF (opcional para nota):
                        </label>
                        <input
                          type="text"
                          placeholder="000.000.000-00"
                          value={clienteCpf}
                          onChange={(e) => setClienteCpf(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Salesperson Selector (10 Vendedores Oficiais) */}
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Vendedor(a) Responsável pelo seu Atendimento:
                    </label>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                      Comissão e Suporte
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Se você foi indicado ou está sendo atendido por um de nossos 10 consultores da Papelaria Globo, selecione abaixo:
                  </p>

                  <select
                    value={selectedVendedorId}
                    onChange={(e) => setSelectedVendedorId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]"
                  >
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.codigo} - {v.nome} ({v.unidade})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Pickup Scheduler */}
                <PickupScheduler
                  selectedDate={dataRetirada}
                  selectedTime={horaRetirada}
                  onSelectDate={setDataRetirada}
                  onSelectTime={setHoraRetirada}
                />

                {/* 4. Payment Method & Change Simulator */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                    Forma de Pagamento na Papelaria Globo:
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('pix')}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 text-xs ${
                        formaPagamento === 'pix'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>PIX</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormaPagamento('dinheiro')}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 text-xs ${
                        formaPagamento === 'dinheiro'
                          ? 'bg-amber-50 border-amber-500 text-amber-800 font-bold ring-2 ring-amber-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-amber-600" />
                      <span>Dinheiro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormaPagamento('cartao_presencial')}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 text-xs ${
                        formaPagamento === 'cartao_presencial'
                          ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>Cartão Balcão</span>
                    </button>
                  </div>

                  {/* Dynamic payment view */}
                  {formaPagamento === 'dinheiro' && (
                    <ChangeCalculator
                      total={total}
                      trocoPara={trocoPara}
                      onTrocoChange={(para, troco) => {
                        setTrocoPara(para);
                        setValorTroco(troco);
                      }}
                    />
                  )}

                  {formaPagamento === 'pix' && (
                    <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Chave PIX Oficial Papelaria Globo:</span>
                      </div>
                      <div className="font-mono font-bold bg-white p-2 rounded-lg border border-emerald-200 text-center select-all">
                        financeiro@papelariaglobo.com.br
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        Você também poderá escanear o QR Code impresso no comprovante ou pagar diretamente no balcão no ato da retirada.
                      </p>
                    </div>
                  )}

                  {formaPagamento === 'cartao_presencial' && (
                    <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 space-y-1">
                      <span className="font-bold block">Parcelamento no Balcão:</span>
                      <p className="text-[11px] text-blue-800">
                        Aceitamos todas as bandeiras (Visa, Mastercard, Elo, Hipercard). Parcelamento em até 6x sem juros para listas escolares 2027.
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Error Banner */}
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Sticky Action Footer */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">Subtotal:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className="font-black text-slate-900">Total a Pagar na Retirada:</span>
                    <span className="text-2xl font-black text-[#D92323] font-mono tabular-nums">
                      {formatCurrency(total)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-black text-[#0D3B8E] bg-[#FFC700] hover:bg-[#E5B300] border-2 border-[#FFC700] rounded-2xl shadow-xl transition-transform active:scale-98 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#D92323]" />
                    <span>Finalizar Pedido e Agendar Retirada</span>
                    <ArrowRight className="w-4 h-4 text-[#0D3B8E]" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

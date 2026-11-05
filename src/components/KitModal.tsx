import React, { useState, useMemo } from 'react';
import { Escola, Turma, Kit, ItemExtra, CartItem } from '../types';
import { formatCurrency } from '../services/pdfGenerator';
import {
  X,
  Check,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  PackageCheck,
  User,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { EmptyState } from './EmptyState';

interface KitModalProps {
  escola: Escola;
  turmas: Turma[];
  kits: Kit[];
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const KitModal: React.FC<KitModalProps> = ({
  escola,
  turmas,
  kits,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>(
    turmas[0]?.id || ''
  );
  const [alunoNome, setAlunoNome] = useState<string>('');
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  const [alunoError, setAlunoError] = useState<boolean>(false);
  const [turmaSearch, setTurmaSearch] = useState<string>('');

  // Filter turmas by search query
  const filteredTurmas = useMemo(() => {
    if (!turmaSearch.trim()) return turmas;
    const term = turmaSearch.toLowerCase().trim();
    return turmas.filter(
      (t) =>
        t.serie.toLowerCase().includes(term) ||
        t.turno.toLowerCase().includes(term) ||
        t.id.toLowerCase().includes(term)
    );
  }, [turmas, turmaSearch]);

  // Synchronize initial turma if changed
  React.useEffect(() => {
    if (turmas.length > 0 && (!selectedTurmaId || !turmas.some((t) => t.id === selectedTurmaId))) {
      setSelectedTurmaId(turmas[0].id);
    }
  }, [turmas, selectedTurmaId]);

  const activeTurma = useMemo(
    () => turmas.find((t) => t.id === selectedTurmaId),
    [turmas, selectedTurmaId]
  );

  const activeKit = useMemo(
    () => kits.find((k) => k.turma_id === selectedTurmaId),
    [kits, selectedTurmaId]
  );

  // Compute live total
  const extrasTotal = useMemo(() => {
    if (!activeKit) return 0;
    return activeKit.itens_extras_json.reduce((acc, extra) => {
      const qty = selectedExtras[extra.id] || 0;
      return acc + extra.preco * qty;
    }, 0);
  }, [activeKit, selectedExtras]);

  const kitBasePrice = activeKit?.preco || 0;
  const grandTotal = kitBasePrice + extrasTotal;

  if (!isOpen) return null;

  const handleToggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => {
      const current = prev[extraId] || 0;
      if (current > 0) {
        const copy = { ...prev };
        delete copy[extraId];
        return copy;
      }
      return { ...prev, [extraId]: 1 };
    });
  };

  const handleExtraQuantity = (extraId: string, delta: number) => {
    setSelectedExtras((prev) => {
      const current = prev[extraId] || 0;
      const next = Math.max(1, current + delta);
      return { ...prev, [extraId]: next };
    });
  };

  const handleAddOrder = () => {
    if (!activeKit || !activeTurma) return;
    if (!alunoNome.trim()) {
      setAlunoError(true);
      return;
    }

    const extrasFormatted = activeKit.itens_extras_json
      .filter((ext) => (selectedExtras[ext.id] || 0) > 0)
      .map((ext) => ({
        item: ext,
        quantidade: selectedExtras[ext.id],
      }));

    const cartItem: CartItem = {
      cart_id: `cart-${Date.now().toString(36)}`,
      kit_id: activeKit.id,
      escola_id: escola.id,
      escola_nome: escola.nome,
      turma_id: activeTurma.id,
      serie: activeTurma.serie,
      turno: activeTurma.turno,
      aluno_nome: alunoNome.trim(),
      preco_base_kit: activeKit.preco,
      itens_obrigatorios: activeKit.itens_json,
      itens_extras_selecionados: extrasFormatted,
      subtotal: grandTotal,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-[#0D3B8E] text-white p-5 border-b-4 border-[#FFC700] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5 text-[#FFC700]" />
          </button>

          <div className="flex items-center gap-2 text-xs text-[#FFC700] font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-[#FFC700]" />
            <span>kitGlobo Oficial 2027 · Rio Branco - AC</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">{escola.nome}</h2>
          <p className="text-xs text-blue-100 mt-0.5">{escola.endereco} · {escola.bairro}</p>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Turma / Série Selector with Search Bar */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-black text-[#0D3B8E] uppercase tracking-wide">
                1. Selecione a Série / Turma ({filteredTurmas.length} {filteredTurmas.length === 1 ? 'disponível' : 'disponíveis'}):
              </label>

              {/* Search input for series or class */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-[#0D3B8E] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar série (ex: 1º Ano, Infantil, Médio)..."
                  value={turmaSearch}
                  onChange={(e) => setTurmaSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0D3B8E] focus:ring-2 focus:ring-[#FFC700]"
                />
                {turmaSearch && (
                  <button
                    type="button"
                    onClick={() => setTurmaSearch('')}
                    className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
                    title="Limpar busca de turma"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Grid of classes or empty search feedback */}
            {filteredTurmas.length === 0 ? (
              <div className="p-4 rounded-2xl border-2 border-dashed border-[#0D3B8E]/20 bg-slate-50 text-center">
                <p className="text-xs text-slate-600 font-medium">
                  Nenhuma turma encontrada com o termo "<strong>{turmaSearch}</strong>".
                </p>
                <button
                  type="button"
                  onClick={() => setTurmaSearch('')}
                  className="mt-2 text-xs font-black text-[#0D3B8E] hover:underline cursor-pointer"
                >
                  Limpar busca e ver todas as turmas
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1">
                {filteredTurmas.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTurmaId(t.id);
                      setSelectedExtras({});
                    }}
                    className={`p-3 rounded-xl text-left border-2 text-xs transition-all cursor-pointer ${
                      selectedTurmaId === t.id
                        ? 'bg-blue-50/90 border-[#0D3B8E] text-[#0D3B8E] font-black ring-2 ring-[#FFC700] shadow-sm'
                        : 'bg-white border-slate-200 hover:border-[#FFC700] text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-slate-900">{t.serie}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Turno: {t.turno}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Student Identification Input */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border-2 border-[#0D3B8E]/15">
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#0D3B8E]">
              <User className="w-4 h-4 text-[#0D3B8E]" />
              Nome Completo do Aluno (para etiquetagem do Kit na Papelaria Globo):
            </label>
            <input
              type="text"
              placeholder="Ex: Gabriel Silveira da Silva"
              value={alunoNome}
              onChange={(e) => {
                setAlunoNome(e.target.value);
                if (alunoError) setAlunoError(false);
              }}
              className={`w-full px-3.5 py-2.5 text-xs bg-white border-2 rounded-xl font-semibold focus:outline-none focus:ring-2 ${
                alunoError
                  ? 'border-[#D92323] focus:ring-[#D92323] text-[#D92323]'
                  : 'border-slate-300 focus:border-[#0D3B8E] focus:ring-[#FFC700] text-slate-900'
              }`}
            />
            {alunoError && (
              <p className="flex items-center gap-1 text-[11px] font-bold text-[#D92323] mt-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Por favor, informe o nome do aluno antes de adicionar o kit.
              </p>
            )}
          </div>

          {/* Kit Details or Empty State */}
          {!activeKit ? (
            <EmptyState
              type="no-kits"
              title="Kit em fase de homologação"
              description="A lista oficial de materiais desta turma está sendo revisada pelos nossos consultores educacionais da Papelaria Globo. Entre em contato pelo WhatsApp (68) 99282-7744 para priorizar sua lista."
              actionText="Chamar no WhatsApp"
              onAction={() => window.open('https://api.whatsapp.com/send?phone=556892827744', '_blank')}
            />
          ) : (
            <div className="space-y-6">
              {/* Closed Kit Banner with #0D3B8E and #FFC700 border */}
              <div className="bg-gradient-to-r from-[#09265E] via-[#0D3B8E] to-[#09265E] text-white p-4.5 rounded-2xl shadow-md border-2 border-[#FFC700] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-[#FFC700] text-[#0D3B8E] px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mb-1.5 shadow-xs">
                    <PackageCheck className="w-3.5 h-3.5" />
                    Produto Fechado · Lista Completa 2027
                  </div>
                  <h4 className="text-base font-black text-white">
                    kitGlobo {activeTurma?.serie}
                  </h4>
                  <p className="text-xs text-blue-100">
                    Contém todos os {activeKit.itens_json.length} itens obrigatórios solicitados pelo colégio.
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[11px] text-blue-200 block">Preço do Kit Fechado</span>
                  <span className="text-2xl font-black text-[#FFC700] font-mono tabular-nums">
                    {formatCurrency(activeKit.preco)}
                  </span>
                </div>
              </div>

              {/* Mandatory Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-[#0D3B8E] uppercase tracking-wide">
                    Itens Obrigatórios Inclusos no Pacote Selado:
                  </h5>
                  <span className="text-xs font-bold text-[#0D3B8E] bg-[#FFC700]/25 px-2.5 py-0.5 rounded-full border border-[#FFC700]">
                    {activeKit.itens_json.length} itens inclusos
                  </span>
                </div>

                <div className="border-2 border-[#0D3B8E]/15 rounded-2xl divide-y divide-slate-100 max-h-56 overflow-y-auto text-xs bg-white">
                  {activeKit.itens_json.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 flex items-center justify-between gap-3 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-[#FFC700] text-[#0D3B8E] flex items-center justify-center shrink-0 font-black">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">{item.nome}</span>
                          {item.marca_sugerida && (
                            <span className="text-slate-500 text-[11px] ml-1.5">
                              · Marca: <strong className="text-slate-700">{item.marca_sugerida}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-[#0D3B8E] shrink-0 font-bold bg-[#0D3B8E]/10 px-2 py-0.5 rounded text-[11px]">
                        {item.quantidade} {item.unidade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Extra Items */}
              {activeKit.itens_extras_json && activeKit.itens_extras_json.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-[#0D3B8E] uppercase tracking-wide">
                        Itens Adicionais e Acessórios Opcionais:
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        Marque se desejar incluir mochila, estojo ou materiais de reforço:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeKit.itens_extras_json.map((extra) => {
                      const isSelected = (selectedExtras[extra.id] || 0) > 0;
                      const qty = selectedExtras[extra.id] || 1;

                      return (
                        <div
                          key={extra.id}
                          className={`p-3 rounded-2xl border-2 text-xs transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-50/80 border-[#FFC700] ring-1 ring-[#FFC700]'
                              : 'bg-white border-slate-200 hover:border-[#FFC700]/70'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900 leading-snug">
                                {extra.nome}
                              </span>
                              <span className="font-black text-[#D92323] whitespace-nowrap font-mono tabular-nums">
                                {formatCurrency(extra.preco)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                              {extra.descricao}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleToggleExtra(extra.id)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-black transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#FFC700] text-[#0D3B8E] shadow-xs'
                                  : 'bg-slate-100 hover:bg-[#FFC700]/30 text-slate-700'
                              }`}
                            >
                              {isSelected ? '✓ Adicionado' : '+ Adicionar'}
                            </button>

                            {isSelected && (
                              <div className="flex items-center gap-1.5 bg-white border border-[#FFC700] rounded-lg px-1.5 py-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleExtraQuantity(extra.id, -1)}
                                  className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-black font-mono text-xs px-1 text-[#0D3B8E]">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleExtraQuantity(extra.id, 1)}
                                  className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Sticky Footer / CTA */}
        {activeKit && (
          <div className="p-4 bg-slate-50 border-t-2 border-[#0D3B8E]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-slate-600">Total com Extras:</span>
              <span className="text-2xl font-black text-[#D92323] font-mono tabular-nums">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleAddOrder}
                className="w-1/2 sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-black text-[#0D3B8E] bg-[#FFC700] hover:bg-[#E5B300] border border-[#FFC700] rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#0D3B8E]" />
                <span>Adicionar ao Carrinho</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

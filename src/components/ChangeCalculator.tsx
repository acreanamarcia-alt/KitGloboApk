import React, { useState, useEffect } from 'react';
import { Banknote, AlertCircle, CheckCircle2, Calculator } from 'lucide-react';
import { formatCurrency } from '../services/pdfGenerator';

interface ChangeCalculatorProps {
  total: number;
  trocoPara: number | null;
  onTrocoChange: (trocoPara: number | null, valorTroco: number | null) => void;
}

export const ChangeCalculator: React.FC<ChangeCalculatorProps> = ({
  total,
  trocoPara,
  onTrocoChange,
}) => {
  const [inputValue, setInputValue] = useState<string>(
    trocoPara ? trocoPara.toString() : ''
  );

  const parsedValue = parseFloat(inputValue.replace(',', '.')) || 0;
  const diferenca = parsedValue - total;

  useEffect(() => {
    if (parsedValue > total) {
      onTrocoChange(parsedValue, diferenca);
    } else if (parsedValue === total) {
      onTrocoChange(parsedValue, 0);
    } else {
      onTrocoChange(null, null);
    }
  }, [parsedValue, total, diferenca, onTrocoChange]);

  const handleQuickSelect = (amount: number) => {
    setInputValue(amount.toString());
  };

  // Generate suggested banknote amounts
  const suggestedAmounts = [
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 100) * 100 + 100,
    500,
    1000,
  ].filter((amt, idx, arr) => amt >= total && arr.indexOf(amt) === idx).slice(0, 4);

  // Breakdown change into Brazilian Real banknotes & coins
  const calculateBanknotes = (change: number) => {
    if (change <= 0) return [];
    const notes = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.25, 0.1, 0.05];
    let remaining = Math.round(change * 100) / 100;
    const result: { value: number; count: number; isCoin: boolean }[] = [];

    for (const note of notes) {
      if (remaining >= note) {
        const count = Math.floor(remaining / note);
        remaining = Math.round((remaining - count * note) * 100) / 100;
        result.push({ value: note, count, isCoin: note <= 1 });
      }
    }
    return result;
  };

  const banknoteBreakdown = calculateBanknotes(diferenca);

  return (
    <div className="bg-amber-50/60 border-2 border-[#FFC700] rounded-2xl p-4 text-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-black text-[#0D3B8E]">
          <Banknote className="w-4 h-4 text-[#FFC700]" />
          <span>Simulador de Troco (Pagamento em Dinheiro)</span>
        </div>
        <span className="text-[11px] font-bold text-slate-600">
          Total a Pagar: <strong className="text-[#D92323]">{formatCurrency(total)}</strong>
        </span>
      </div>

      <p className="text-slate-600 leading-relaxed text-[11px]">
        Informe com quanto você pretende pagar no balcão da Papelaria Globo para prepararmos o seu troco antecipadamente:
      </p>

      {/* Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 font-bold text-slate-500">R$</span>
          <input
            type="number"
            step="0.01"
            min={total}
            placeholder={`Ex: ${(Math.ceil(total / 50) * 50).toFixed(2)}`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#FFC700] rounded-xl font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]"
          />
        </div>
        <button
          type="button"
          onClick={() => setInputValue(total.toFixed(2))}
          className="px-3 py-2 bg-white hover:bg-[#FFC700]/20 text-[#0D3B8E] border-2 border-[#0D3B8E]/30 rounded-xl font-bold whitespace-nowrap text-xs transition-colors cursor-pointer"
        >
          Valor Exato
        </button>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex items-center flex-wrap gap-1.5 pt-1">
        <span className="text-[10px] text-slate-500 font-bold">Sugestões rápidas:</span>
        {suggestedAmounts.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => handleQuickSelect(amt)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-colors cursor-pointer ${
              parsedValue === amt
                ? 'bg-[#0D3B8E] text-[#FFC700] border-[#0D3B8E] shadow-xs'
                : 'bg-white hover:bg-amber-100/60 text-slate-700 border-[#FFC700]'
            }`}
          >
            R$ {amt.toFixed(2)}
          </button>
        ))}
      </div>

      {/* Feedback & Result */}
      {parsedValue > 0 && (
        <div className="pt-2 border-t border-amber-200">
          {parsedValue < total ? (
            <div className="flex items-center gap-2 text-[#D92323] font-bold bg-rose-50 p-2.5 rounded-xl border border-[#D92323]/50">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D92323]" />
              <span>
                Valor informado é menor que o total do pedido. Faltam{' '}
                {formatCurrency(total - parsedValue)}.
              </span>
            </div>
          ) : parsedValue === total ? (
            <div className="flex items-center gap-2 text-[#0D3B8E] font-bold bg-blue-50 p-2.5 rounded-xl border border-[#0D3B8E]/40">
              <CheckCircle2 className="w-4 h-4 text-[#0D3B8E] shrink-0" />
              <span>Sem necessidade de troco (pagamento no valor exato).</span>
            </div>
          ) : (
            <div className="space-y-2 bg-white p-3.5 rounded-xl border-2 border-[#0D3B8E] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold">Troco calculado para você:</span>
                <span className="text-lg font-black text-[#D92323]">
                  {formatCurrency(diferenca)}
                </span>
              </div>

              {banknoteBreakdown.length > 0 && (
                <div className="pt-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Sugestão de notas/moedas preparadas no balcão:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {banknoteBreakdown.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px] font-bold border border-slate-200"
                      >
                        {item.count}x {item.isCoin ? 'moeda' : 'nota'} de R$ {item.value >= 1 ? item.value : item.value.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

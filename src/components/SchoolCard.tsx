import React from 'react';
import { Escola } from '../types';
import { MapPin, ArrowRight, GraduationCap, CheckCircle2 } from 'lucide-react';

interface SchoolCardProps {
  escola: Escola;
  turmasCount: number;
  onSelect: (escola: Escola) => void;
}

export const SchoolCard: React.FC<SchoolCardProps> = ({
  escola,
  turmasCount,
  onSelect,
}) => {
  const initials = escola.nome
    .split(' ')
    .filter((w) => w.length > 2 && !['DO', 'DA', 'DE'].includes(w.toUpperCase()))
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="group bg-white rounded-2xl border-2 border-[#0D3B8E]/15 hover:border-[#FFC700] hover:shadow-xl transition-all duration-200 p-5 flex flex-col justify-between h-[235px] relative overflow-hidden">
      {/* Top Brand Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#0D3B8E] group-hover:bg-[#FFC700] transition-colors" />

      <div>
        {/* Top Header: Logo/Badge & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Logo emblem with #0D3B8E base & #FFC700 border */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm shrink-0 select-none border-2 border-[#FFC700]/30"
              style={{ backgroundColor: escola.badge_color || '#0D3B8E' }}
            >
              {initials || <GraduationCap className="w-6 h-6 text-[#FFC700]" />}
            </div>

            <div>
              <h3 className="font-bold text-base text-[#0D3B8E] group-hover:text-[#0D3B8E] transition-colors leading-snug line-clamp-1">
                {escola.nome}
              </h3>
              <div className="flex items-center gap-1.5 text-xs mt-0.5">
                <span className="font-bold text-[#D92323] flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0D3B8E]" />
                  Lista 2027 Homologada
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Address and neighborhood info */}
        <div className="mt-3.5 space-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-[#D92323] shrink-0" />
            <span className="truncate">{escola.endereco}</span>
          </div>
          <div className="text-[11px] text-slate-500 pl-5 font-medium">
            {escola.bairro}
          </div>
        </div>
      </div>

      {/* Bottom Action Area: Prominent CTA with #FFC700 Amarelo Vibrante */}
      <div className="pt-3.5 border-t border-[#0D3B8E]/10 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600">
          <strong className="text-[#0D3B8E] font-black">{turmasCount}</strong> turmas disponíveis
        </span>

        <button
          onClick={() => onSelect(escola)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-[#0D3B8E] bg-[#FFC700] hover:bg-[#E5B300] border border-[#FFC700] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <span>Ver Kits</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#0D3B8E]" />
        </button>
      </div>
    </div>
  );
};

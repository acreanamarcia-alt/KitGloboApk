import React from 'react';
import { ShoppingCart, ShieldCheck, Phone, MapPin, Sparkles } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  isAdminOpen: boolean;
  onToggleAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  isAdminOpen,
  onToggleAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0D3B8E] text-white shadow-md border-b-4 border-[#FFC700]">
      {/* Top Delivery & City Bar */}
      <div className="bg-[#09265E] py-1.5 px-4 text-xs border-b border-white/10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: City & School Year badge */}
          <div className="flex items-center gap-2 text-slate-200">
            <span className="flex items-center gap-1 font-semibold text-[#FFC700]">
              <MapPin className="w-3.5 h-3.5 text-[#FFC700]" />
              Rio Branco - Acre
            </span>
            <span className="text-white/30">|</span>
            <span className="bg-[#D92323] text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-xs">
              Ano Letivo 2027
            </span>
            <span className="hidden sm:inline text-white/80">
              · Listas escolares oficiais das escolas particulares
            </span>
          </div>

          {/* Right: Disk Entregas & WhatsApp */}
          <div className="flex items-center gap-3 text-xs">
            {/* Yellow Disk Entregas Badge with red text */}
            <div className="flex items-center gap-1.5 bg-[#FFC700] text-[#D92323] px-2.5 py-0.5 rounded-md font-black text-[11px] shadow-xs border border-[#FFC700]">
              <Phone className="w-3.5 h-3.5 text-[#D92323]" />
              <span className="tracking-wide">DISK ENTREGAS:</span>
              <span className="text-[#0D3B8E] font-black">(68) 3302-0245 · 3026-1082</span>
            </div>

            <a
              href="https://api.whatsapp.com/send?phone=556892827744"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1 text-[#FFC700] hover:underline font-bold"
            >
              <span>WhatsApp: (68) 99282-7744</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Brand Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Identity Lockup */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col leading-none select-none">
            {/* Extruded Red "PAPELARIA" */}
            <span className="text-[#D92323] text-xs font-black tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] uppercase">
              PAPELARIA
            </span>

            {/* "GLOBO" with 3D Globe Style */}
            <div className="flex items-center gap-1 -mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter drop-shadow-md">
                GL
              </span>
              {/* Globe Icon */}
              <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-800 border-2 border-white shadow-inner flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500 rounded-full opacity-70 transform -translate-x-1.5 translate-y-1 scale-90" />
                <div className="absolute w-2.5 h-2 bg-emerald-400 rounded-full top-1 right-1" />
                <div className="absolute inset-0 border border-white/40 rounded-full" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter drop-shadow-md">
                BO
              </span>

              {/* KitGlobo Pill badge */}
              <span className="ml-2 bg-[#FFC700] text-[#0D3B8E] text-[11px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs border border-white/20">
                kitGlobo
              </span>
            </div>

            {/* Slogan */}
            <span className="text-[#FFC700] text-[9px] font-bold tracking-wider uppercase mt-0.5">
              SEMPRE NA FRENTE · DESDE 1988
            </span>
          </div>
        </div>

        {/* Center: Main Navigation Tabs (Loja vs Painel Admin) */}
        <div className="flex items-center gap-1.5 bg-[#09265E] p-1 rounded-2xl border-2 border-[#FFC700]/40 shadow-inner">
          <button
            type="button"
            onClick={() => {
              if (isAdminOpen) onToggleAdmin();
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              !isAdminOpen
                ? 'bg-[#FFC700] text-[#0D3B8E] shadow-md border border-[#FFC700]'
                : 'text-blue-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D92323]" />
            <span>Loja de Kits 2027</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isAdminOpen) onToggleAdmin();
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              isAdminOpen
                ? 'bg-[#FFC700] text-[#0D3B8E] shadow-md border border-[#FFC700]'
                : 'text-blue-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#D92323]" />
            <span>Painel Administrativo</span>
            <span className="hidden sm:inline bg-[#D92323] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Gestão
            </span>
          </button>
        </div>

        {/* Right Actions: Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cart Button: Prominent CTA with #FFC700 background & #D92323 notification badge */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-[#FFC700] hover:bg-[#E5B300] text-[#0D3B8E] px-4 py-2 rounded-xl font-black text-xs sm:text-sm shadow-md border-2 border-white/30 transition-transform active:scale-95 cursor-pointer"
            aria-label="Ver Carrinho de Compras"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-[#0D3B8E]" />
            <span className="hidden sm:inline">Meu Kit</span>
            {cartCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-[#D92323] text-white text-xs font-black rounded-full shadow-xs animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { BookOpen, ShoppingBag, Search, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-kits' | 'empty-cart' | 'no-results';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-6 rounded-3xl bg-white border-2 border-[#0D3B8E]/15 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-[#0D3B8E]/10 border-2 border-[#FFC700] flex items-center justify-center mb-4">
        {type === 'no-kits' && <BookOpen className="w-8 h-8 text-[#0D3B8E]" />}
        {type === 'empty-cart' && <ShoppingBag className="w-8 h-8 text-[#D92323]" />}
        {type === 'no-results' && <Search className="w-8 h-8 text-[#0D3B8E]" />}
      </div>
      <h3 className="text-base font-black text-[#0D3B8E] mb-1">{title}</h3>
      <p className="text-xs text-slate-600 leading-relaxed mb-5">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black text-[#0D3B8E] bg-[#FFC700] hover:bg-[#E5B300] border border-[#FFC700] rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D92323]" />
          {actionText}
        </button>
      )}
    </div>
  );
};

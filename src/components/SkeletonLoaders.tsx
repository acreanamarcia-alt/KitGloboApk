import React from 'react';

export const SchoolCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border-2 border-[#0D3B8E]/15 p-5 shadow-xs flex flex-col justify-between h-[230px] overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0D3B8E] via-[#FFC700] to-[#D92323] opacity-40" />
      <div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0D3B8E]/15 border border-[#FFC700]/40 shrink-0 globo-skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#0D3B8E]/15 rounded w-3/4 globo-skeleton" />
            <div className="h-3 bg-slate-200 rounded w-1/2 globo-skeleton" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 bg-slate-100 rounded w-full globo-skeleton" />
          <div className="h-3 bg-slate-100 rounded w-2/3 globo-skeleton" />
        </div>
      </div>
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="h-3 bg-[#0D3B8E]/20 rounded w-24 globo-skeleton" />
        <div className="h-9 bg-[#FFC700]/30 border border-[#FFC700]/50 rounded-xl w-32 globo-skeleton" />
      </div>
    </div>
  );
};

export const KitDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="h-6 bg-[#0D3B8E]/20 rounded w-1/3 globo-skeleton" />
      <div className="h-4 bg-slate-200 rounded w-1/2 globo-skeleton" />
      <div className="space-y-3 pt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#0D3B8E]/10">
            <div className="h-4 bg-slate-200 rounded w-2/3 globo-skeleton" />
            <div className="h-4 bg-[#FFC700]/30 rounded w-16 globo-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdminTableSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 bg-white rounded-xl border border-[#0D3B8E]/15 p-4 flex items-center justify-between">
          <div className="h-4 bg-[#0D3B8E]/20 rounded w-28 globo-skeleton" />
          <div className="h-4 bg-slate-200 rounded w-40 globo-skeleton" />
          <div className="h-4 bg-slate-200 rounded w-24 globo-skeleton" />
          <div className="h-6 bg-[#FFC700]/40 rounded-full w-20 border border-[#FFC700]/60 globo-skeleton" />
        </div>
      ))}
    </div>
  );
};

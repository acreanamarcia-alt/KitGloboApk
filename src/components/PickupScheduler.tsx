import React from 'react';
import { Calendar, Clock, MapPin, Store } from 'lucide-react';

interface PickupSchedulerProps {
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
}

const AVAILABLE_TIMES = [
  '08:30',
  '09:30',
  '10:30',
  '11:30',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '17:30',
];

export const PickupScheduler: React.FC<PickupSchedulerProps> = ({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}) => {
  // Quick pre-selected dates for convenience (e.g. Next business days / 2027 Back to school)
  const today = new Date();
  const getFormattedDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(today.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const quickDates = [
    { label: 'Hoje / Urgente', date: getFormattedDate(0) },
    { label: 'Amanhã', date: getFormattedDate(1) },
    { label: 'Em 2 dias', date: getFormattedDate(2) },
    { label: 'Semana que vem', date: getFormattedDate(7) },
  ];

  return (
    <div className="bg-blue-50/60 border-2 border-[#0D3B8E]/20 rounded-2xl p-4 text-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-black text-[#0D3B8E]">
          <Calendar className="w-4 h-4 text-[#0D3B8E]" />
          <span>Agendamento de Retirada Física</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-black text-[#0D3B8E] bg-[#FFC700] px-2.5 py-0.5 rounded-full border border-[#FFC700]">
          <Store className="w-3.5 h-3.5 text-[#0D3B8E]" />
          Retirada Grátis no Balcão
        </span>
      </div>

      {/* Store Address Notice */}
      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-[#0D3B8E]/20 text-slate-700">
        <MapPin className="w-4 h-4 text-[#D92323] shrink-0 mt-0.5" />
        <div className="text-[11px]">
          <strong className="text-[#0D3B8E] block font-black">Balcão Papelaria Globo - Matriz Centro</strong>
          <span className="text-slate-600">Av. Brasil, 452 - Centro, Rio Branco - AC · Horário: 08:00 às 18:00</span>
        </div>
      </div>

      {/* Date Selection */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-black text-[#0D3B8E]">
          1. Escolha a data de comparecimento:
        </label>
        
        {/* Quick Dates */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
          {quickDates.map((q) => (
            <button
              key={q.date}
              type="button"
              onClick={() => onSelectDate(q.date)}
              className={`p-2 rounded-xl text-center font-bold text-[11px] transition-colors border-2 cursor-pointer ${
                selectedDate === q.date
                  ? 'bg-[#0D3B8E] text-[#FFC700] border-[#0D3B8E] shadow-sm'
                  : 'bg-white hover:border-[#FFC700] text-slate-700 border-slate-200'
              }`}
            >
              <div className="truncate">{q.label}</div>
              <div className="text-[9px] opacity-80 mt-0.5">{q.date.split('-').reverse().join('/')}</div>
            </button>
          ))}
        </div>

        {/* Custom date input */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600 font-bold">Ou selecione no calendário:</span>
          <input
            type="date"
            value={selectedDate}
            min={getFormattedDate(0)}
            onChange={(e) => onSelectDate(e.target.value)}
            className="px-2.5 py-1.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0D3B8E] focus:ring-2 focus:ring-[#FFC700]"
          />
        </div>
      </div>

      {/* Time Slot Selection */}
      <div className="space-y-1.5 pt-1">
        <label className="flex items-center gap-1.5 text-[11px] font-black text-[#0D3B8E]">
          <Clock className="w-3.5 h-3.5 text-[#0D3B8E]" />
          2. Escolha o horário de preferência:
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {AVAILABLE_TIMES.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => onSelectTime(time)}
              className={`py-1.5 px-2 rounded-xl text-xs font-mono font-black text-center border-2 transition-all cursor-pointer ${
                selectedTime === time
                  ? 'bg-[#FFC700] text-[#0D3B8E] border-[#FFC700] shadow-sm scale-102'
                  : 'bg-white hover:border-[#FFC700]/70 text-slate-700 border-slate-200'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

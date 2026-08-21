import React from 'react';
import type { HOSSummary as HOSSummaryType } from '../../types/trip';
import { Activity, ShieldAlert, Award } from 'lucide-react';

interface HOSSummaryProps {
  summary: HOSSummaryType;
}

export const HOSSummary: React.FC<HOSSummaryProps> = ({ summary }) => {
  const limits = {
    driving_today: 11,
    duty_window_used: 14,
    cycle_used: 70,
    driving_since_break: 8
  };

  const getPercent = (value: number, max: number) => {
    return Math.min(100, Math.max(0, (value / max) * 100));
  };

  const getColorClass = (value: number, max: number) => {
    const pct = (value / max) * 100;
    if (pct >= 90) return 'bg-red-500 text-red-500 border-red-500';
    if (pct >= 75) return 'bg-amber-500 text-amber-500 border-amber-500';
    return 'bg-teal-600 text-teal-600 border-teal-600';
  };

  const getProgressStyles = (value: number, max: number) => {
    const color = getColorClass(value, max).split(' ')[0];
    const pct = getPercent(value, max);
    return {
      className: `${color} h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm`,
      style: { width: `${pct}%` }
    };
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase text-xs tracking-wider">
          <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg animate-pulse">
            <Activity className="w-4 h-4" />
          </div>
          HOS Status Counters
        </h3>
        {summary.cycle_used >= 68 ? (
          <span className="text-[10px] font-black text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> Close to Cycle Limit
          </span>
        ) : (
          <span className="text-[10px] font-black text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 animate-bounce" /> Compliant
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Driving Today */}
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-3 transition-all hover:scale-[1.02] hover:bg-white hover:shadow-sm">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Driving Today</span>
            <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{summary.driving_today}h</span>
          </div>
          <p className="text-xl font-black text-slate-800 tracking-tight">{summary.driving_today} <span className="text-xs text-slate-400 font-bold">/ 11 hrs</span></p>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div {...getProgressStyles(summary.driving_today, limits.driving_today)} />
          </div>
        </div>

        {/* Duty Window */}
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-3 transition-all hover:scale-[1.02] hover:bg-white hover:shadow-sm">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duty Window</span>
            <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{summary.duty_window_used}h</span>
          </div>
          <p className="text-xl font-black text-slate-800 tracking-tight">{summary.duty_window_used} <span className="text-xs text-slate-400 font-bold">/ 14 hrs</span></p>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div {...getProgressStyles(summary.duty_window_used, limits.duty_window_used)} />
          </div>
        </div>

        {/* Cycle Used */}
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-3 transition-all hover:scale-[1.02] hover:bg-white hover:shadow-sm">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cycle Used</span>
            <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{summary.cycle_used}h</span>
          </div>
          <p className="text-xl font-black text-slate-800 tracking-tight">{summary.cycle_used} <span className="text-xs text-slate-400 font-bold">/ 70 hrs</span></p>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div {...getProgressStyles(summary.cycle_used, limits.cycle_used)} />
          </div>
        </div>

        {/* Driving Since Break */}
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-3 transition-all hover:scale-[1.02] hover:bg-white hover:shadow-sm">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Since last Break</span>
            <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{summary.driving_since_break}h</span>
          </div>
          <p className="text-xl font-black text-slate-800 tracking-tight">{summary.driving_since_break} <span className="text-xs text-slate-400 font-bold">/ 8 hrs</span></p>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div {...getProgressStyles(summary.driving_since_break, limits.driving_since_break)} />
          </div>
        </div>
      </div>
    </div>
  );
};

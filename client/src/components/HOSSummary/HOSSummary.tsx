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
    if (pct >= 90) return 'bg-red-500 text-red-500';
    if (pct >= 75) return 'bg-amber-500 text-amber-500';
    return 'bg-teal-600 text-teal-600';
  };

  const getProgressStyles = (value: number, max: number) => {
    const color = getColorClass(value, max).split(' ')[0];
    const pct = getPercent(value, max);
    return {
      className: `${color} h-2 rounded-full transition-all duration-500`,
      style: { width: `${pct}%` }
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600 animate-pulse" />
          HOS Status Counters
        </h3>
        {summary.cycle_used >= 68 ? (
          <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Close to Cycle Limit
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Compliant
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Driving Today */}
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Driving Today</span>
            <span className="text-xs font-bold text-slate-700">{summary.driving_today}h</span>
          </div>
          <p className="text-lg font-black text-slate-800">{summary.driving_today} / 11 hrs</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div {...getProgressStyles(summary.driving_today, limits.driving_today)} />
          </div>
        </div>

        {/* Duty Window */}
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Duty Window</span>
            <span className="text-xs font-bold text-slate-700">{summary.duty_window_used}h</span>
          </div>
          <p className="text-lg font-black text-slate-800">{summary.duty_window_used} / 14 hrs</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div {...getProgressStyles(summary.duty_window_used, limits.duty_window_used)} />
          </div>
        </div>

        {/* Cycle Used */}
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cycle Used</span>
            <span className="text-xs font-bold text-slate-700">{summary.cycle_used}h</span>
          </div>
          <p className="text-lg font-black text-slate-800">{summary.cycle_used} / 70 hrs</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div {...getProgressStyles(summary.cycle_used, limits.cycle_used)} />
          </div>
        </div>

        {/* Driving Since Break */}
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Since last Break</span>
            <span className="text-xs font-bold text-slate-700">{summary.driving_since_break}h</span>
          </div>
          <p className="text-lg font-black text-slate-800">{summary.driving_since_break} / 8 hrs</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div {...getProgressStyles(summary.driving_since_break, limits.driving_since_break)} />
          </div>
        </div>
      </div>
    </div>
  );
};

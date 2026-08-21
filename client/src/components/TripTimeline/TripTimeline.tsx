import React from 'react';
import type { TripEvent } from '../../types/trip';
import { Truck, Moon, Coffee, Flame, ArrowUpCircle, ArrowDownCircle, Calendar, HelpCircle } from 'lucide-react';

interface TripTimelineProps {
  events: TripEvent[];
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ events }) => {
  const getLocalDateStr = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const groupedEvents: { [key: string]: TripEvent[] } = {};
  events.forEach(evt => {
    const dayStr = getLocalDateStr(evt.start_time);
    if (!groupedEvents[dayStr]) {
      groupedEvents[dayStr] = [];
    }
    groupedEvents[dayStr].push(evt);
  });

  const getEventIcon = (type: TripEvent['type']) => {
    const sizeClass = "w-4 h-4";
    switch (type) {
      case 'DRIVING':
        return <Truck className={`${sizeClass} text-teal-600`} />;
      case 'REST':
        return <Moon className={`${sizeClass} text-blue-600`} />;
      case 'BREAK':
        return <Coffee className={`${sizeClass} text-amber-600`} />;
      case 'FUEL':
      case 'FUEL_BREAK':
        return <Flame className={`${sizeClass} text-orange-600`} />;
      case 'PICKUP':
        return <ArrowUpCircle className={`${sizeClass} text-emerald-600`} />;
      case 'DROPOFF':
        return <ArrowDownCircle className={`${sizeClass} text-indigo-600`} />;
      default:
        return <HelpCircle className={`${sizeClass} text-slate-500`} />;
    }
  };

  const getEventBadgeColor = (type: TripEvent['type']) => {
    switch (type) {
      case 'DRIVING':
        return 'bg-teal-50/60 border-teal-100/70 text-teal-850';
      case 'REST':
        return 'bg-blue-50/60 border-blue-100/70 text-blue-850';
      case 'BREAK':
        return 'bg-amber-50/60 border-amber-100/70 text-amber-850';
      case 'FUEL':
      case 'FUEL_BREAK':
        return 'bg-orange-50/60 border-orange-100/70 text-orange-850';
      case 'PICKUP':
        return 'bg-emerald-50/60 border-emerald-100/70 text-emerald-850';
      case 'DROPOFF':
        return 'bg-indigo-50/60 border-indigo-100/70 text-indigo-850';
      default:
        return 'bg-slate-50 border-slate-100 text-slate-800';
    }
  };

  const formatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 hover:shadow-md transition-shadow">
      <h3 className="font-bold text-slate-800 flex items-center gap-2 pb-4 border-b border-slate-100 uppercase text-xs tracking-wider">
        <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
          <Calendar className="w-4 h-4" />
        </div>
        Trip Timeline
      </h3>

      <div className="space-y-8 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
        {Object.entries(groupedEvents).map(([dateStr, dayEvents], dayIdx) => (
          <div key={dateStr} className="space-y-5">
            {/* Day Header */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black bg-teal-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                DAY {dayIdx + 1}
              </span>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">{dateStr}</h4>
            </div>

            {/* Event Timeline list */}
            <div className="relative border-l-2 border-slate-150 ml-[18px] pl-6 space-y-6">
              {dayEvents.map((evt, evtIdx) => {
                const isDriving = evt.type === 'DRIVING';
                const isCombined = evt.type === 'FUEL_BREAK';
                
                return (
                  <div key={`${evt.type}-${evtIdx}`} className="relative group">
                    
                    {/* Circle icon marker on the timeline line */}
                    <div className="absolute -left-[38px] top-1 bg-white border-2 border-slate-200 group-hover:border-teal-500 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors z-10">
                      {getEventIcon(evt.type)}
                    </div>

                    {/* Event Detail Card */}
                    <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all hover:translate-x-0.5 ${getEventBadgeColor(evt.type)}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs uppercase tracking-wider">
                            {isCombined ? 'FUEL & BREAK' : evt.type.replace('_', ' ')}
                          </span>
                          {evt.reason && (
                            <span className="text-[9px] bg-white/80 border border-slate-200/50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-slate-600">
                              {evt.reason}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] opacity-75 font-bold">
                          {formatTime(evt.start_time)} — {formatTime(evt.end_time)} ({evt.duration_hours} hr{evt.duration_hours > 1 ? 's' : ''})
                        </p>
                      </div>

                      {/* Mileage Info */}
                      <div className="text-left sm:text-right shrink-0">
                        {isDriving ? (
                          <div className="text-xs font-black text-slate-800">
                            <p>{Math.round(evt.end_distance_miles - evt.start_distance_miles)} miles</p>
                            <p className="text-[9px] opacity-75 font-semibold">
                              ({Math.round(evt.start_distance_miles)} to {Math.round(evt.end_distance_miles)} mi)
                            </p>
                          </div>
                        ) : (
                          <span className="text-[9px] opacity-70 font-black uppercase tracking-wider bg-white/40 border border-black/5 px-2 py-0.5 rounded-full">
                            Stopped at {Math.round(evt.start_distance_miles)} mi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

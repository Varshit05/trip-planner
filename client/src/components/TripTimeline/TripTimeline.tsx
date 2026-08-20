import React from 'react';
import type { TripEvent } from '../../types/trip';
import { Truck, Moon, Coffee, Flame, ArrowUpCircle, ArrowDownCircle, Calendar, HelpCircle } from 'lucide-react';

interface TripTimelineProps {
  events: TripEvent[];
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ events }) => {
  // Group events by local date string
  const getLocalDateStr = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Group events by day
  const groupedEvents: { [key: string]: TripEvent[] } = {};
  events.forEach(evt => {
    const dayStr = getLocalDateStr(evt.start_time);
    if (!groupedEvents[dayStr]) {
      groupedEvents[dayStr] = [];
    }
    groupedEvents[dayStr].push(evt);
  });

  const getEventIcon = (type: TripEvent['type']) => {
    const sizeClass = "w-4.5 h-4.5";
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
        return 'bg-teal-50 border-teal-100 text-teal-800';
      case 'REST':
        return 'bg-blue-50 border-blue-100 text-blue-800';
      case 'BREAK':
        return 'bg-amber-50 border-amber-100 text-amber-800';
      case 'FUEL':
      case 'FUEL_BREAK':
        return 'bg-orange-50 border-orange-100 text-orange-800';
      case 'PICKUP':
        return 'bg-emerald-50 border-emerald-100 text-emerald-800';
      case 'DROPOFF':
        return 'bg-indigo-50 border-indigo-100 text-indigo-800';
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2 pb-4 border-b border-slate-100">
        <Calendar className="w-5 h-5 text-teal-600" />
        Trip Timeline
      </h3>

      <div className="space-y-8 max-h-[700px] overflow-y-auto pr-2">
        {Object.entries(groupedEvents).map(([dateStr, dayEvents], dayIdx) => (
          <div key={dateStr} className="space-y-4">
            {/* Day Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-teal-600 text-white px-2 py-0.5 rounded-md">
                DAY {dayIdx + 1}
              </span>
              <h4 className="text-sm font-bold text-slate-700">{dateStr}</h4>
            </div>

            {/* Event Timeline list */}
            <div className="relative border-l-2 border-slate-100 ml-4.5 pl-6 space-y-5">
              {dayEvents.map((evt, evtIdx) => {
                const isDriving = evt.type === 'DRIVING';
                const isCombined = evt.type === 'FUEL_BREAK';
                
                return (
                  <div key={`${evt.type}-${evtIdx}`} className="relative">
                    {/* Circle icon marker on the timeline line */}
                    <div className="absolute -left-10 top-0.5 bg-white border-2 border-slate-200 w-7 h-7 rounded-full flex items-center justify-center shadow-sm">
                      {getEventIcon(evt.type)}
                    </div>

                    {/* Event Detail Card */}
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${getEventBadgeColor(evt.type)}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">
                            {isCombined ? 'FUEL & BREAK' : evt.type}
                          </span>
                          {evt.reason && (
                            <span className="text-[10px] bg-white/60 border border-current/10 px-1.5 py-0.5 rounded">
                              {evt.reason}
                            </span>
                          )}
                        </div>
                        <p className="text-xs opacity-75 font-semibold">
                          {formatTime(evt.start_time)} — {formatTime(evt.end_time)} ({evt.duration_hours} hr{evt.duration_hours > 1 ? 's' : ''})
                        </p>
                      </div>

                      {/* Mileage Info */}
                      <div className="text-right">
                        {isDriving ? (
                          <div className="text-xs font-black">
                            <p>{Math.round(evt.end_distance_miles - evt.start_distance_miles)} miles</p>
                            <p className="text-[10px] opacity-75 font-semibold">
                              ({Math.round(evt.start_distance_miles)} to {Math.round(evt.end_distance_miles)} mi)
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] opacity-60 font-semibold italic">
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

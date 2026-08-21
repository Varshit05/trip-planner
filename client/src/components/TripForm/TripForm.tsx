import React, { useState } from 'react';
import type { PlanTripParams } from '../../services/api';
import { Clock, Navigation, MapPin, Sliders, Play } from 'lucide-react';

interface TripFormProps {
  onSubmit: (params: PlanTripParams) => void;
  loading: boolean;
}

export const TripForm: React.FC<TripFormProps> = ({ onSubmit, loading }) => {
  const [currentLocation, setCurrentLocation] = useState('Chicago, IL');
  const [pickupLocation, setPickupLocation] = useState('Dallas, TX');
  const [dropoffLocation, setDropoffLocation] = useState('Phoenix, AZ');
  const [cycleUsed, setCycleUsed] = useState<number>(20.0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced driver state
  const [tripStart, setTripStart] = useState(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [drivingSinceBreak, setDrivingSinceBreak] = useState<number>(0.0);
  const [dutyWindowUsed, setDutyWindowUsed] = useState<number>(0.0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocation || !pickupLocation || !dropoffLocation) return;

    const tripStartISO = new Date(tripStart).toISOString();

    onSubmit({
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      cycle_used_hours: Number(cycleUsed),
      trip_start: tripStartISO,
      driving_since_break_hours: Number(drivingSinceBreak),
      duty_window_used_hours: Number(dutyWindowUsed)
    });
  };

  const loadDemo = () => {
    setCurrentLocation('Chicago, IL');
    setPickupLocation('Dallas, TX');
    setDropoffLocation('Phoenix, AZ');
    setCycleUsed(20);
    setDrivingSinceBreak(0);
    setDutyWindowUsed(0);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 md:p-8 space-y-6 transition-all hover:shadow-2xl hover:shadow-slate-100/80">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 tracking-tight">
          <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
            <Navigation className="w-4 h-4" />
          </div>
          Route Settings
        </h2>
        <button
          type="button"
          onClick={loadDemo}
          className="text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3.5 py-1.5 rounded-xl transition-all hover:scale-[1.02]"
        >
          Load Demo Route
        </button>
      </div>

      {/* Stacked locations with vertical connector line */}
      <div className="relative pl-7 pr-1 space-y-6">
        
        {/* Visual dashed route line */}
        <div className="absolute left-[11px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-slate-200 z-0" />

        {/* Current Location */}
        <div className="relative z-10">
          <div className="absolute -left-[23px] top-9 w-3 h-3 rounded-full bg-slate-400 ring-4 ring-slate-100 flex items-center justify-center shrink-0" />
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Current Location
          </label>
          <input
            type="text"
            value={currentLocation}
            onChange={(e) => setCurrentLocation(e.target.value)}
            placeholder="e.g. Chicago, IL"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all font-semibold text-sm shadow-sm"
          />
        </div>

        {/* Pickup Location */}
        <div className="relative z-10">
          <div className="absolute -left-[23px] top-9 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-teal-100/50 flex items-center justify-center shrink-0" />
          <label className="block text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-500" />
            Pickup Location
          </label>
          <input
            type="text"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            placeholder="e.g. Dallas, TX"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all font-semibold text-sm shadow-sm"
          />
        </div>

        {/* Dropoff Location */}
        <div className="relative z-10">
          <div className="absolute -left-[23px] top-9 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-100 flex items-center justify-center shrink-0" />
          <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            Dropoff Location
          </label>
          <input
            type="text"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
            placeholder="e.g. Phoenix, AZ"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all font-semibold text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {/* Current Cycle Used */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Current Cycle Used
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              max="70"
              value={cycleUsed}
              onChange={(e) => setCycleUsed(Math.max(0, Math.min(70, Number(e.target.value))))}
              required
              className="w-full pl-4 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all font-black text-sm shadow-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-[10px] font-black uppercase tracking-wider">
              / 70.0 hrs
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
            Enter the driving/on-duty hours already logged in the current 8-day cycle.
          </p>
        </div>
      </div>

      {/* Advanced Driver Status Toggle */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-wider"
        >
          <Sliders className="w-3.5 h-3.5" />
          {showAdvanced ? 'Hide Advanced Status' : 'Show Advanced Driver Status'}
        </button>

        {showAdvanced && (
          <div className="mt-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 animate-fadeIn">
            {/* Trip Start */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Trip Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={tripStart}
                onChange={(e) => setTripStart(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Driving Since Last Break */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                  Driving Since Break
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="8"
                    value={drivingSinceBreak}
                    onChange={(e) => setDrivingSinceBreak(Math.max(0, Math.min(8, Number(e.target.value))))}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-black text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[9px] text-slate-400 font-bold uppercase">hrs</span>
                </div>
              </div>

              {/* Duty Window Used */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                  Duty Window Used
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={dutyWindowUsed}
                    onChange={(e) => setDutyWindowUsed(Math.max(0, Math.min(14, Number(e.target.value))))}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-black text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[9px] text-slate-400 font-bold uppercase">hrs</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-4 px-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
          loading
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-[0.98] shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-500/30'
        }`}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            Generate Trip Plan
          </>
        )}
      </button>
    </form>
  );
};

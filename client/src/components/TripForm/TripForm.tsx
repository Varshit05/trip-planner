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
    // Format to yyyy-MM-ddThh:mm suitable for datetime-local input
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  });
  const [drivingSinceBreak, setDrivingSinceBreak] = useState<number>(0.0);
  const [dutyWindowUsed, setDutyWindowUsed] = useState<number>(0.0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocation || !pickupLocation || !dropoffLocation) return;

    // Convert datetime-local to standard ISO
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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-teal-600" />
          Route Settings
        </h2>
        <button
          type="button"
          onClick={loadDemo}
          className="text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          Load Demo Route
        </button>
      </div>

      <div className="space-y-4">
        {/* Current Location */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Current Location
          </label>
          <input
            type="text"
            value={currentLocation}
            onChange={(e) => setCurrentLocation(e.target.value)}
            placeholder="e.g. Chicago, IL"
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-sm"
          />
        </div>

        {/* Pickup Location */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-500" />
            Pickup Location
          </label>
          <input
            type="text"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            placeholder="e.g. Dallas, TX"
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-sm"
          />
        </div>

        {/* Dropoff Location */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            Dropoff Location
          </label>
          <input
            type="text"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
            placeholder="e.g. Phoenix, AZ"
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-sm"
          />
        </div>

        {/* Current Cycle Used */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Current Cycle Used (Hours)
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
              className="w-full pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold text-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">
              / 70.0 hrs
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-normal">
            Enter the number of on-duty/driving hours already logged in the current 8-day cycle.
          </p>
        </div>
      </div>

      {/* Advanced Driver Status Toggle */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          {showAdvanced ? 'Hide Advanced Status' : 'Show Advanced Driver Status'}
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-4 animate-fadeIn">
            {/* Trip Start */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Trip Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={tripStart}
                onChange={(e) => setTripStart(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Driving Since Last Break */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Driving Since Last Break
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
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 font-semibold">hrs</span>
                </div>
              </div>

              {/* Duty Window Used */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
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
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 font-semibold">hrs</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
          loading
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-teal-600 hover:bg-teal-500 active:scale-[0.98] shadow-lg shadow-teal-600/15 hover:shadow-teal-600/25'
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

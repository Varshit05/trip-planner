import React from 'react';
import type { TripPlanResponse } from '../../types/trip';
import { FileText, Printer, Edit3, Building, Truck, FileCheck } from 'lucide-react';

interface ELDLogProps {
  plan: TripPlanResponse;
}

export const ELDLog: React.FC<ELDLogProps> = ({ plan }) => {
  const [activeDayIdx, setActiveDayIdx] = React.useState(0);

  // Editable log book fields
  const [carrier, setCarrier] = React.useState('Apex Logistics LLC');
  const [officeAddress, setOfficeAddress] = React.useState('123 Main St, Chicago, IL');
  const [homeTerminalAddress, setHomeTerminalAddress] = React.useState('456 Terminal Rd, Dallas, TX');
  const [vehicleNumbers, setVehicleNumbers] = React.useState('TRK-102 / TR-405');
  const [manifestNumber, setManifestNumber] = React.useState('MN-987654');
  const [commodity, setCommodity] = React.useState('General Freight');
  const [customRemarks, setCustomRemarks] = React.useState('');

  const logs = plan.daily_logs;
  if (!logs || logs.length === 0) return null;
  const activeLog = logs[activeDayIdx];

  // SVG grid sizing constants
  const svgWidth = 840;
  const svgHeight = 220;
  
  const startX = 140; // Space for status labels
  const endX = 780;   // Grid end
  const gridWidth = endX - startX; // 640px
  
  const rowY = {
    'OFF DUTY': 35,
    'SLEEPER BERTH': 75,
    'DRIVING': 115,
    'ON DUTY': 155
  };

  const getX = (minutes: number) => {
    return startX + (minutes / 1440) * gridWidth;
  };

  const getY = (status: keyof typeof rowY) => {
    return rowY[status] || 35;
  };

  // Helper to format address names cleanly
  const cleanAddress = (address?: string) => {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length >= 2) {
      return `${parts[0].trim()}, ${parts[1].trim()}`;
    }
    return address;
  };

  // Helper to get closest Stop name for coordinates
  const getStopName = (lat: number, lon: number) => {
    if (!plan.stops || plan.stops.length === 0) return 'Unknown';
    let closestStop = plan.stops[0];
    let minD = Infinity;
    for (const stop of plan.stops) {
      const d = Math.pow(stop.latitude - lat, 2) + Math.pow(stop.longitude - lon, 2);
      if (d < minD) {
        minD = d;
        closestStop = stop;
      }
    }
    return cleanAddress(closestStop.display_name || closestStop.reason || closestStop.type);
  };

  // Split date into Month, Day, Year
  const formatDateParts = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00'); // enforce local time zone parsing
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear().toString();
    return { month, day, year };
  };

  const { month, day, year } = formatDateParts(activeLog.date);

  // Determine From and To locations for the active day
  const getDayLocations = () => {
    const dayDateStr = activeLog.date;
    const dayEvents = plan.events.filter(evt => {
      const evtStart = evt.start_time.split('T')[0];
      const evtEnd = evt.end_time.split('T')[0];
      return evtStart === dayDateStr || evtEnd === dayDateStr || (evtStart < dayDateStr && evtEnd > dayDateStr);
    });

    if (dayEvents.length === 0) {
      const startLoc = plan.stops[0]?.display_name || 'Start Location';
      const endLoc = plan.stops[plan.stops.length - 1]?.display_name || 'End Location';
      return { from: cleanAddress(startLoc), to: cleanAddress(endLoc) };
    }

    const firstEvt = dayEvents[0];
    const lastEvt = dayEvents[dayEvents.length - 1];

    const fromName = getStopName(firstEvt.latitude, firstEvt.longitude);
    const toName = getStopName(lastEvt.end_latitude, lastEvt.end_longitude);

    return { from: fromName, to: toName };
  };

  const { from, to } = getDayLocations();

  // Generate SVG path for the continuous status lines
  const renderLogLines = () => {
    const paths: React.ReactNode[] = [];
    const segments = activeLog.segments;

    segments.forEach((seg, idx) => {
      const x1 = getX(seg.start_minutes);
      const x2 = getX(seg.end_minutes);
      const y = getY(seg.status);

      // Horizontal line for this status segment
      paths.push(
        <line
          key={`h-${idx}`}
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke="#ef4444" // Classic ELD red line
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      );

      // Draw vertical connector to next segment if not the last segment
      if (idx < segments.length - 1) {
        const nextSeg = segments[idx + 1];
        const nextY = getY(nextSeg.status);
        paths.push(
          <line
            key={`v-${idx}`}
            x1={x2}
            y1={y}
            x2={x2}
            y2={nextY}
            stroke="#ef4444"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        );
      }
    });

    return paths;
  };

  // Helper to format event times
  const formatEventTime = (isoStr: string) => {
    const date = new Date(isoStr);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should be 12
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Compile remarks list for display
  const getRemarks = () => {
    const dayDateStr = activeLog.date;
    const dayStart = new Date(`${dayDateStr}T00:00:00`);
    const dayEnd = new Date(`${dayDateStr}T23:59:59`);

    const dayEvents = plan.events.filter(evt => {
      const evtStart = new Date(evt.start_time);
      const evtEnd = new Date(evt.end_time);
      return evtStart < dayEnd && evtEnd > dayStart;
    });

    const remarksList: string[] = [];
    
    // Check if first event started before midnight
    if (dayEvents.length > 0) {
      const firstEvt = dayEvents[0];
      const evtStart = new Date(firstEvt.start_time);
      if (evtStart < dayStart) {
        let label = 'Off-duty';
        if (firstEvt.type === 'DRIVING') label = 'Driving';
        else if (firstEvt.type === 'REST') label = 'Off-duty rest (Sleeper)';
        else if (firstEvt.type === 'PICKUP' || firstEvt.type === 'DROPOFF' || firstEvt.type === 'FUEL') label = 'On-duty (not driving)';
        
        remarksList.push(`12:00 AM — Continued ${label} from ${getStopName(firstEvt.latitude, firstEvt.longitude)}`);
      }
    }
    
    dayEvents.forEach(evt => {
      const evtStart = new Date(evt.start_time);
      if (evtStart >= dayStart && evtStart <= dayEnd) {
        const timeStr = formatEventTime(evt.start_time);
        const loc = getStopName(evt.latitude, evt.longitude);
        
        let desc = '';
        switch (evt.type) {
          case 'PICKUP':
            desc = `On-duty (load cargo) at ${loc}`;
            break;
          case 'DROPOFF':
            desc = `On-duty (unload cargo / end of shift) at ${loc}`;
            break;
          case 'FUEL':
            desc = `On-duty (fuel stop) at ${loc}`;
            break;
          case 'FUEL_BREAK':
            desc = `Fuel & break combined at ${loc}`;
            break;
          case 'BREAK':
            desc = `Off-duty (30-min break) at ${loc}`;
            break;
          case 'REST':
            desc = `Off-duty rest (10h Sleeper berth) at ${loc}`;
            break;
          case 'DRIVING':
            desc = `Started driving from ${loc}`;
            break;
          default:
            desc = `Change of duty status at ${loc}`;
        }
        remarksList.push(`${timeStr} — ${desc}`);
      }
    });

    return remarksList;
  };

  const remarks = getRemarks();

  // Recap Table Calculations
  const initialCycleUsed = plan.hos_summary.initial_cycle_used || 0;
  const priorDays = Array(7).fill(initialCycleUsed / 7);
  const tripDaysHours = logs.map(log => log.driving_hours + log.on_duty_hours);
  const allDaysHours = [...priorDays, ...tripDaysHours];
  const todayIdx = 7 + activeDayIdx;

  // 70 hr / 8 day
  const A_70 = allDaysHours.slice(todayIdx - 6, todayIdx + 1).reduce((s, h) => s + h, 0);
  const B_70 = Math.max(0, 70 - A_70);
  const C_70 = allDaysHours.slice(todayIdx - 7, todayIdx + 1).reduce((s, h) => s + h, 0);

  // 60 hr / 7 day
  const A_60 = allDaysHours.slice(todayIdx - 5, todayIdx + 1).reduce((s, h) => s + h, 0);
  const B_60 = Math.max(0, 60 - A_60);
  const C_60 = allDaysHours.slice(todayIdx - 6, todayIdx + 1).reduce((s, h) => s + h, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Tab Selectors & Print Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Drivers Daily Log
            </h3>
            <p className="text-xs text-slate-400">Generate, customize, and print HOS daily log sheets based on the physical paper log template</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-xl transition-colors border border-teal-100"
            >
              <Printer className="w-4 h-4" />
              Print Log Sheets
            </button>
          </div>
        </div>

        {/* Days Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {logs.map((log, idx) => (
            <button
              key={log.date}
              onClick={() => setActiveDayIdx(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeDayIdx === idx
                  ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Day {idx + 1} — {new Date(log.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </button>
          ))}
        </div>
      </div>

      {/* Log Book Sheet Container - Prints full page landscape */}
      <div className="bg-white border border-slate-300 rounded-2xl shadow-sm p-8 max-w-[940px] mx-auto text-slate-800 print-section font-sans relative overflow-x-auto">
        
        {/* Style block for clean printing layout */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
            .print-section {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              background: white !important;
            }
            @page {
              size: landscape;
              margin: 0.4in;
            }
          }
        `}} />

        <div className="min-w-[850px] space-y-6">
          {/* Header Block */}
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Drivers Daily Log</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">(24 hours)</p>
            </div>

            {/* Date month/day/year boxes */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 text-center">
                <div className="w-10 border-b-2 border-slate-800 pb-0.5 font-bold text-sm text-slate-900">{month}</div>
                <span className="font-bold text-slate-500">/</span>
                <div className="w-10 border-b-2 border-slate-800 pb-0.5 font-bold text-sm text-slate-900">{day}</div>
                <span className="font-bold text-slate-500">/</span>
                <div className="w-14 border-b-2 border-slate-800 pb-0.5 font-bold text-sm text-slate-900">{year}</div>
              </div>
              <div className="flex gap-4 text-[8px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                <span className="w-10 text-center">Month</span>
                <span className="w-4" />
                <span className="w-10 text-center">Day</span>
                <span className="w-4" />
                <span className="w-14 text-center">Year</span>
              </div>
            </div>

            {/* Copy distribution label */}
            <div className="text-[8px] font-bold text-slate-400 text-right uppercase space-y-0.5 leading-tight max-w-[200px]">
              <p className="text-slate-600">Original - File at home terminal.</p>
              <p>Duplicate - Driver retains in his/her possession for 8 days.</p>
            </div>
          </div>

          {/* From / To line */}
          <div className="grid grid-cols-2 gap-8 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase text-[9px] tracking-wider">From:</span>
              <div className="flex-grow border-b border-slate-300 pb-0.5 text-slate-900 font-bold text-sm">{from}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase text-[9px] tracking-wider">To:</span>
              <div className="flex-grow border-b border-slate-300 pb-0.5 text-slate-900 font-bold text-sm">{to}</div>
            </div>
          </div>

          {/* Main Info Fields Grid */}
          <div className="grid grid-cols-12 gap-6 items-start">
            
            {/* Left Boxes Block */}
            <div className="col-span-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Total Miles Driving */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 text-center">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1 leading-none">Total Miles Driving Today</span>
                  <span className="text-base font-black text-slate-800">{activeLog.total_miles}</span>
                </div>
                {/* Total Mileage */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 text-center">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1 leading-none">Total Mileage Today</span>
                  <span className="text-base font-black text-slate-800">{activeLog.total_miles}</span>
                </div>
              </div>

              {/* Truck / Trailer Box */}
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50">
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1 leading-none">Truck/Tractor & Trailer Numbers</span>
                <div className="flex items-center gap-2 mt-1">
                  <Truck className="w-4 h-4 text-slate-400 shrink-0 no-print" />
                  <input
                    type="text"
                    value={vehicleNumbers}
                    onChange={(e) => setVehicleNumbers(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-xs font-bold text-slate-800 p-0 focus:ring-0"
                    placeholder="TRK-102 / TR-405"
                  />
                </div>
              </div>
            </div>

            {/* Right Carrier / Address Fields Block */}
            <div className="col-span-7 space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/20">
              {/* Carrier Name */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider w-28 text-right">Carrier Name:</span>
                <div className="flex-grow flex items-center gap-1.5 border-b border-slate-200 pb-0.5">
                  <Building className="w-3.5 h-3.5 text-slate-300 no-print shrink-0" />
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-xs font-bold text-slate-800 p-0 focus:ring-0"
                  />
                </div>
              </div>

              {/* Office Address */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider w-28 text-right">Main Office:</span>
                <div className="flex-grow border-b border-slate-200 pb-0.5">
                  <input
                    type="text"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-xs font-bold text-slate-800 p-0 focus:ring-0"
                  />
                </div>
              </div>

              {/* Home Terminal */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider w-28 text-right">Home Terminal:</span>
                <div className="flex-grow border-b border-slate-200 pb-0.5">
                  <input
                    type="text"
                    value={homeTerminalAddress}
                    onChange={(e) => setHomeTerminalAddress(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-xs font-bold text-slate-800 p-0 focus:ring-0"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Grid Section */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/10">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              width="100%"
              height="100%"
              className="min-w-[760px] bg-white border border-slate-400 select-none shadow-sm rounded-lg"
            >
              {/* Header Dark Bar */}
              <rect x={startX} y="0" width={gridWidth} height="20" fill="#0f172a" />
              
              {/* Header Labels (Midnight, Noon, etc.) */}
              <text x={startX} y="13" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">MID-NIGHT</text>
              <text x={getX(12 * 60)} y="13" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">NOON</text>
              <text x={endX} y="13" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">MID-NIGHT</text>
              
              {/* Header Hours 1..11, 1..11 */}
              {Array.from({ length: 23 }).map((_, hrIdx) => {
                const hr = hrIdx + 1;
                const x = getX(hr * 60);
                const displayHr = hr > 12 ? hr - 12 : hr === 12 ? '12' : hr;
                if (hr === 12) return null; // handled by Noon
                return (
                  <text
                    key={`header-hr-${hr}`}
                    x={x}
                    y="13"
                    fill="#cbd5e1"
                    fontSize="8"
                    fontWeight="black"
                    textAnchor="middle"
                  >
                    {displayHr}
                  </text>
                );
              })}

              <text x={endX + 25} y="13" fill="#0f172a" fontSize="7" fontWeight="black" textAnchor="middle">TOTAL HOURS</text>

              {/* Grid Outer Border */}
              <rect x={startX} y="20" width={gridWidth} height="160" fill="none" stroke="#475569" strokeWidth="1.5" />

              {/* Grid Row separators */}
              {Object.keys(rowY).map((status, idx) => (
                <line
                  key={`row-sep-${idx}`}
                  x1={startX}
                  y1={rowY[status as keyof typeof rowY]}
                  x2={endX}
                  y2={rowY[status as keyof typeof rowY]}
                  stroke="#475569"
                  strokeWidth="1.2"
                />
              ))}

              {/* Grid Hour Lines and Quarter-Hour Ticks */}
              {Array.from({ length: 25 }).map((_, hr) => {
                const x = getX(hr * 60);
                
                return (
                  <g key={`hour-grid-${hr}`}>
                    {/* Solid Vertical Hour Line */}
                    <line
                      x1={x}
                      y1="20"
                      x2={x}
                      y2="180"
                      stroke="#475569"
                      strokeWidth={hr === 0 || hr === 12 || hr === 24 ? "1.5" : "1.0"}
                    />
                    
                    {/* Quarter-hour ticks inside each row */}
                    {hr < 24 && Object.keys(rowY).map((status) => {
                      const yCenter = rowY[status as keyof typeof rowY];
                      
                      // 15, 30, 45 minute positions
                      const x15 = getX(hr * 60 + 15);
                      const x30 = getX(hr * 60 + 30);
                      const x45 = getX(hr * 60 + 45);

                      return (
                        <g key={`ticks-${status}-${hr}`}>
                          {/* 15m Tick */}
                          <line x1={x15} y1={yCenter - 5} x2={x15} y2={yCenter + 5} stroke="#94a3b8" strokeWidth="0.8" />
                          {/* 30m Mid-tick */}
                          <line x1={x30} y1={yCenter - 9} x2={x30} y2={yCenter + 9} stroke="#64748b" strokeWidth="1.0" />
                          {/* 45m Tick */}
                          <line x1={x45} y1={yCenter - 5} x2={x45} y2={yCenter + 5} stroke="#94a3b8" strokeWidth="0.8" />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Row text labels on the left */}
              {Object.keys(rowY).map((status, idx) => (
                <text
                  key={`row-label-${status}`}
                  x={startX - 15}
                  y={rowY[status as keyof typeof rowY] + 3}
                  textAnchor="end"
                  fontSize="8"
                  fontWeight="black"
                  fill="#0f172a"
                >
                  {`${idx + 1}. ${status}`}
                </text>
              ))}

              {/* SVG Status Line graph */}
              {renderLogLines()}

              {/* Hour summary counts drawn on the right */}
              <text x={endX + 25} y={rowY['OFF DUTY'] + 3} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">
                {activeLog.off_duty_hours}
              </text>
              <text x={endX + 25} y={rowY['SLEEPER BERTH'] + 3} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">
                {activeLog.sleeper_hours}
              </text>
              <text x={endX + 25} y={rowY['DRIVING'] + 3} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">
                {activeLog.driving_hours}
              </text>
              <text x={endX + 25} y={rowY['ON DUTY'] + 3} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">
                {activeLog.on_duty_hours}
              </text>

              {/* Right margin total hours border */}
              <line x1={endX + 10} y1="20" x2={endX + 10} y2="180" stroke="#475569" strokeWidth="1.2" />
              <line x1={endX + 40} y1="20" x2={endX + 40} y2="180" stroke="#475569" strokeWidth="1.2" />
              
              {/* Double line underneath the total hours */}
              <line x1={endX + 10} y1="183" x2={endX + 40} y2="183" stroke="#0f172a" strokeWidth="1.5" />
              <line x1={endX + 10} y1="186" x2={endX + 40} y2="186" stroke="#0f172a" strokeWidth="1.5" />

              {/* Total Check hours text */}
              <text x={endX + 25} y="200" textAnchor="middle" fontSize="10" fontWeight="black" fill="#0f766e">
                {activeLog.off_duty_hours + activeLog.sleeper_hours + activeLog.driving_hours + activeLog.on_duty_hours}
              </text>
            </svg>
          </div>

          {/* Remarks Section */}
          <div className="border border-slate-300 rounded-xl overflow-hidden grid grid-cols-12 text-xs">
            
            {/* Left Remarks: Shipping Documents Box */}
            <div className="col-span-4 border-r border-slate-300 p-4 bg-slate-50/40 space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-2">Shipping Documents:</h4>
                
                {/* Manifest line */}
                <div className="space-y-1">
                  <label className="text-[8px] text-slate-400 uppercase font-bold tracking-wide">B/L or Manifest No.</label>
                  <div className="flex items-center gap-1 border-b border-slate-200 pb-0.5">
                    <FileCheck className="w-3.5 h-3.5 text-slate-300 shrink-0 no-print" />
                    <input
                      type="text"
                      value={manifestNumber}
                      onChange={(e) => setManifestNumber(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-xs font-bold text-slate-800 p-0 focus:ring-0"
                      placeholder="e.g. B/L-789012"
                    />
                  </div>
                </div>

                {/* Shipper & Commodity line */}
                <div className="space-y-1 mt-4">
                  <label className="text-[8px] text-slate-400 uppercase font-bold tracking-wide">Shipper & Commodity</label>
                  <div className="border-b border-slate-200 pb-0.5">
                    <input
                      type="text"
                      value={commodity}
                      onChange={(e) => setCommodity(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-xs font-bold text-slate-800 p-0 focus:ring-0"
                      placeholder="e.g. General Freight"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Right Remarks: Change of duty status listing */}
            <div className="col-span-8 p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider">Remarks (Status Changes)</h4>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Use home terminal time</span>
              </div>

              {/* Remarks Chronological List */}
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2">
                {remarks.map((rem, idx) => (
                  <p key={idx} className="text-[11px] font-bold text-slate-600 border-l-2 border-teal-500 pl-2 py-0.5">
                    {rem}
                  </p>
                ))}

                {remarks.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic">No duty status changes recorded for today.</p>
                )}
              </div>

              {/* Custom Remarks input box */}
              <div className="pt-2 border-t border-slate-100 no-print">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <Edit3 className="w-3 h-3 text-slate-400" />
                  Add Custom Remark:
                </div>
                <input
                  type="text"
                  value={customRemarks}
                  onChange={(e) => setCustomRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-1.5 focus:border-teal-500 outline-none"
                  placeholder="e.g., Driver change, inspection, or vehicle maintenance details..."
                />
              </div>

              {/* Custom Remarks line for printing */}
              {customRemarks && (
                <div className="hidden print:block border-t border-slate-100 pt-2 text-[10px] font-black text-slate-800">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider mr-2">Additional Note:</span>
                  {customRemarks}
                </div>
              )}
            </div>

          </div>

          {/* Footer section: Recap Table */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/30">
            <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-3">Recap: Complete at end of day</h4>
            
            <div className="grid grid-cols-12 gap-6 items-center">
              
              {/* Daily on duty lines 3 & 4 summary */}
              <div className="col-span-3 border border-slate-200 rounded-lg p-2.5 bg-white text-center">
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1 leading-normal">On duty hours today<br />(Total Lines 3 & 4)</span>
                <span className="text-sm font-black text-slate-800">{(activeLog.driving_hours + activeLog.on_duty_hours).toFixed(2)} hrs</span>
              </div>

              {/* 70 Hour / 8 Day Drivers table */}
              <div className="col-span-9 grid grid-cols-2 gap-4">
                
                {/* 70 Hour / 8 Day Column */}
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <span className="block text-[8px] font-black text-teal-800 uppercase tracking-widest border-b border-slate-100 pb-1">70 Hour / 8 Day Drivers</span>
                  
                  <div className="space-y-1.5 text-[10px] font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>A. On duty hours last 7 days (incl. today):</span>
                      <span className="font-bold text-slate-800">{A_70.toFixed(2)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>B. Hours available tomorrow (70 - A):</span>
                      <span className="font-bold text-teal-700">{B_70.toFixed(2)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>C. On duty hours last 8 days (incl. today):</span>
                      <span className="font-bold text-slate-800">{C_70.toFixed(2)}h</span>
                    </div>
                  </div>
                </div>

                {/* 60 Hour / 7 Day Column */}
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1">60 Hour / 7 Day Drivers</span>
                  
                  <div className="space-y-1.5 text-[10px] font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>A. On duty hours last 6 days (incl. today):</span>
                      <span className="font-bold text-slate-800">{A_60.toFixed(2)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>B. Hours available tomorrow (60 - A):</span>
                      <span className="font-bold text-slate-700">{B_60.toFixed(2)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>C. On duty hours last 7 days (incl. today):</span>
                      <span className="font-bold text-slate-800">{C_60.toFixed(2)}h</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Note caption */}
            <p className="text-[7.5px] text-slate-400 mt-3 font-semibold text-center italic">
              *If you took 34 consecutive hours off duty, you have 60/70 hours available. Enter name of place you reported and where released from work and when and where each change of duty occurred. Use time standard of home terminal.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

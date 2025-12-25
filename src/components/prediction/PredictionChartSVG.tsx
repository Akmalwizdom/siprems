import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  Activity
} from 'lucide-react';
import { PredictionData } from '../types';

// Constants for layout
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 400;
const PADDING_X = 60;
const PADDING_Y = 50; 
const GRAPH_HEIGHT = SVG_HEIGHT - PADDING_Y * 2;

const getControlPoint = (current: {x: number, y: number}, previous: {x: number, y: number} | undefined, next: {x: number, y: number} | undefined, reverse?: boolean) => {
  const p = previous || current;
  const n = next || current;
  const smoothing = 0.15;
  const lengthX = n.x - p.x;
  const lengthY = n.y - p.y;
  const length = Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2));
  const angle = Math.atan2(lengthY, lengthX) + (reverse ? Math.PI : 0);
  const lengthCp = length * smoothing;
  
  let x = current.x + Math.cos(angle) * lengthCp;
  let y = current.y + Math.sin(angle) * lengthCp;

  // CLAMP Y to prevent overshoot below graph area or above
  y = Math.max(PADDING_Y, Math.min(y, SVG_HEIGHT - PADDING_Y));

  return { x, y };
};

const createSmoothPath = (points: {x: number, y: number}[]) => {
  if (points.length === 0) return "";
  const d = points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const cps = getControlPoint(a[i - 1], a[i - 2], point);
    const cpe = getControlPoint(point, a[i - 1], a[i + 1], true);
    return `${acc} C ${cps.x},${cps.y} ${cpe.x},${cpe.y} ${point.x},${point.y}`;
  }, "");
  return d;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface TooltipData {
  label: string;
  value: number;
  type: 'history' | 'forecast';
  event?: {
    label: string;
    type: string;
    description: string;
  };
}

const Tooltip = ({ x, y, data, show }: { x: number; y: number; data: TooltipData | null; show: boolean }) => {
  if (!show || !data) return null;
  
  // FORCE STYLES with inline style to prevent overrides
  return (
    <div 
      style={{ 
        position: 'absolute',
        top: y,
        left: x,
        zIndex: 50,
        backgroundColor: '#0f172a', // slate-900
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        pointerEvents: 'none',
        transform: 'translate(-50%, -100%)',
        marginTop: '-15px',
        minWidth: '160px',
        border: '1px solid #334155' // slate-700
      }}
    >
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '8px', 
        paddingBottom: '8px', 
        borderBottom: '1px solid rgba(51, 65, 85, 0.5)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontSize: '14px' 
      }}>
        <span>{data.label}</span>
        {data.type === 'forecast' && (
          <span style={{ 
            fontSize: '10px', 
            backgroundColor: 'rgba(99, 102, 241, 0.2)', 
            padding: '2px 6px', 
            borderRadius: '4px', 
            color: '#a5b4fc',
            fontWeight: 'normal' 
          }}>Prophet</span>
        )}
      </div>
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>Sales:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#34d399', fontSize: '13px' }}>{formatCurrency(data.value)}</span>
        </div>
      </div>
      {data.event && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontWeight: 600, 
            marginBottom: '2px',
            fontSize: '12px',
            color: data.event.type === 'traffic' ? '#fbbf24' : // amber-400
                   data.event.type === 'promo' ? '#60a5fa' :    // blue-400
                   data.event.type === 'holiday' ? '#f87171' :  // red-400
                   '#e2e8f0'
          }}>
            <AlertCircle size={11} />
            <span>{data.event.label}</span>
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.2', paddingLeft: '16px' }}>{data.event.description}</div>
        </div>
      )}
    </div>
  );
};

interface PredictionChartSVGProps {
  data: PredictionData[];
  eventAnnotations: {
    date: string;
    titles: string[];
    types: string[];
  }[];
  title?: string;
}

export function PredictionChartSVG({ 
  data, 
  eventAnnotations,
  title = "Prediksi Penjualan" 
}: PredictionChartSVGProps) {
  const [hoverData, setHoverData] = useState<(TooltipData & { domX: number; domY: number; svgX: number }) | null>(null);
  const [showForecast, setShowForecast] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  
  const GRAPH_WIDTH = SVG_WIDTH - PADDING_X * 2;

  const { combinedData, events } = useMemo(() => {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date);
    };

    const typeMap: Record<string, string> = {
      'promotion': 'promo',
      'holiday': 'holiday',
      'traffic': 'traffic',
      'event': 'event',
    };

    const allDates = data.map(d => d.date);
    const events = eventAnnotations.map((ev, idx) => {
      const eventIndex = allDates.findIndex(d => d === ev.date);
      const rawType = ev.types[0] || 'event';
      const type = typeMap[rawType] || (rawType.includes('promo') ? 'promo' : 'traffic');
      
      const label = ev.titles[0];
      const finalType = label?.toLowerCase().includes('traffic') ? 'traffic' : 
                        label?.toLowerCase().includes('sale') ? 'promo' : type;

      return {
        index: eventIndex >= 0 ? eventIndex : idx,
        label: label || 'Event',
        type: finalType,
        description: rawType === 'promotion' ? 'Promo dadakan durasi pendek' : 
                     finalType === 'traffic' ? 'Kenaikan organik dari sosmed' : 
                     finalType === 'holiday' ? 'Hari libur nasional' : 'Event khusus'
      };
    }).filter(ev => ev.index >= 0);

    const combined = data.map((d, i) => ({
      label: formatDate(d.date),
      value: d.historical ?? d.predicted ?? 0,
      type: (d.historical !== null && d.historical !== undefined ? 'history' : 'forecast') as 'history' | 'forecast',
      globalIndex: i
    }));

    return { events, combinedData: combined };
  }, [data, eventAnnotations]);

  const totalPoints = combinedData.length;
  
  const allValues = combinedData.map(d => d.value).filter(v => v > 0);
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 50000000;
  const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const padding = (dataMax - dataMin) * 0.25; 
  const maxValue = dataMax + padding;
  // Ensure minValue respects the data but allows starting from 0 if reasonably close
  const minValue = Math.max(0, dataMin - padding * 0.5);

  const getX = (index: number) => PADDING_X + (index / Math.max(totalPoints - 1, 1)) * GRAPH_WIDTH;
  const getY = (value: number) => {
    const range = maxValue - minValue;
    if (range === 0) return SVG_HEIGHT - PADDING_Y - GRAPH_HEIGHT / 2;
    // CLAMP Y at the output stage as well
    const yStr = SVG_HEIGHT - PADDING_Y - ((value - minValue) / range) * GRAPH_HEIGHT;
    return Math.max(PADDING_Y, Math.min(yStr, SVG_HEIGHT - PADDING_Y));
  };

  const historyPoints = useMemo(() => {
    const points: {x: number, y: number}[] = [];
    data.forEach((d, i) => {
      if (d.historical !== null && d.historical !== undefined) {
        points.push({ x: getX(i), y: getY(d.historical) });
      }
    });
    return points;
  }, [data, totalPoints, maxValue, minValue]);

  const forecastPoints = useMemo(() => {
    if (!showForecast) return [];
    
    const points: {x: number, y: number}[] = [];
    let lastHistoryIdx = -1;
    let lastHistoryValue = 0;
    
    data.forEach((d, i) => {
      if (d.historical !== null && d.historical !== undefined) {
        lastHistoryIdx = i;
        lastHistoryValue = d.historical;
      }
    });
    
    if (lastHistoryIdx >= 0) {
      points.push({ x: getX(lastHistoryIdx), y: getY(lastHistoryValue) });
    }
    
    data.forEach((d, i) => {
      if (d.predicted !== null && d.predicted !== undefined && 
          (d.historical === null || d.historical === undefined)) {
        points.push({ x: getX(i), y: getY(d.predicted) });
      }
    });
    
    return points;
  }, [data, showForecast, totalPoints, maxValue, minValue]);

  const historyPathD = useMemo(() => createSmoothPath(historyPoints), [historyPoints]);
  const forecastPathD = useMemo(() => createSmoothPath(forecastPoints), [forecastPoints]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgMouseX = (mouseX / rect.width) * SVG_WIDTH;

    let index = Math.round(((svgMouseX - PADDING_X) / GRAPH_WIDTH) * (totalPoints - 1));
    index = Math.max(0, Math.min(index, totalPoints - 1));

    const pointData = combinedData[index];
    if (!pointData) return;

    const event = events.find(ev => ev.index === pointData.globalIndex);

    const domX = (getX(index) / SVG_WIDTH) * rect.width;
    const domY = (getY(pointData.value) / SVG_HEIGHT) * rect.height;

    setHoverData({
      ...pointData,
      event,
      domX,
      domY,
      svgX: getX(index)
    });
  };

  const getLabelStep = () => {
    if (totalPoints > 60) return 10;
    if (totalPoints > 20) return 4;
    return 1;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200 flex items-center justify-center h-96">
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  const getColor = (type: string) => {
     if (type === 'traffic') return '#f59e0b'; // Amber
     if (type === 'promo') return '#3b82f6';   // Blue
     if (type === 'holiday') return '#ef4444'; // Red
     return '#3b82f6';
  };

  const getBgColorClass = (type: string) => {
    if (type === 'traffic') return 'bg-amber-500';
    if (type === 'promo') return 'bg-blue-500';
    if (type === 'holiday') return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div style={{ width: '32px', height: '4px', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
              <span className="font-medium text-slate-700">Data Aktual</span>
            </div>
            {showForecast && (
              <div className="flex items-center gap-2">
                <div style={{ width: '32px', height: '0px', borderTop: '2px dashed #6366f1' }}></div>
                <span className="font-medium text-slate-700">Forecast (Prophet)</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowEvents(!showEvents)}
              className={`p-2 rounded-lg transition-colors border ${showEvents ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-400 border-slate-200'}`}
              title="Toggle Events"
            >
              <AlertCircle size={18} />
            </button>
            <button 
              onClick={() => setShowForecast(!showForecast)}
              className={`p-2 rounded-lg transition-colors border ${showForecast ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-400 border-slate-200'}`}
              title="Toggle Forecast"
            >
              <Activity size={18} />
            </button>
          </div>
        </div>

        <div className="relative w-full aspect-[21/9] min-h-[350px]">
          <svg 
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
            className="w-full h-full overflow-visible select-none cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverData(null)}
          >
            <defs>
              <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e2e8f0" stopOpacity={0.5}/>
                <stop offset="100%" stopColor="#e2e8f0" stopOpacity={0.1}/>
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const val = minValue + (maxValue - minValue) * tick;
              const y = getY(val);
              return (
                <g key={tick}>
                  <line x1={PADDING_X} y1={y} x2={SVG_WIDTH - PADDING_X} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text 
                    x={PADDING_X - 10} 
                    y={y + 3} 
                    textAnchor="end" 
                    className="fill-slate-400 font-mono font-medium"
                    style={{ fontSize: '9px' }}
                  >
                    {(val / 1000000).toFixed(0)}Jt
                  </text>
                </g>
              );
            })}

            <path 
              d={historyPathD} 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              filter="drop-shadow(0 2px 4px rgb(16 185 129 / 0.15))"
            />

            {showForecast && forecastPathD && (
              <path 
                d={forecastPathD} 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                strokeDasharray="6 6"
              />
            )}

            {showEvents && events.map((ev, i) => {
              const idx = ev.index;
              if (idx < 0 || idx >= totalPoints) return null;
              
              const pointValue = combinedData[idx]?.value || 0;
              const pt = { x: getX(idx), y: getY(pointValue) };
              const color = getColor(ev.type);

              return (
                <g key={`ev-${i}`}>
                  <line 
                    x1={pt.x} y1={PADDING_Y} 
                    x2={pt.x} y2={SVG_HEIGHT - PADDING_Y} 
                    stroke={color} 
                    strokeWidth="1.5" 
                    strokeDasharray="3 3"
                    opacity="0.5"
                  />
                  
                  <circle cx={pt.x} cy={pt.y} r="3" fill={color} />
                  
                  <foreignObject x={pt.x - 12} y={PADDING_Y - 32} width="24" height="24">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm transition-transform hover:scale-110 ${getBgColorClass(ev.type)}`}>
                      <span className="font-bold">{i + 1}</span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {hoverData && (
              <g>
                <line 
                  x1={hoverData.svgX} y1={PADDING_Y} 
                  x2={hoverData.svgX} y2={SVG_HEIGHT - PADDING_Y} 
                  stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3"
                />
                <circle 
                  cx={hoverData.svgX} 
                  cy={getY(hoverData.value)} 
                  r="5" 
                  fill="white" 
                  stroke={hoverData.type === 'history' ? '#10b981' : '#6366f1'} 
                  strokeWidth="3"
                />
              </g>
            )}

            {combinedData.map((d, i) => {
               const step = getLabelStep();
               if (i % step !== 0) return null; 

               return (
                <text 
                  key={i} 
                  x={getX(i)} 
                  y={SVG_HEIGHT - PADDING_Y + 20} 
                  textAnchor="middle" 
                  className="fill-slate-500 font-medium"
                  style={{ fontSize: '9px' }}
                >
                  {d.label}
                </text>
               );
            })}
          </svg>
          
          <Tooltip show={!!hoverData} data={hoverData} x={hoverData?.domX || 0} y={hoverData?.domY || 0} />
        </div>
      </div>
    </div>
  );
}

export default PredictionChartSVG;

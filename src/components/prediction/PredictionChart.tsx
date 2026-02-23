import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { formatCompactNumber } from '../../utils/format';

interface PredictionChartProps {
  data: any[];
}

export function PredictionChart({ data }: PredictionChartProps) {
  return (
    <div className="glass-card shadow-bronze-100/10 rounded-3xl border-white/40 p-6 shadow-xl lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900 italic">
            Visualisasi <span className="text-bronze-600 not-italic">Masa Depan.</span>
          </h3>
          <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Gabungan Data Historis & Prediksi AI
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-slate-100/50 p-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-slate-400"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase">Historis</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 shadow-sm">
            <div className="bg-bronze-500 h-2 w-2 rounded-full"></div>
            <span className="text-bronze-600 text-[10px] font-black uppercase">Prediksi</span>
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B59663" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#B59663" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(v) => formatCompactNumber(v)}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 8px 32px 0 rgba(181, 150, 99, 0.1)',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
              }}
              labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}
              itemStyle={{ fontWeight: 700, fontSize: '12px' }}
            />

            <Area
              type="monotone"
              dataKey="sales"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#historyGradient)"
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#B59663"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#predictionGradient)"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

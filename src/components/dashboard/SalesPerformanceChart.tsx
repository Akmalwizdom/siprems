import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatCompactNumber } from '../../utils/format';

interface SalesPerformanceChartProps {
  data: any[];
}

export function SalesPerformanceChart({ data }: SalesPerformanceChartProps) {
  return (
    <div className="glass-card shadow-bronze-100/10 rounded-3xl border-white/40 p-6 shadow-xl lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900">Performa Penjualan</h3>
          <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Total Pendapatan 7 Hari Terakhir
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-slate-100/50 p-1">
          <button className="text-bronze-600 rounded-lg bg-white px-3 py-1.5 text-[10px] font-black uppercase shadow-sm">
            Mingguan
          </button>
          <button className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase hover:text-slate-600">
            Bulanan
          </button>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B59663" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#B59663" stopOpacity={0} />
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
              formatter={(value: any) => [`Rp ${formatNumber(value)}`, 'Pendapatan']}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#B59663"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorSales)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

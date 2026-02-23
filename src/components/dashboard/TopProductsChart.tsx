import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { formatCompactNumber } from '../../utils/format';

interface TopProductsChartProps {
  data: any[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  return (
    <div className="glass-card rounded-3xl p-6 lg:p-8 border-white/40 shadow-xl shadow-bronze-100/10">
      <div className="mb-8">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">Produk Terlaris</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Berdasarkan Total Unit Terjual</p>
      </div>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
            <XAxis 
              type="number" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(v) => formatCompactNumber(v)}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }}
              width={100}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(181, 150, 99, 0.05)' }}
              contentStyle={{ 
                borderRadius: '16px', 
                border: '1px solid rgba(255,255,255,0.4)', 
                boxShadow: '0 8px 32px 0 rgba(181, 150, 99, 0.1)',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)'
              }}
              labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}
              itemStyle={{ fontWeight: 700, fontSize: '12px' }}
            />
            <Bar dataKey="sales" radius={[0, 8, 8, 0]} barSize={24} animationDuration={1500}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#B59663' : '#E2E8F0'} className="hover:fill-bronze-400 transition-colors" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

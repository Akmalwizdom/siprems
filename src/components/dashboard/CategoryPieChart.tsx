import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface CategoryPieChartProps {
  data: any[];
}

const BRONZE_COLORS = ['#B59663', '#8C734B', '#D4BC91', '#E6D5B8', '#594833'];

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <div className="glass-card shadow-bronze-100/10 flex h-full flex-col rounded-3xl border-white/40 p-6 shadow-xl">
      <div className="mb-6">
        <h3 className="text-lg font-black tracking-tight text-slate-900">Kategori Terpopuler</h3>
        <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
          Distribusi Penjualan
        </p>
      </div>

      <div className="min-h-[300px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={8}
              dataKey="value"
              animationDuration={1500}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BRONZE_COLORS[index % BRONZE_COLORS.length]}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 8px 32px 0 rgba(181, 150, 99, 0.1)',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
              }}
              itemStyle={{ fontWeight: 700, fontSize: '12px', color: '#1e293b' }}
            />
            <Legend
              iconType="circle"
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

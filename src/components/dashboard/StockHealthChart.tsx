import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface StockHealthChartProps {
  data: any[];
}

const HEALTH_COLORS = {
  'Good Stock': '#B59663', // Bronze for healthy
  'Low Stock': '#F59E0B', // Amber
  'Out of Stock': '#EF4444', // Red
};

export function StockHealthChart({ data }: StockHealthChartProps) {
  return (
    <div className="glass-card shadow-bronze-100/10 flex h-full flex-col rounded-3xl border-white/40 p-6 shadow-xl">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-black tracking-tight text-slate-900">Kesehatan Stok</h3>
        <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
          Status Inventaris Saat Ini
        </p>
      </div>

      <div className="relative min-h-[250px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={10}
              dataKey="value"
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={HEALTH_COLORS[entry.name as keyof typeof HEALTH_COLORS] || '#E2E8F0'}
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
          </PieChart>
        </ResponsiveContainer>

        {/* Center overlay text */}
        <div className="pointer-events-none absolute inset-0 mt-6 flex flex-col items-center justify-center">
          <span className="text-2xl leading-none font-black text-slate-900">
            {data.reduce((acc, curr) => acc + curr.value, 0)}
          </span>
          <span className="mt-1 text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
            Total SKU
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-white/40 bg-slate-50/50 p-2 text-center"
          >
            <div
              className="mx-auto mb-1 h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  HEALTH_COLORS[item.name as keyof typeof HEALTH_COLORS] || '#E2E8F0',
              }}
            ></div>
            <p className="truncate text-[9px] font-black tracking-tighter text-slate-700 uppercase">
              {item.name}
            </p>
            <p className="text-xs font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

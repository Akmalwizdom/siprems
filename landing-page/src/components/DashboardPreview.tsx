import { motion } from "framer-motion";
import { CheckCircle, TrendingUp, AlertTriangle, MessageSquare, ShoppingCart, Package } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";

// Dummy chart data
const chartData = [
  { name: "1 Jan", historis: 120, prediksi: null },
  { name: "5 Jan", historis: 150, prediksi: null },
  { name: "10 Jan", historis: 180, prediksi: null },
  { name: "15 Jan", historis: 220, prediksi: null },
  { name: "20 Jan", historis: 200, prediksi: null },
  { name: "25 Jan", historis: 280, prediksi: null },
  { name: "30 Jan", historis: 320, prediksi: 320 },
  { name: "5 Feb", historis: null, prediksi: 380 },
  { name: "10 Feb", historis: null, prediksi: 450 },
  { name: "15 Feb", historis: null, prediksi: 520 },
  { name: "20 Feb", historis: null, prediksi: 580 },
  { name: "25 Feb", historis: null, prediksi: 650 },
];

const statsCards = [
  { icon: CheckCircle, label: "Akurasi Model", value: "96% Akurasi", color: "text-success", bg: "bg-success-muted" },
  { icon: TrendingUp, label: "Tren Pertumbuhan", value: "+15% vs Bulan Lalu", color: "text-primary", bg: "bg-accent" },
  { icon: AlertTriangle, label: "Peringatan Stok", value: "3 Item Kritis", color: "text-destructive", bg: "bg-destructive-muted" },
];

const restockItems = [
  { 
    name: "Sirup Marjan", 
    category: "Minuman", 
    urgency: "High",
    currentStock: 50, 
    predictedDemand: 200, 
    suggestion: "+150" 
  },
  { 
    name: "Beras Premium 5kg", 
    category: "Sembako", 
    urgency: "High",
    currentStock: 30, 
    predictedDemand: 150, 
    suggestion: "+120" 
  },
  { 
    name: "Minyak Goreng 2L", 
    category: "Sembako", 
    urgency: "Medium",
    currentStock: 80, 
    predictedDemand: 130, 
    suggestion: "+50" 
  },
];

interface DashboardPreviewProps {
  compact?: boolean;
}

const DashboardPreview = ({ compact = false }: DashboardPreviewProps) => {
  return (
    <div className={`rounded-2xl bg-card ${compact ? "p-4" : "p-6"}`}>
      {/* Stats Cards */}
      <div className={`grid gap-4 ${compact ? "grid-cols-3 mb-4" : "grid-cols-1 sm:grid-cols-3 mb-6"}`}>
        {statsCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className={`flex items-center gap-3 rounded-xl ${stat.bg} p-4`}
          >
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
            <div>
              <p className={`text-xs text-muted-foreground ${compact ? "hidden sm:block" : ""}`}>{stat.label}</p>
              <p className={`font-semibold text-foreground ${compact ? "text-xs" : "text-sm"}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`grid gap-6 ${compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}`}>
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={`rounded-xl border border-border bg-card p-4 ${compact ? "" : "lg:col-span-2"}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
              Prediksi Penjualan
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Data Historis
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full border-2 border-primary border-dashed" />
                Prediksi AI
              </span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={compact ? 150 : 250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHistoris" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPrediksi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px"
                }} 
              />
              <Area
                type="monotone"
                dataKey="historis"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorHistoris)"
              />
              <Area
                type="monotone"
                dataKey="prediksi"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorPrediksi)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Restock Panel */}
        {!compact && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <h3 className="mb-4 font-semibold text-foreground">Rekomendasi Restock</h3>
            <div className="space-y-3">
              {restockItems.map((item, index) => (
                <div key={index} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{item.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.urgency === "High" 
                            ? "bg-destructive-muted text-destructive" 
                            : "bg-warning-muted text-warning"
                        }`}>
                          {item.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <span className="text-lg font-bold text-primary">{item.suggestion}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Stok: {item.currentStock} → Prediksi: {item.predictedDemand}</span>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <ShoppingCart className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Chatbot Widget */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 rounded-xl border border-primary/20 bg-accent p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">AI Assistant</p>
              <p className="mt-1 text-sm text-muted-foreground">
                "Analisis selesai. Permintaan <span className="font-semibold text-foreground">Sirup Marjan</span> diprediksi naik <span className="font-semibold text-primary">200%</span> menjelang Lebaran. Disarankan restock <span className="font-semibold text-primary">+500 unit</span> sekarang."
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="default" className="h-8">
                  <Package className="mr-1 h-3 w-3" />
                  Isi Stok
                </Button>
                <Button size="sm" variant="outline" className="h-8">
                  Lihat Detail
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPreview;

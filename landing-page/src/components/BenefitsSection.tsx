import { motion } from "framer-motion";
import { TrendingDown, Clock, DollarSign, AlertCircle } from "lucide-react";

const benefits = [
  {
    icon: TrendingDown,
    title: "Kurangi Overstock 40%",
    description: "Hindari pembelian berlebih dengan prediksi yang akurat berdasarkan data historis dan tren musiman.",
  },
  {
    icon: Clock,
    title: "Hemat 10 Jam/Minggu",
    description: "Otomatisasi analisis stok yang biasanya memakan waktu berjam-jam menjadi hanya beberapa klik.",
  },
  {
    icon: DollarSign,
    title: "Tingkatkan Profit 25%",
    description: "Maksimalkan keuntungan dengan stok yang tepat di waktu yang tepat, tanpa kelebihan atau kekurangan.",
  },
  {
    icon: AlertCircle,
    title: "Zero Stockout",
    description: "Dapatkan peringatan dini sebelum stok habis sehingga pelanggan selalu terlayani dengan baik.",
  },
];

const BenefitsSection = () => {
  return (
    <section className="py-20 bg-accent/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            Apa Manfaatnya untuk Bisnis Anda?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Siprems membantu Anda mengambil keputusan berbasis data, bukan intuisi
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative rounded-2xl border border-border bg-card p-6 hover-lift"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;

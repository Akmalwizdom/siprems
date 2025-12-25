import { motion } from "framer-motion";
import DashboardPreview from "./DashboardPreview";

const DemoSection = () => {
  return (
    <section id="prediksi" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            Lihat Dashboard Prediksi
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Preview interaktif dari sistem prediksi stok kami dengan data simulasi
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-border bg-gradient-to-b from-card to-accent/20 p-2 shadow-xl"
        >
          {/* Browser Chrome */}
          <div className="flex items-center gap-2 rounded-t-2xl bg-muted/50 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-warning/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
            </div>
            <div className="ml-4 flex-1 rounded-lg bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
              app.siprems.id/dashboard
            </div>
          </div>
          
          {/* Dashboard Content */}
          <div className="rounded-b-2xl bg-background p-4">
            <DashboardPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;

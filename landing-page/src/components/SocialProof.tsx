import { motion } from "framer-motion";

const logos = [
  { name: "Indomaret", initial: "I" },
  { name: "Alfamart", initial: "A" },
  { name: "Tokopedia", initial: "T" },
  { name: "Shopee", initial: "S" },
  { name: "Bukalapak", initial: "B" },
  { name: "Grab", initial: "G" },
];

const SocialProof = () => {
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-sm font-medium text-muted-foreground">
            Dipercaya oleh 500+ bisnis di Indonesia
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {logos.map((logo, index) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <span className="text-lg font-bold">{logo.initial}</span>
              </div>
              <span className="text-sm font-medium hidden sm:block">{logo.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            Keamanan Data Terjamin
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            ISO 27001 Certified
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            99.9% Uptime
          </span>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;

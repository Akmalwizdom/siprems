import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "Bagaimana cara mengintegrasikan dengan sistem POS saya?",
    answer: "Siprems mendukung integrasi dengan berbagai sistem POS populer seperti Moka, iSeller, Olsera, dan banyak lagi. Kami juga menyediakan API untuk integrasi custom. Tim teknis kami akan membantu proses setup yang biasanya memakan waktu 1-2 hari kerja.",
  },
  {
    question: "Seberapa akurat prediksi yang diberikan?",
    answer: "Akurasi prediksi kami rata-rata mencapai 96% untuk data dengan histori minimal 3 bulan. Semakin banyak data historis yang tersedia, semakin akurat prediksi yang dihasilkan. Sistem kami juga terus belajar dan meningkatkan akurasi seiring waktu.",
  },
  {
    question: "Apakah data saya aman?",
    answer: "Keamanan data adalah prioritas utama kami. Siprems menggunakan enkripsi end-to-end, tersertifikasi ISO 27001, dan data Anda disimpan di server yang berlokasi di Indonesia. Kami tidak pernah membagikan data Anda kepada pihak ketiga.",
  },
  {
    question: "Berapa lama waktu yang dibutuhkan untuk melihat hasil?",
    answer: "Setelah integrasi selesai, Anda bisa langsung melihat prediksi awal dalam hitungan jam. Untuk hasil yang optimal, kami merekomendasikan penggunaan selama minimal 2 minggu agar sistem dapat mempelajari pola bisnis Anda dengan lebih baik.",
  },
  {
    question: "Apakah ada dukungan untuk bisnis kecil?",
    answer: "Ya! Siprems memiliki paket khusus untuk UMKM dengan harga terjangkau dan fitur yang disesuaikan. Kami percaya setiap bisnis berhak mendapatkan akses ke teknologi prediksi stok yang canggih.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan umum tentang Siprems
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/50 transition-colors"
              >
                <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-6 text-muted-foreground">{faq.answer}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

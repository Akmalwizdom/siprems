import { useState, useEffect } from 'react';
import { Zap, AlertTriangle, Clock, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiService, type PredictionResponse, type ModelAccuracyResponse } from '../services/api';
import { geminiService, type ChatMessage, type CommandAction } from '../services/gemini';
import { PredictionData, RestockRecommendation } from '../types';
import { Button } from '../components/ui/button';
import { AdminOnly } from '../components/auth/RoleGuard';
import Loader from '../components/common/Loader';
import { usePrediction } from '../hooks';

// Modular components
import {
  PredictionHeader,
  PredictionSummaryCards,
  PredictionChart,
  RecommendationCards,
  TrendAnalysis,
  RestockModal,
  ChatBot,
} from '../components/prediction';

type PredictionState = 'idle' | 'loading' | 'result' | 'learning' | 'error';
type PredictionRange = 7 | 30 | 90;

export function SmartPrediction() {
  const { events } = useStore();
  const [predictionRange, setPredictionRange] = useState<PredictionRange>(30);
  const { cachedData, hasCachedData, runPrediction, updateRecommendations } =
    usePrediction(predictionRange);

  const [state, setState] = useState<PredictionState>('idle');
  const [predictionData, setPredictionData] = useState<PredictionData[]>([]);
  const [restockRecommendations, setRestockRecommendations] = useState<RestockRecommendation[]>([]);
  const [predictionMeta, setPredictionMeta] = useState<PredictionResponse['meta'] | null>(null);
  const [eventAnnotations, setEventAnnotations] = useState<PredictionResponse['eventAnnotations']>(
    []
  );
  const [error, setError] = useState<string>('');
  const [restockingProduct, setRestockingProduct] = useState<string | null>(null);
  const [forecastAccuracy, setForecastAccuracy] = useState<number | null>(null);
  const [accuracyDetails, setAccuracyDetails] = useState<ModelAccuracyResponse | null>(null);
  const [dataFreshnessWarning, setDataFreshnessWarning] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Saya adalah asisten AI Anda. Klik "Mulai Prediksi" untuk menghasilkan perkiraan stok berdasarkan kalender acara dan riwayat penjualan Anda.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<CommandAction | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedRestockProduct, setSelectedRestockProduct] =
    useState<RestockRecommendation | null>(null);

  useEffect(() => {
    if (hasCachedData && cachedData) {
      setPredictionData(cachedData.predictionData);
      setRestockRecommendations(cachedData.restockRecommendations);
      setPredictionMeta(cachedData.predictionMeta);
      setEventAnnotations(cachedData.eventAnnotations || []);
      setDataFreshnessWarning(cachedData.dataFreshnessWarning);
      setForecastAccuracy(cachedData.forecastAccuracy);
      setAccuracyDetails(cachedData.accuracyDetails);
      setState('result');
    }
  }, [hasCachedData, cachedData, predictionRange]);

  const handleStartPrediction = async (days?: PredictionRange) => {
    setState('loading');
    setError('');
    const daysToUse = days || predictionRange;
    if (days && days !== predictionRange) setPredictionRange(days);

    try {
      const result = await runPrediction();
      if (result) {
        setPredictionData(result.predictionData);
        setRestockRecommendations(result.restockRecommendations);
        setPredictionMeta(result.predictionMeta);
        setEventAnnotations(result.eventAnnotations || []);
        setDataFreshnessWarning(result.dataFreshnessWarning);
        setForecastAccuracy(result.forecastAccuracy);
        setAccuracyDetails(result.accuracyDetails);

        const firstHoliday = result.predictionData?.find?.((d) => d.isHoliday);
        setChatMessages([
          {
            role: 'assistant',
            content: firstHoliday
              ? `Lonjakan penjualan diprediksi sekitar ${firstHoliday.date} karena ${firstHoliday.holidayName}.`
              : `Prediksi selesai. Tinjau perkiraan dan rekomendasi di bawah ini.`,
          },
        ]);
        setState('result');
      } else {
        setError('Prediksi gagal. Silakan coba lagi.');
        setState('error');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil prediksi dari server');
      setState('error');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMessage = chatInput;
    setChatInput('');
    setIsChatLoading(true);
    const updatedMessages: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: userMessage },
    ];
    setChatMessages(updatedMessages);

    try {
      const { response, action } = await geminiService.chat(userMessage, null, updatedMessages);
      setChatMessages([
        ...updatedMessages,
        { role: 'assistant', content: response || 'Maaf, tidak dapat memproses permintaan Anda.' },
      ]);
      if (action?.needsConfirmation) setPendingAction(action);
    } catch (error) {
      setChatMessages([
        ...updatedMessages,
        { role: 'assistant', content: 'Gagal memproses permintaan Anda.' },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRestock = async (productId: string, quantity: number): Promise<boolean> => {
    setRestockingProduct(productId);
    try {
      await apiService.restockProduct(productId, quantity);
      setRestockRecommendations((prev) => prev.filter((item) => item.productId !== productId));
      updateRecommendations(productId);
      return true;
    } catch (error) {
      return false;
    } finally {
      setRestockingProduct(null);
    }
  };

  if (state === 'error')
    return (
      <div className="animate-slide-up mx-auto max-w-2xl py-20 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
        <h1 className="mb-2 text-2xl font-black tracking-tight text-slate-900">
          Kesalahan Prediksi
        </h1>
        <p className="mb-8 font-medium text-slate-500">{error}</p>
        <Button
          onClick={() => setState('idle')}
          size="lg"
          className="bronze-gradient shadow-bronze-200 shadow-lg"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    );

  if (state === 'idle')
    return (
      <div className="animate-slide-up mx-auto max-w-2xl py-20 text-center">
        <div className="bronze-gradient shadow-bronze-100/50 mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] border-4 border-white/50 shadow-2xl">
          <Zap className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-4 text-4xl font-black tracking-tight text-slate-900 italic">
          Perencanaan Stok <span className="text-bronze-600 not-italic">Strategis.</span>
        </h1>
        <p className="mb-12 px-4 leading-relaxed font-medium text-slate-500">
          Artificial Intelligence kami menganalisis riwayat penjualan, tren musiman, dan hari libur
          mendatang untuk memprediksi permintaan optimal dengan akurasi tinggi.
        </p>
        <AdminOnly>
          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={() => handleStartPrediction(7)}
              className="group flex h-14 items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-8 backdrop-blur-sm transition-all hover:translate-y-[-2px] hover:bg-white hover:shadow-xl active:scale-95"
            >
              <Clock className="group-hover:text-bronze-500 h-5 w-5 text-slate-400 transition-colors" />
              <span className="text-xs font-black tracking-widest text-slate-600 uppercase">
                7 Hari
              </span>
            </button>

            <button
              onClick={() => handleStartPrediction(30)}
              className="group bronze-gradient shadow-bronze-200 flex h-14 items-center gap-3 rounded-2xl px-10 shadow-xl transition-all hover:translate-y-[-2px] hover:shadow-2xl active:scale-95"
            >
              <Zap className="h-5 w-5 animate-pulse text-white" />
              <span className="text-xs font-black tracking-widest text-white uppercase">
                Mulai Analisis 30 Hari
              </span>
            </button>

            <button
              onClick={() => handleStartPrediction(90)}
              className="group flex h-14 items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-8 backdrop-blur-sm transition-all hover:translate-y-[-2px] hover:bg-white hover:shadow-xl active:scale-95"
            >
              <CalendarIcon className="group-hover:text-bronze-500 h-5 w-5 text-slate-400 transition-colors" />
              <span className="text-xs font-black tracking-widest text-slate-600 uppercase">
                90 Hari
              </span>
            </button>
          </div>
        </AdminOnly>
      </div>
    );

  if (state === 'loading')
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative">
          <div className="bronze-gradient absolute inset-0 animate-pulse opacity-20 blur-3xl"></div>
          <Loader className="relative z-10" />
        </div>
        <p className="text-bronze-600 mt-8 animate-pulse text-xs font-black tracking-[0.3em] uppercase">
          Menganalisis Strategi Bisnis Anda...
        </p>
      </div>
    );

  return (
    <div className="animate-slide-up space-y-10 pb-20">
      <PredictionHeader
        predictionRange={predictionRange}
        onRangeChange={handleStartPrediction}
        date={new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      />

      {dataFreshnessWarning && (
        <div className="flex items-center gap-5 rounded-3xl border border-amber-200 bg-linear-to-r from-amber-50 to-white p-5 shadow-lg shadow-amber-100/20">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-200">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-slate-900 uppercase">
              {dataFreshnessWarning}
            </p>
            <p className="text-xs font-bold text-amber-600/80">
              Sinkronisasi data penjualan diperlukan untuk mempertahankan akurasi AI.
            </p>
          </div>
        </div>
      )}

      <PredictionSummaryCards
        forecastAccuracy={forecastAccuracy}
        accuracyDetails={accuracyDetails}
        appliedFactor={predictionMeta?.applied_factor ?? 1}
        dataFreshnessWarning={dataFreshnessWarning}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <PredictionChart data={predictionData} events={events} range={predictionRange} />
          <TrendAnalysis
            growthPercentage={
              (predictionMeta?.applied_factor ? predictionMeta.applied_factor - 1 : 0) * 100
            }
            accuracy={forecastAccuracy}
            hasHolidaySpike={!!predictionData.find((d) => d.isHoliday)}
            holidayName={predictionData.find((d) => d.isHoliday)?.holidayName}
          />
        </div>
        <div className="space-y-10">
          <RecommendationCards
            recommendations={restockRecommendations}
            onRestock={(item) => {
              setSelectedRestockProduct(item);
              setIsRestockModalOpen(true);
            }}
            restockingProduct={restockingProduct}
          />
          <ChatBot
            messages={chatMessages}
            input={chatInput}
            setInput={setChatInput}
            onSend={handleSendMessage}
            isLoading={isChatLoading}
            pendingAction={pendingAction}
            onConfirmAction={async () => {
              if (pendingAction?.type === 'restock' && pendingAction.productId) {
                await handleRestock(pendingAction.productId, pendingAction.quantity || 0);
                setPendingAction(null);
              }
            }}
            onCancelAction={() => setPendingAction(null)}
          />
        </div>
      </div>

      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        item={selectedRestockProduct}
        onConfirm={async (qty) => {
          if (selectedRestockProduct) {
            await handleRestock(selectedRestockProduct.productId, qty);
            setIsRestockModalOpen(false);
          }
        }}
      />
    </div>
  );
}

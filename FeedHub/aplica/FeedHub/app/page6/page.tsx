'use client';

import { useEffect, useState, Suspense } from "react"; // Importe Suspense aqui
import { useSearchParams } from "next/navigation";
import { LogoPlace } from "@/components/logo-place";
import FeedbackCard from "@/components/feedback-card";
import { Download, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- VARIÁVEIS DE AMBIENTE ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("Erro: NEXT_PUBLIC_API_BASE_URL não está definida! As chamadas de API e conexões WebSocket podem falhar.");
}
// -------------------------------

interface Feedback {
  studentId: string;
  message: string;
  timestamp: number;
  rating?: number;
  pin?: string;
}

// Componente Wrapper para lidar com o Suspense
// Exportamos este como o default para a página
export default function StudentFeedbackDashboardWrapper() {
  return (
    // O fallback será exibido enquanto o componente interno está carregando.
    <Suspense fallback={
        <div className="h-screen flex items-center justify-center text-xl text-gray-600">
            Carregando painel de feedbacks...
        </div>
    }>
      <StudentFeedbackDashboardContent /> {/* Nosso componente real com a lógica */}
    </Suspense>
  );
}

// Componente que contém toda a lógica e o JSX da sua página de dashboard
function StudentFeedbackDashboardContent() {
  const searchParams = useSearchParams(); // useSearchParams() agora está seguro aqui!
  const pin = searchParams.get("pin") || "";

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Busca feedbacks do back-end via REST
  useEffect(() => {
    if (!pin) {
        // Se o PIN não estiver presente, pode ser um erro ou o professor ainda não selecionou a sala.
        // Você pode adicionar um tratamento de erro ou redirecionamento aqui, se necessário.
        console.warn("PIN da sala não encontrado na URL para o dashboard de feedbacks.");
        setError("PIN da sala ausente. Por favor, acesse esta página através do painel do professor.");
        return;
    }

    if (!API_BASE_URL) {
      setError("Configuração de API inválida. Contate o suporte.");
      return;
    }

    const fetchFeedbacks = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${pin}/feedbacks`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Aguardando Feedbacks: ${errorData.message || 'Erro desconhecido'}`);
        }

        const data = await response.json();
        setFeedbacks(data.feedbacks || []);
      } catch (err: any) {
        setError(err.message || "Erro desconhecido ao buscar feedbacks.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [pin, API_BASE_URL]); // Adicione API_BASE_URL como dependência

  // WebSocket para receber feedbacks em tempo real
  useEffect(() => {
    if (!pin) return;

    if (!API_BASE_URL) {
        console.error("Erro: API_BASE_URL não está definida para conexão WebSocket.");
        return;
    }

    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsHost = API_BASE_URL.split('//')[1];
    const wsUrl = `${wsProtocol}://${wsHost}/ws/rooms/${pin}`;

    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "feedback") {
          setFeedbacks((prev) => {
            if (
              prev.some(
                (fb) => fb.studentId === message.data.studentId && fb.timestamp === message.data.timestamp
              )
            )
              return prev;
            return [...prev, message.data];
          });
        }
      } catch (err) {
        console.error("Erro ao processar mensagem WebSocket:", err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket desconectado.');
    };

    socket.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
      setError("Erro de conexão com o WebSocket. Tente recarregar a página.");
    };

    return () => socket.close();
  }, [pin, API_BASE_URL]); // Adicione API_BASE_URL como dependência

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <header className="container mx-auto p-4 flex justify-between items-center">
        <LogoPlace />
        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-sky-500 hover:bg-sky-100"
            aria-label="Capturar foto"
          >
            <Camera className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-sky-500 hover:bg-sky-100"
            aria-label="Baixar feedbacks"
          >
            <Download className="w-6 h-6" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-12">
        <h1 className="text-3xl font-bold text-gray-800 my-6">Feedbacks - Sala {pin}</h1>

        {loading && <p className="text-center text-gray-500">Carregando feedbacks...</p>}
        {error && <p className="text-center text-red-600">{error}</p>}

        {!loading && !error && feedbacks.length === 0 && (
          <p className="text-center text-gray-600">Nenhum feedback enviado ainda.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedbacks.map((feedback) => (
            <FeedbackCard
              key={`${feedback.studentId}-${feedback.timestamp}`}
              rating={feedback.rating ?? 0}
              name="Feedback"
              studentName={feedback.studentId}
              comment={feedback.message}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
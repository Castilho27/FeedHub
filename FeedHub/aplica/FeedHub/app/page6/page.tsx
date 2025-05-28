"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogoPlace } from "@/components/logo-place";
import FeedbackCard from "@/components/feedback-card"; // Importe o FeedbackCard
import { Download, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- ADICIONE ESTAS LINHAS AQUI ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Recomendação: Adicione uma verificação para garantir que a URL esteja definida
if (!API_BASE_URL) {
  console.error("Erro: NEXT_PUBLIC_API_BASE_URL não está definida! As chamadas de API e conexões WebSocket podem falhar.");
}
// -------------------------------

interface Feedback {
  studentId: string;
  message: string;
  timestamp: number;
  rating?: number; // Este campo deve conter a nota
  pin?: string;    // O pin ainda pode vir, mas não será o valor principal da bolinha
}

export default function StudentFeedbackDashboard() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Busca feedbacks do back-end via REST
  useEffect(() => {
    if (!pin) return;

    // --- ADICIONE ESTA VERIFICAÇÃO ANTES DA CHAMADA DE API ---
    if (!API_BASE_URL) {
      setError("Configuração de API inválida. Contate o suporte.");
      return;
    }
    // -----------------------------------------------------------

    const fetchFeedbacks = async () => {
      setLoading(true);
      setError("");
      try {
        // --- MODIFIQUE ESTA LINHA ---
        const response = await fetch(`${API_BASE_URL}/api/rooms/${pin}/feedbacks`);
        // --------------------------
        if (!response.ok) throw new Error(`Aguardando Feedbacks:`);

        const data = await response.json();
        setFeedbacks(data.feedbacks || []);
      } catch (err: any) {
        setError(err.message || "Erro desconhecido ao buscar feedbacks.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [pin]); // Adicione API_BASE_URL como dependência se `fetchFeedbacks` usar diretamente o estado de `API_BASE_URL` ou se houver um `toast.error`

  // WebSocket para receber feedbacks em tempo real
  useEffect(() => {
    if (!pin) return;

    // --- ADICIONE ESTA VERIFICAÇÃO ANTES DA CONEXÃO WS ---
    if (!API_BASE_URL) {
        console.error("Erro: API_BASE_URL não está definida para conexão WebSocket.");
        return;
    }

    // Para WebSocket, você precisa determinar se é http ou https.
    // Assumindo que se a API_BASE_URL é https, o WebSocket também é wss.
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${API_BASE_URL.split('//')[1]}/ws/rooms/${pin}`;
    // ---------------------------------------------------

    // --- MODIFIQUE ESTA LINHA ---
    const socket = new WebSocket(wsUrl);
    // --------------------------

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "feedback") {
          setFeedbacks((prev) => {
            // Evita duplicados com base em studentId + timestamp
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
  }, [pin]); // Adicione API_BASE_URL como dependência

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
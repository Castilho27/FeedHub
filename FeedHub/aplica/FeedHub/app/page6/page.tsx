'use client'

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogoPlace } from "@/components/logo-place";
import FeedbackCard  from "@/components/feedback-card";
import { Download, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Feedback {
  // Removi o id obrigatório, pois parece que o backend não envia
  studentId: string;
  message: string;
  timestamp: number;
  rating?: number;
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

    const fetchFeedbacks = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`http://localhost:3001/api/rooms/${pin}/feedbacks`);
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
  }, [pin]);

  // WebSocket para receber feedbacks em tempo real
  useEffect(() => {
    if (!pin) return;

    const socket = new WebSocket(`ws://localhost:3001/ws/rooms/${pin}`);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "feedback") {
          setFeedbacks((prev) => {
            // Evita duplicados com base em studentId + timestamp
            if (prev.some(fb => fb.studentId === message.data.studentId && fb.timestamp === message.data.timestamp)) return prev;
            return [...prev, message.data];
          });
        }
      } catch (err) {
        console.error("Erro ao processar mensagem WebSocket:", err);
      }
    };

    return () => socket.close();
  }, [pin]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <header className="container mx-auto p-4 flex justify-between items-center">
        <LogoPlace />
        <div className="flex gap-4">
          <Button variant="ghost" size="icon" className="text-sky-500 hover:bg-sky-100" aria-label="Capturar foto">
            <Camera className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-sky-500 hover:bg-sky-100" aria-label="Baixar feedbacks">
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
              rating={feedback.rating ?? 5} // valor padrão 5
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

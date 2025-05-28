'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

// --- ADICIONE ESTAS LINHAS AQUI ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Recomendação: Adicione uma verificação para garantir que a URL esteja definida
if (!API_BASE_URL) {
  console.error("Erro: NEXT_PUBLIC_API_BASE_URL não está definida! As chamadas de API e conexões WebSocket podem falhar.");
}
// -------------------------------

export default function FeedbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const pin = searchParams.get('pin') || '';
  const studentId = searchParams.get('student_id') || '';
  const initialQuestion = searchParams.get('question') || 'Como você se sentiu com essa atividade?';

  const [selectedRating, setSelectedRating] = useState<number>(8);
  const [comment, setComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [roomQuestion, setRoomQuestion] = useState<string>(initialQuestion);

  const webSocketRef = useRef<WebSocket | null>(null);

  // NOVO: console.log para ver o valor inicial e em cada render
  console.log("FeedbackPage renderizada. roomQuestion atual:", roomQuestion);

  useEffect(() => {
    // NOVO: console.log para ver o valor de pin e studentId no useEffect
    console.log("useEffect [pin, studentId, router] ativado.");
    console.log("PIN:", pin);
    console.log("Student ID:", studentId);
    console.log("Initial Question from URL:", initialQuestion);

    if (!pin || !studentId) {
      toast.error('PIN da sala ou ID do estudante ausente. Redirecionando...');
      router.push('/');
      return;
    }

    // --- ADICIONE ESTA VERIFICAÇÃO ANTES DA CONEXÃO WS ---
    if (!API_BASE_URL) {
        toast.error('Configuração de API inválida. Contate o suporte.');
        return;
    }

    // Para WebSocket, você precisa determinar se é http ou https.
    // Assumindo que se a API_BASE_URL é https, o WebSocket também é wss.
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${API_BASE_URL.split('//')[1]}/ws/rooms/${pin}?student_id=${studentId}`;
    // ---------------------------------------------------

    // --- MODIFIQUE ESTA LINHA ---
    const ws = new WebSocket(wsUrl);
    // --------------------------
    webSocketRef.current = ws;

    ws.onopen = () => {
      console.log(`WebSocket conectado para sala ${pin} como aluno ${studentId}`);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'question-update') {
        // NOVO: Logs detalhados para a mensagem
        console.log('Mensagem WebSocket recebida:', message);
        console.log('Tipo da mensagem:', message.type);
        console.log('Valor de message.question:', message.question);
        console.log('Tipo de message.question:', typeof message.question); // <-- MUITO IMPORTANTE!

        setRoomQuestion(message.question);
        console.log('Estado roomQuestion atualizado para:', message.question); // Confirma a atualização do estado
        toast('A pergunta da atividade foi atualizada!');
      }
    };

    ws.onerror = (error) => {
      console.error('Erro no WebSocket do aluno:', error);
      toast.error('Erro de conexão com a sala. Tente recarregar.');
    };

    ws.onclose = () => {
      console.log('WebSocket do aluno desconectado.');
    };

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [pin, studentId, router, initialQuestion]); // Adicionado initialQuestion e API_BASE_URL como dependências

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!pin) throw new Error('PIN da sala inválido');
      if (!studentId) throw new Error('ID do estudante não encontrado');

      // --- ADICIONE ESTA VERIFICAÇÃO ANTES DA CHAMADA DE API ---
      if (!API_BASE_URL) {
        toast.error('Configuração de API inválida. Contate o suporte.');
        setIsLoading(false); // Reseta o estado de carregamento
        return;
      }
      // -----------------------------------------------------------

      // --- MODIFIQUE ESTA LINHA ---
      const response = await fetch(`${API_BASE_URL}/api/rooms/${pin}/feedback`, {
      // --------------------------
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'student-id': studentId,
          pin: pin,
          rating: selectedRating,
          comment: comment,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || 'Erro ao enviar feedback');

      toast.success('Feedback enviado com sucesso!');
      setComment('');
      router.push(`/page7`);
    } catch (error: any) {
      toast.error(`Falha no envio: ${error.message}`);
      console.error('Erro detalhado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm p-8 relative">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>

        <h1 className="text-center text-2xl md:text-3xl font-medium text-slate-700 mb-8">
          {roomQuestion}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 md:gap-3 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => setSelectedRating(number)}
                className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-sm md:text-base font-medium transition-colors
                  ${
                    selectedRating === number
                      ? 'bg-blue-400 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {number}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nos conte o motivo da sua nota..."
              className="w-full h-32 p-4 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !comment.trim()}
            className={`w-full bg-blue-400 hover:bg-blue-500 text-white font-medium py-4 rounded-xl transition-colors
              ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
              ${!comment.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Enviando...' : 'Enviar feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
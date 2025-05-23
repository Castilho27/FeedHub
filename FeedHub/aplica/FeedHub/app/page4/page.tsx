'use client';

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react"; // Importe useRef
import Image from "next/image";

export default function ProfileContent() {
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState("Convidado");
  const [currentAvatarColor, setCurrentAvatarColor] = useState("#A8CFF5");
  const [roomPin, setRoomPin] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  // Usar useRef para o WebSocket permite que a função de limpeza sempre acesse a instância correta
  const webSocketRef = useRef<WebSocket | null>(null); // ALTERAÇÃO AQUI!
  const [connectedStudents, setConnectedStudents] = useState<any[]>([]);

  useEffect(() => {
    const nameFromUrl = searchParams.get("name");
    const pinFromUrl = searchParams.get("pin");
    const colorFromUrl = searchParams.get("color");
    const studentIdFromUrl = searchParams.get("student_id");

    console.log("DEBUG_FRONTEND: searchParams lidos (page4):", { nameFromUrl, pinFromUrl, colorFromUrl, studentIdFromUrl }); // NOVO LOG

    if (nameFromUrl) setUserName(decodeURIComponent(nameFromUrl));
    if (pinFromUrl) setRoomPin(decodeURIComponent(pinFromUrl));
    if (colorFromUrl) setCurrentAvatarColor(decodeURIComponent(colorFromUrl));
    
    // ATENÇÃO: Verifique se o studentIdFromUrl está correto aqui!
    if (studentIdFromUrl) {
      setStudentId(decodeURIComponent(studentIdFromUrl));
    } else {
      console.error("DEBUG_FRONTEND: ERRO! student_id não encontrado na URL para page4. Isso é crítico!"); // NOVO LOG DE ERRO
      // Considere redirecionar para uma página de erro ou login se o ID for essencial
      // return; // Interrompe a execução para evitar problemas neste ponto se não houver studentId
    }

    // Só tentar conectar o WebSocket se tivermos todos os dados necessários E AINDA NÃO ESTIVER CONECTADO
    if (pinFromUrl && studentIdFromUrl && (!webSocketRef.current || webSocketRef.current.readyState === WebSocket.CLOSED)) {
      console.log(`DEBUG_FRONTEND: Tentando conectar WebSocket. PIN=${pinFromUrl}, StudentID=${studentIdFromUrl}`); // NOVO LOG
      
      const ws = new WebSocket(`ws://localhost:3001/ws/rooms/${pinFromUrl}?student_id=${studentIdFromUrl}`);
      webSocketRef.current = ws; // Salva a instância no ref // ALTERAÇÃO AQUI!
      console.log(`DEBUG_FRONTEND: WebSocket URL para conexão: ws://localhost:3001/ws/rooms/${pinFromUrl}?student_id=${studentIdFromUrl}`); // NOVO LOG

      ws.onopen = () => {
        console.log(`DEBUG_FRONTEND: WebSocket CONECTADO. Sala: ${pinFromUrl}, ID: ${studentIdFromUrl}`); // NOVO LOG
        // Você pode querer fazer uma requisição inicial para a lista de alunos aqui
        // se o backend não envia a lista completa no open
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('DEBUG_FRONTEND: Mensagem WebSocket recebida:', message); // NOVO LOG
        if (message.type === 'student-list-update') {
          console.log('DEBUG_FRONTEND: Lista de alunos atualizada via WebSocket:', message.students); // NOVO LOG
          setConnectedStudents(message.students);
        }
        // Lógica para outros tipos de mensagens
      };

      ws.onclose = (event) => {
        console.log(`DEBUG_FRONTEND: WebSocket DESCONECTADO (onclose). Código: ${event.code}, Razão: ${event.reason}`); // NOVO LOG
        webSocketRef.current = null; // Limpa a ref // ALTERAÇÃO AQUI!
      };

      ws.onerror = (error) => {
        console.error('DEBUG_FRONTEND: Erro no WebSocket (onerror):', error); // NOVO LOG
        webSocketRef.current = null; // Limpa a ref em caso de erro // ALTERAÇÃO AQUI!
      };
    } else if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        console.log("DEBUG_FRONTEND: WebSocket já está conectado e aberto. Não reconectando."); // NOVO LOG
    } else {
        console.log("DEBUG_FRONTEND: Condições para conexão WebSocket não atendidas (PIN/StudentID faltando ou WS em estado intermediário)."); // NOVO LOG
    }

    // Função de limpeza: Fecha o WebSocket quando o componente é desmontado
    return () => {
      console.log("DEBUG_FRONTEND: Função de limpeza do useEffect sendo executada."); // NOVO LOG
      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) { // Verifica se está aberto antes de tentar fechar // ALTERAÇÃO AQUI!
        console.log("DEBUG_FRONTEND: Fechando WebSocket ativo de page4 através da função de limpeza..."); // NOVO LOG
        webSocketRef.current.close(1000, "Component unmounted"); // 1000 é o código de fechamento normal
      } else {
        console.log("DEBUG_FRONTEND: Nenhum WebSocket ativo ou em estado de fechamento/fechado para fechar na limpeza."); // NOVO LOG
      }
    };
  }, [searchParams]); // REMOVI webSocket como dependência, pois estamos usando useRef // ALTERAÇÃO AQUI!

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/Images/Fundo1.png"
          alt="Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-sky-50/80" />
      </div>

      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        <div className="flex justify-center mb-6">
          <div className="w-32 h-auto relative">
            <Image
              src="/images/logo1.png"
              alt="FeedHub Logo"
              width={128}
              height={43}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-5 flex flex-col items-center w-full flex-grow-0 min-h-0 overflow-auto">
          <div className="mb-4">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-md"
              style={{ backgroundColor: currentAvatarColor }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div
            className="w-full mt-3 text-white rounded-lg p-3 text-center"
            style={{ backgroundColor: currentAvatarColor }}
          >
            <span className="font-medium text-lg">{userName}</span>
          </div>

          <div className="w-full mt-3 bg-white border border-[#E9F2FC] rounded-full p-3 text-center">
            <h2 className="text-[#1A3E55] text-base font-medium">
              Confira se está no Hub
            </h2>
            {roomPin && <p className="text-gray-500 text-sm mt-1">PIN da Sala: <span className="font-semibold">{roomPin}</span></p>}
          </div>

          <p className="mt-4 text-gray-600 text-center">
            Aguardando o professor iniciar a sessão...
          </p>

          {/* MANTENHA A LISTA DE ALUNOS AQUI PARA DEPURAR, POR FAVOR. */}
          <div className="w-full mt-4 p-3 bg-gray-100 rounded-lg">
            <h3 className="text-gray-700 text-md font-semibold mb-2">Alunos Conectados (DEBUG):</h3>
            {connectedStudents.length > 0 ? (
              <ul>
                {connectedStudents.map((student) => (
                  <li key={student.student_id || Math.random()} className="text-gray-800 text-sm py-1">
                    {student.name} ({student.student_id || 'ID Nulo'})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum aluno conectado (aguardando broadcast).</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
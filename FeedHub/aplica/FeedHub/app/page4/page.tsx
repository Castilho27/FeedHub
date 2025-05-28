'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react"; // Importe Suspense aqui
import Image from "next/image";
import toast from 'react-hot-toast'; // Adicionei o toast para mensagens mais amigáveis

// --- VARIÁVEIS DE AMBIENTE ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("Erro: NEXT_PUBLIC_API_BASE_URL não está definida! As conexões WebSocket podem falhar.");
}
// -------------------------------

// Componente Wrapper para lidar com o Suspense
// Exportamos este como o default para a página
export default function ProfilePageWrapper() {
  return (
    // O fallback é o que será exibido enquanto o componente interno está carregando.
    // É importante para uma experiência de usuário suave.
    <Suspense fallback={
        <div className="h-screen flex items-center justify-center text-xl text-gray-600">
            Carregando perfil do aluno...
        </div>
    }>
      <ProfileContent /> {/* Nosso componente real com a lógica */}
    </Suspense>
  );
}

// Componente que contém toda a lógica e o JSX da sua página de perfil
function ProfileContent() {
  const searchParams = useSearchParams(); // useSearchParams() agora está seguro aqui!
  const router = useRouter();

  const [userName, setUserName] = useState("Convidado");
  const [currentAvatarColor, setCurrentAvatarColor] = useState("#A8CFF5");
  const [roomPin, setRoomPin] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const [connectedStudents, setConnectedStudents] = useState<any[]>([]);

  useEffect(() => {
    const nameFromUrl = searchParams.get("name");
    const pinFromUrl = searchParams.get("pin");
    const colorFromUrl = searchParams.get("color");
    const studentIdFromUrl = searchParams.get("student_id");

    if (nameFromUrl) setUserName(decodeURIComponent(nameFromUrl));
    if (pinFromUrl) setRoomPin(decodeURIComponent(pinFromUrl));
    if (colorFromUrl) setCurrentAvatarColor(decodeURIComponent(colorFromUrl));
    if (studentIdFromUrl) {
      setStudentId(decodeURIComponent(studentIdFromUrl));
    } else {
      console.error("student_id não encontrado na URL para page4.");
      toast.error("Erro: ID do aluno não encontrado. Redirecionando.");
      router.push('/'); // Redireciona se o ID do aluno for crucial e estiver faltando
    }

    // Estabelece WebSocket se pin e studentId existirem e não estiver conectado
    if (
      pinFromUrl &&
      studentIdFromUrl &&
      (!webSocketRef.current || webSocketRef.current.readyState === WebSocket.CLOSED)
    ) {
      if (!API_BASE_URL) {
          console.error("Erro: API_BASE_URL não está definida para conexão WebSocket.");
          toast.error("Erro de configuração. Contate o suporte.");
          return;
      }

      const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
      const wsHost = API_BASE_URL.split('//')[1]; // Remove "http://" or "https://"
      const wsUrl = `${wsProtocol}://${wsHost}/ws/rooms/${pinFromUrl}?student_id=${studentIdFromUrl}`;

      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;

      ws.onopen = () => {
        console.log(`WebSocket conectado. Sala: ${pinFromUrl}, ID: ${studentIdFromUrl}`);
        toast.success("Conectado à sala!");
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Mensagem WebSocket recebida:", message);

        if (message.type === "student-list-update") {
          setConnectedStudents(message.students);
        }

        if (message.type === "start" || message.type === "activity-started") {
          console.log("Recebido evento de início da atividade, redirecionando para page5...");
          toast("Atividade iniciada pelo professor!");
          router.push(
            `/page5?pin=${pinFromUrl}&student_id=${studentIdFromUrl}&name=${encodeURIComponent(userName)}`
          );
        }
      };

      ws.onclose = () => {
        console.log("WebSocket desconectado.");
        toast.error("Conexão com a sala perdida. Tente recarregar a página.");
        webSocketRef.current = null;
      };

      ws.onerror = (error) => {
        console.error("Erro no WebSocket:", error);
        toast.error("Erro na conexão WebSocket. Verifique sua rede.");
        webSocketRef.current = null;
      };
    }
  }, [searchParams, router, userName, API_BASE_URL]); // Adicione API_BASE_URL como dependência

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image src="/Images/Fundo1.png" alt="Background" fill className="object-cover" />
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
            <h2 className="text-[#1A3E55] text-base font-medium">Confira se está no Hub</h2>
            {roomPin && (
              <p className="text-gray-500 text-sm mt-1">
                PIN da Sala: <span className="font-semibold">{roomPin}</span>
              </p>
            )}
          </div>

          <p className="mt-4 text-gray-600 text-center">
            Aguardando o professor iniciar a sessão...
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function ProfileContent() {
  const searchParams = useSearchParams();
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
    }

    // Estabelece WebSocket se pin e studentId existirem e não estiver conectado
    if (
      pinFromUrl &&
      studentIdFromUrl &&
      (!webSocketRef.current || webSocketRef.current.readyState === WebSocket.CLOSED)
    ) {
      const ws = new WebSocket(
        `ws://localhost:3001/ws/rooms/${pinFromUrl}?student_id=${studentIdFromUrl}`
      );
      webSocketRef.current = ws;

      ws.onopen = () => {
        console.log(`WebSocket conectado. Sala: ${pinFromUrl}, ID: ${studentIdFromUrl}`);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Mensagem WebSocket recebida:", message);
        
        if (message.type === "student-list-update") {
          setConnectedStudents(message.students);
        }

        // Escuta a mensagem do tipo 'start' enviada pelo backend para iniciar a atividade
        if (message.type === "start" || message.type === "activity-started") {
          console.log("Recebido evento de início da atividade, redirecionando para page5...");
          router.push(
            `/page5?pin=${pinFromUrl}&student_id=${studentIdFromUrl}&name=${encodeURIComponent(userName)}`
          );
        }
      };

      ws.onclose = () => {
        console.log("WebSocket desconectado.");
        webSocketRef.current = null;
      };

      ws.onerror = (error) => {
        console.error("Erro no WebSocket:", error);
        webSocketRef.current = null;
      };
    }
  }, [searchParams, router, userName]);

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

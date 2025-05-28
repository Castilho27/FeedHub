'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from "react" // Importe Suspense
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LucideClipboard, QrCode as QrCodeIcon, Settings as SettingsIcon } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

interface Student {
  student_id: string
  name: string
  avatar_color: string
}

// --- VARIÁVEIS DE AMBIENTE ---
// Estas variáveis são carregadas do ambiente de build/runtime do Vercel.
// Elas devem ser configuradas no painel do Vercel para o seu projeto de frontend.
// O prefixo NEXT_PUBLIC_ as torna disponíveis tanto no lado do servidor (para prerendering)
// quanto no lado do cliente (no navegador).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const FRONTEND_BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_BASE_URL || 'http://localhost:3000'; // Fallback para desenvolvimento local

// Recomendações: Adicione verificações para ajudar na depuração.
if (!API_BASE_URL) {
  console.error("Erro: NEXT_PUBLIC_API_BASE_URL não está definida! As chamadas de API podem falhar. Por favor, configure esta variável no Vercel.");
}
if (!FRONTEND_BASE_URL) {
    console.error("Erro: NEXT_PUBLIC_FRONTEND_BASE_URL não está definida! O QR Code pode gerar uma URL inválida. Por favor, configure esta variável no Vercel.");
}
// ----------------------------

// Componente simples de Modal para o QR Code
const QRModal = ({ url, pin, onClose }: { url: string; pin: string; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Escaneie para entrar na sala</h2>
        <p className="text-4xl font-bold text-blue-600 mb-4 tracking-wider">
          {pin}
        </p>
        <div className="p-4 bg-gray-100 rounded-md">
          <QRCodeSVG
            value={url}
            size={256}
            level="H"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        <p className="mt-4 text-gray-600 break-all text-center text-sm">{url}</p>
        <Button onClick={onClose} className="mt-6 bg-blue-500 hover:bg-blue-600 text-white">
          Fechar
        </Button>
      </div>
    </div>
  );
};

// Componente: ConfigurationModal para configurar a pergunta
const ConfigurationModal = ({
  onClose,
  currentQuestion,
  onSaveQuestion,
}: {
  onClose: () => void;
  currentQuestion: string;
  onSaveQuestion: (question: string) => void;
}) => {
  const [question, setQuestion] = useState(currentQuestion); // Estado interno para o input da pergunta

  const handleSave = () => {
    if (question.trim() === "") {
      toast.error("A pergunta não pode estar vazia.");
      return;
    }
    onSaveQuestion(question);
    onClose(); // Fecha o modal após salvar
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Configurar Pergunta</h2>

        <div className="w-full mb-4">
          <label htmlFor="question-input" className="block text-gray-700 text-sm font-bold mb-2">
            Perguntar aos alunos:
          </label>
          <textarea
            id="question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-none"
            placeholder="Digite a pergunta que será feita aos alunos..."
          ></textarea>
        </div>

        <div className="flex gap-4 mt-4">
          <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white">
            Salvar Pergunta
          </Button>
          <Button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};


// Componente principal GameWaitingRoom
// Envolvemos o conteúdo que usa useSearchParams com Suspense
export default function GameWaitingRoom() {
  return (
    // Adicione um Suspense Boundary aqui para lidar com useSearchParams()
    // O fallback é o que será exibido enquanto o componente real está carregando no cliente.
    <Suspense fallback={
        <div className="h-screen flex items-center justify-center text-xl text-gray-600">
            Carregando sala de espera...
        </div>
    }>
      <GameWaitingRoomContent />
    </Suspense>
  )
}

// NOVO COMPONENTE: Onde o useSearchParams é realmente utilizado.
// Este componente será renderizado no cliente após o Suspense.
function GameWaitingRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams() // Agora seguro dentro de um componente cliente sob Suspense
  const urlPin = searchParams.get("pin")

  const [pin, setPin] = useState("000 000")
  const [connectedStudents, setConnectedStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activityStarted, setActivityStarted] = useState(false)

  const studentsPerPage = 4
  const [startIndex, setStartIndex] = useState(0)

  const webSocketRef = useRef<WebSocket | null>(null)

  const roomPin = urlPin || ""
  const teacherId = "professor"
  const userName = "Professor"

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [roomEntryUrl, setRoomEntryUrl] = useState("");

  const [isConfigModalOpen, setIsConfigModalmOpen] = useState(false);
  const [currentRoomQuestion, setCurrentRoomQuestion] = useState("Qual a sua expectativa para a aula de hoje?"); // Pergunta padrão

  const generateUniqueKey = (student: Student) => {
    return student.student_id
  }

  const visibleStudents = connectedStudents.slice(
    startIndex,
    Math.min(startIndex + studentsPerPage, connectedStudents.length)
  )

  const handlePrevious = () => {
    setStartIndex((prev) => Math.max(0, prev - studentsPerPage))
  }

  const handleNext = () => {
    if (startIndex + studentsPerPage < connectedStudents.length) {
      setStartIndex(startIndex + studentsPerPage)
    }
  }

  const canGoBack = startIndex > 0
  const canGoForward = startIndex + studentsPerPage < connectedStudents.length

  const fetchInitialConnectedStudents = useCallback(async () => {
    if (!urlPin) {
      setError("PIN da sala não disponível. Por favor, volte para a página inicial.")
      setLoadingStudents(false)
      return
    }

    if (!API_BASE_URL) {
        toast.error('Configuração de API inválida. Contate o suporte.');
        setLoadingStudents(false);
        return;
    }

    setLoadingStudents(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${urlPin}/panel`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Falha ao buscar alunos conectados.")
      }

      const data = await res.json()
      const studentsWithValidColors = (data["connected-students"] || []).map((s: any) => ({
        student_id: s["student-id"],
        name: s.name,
        avatar_color: s["avatar-color"] && typeof s["avatar-color"] === 'string' ? s["avatar-color"] : '#CCCCCC'
      }))

      setConnectedStudents(studentsWithValidColors)

    } catch (err: any) {
      setError(`Erro ao carregar alunos: ${err.message}`)
      toast.error(`Erro ao carregar alunos: ${err.message}`);
    } finally {
      setLoadingStudents(false)
    }
  }, [urlPin])

  const startActivity = () => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type: "activity-started" })
      webSocketRef.current.send(message)
      console.log("Mensagem 'activity-started' enviada para a sala:", roomPin)
      toast.success("Atividade iniciada para os alunos!");

      router.push(`/page6?pin=${roomPin}&teacher_id=${teacherId}&name=${encodeURIComponent(userName)}&question=${encodeURIComponent(currentRoomQuestion)}`);
    } else {
      console.error("WebSocket não está aberto para enviar a mensagem.")
      toast.error("Erro: Conexão com a sala não está ativa para iniciar a atividade.");
    }
  }

  const sendQuestionToStudents = useCallback((questionText: string) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type: "question-update", question: questionText });
      webSocketRef.current.send(message);
      console.log(`Pergunta '${questionText}' enviada para a sala: ${roomPin}`);
      toast.success("Pergunta da sala atualizada!");
    } else {
      console.error("WebSocket não está aberto para enviar a atualização da pergunta.");
      toast.error("Erro: Conexão com a sala não está ativa para alterar a pergunta.");
    }
  }, [roomPin]);


  useEffect(() => {
    if (!urlPin) {
      setError("PIN da sala não disponível. Por favor, volte para a página inicial.")
      setLoadingStudents(false)
      return
    }

    setPin(urlPin.replace(/(\d{3})(\d{3})/, "$1 $2"))

    if (!FRONTEND_BASE_URL) {
        console.error("Erro: FRONTEND_BASE_URL não está definida para gerar URL do QR Code.");
        setError("Erro de configuração. Contate o suporte.");
        return;
    }
    setRoomEntryUrl(`${FRONTEND_BASE_URL}/page3?pin=${encodeURIComponent(urlPin)}`);

    if (!API_BASE_URL) {
        console.error("Erro: API_BASE_URL não está definida para conexão WebSocket.");
        setError("Erro de configuração. Contate o suporte.");
        return;
    }
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsHost = API_BASE_URL.split('//')[1]; // Remove "http://" or "https://"
    const wsUrl = `${wsProtocol}://${wsHost}/ws/rooms/${urlPin}?student_id=professor`;

    const ws = new WebSocket(wsUrl);
    webSocketRef.current = ws

    ws.onopen = () => {
      fetchInitialConnectedStudents()
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === "student-list-update") {
        const studentsWithValidColors = (message.students || []).map((s: any) => ({
          student_id: s["student-id"],
          name: s.name,
          avatar_color: s["avatar-color"] && typeof s["avatar-color"] === 'string' ? s["avatar-color"] : '#CCCCCC'
        }))
        setConnectedStudents(studentsWithValidColors)
      } else if (message.type === "start-activity") {
        setActivityStarted(true)
      } else if (message.type === "question-update") {
        setCurrentRoomQuestion(message.question);
      }
    }

    ws.onerror = () => {
      setError("Erro na conexão em tempo real com a sala. Por favor, recarregue a página.")
      toast.error("Erro na conexão com a sala. Por favor, recarregue a página.");
      fetchInitialConnectedStudents()
    }

    ws.onclose = () => {
      console.log("WebSocket desconectado.")
      toast.error("Conexão com a sala perdida. Recarregue a página.");
    }

    return () => {
      ws.close()
    }
  }, [urlPin, fetchInitialConnectedStudents, sendQuestionToStudents, FRONTEND_BASE_URL, API_BASE_URL])

  const handleStartActivity = async () => {
    if (!API_BASE_URL) {
        toast.error('Configuração de API inválida. Contate o suporte.');
        return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${urlPin}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "teacher" })
      })

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha ao enviar comando de início de atividade.");
      }

      startActivity()
    } catch (err: any) {
      console.error("Erro ao iniciar atividade:", err)
      toast.error(`Falha ao iniciar atividade: ${err.message}`);
    }
  }

  useEffect(() => {
    if (activityStarted) {
      router.push(`/page6?pin=${urlPin}&teacher_id=${teacherId}&name=${encodeURIComponent(userName)}&question=${encodeURIComponent(currentRoomQuestion)}`);
    }
  }, [activityStarted, router, urlPin, teacherId, userName, currentRoomQuestion])


  const handleLogout = () => {
    router.push("/")
    toast("Você foi desconectado.");
  }

  const handleCopyPin = () => {
    if (pin) {
      navigator.clipboard.writeText(pin.replace(/\s/g, ""));
      toast.success("PIN copiado para a área de transferência!");
    } else {
      toast.error("Não foi possível copiar o PIN.");
    }
  }

  const handleOpenQRModal = () => {
    setIsQRModalOpen(true);
  };

  const handleCloseQRModal = () => {
    setIsQRModalOpen(false);
  };

  const handleOpenConfigModal = () => {
    setIsConfigModalmOpen(true);
  };

  const handleCloseConfigModal = () => {
    setIsConfigModalmOpen(false);
  };

  const handleSaveConfigQuestion = (question: string) => {
    setCurrentRoomQuestion(question);
    sendQuestionToStudents(question);
  };


  return (
    <div className="h-screen flex flex-col p-4 overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <Image src="/Images/Fundo2.png" alt="Background" fill className="object-cover" />
        <div className="absolute inset-0 bg-sky-50/80"></div>
      </div>

      <header className="flex justify-between items-start mb-2">
        <img src="/Images/logo1.png" alt="Logo" className="h-28 w-auto" />
        <div className="flex items-center gap-2 mt-2">
          <span className="font-medium">Área Administrador</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>Sair</Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-3 max-w-md mx-auto w-full">
        <Card className="px-4 py-3">
          <h2 className="text-xl font-bold text-center mb-2">PIN da Sala</h2>
          <div className="text-4xl font-bold text-center bg-sky-50 py-2 rounded-lg mb-2">{pin}</div>
          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline" className="gap-1" onClick={handleCopyPin}>
              <LucideClipboard size={16} />
              Copiar
            </Button>
          </div>
        </Card>

        <Card className="p-4 flex-1 flex flex-col justify-between">
          <h2 className="text-xl font-bold mb-2 text-center">Alunos Conectados</h2>

          {loadingStudents && <p className="text-center text-gray-500">Carregando alunos...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}
          {!loadingStudents && !error && connectedStudents.length === 0 && (
            <p className="text-center text-gray-500">Nenhum aluno conectado ainda.</p>
          )}

          {!loadingStudents && !error && connectedStudents.length > 0 && (
            <div className="flex items-center justify-between h-full">
              <button
                onClick={handlePrevious}
                disabled={!canGoBack}
                className={`h-8 w-8 flex items-center justify-center rounded-full ${canGoBack ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                &lt;
              </button>
              <div className="flex justify-center gap-2 flex-1 overflow-hidden">
                {visibleStudents.map((student) => (
                  <div key={generateUniqueKey(student)} className="flex flex-col items-center flex-shrink-0 w-20">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: student.avatar_color }}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="mt-1 text-xs text-center truncate w-full">{student.name}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleNext}
                disabled={!canGoForward}
                className={`h-8 w-8 flex items-center justify-center rounded-full ${canGoForward ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                &gt;
              </button>
            </div>
          )}
        </Card>

        <Button className="w-full py-3 text-base" onClick={handleStartActivity}>
          Iniciar Atividade
        </Button>

        <div className="flex justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleOpenQRModal}>
            <QrCodeIcon className="w-5 h-5 mr-1" /> QR Code
          </Button>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenConfigModal}
          className="bg-white/80 backdrop-blur-sm shadow-md"
        >
          <SettingsIcon className="w-5 h-5 mr-1" /> Configurações
        </Button>
      </div>

      {isQRModalOpen && roomEntryUrl && (
        <QRModal url={roomEntryUrl} pin={pin} onClose={handleCloseQRModal} />
      )}

      {isConfigModalOpen && (
        <ConfigurationModal
          onClose={handleCloseConfigModal}
          currentQuestion={currentRoomQuestion}
          onSaveQuestion={handleSaveConfigQuestion}
        />
      )}
    </div>
  )
}

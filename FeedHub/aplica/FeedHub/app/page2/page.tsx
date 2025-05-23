// app/page2/page.tsx
'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LucideClipboard } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"

interface Student {
  student_id: string
  name: string
  avatar_color: string
}

export default function GameWaitingRoom() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlPin = searchParams.get("pin")

  // Inicializa com valor padrão, será atualizado pelo urlPin
  const [pin, setPin] = useState("000 000")
  const [connectedStudents, setConnectedStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const studentsPerPage = 4 // <--- ALTERADO DE 5 PARA 4 AQUI!
  const [startIndex, setStartIndex] = useState(0)

  // Gera uma chave única combinando student_id com o índice como fallback
  const generateUniqueKey = (student: Student, index: number) => {
    return `${student.student_id}-${index}-${student.avatar_color}`
  }

  const visibleStudents = connectedStudents.slice(
    startIndex,
    startIndex + studentsPerPage
  )

  const handlePrevious = () => {
    setStartIndex((prev) => Math.max(0, prev - studentsPerPage))
  }

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(connectedStudents.length - studentsPerPage, prev + studentsPerPage)
    )
  }

  const canGoBack = startIndex > 0
  const canGoForward = startIndex + studentsPerPage < connectedStudents.length

  // Callback para buscar alunos (usada tanto no início quanto em caso de erro no WS)
  const fetchInitialConnectedStudents = useCallback(async () => {
    if (!urlPin) {
      setError("PIN da sala não disponível. Por favor, volte para a página inicial.")
      setLoadingStudents(false)
      return
    }

    setLoadingStudents(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:3001/api/rooms/${urlPin}/panel`, {
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
      console.log("Dados iniciais de alunos recebidos do backend (REST):", data)

      // Verificação extra para garantir que a cor é uma string válida
      const studentsWithValidColors = (data["connected-students"] || []).map((s: any) => ({
        student_id: s["student-id"], // Ajuste para a chave do backend (se necessário, de `student-id` para `student_id`)
        name: s.name,
        avatar_color: s["avatar-color"] && typeof s["avatar-color"] === 'string' ? s["avatar-color"] : '#CCCCCC' // Fallback para cinza
      }));

      setConnectedStudents(studentsWithValidColors);
      setStartIndex(0) // Reinicia a visualização para o começo da lista
    } catch (err: any) {
      console.error("Erro ao buscar alunos inicialmente (REST):", err.message)
      setError(`Erro ao carregar alunos: ${err.message}`)
    } finally {
      setLoadingStudents(false)
    }
  }, [urlPin])

  // useEffect principal para a conexão WebSocket e fetch inicial
  useEffect(() => {
    let ws: WebSocket | null = null // Inicializa ws como null
    let intervalId: NodeJS.Timeout | null = null

    // Garante que urlPin existe antes de tentar conectar
    if (urlPin) {
      // --- Adicione estes console.log aqui para depuração ---
      console.log("DEBUG: urlPin no useEffect antes do WS:", urlPin)
      console.log("DEBUG: Tentando conectar WebSocket com URL:", `ws://localhost:3001/ws/rooms/${urlPin}?student_id=professor`)
      // --- Fim dos console.log ---

      // Formata o PIN para exibição apenas quando o urlPin estiver disponível
      setPin(urlPin.replace(/(\d{3})(\d{3})/, "$1 $2"))

      // 1. Inicia a conexão WebSocket
      // Importante: Usamos um ID de estudante como "professor" para identificar no backend
      ws = new WebSocket(`ws://localhost:3001/ws/rooms/${urlPin}?student_id=professor`);

      ws.onopen = () => {
        console.log("WebSocket conectado para o professor:", urlPin)
        // Ao conectar o WS, faz o fetch inicial para garantir a lista atual
        fetchInitialConnectedStudents()
      }

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.type === "student-list-update") {
          console.log("Lista de alunos atualizada via WebSocket:", message.students)
          
          // Verificação extra para garantir que a cor é uma string válida (WebSocket)
          const studentsWithValidColors = (message.students || []).map((s: any) => ({
            student_id: s["student-id"], // Ajuste para a chave do backend
            name: s.name,
            avatar_color: s["avatar-color"] && typeof s["avatar-color"] === 'string' ? s["avatar-color"] : '#CCCCCC' // Fallback para cinza
          }));

          setConnectedStudents(studentsWithValidColors);
          setStartIndex(0) // Reinicia a visualização para o começo da lista
        }
      }

      ws.onerror = (err) => {
        console.error("Erro no WebSocket:", err) // Esta é a linha onde o erro é logado
        setError("Erro na conexão em tempo real com a sala. Por favor, recarregue a página.")
        // Em caso de erro no WS, tente buscar novamente via REST como fallback
        fetchInitialConnectedStudents()
      }

      ws.onclose = () => {
        console.log("WebSocket desconectado.")
      }

      // Remover o setInterval de polling REST aqui
      // O fetchInitialConnectedStudents é chamado no onopen do WS e como fallback em erro.
      // intervalId = setInterval(fetchInitialConnectedStudents, 5000); // Comente ou remova
    } else {
      console.warn("DEBUG: urlPin não disponível no momento da inicialização do useEffect.");
      // Se não há PIN na URL na primeira renderização, trata o erro
      setError("PIN da sala não disponível. Por favor, volte para a página inicial.")
      setLoadingStudents(false)
    }

    // Função de cleanup: fecha o WebSocket e limpa o intervalo se existirem
    return () => {
      if (ws) {
        console.log("Fechando WebSocket para limpeza...")
        ws.close()
      }
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [urlPin, fetchInitialConnectedStudents]) // A dependência urlPin e fetchInitialConnectedStudents são fundamentais aqui


  const handleLogout = () => {
    router.push("/")
  }

  const handleCopyPin = () => {
    if (pin) {
      // Remove espaços antes de copiar
      navigator.clipboard.writeText(pin.replace(/\s/g, ""))
      console.log(`PIN ${pin} copiado!`)
    }
  }

  return (
    <div className="h-screen flex flex-col p-4 overflow-hidden">
      {/* Imagem de fundo */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/Images/Fundo1.png"
          alt="Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-sky-50/80"></div>
      </div>

      <header className="flex justify-between items-start mb-2">
        <img src="/Images/logo1.png" alt="Logo" className="h-28 w-auto" />
        <div className="flex items-center gap-2 mt-2">
          <span className="font-medium">Área Administrador</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col gap-3 max-w-md mx-auto w-full">
        {/* Painel do pin */}
        <Card className="px-4 py-3">
          <h2 className="text-xl font-bold text-center mb-2">PIN da Sala</h2>
          <div className="text-4xl font-bold text-center bg-sky-50 py-2 rounded-lg mb-2">
            {pin}
          </div>
          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline" className="gap-1" onClick={handleCopyPin}>
              <LucideClipboard size={16} />
              Copiar
            </Button>
          </div>
        </Card>

        {/* Card dos Alunos */}
        <Card className="p-4 flex-1 flex flex-col justify-between">
          <h2 className="text-xl font-bold mb-2 text-center">Alunos Conectados</h2>

          {loadingStudents && (
            <p className="text-center text-gray-500">Carregando alunos...</p>
          )}
          {error && <p className="text-center text-red-500">{error}</p>}
          {!loadingStudents && !error && connectedStudents.length === 0 && (
            <p className="text-center text-gray-500">Nenhum aluno conectado ainda.</p>
          )}

          {!loadingStudents && !error && connectedStudents.length > 0 && (
            <div className="flex items-center justify-between h-full">
              <button
                onClick={handlePrevious}
                disabled={!canGoBack}
                className={`h-8 w-8 flex items-center justify-center rounded-full ${
                  canGoBack
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                &lt;
              </button>

              <div className="flex justify-center gap-2 flex-1 overflow-hidden">
                {visibleStudents.map((student, index) => (
                  <div
                    key={generateUniqueKey(student, index)}
                    className="flex flex-col items-center flex-shrink-0 w-20"
                  >
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold`}
                      style={{ backgroundColor: student.avatar_color }}
                    >
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="mt-1 text-xs text-center truncate w-full">
                      {student.name}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={!canGoForward}
                className={`h-8 w-8 flex items-center justify-center rounded-full ${
                  canGoForward
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                &gt;
              </button>
            </div>
          )}
        </Card>

        {/* Botão de ação */}
        <Button className="w-full py-3 text-base">Iniciar Atividade</Button>

        {/* Menu inferior */}
        <div className="flex justify-center gap-3">
          <Button variant="ghost" size="sm">
            Relatórios
          </Button>
          <Button variant="ghost" size="sm">
            Temas
          </Button>
          <Button variant="ghost" size="sm">
            Configurações
          </Button>
        </div>
      </div>
    </div>
  )
}
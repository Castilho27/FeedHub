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

  const [pin, setPin] = useState("000 000")
  const [connectedStudents, setConnectedStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const studentsPerPage = 4
  const [startIndex, setStartIndex] = useState(0)

  // Gera uma chave única usando APENAS o student_id
  const generateUniqueKey = (student: Student) => {
    return student.student_id
  }

  // Calcula os alunos visíveis corretamente
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

      const studentsWithValidColors = (data["connected-students"] || []).map((s: any) => ({
        student_id: s["student-id"],
        name: s.name,
        avatar_color: s["avatar-color"] && typeof s["avatar-color"] === 'string' ? s["avatar-color"] : '#CCCCCC'
      }));

      setConnectedStudents(studentsWithValidColors);
    } catch (err: any) {
      console.error("Erro ao buscar alunos inicialmente (REST):", err.message)
      setError(`Erro ao carregar alunos: ${err.message}`)
    } finally {
      setLoadingStudents(false)
    }
  }, [urlPin])

  // useEffect principal para a conexão WebSocket e fetch inicial
  useEffect(() => {
    let ws: WebSocket | null = null
    let intervalId: NodeJS.Timeout | null = null

    if (urlPin) {
      console.log("DEBUG: urlPin no useEffect antes do WS:", urlPin)
      console.log("DEBUG: Tentando conectar WebSocket com URL:", `ws://localhost:3001/ws/rooms/${urlPin}?student_id=professor`)
      
      setPin(urlPin.replace(/(\d{3})(\d{3})/, "$1 $2"))

      ws = new WebSocket(`ws://localhost:3001/ws/rooms/${urlPin}?student_id=professor`);

      ws.onopen = () => {
        console.log("WebSocket conectado para o professor:", urlPin)
        fetchInitialConnectedStudents()
      }

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.type === "student-list-update") {
          console.log("Lista de alunos atualizada via WebSocket:", message.students)
          
          const studentsWithValidColors = (message.students || []).map((s: any) => ({
            student_id: s["student-id"],
            name: s.name,
            avatar_color: s["avatar-color"] && typeof s["avatar-color"] === 'string' ? s["avatar-color"] : '#CCCCCC'
          }));

          setConnectedStudents(studentsWithValidColors);
        }
      }

      ws.onerror = (err) => {
        console.error("Erro no WebSocket:", err)
        setError("Erro na conexão em tempo real com a sala. Por favor, recarregue a página.")
        fetchInitialConnectedStudents()
      }

      ws.onclose = () => {
        console.log("WebSocket desconectado.")
      }

    } else {
      console.warn("DEBUG: urlPin não disponível no momento da inicialização do useEffect.");
      setError("PIN da sala não disponível. Por favor, volte para a página inicial.")
      setLoadingStudents(false)
    }

    return () => {
      if (ws) {
        console.log("Fechando WebSocket para limpeza...")
        ws.close()
      }
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [urlPin, fetchInitialConnectedStudents])

  const handleLogout = () => {
    router.push("/")
  }

  const handleCopyPin = () => {
    if (pin) {
      navigator.clipboard.writeText(pin.replace(/\s/g, ""))
      console.log(`PIN ${pin} copiado!`)
    }
  }

  return (
    <div className="h-screen flex flex-col p-4 overflow-hidden">
      {/* Imagem de fundo */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/Images/Fundo2.png"
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

      <div className="flex-1 flex flex-col gap-3 max-w-md mx-auto w-full">
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
                {visibleStudents.map((student) => (
                  <div
                    key={generateUniqueKey(student)}
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

        <Button className="w-full py-3 text-base">Iniciar Atividade</Button>

        <div className="flex justify-center gap-3">
          <Button variant="ghost" size="sm">
            QR Code
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
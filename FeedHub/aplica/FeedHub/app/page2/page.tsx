'use client'

import { useState, useEffect, useCallback, useRef } from "react"
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
  const [activityStarted, setActivityStarted] = useState(false)

  const studentsPerPage = 4
  const [startIndex, setStartIndex] = useState(0)

  // Para WebSocket precisar usar useRef para manter a referência
  const webSocketRef = useRef<WebSocket | null>(null)

  // Variáveis para passar na URL do redirecionamento (ajuste conforme seu contexto)
  const roomPin = urlPin || ""
  const teacherId = "professor" // coloque o id correto do professor, ou busque do contexto
  const userName = "Professor"  // mesmo aqui, ajuste conforme necessário

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
      const studentsWithValidColors = (data["connected-students"] || []).map((s: any) => ({
        student_id: s["student-id"],
        name: s.name,
        avatar_color: s["avatar-color"] && typeof s["avatar-color"] === 'string' ? s["avatar-color"] : '#CCCCCC'
      }))

      setConnectedStudents(studentsWithValidColors)
    } catch (err: any) {
      setError(`Erro ao carregar alunos: ${err.message}`)
    } finally {
      setLoadingStudents(false)
    }
  }, [urlPin])

  // Função para iniciar a atividade
  const startActivity = () => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type: "activity-started" })
      webSocketRef.current.send(message)
      console.log("Mensagem 'activity-started' enviada para a sala:", roomPin)

      router.push(`/page6?pin=${roomPin}&teacher_id=${teacherId}&name=${encodeURIComponent(userName)}`)
    } else {
      console.error("WebSocket não está aberto para enviar a mensagem.")
    }
  }

  useEffect(() => {
    if (!urlPin) {
      setError("PIN da sala não disponível. Por favor, volte para a página inicial.")
      setLoadingStudents(false)
      return
    }

    setPin(urlPin.replace(/(\d{3})(\d{3})/, "$1 $2"))

    const ws = new WebSocket(`ws://localhost:3001/ws/rooms/${urlPin}?student_id=professor`)
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
      }
    }

    ws.onerror = () => {
      setError("Erro na conexão em tempo real com a sala. Por favor, recarregue a página.")
      fetchInitialConnectedStudents()
    }

    ws.onclose = () => {
      console.log("WebSocket desconectado.")
    }

    return () => {
      ws.close()
    }
  }, [urlPin, fetchInitialConnectedStudents])

  const handleStartActivity = async () => {
    try {
      await fetch(`http://localhost:3001/api/rooms/${urlPin}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "teacher" })
      })
      // Depois de mandar o start para o backend, envie a mensagem WS e redirecione:
      startActivity()
    } catch (err) {
      console.error("Erro ao iniciar atividade:", err)
    }
  }

  useEffect(() => {
    if (activityStarted) {
      router.push(`/page4?pin=${urlPin}`)
    }
  }, [activityStarted, router, urlPin])

  const handleLogout = () => {
    router.push("/")
  }

  const handleCopyPin = () => {
    if (pin) navigator.clipboard.writeText(pin.replace(/\s/g, ""))
  }

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
          <Button variant="ghost" size="sm">QR Code</Button>
          <Button variant="ghost" size="sm">Temas</Button>
          <Button variant="ghost" size="sm">Configurações</Button>
        </div>
      </div>
    </div>
  )
}

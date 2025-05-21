'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LucideClipboard } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"

export default function GameWaitingRoom() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlPin = searchParams.get('pin')

  const [pin, setPin] = useState(urlPin ? urlPin.replace(/(\d{3})(\d{3})/, "$1 $2") : "000000")

  useEffect(() => {
  }, [urlPin]) 

  const handleLogout = () => {
    router.push('/')
  }

  const handleCopyPin = () => {
    if (pin) {
      navigator.clipboard.writeText(pin.replace(/\s/g, ''))
      console.log(`PIN ${pin} copiado!`); 
    }
  }

  const connectedStudents = [
    { id: 1, name: "Ana Clara", color: "bg-cyan-500" },
    { id: 2, name: "Pedro T.", color: "bg-purple-500" },
    { id: 3, name: "João P.", color: "bg-emerald-500" },
    { id: 4, name: "Beatriz M.", color: "bg-amber-500" },
    { id: 5, name: "José L.", color: "bg-pink-500" },
    { id: 6, name: "Lucas C.", color: "bg-indigo-500" },
    { id: 7, name: "Yasmin", color: "bg-orange-500" },
    { id: 8, name: "Carlos", color: "bg-teal-500" },
  ]

  const studentsPerPage = 5
  const [startIndex, setStartIndex] = useState(0)

  const visibleStudents = connectedStudents.slice(startIndex, startIndex + studentsPerPage)

  const handlePrevious = () => {
    setStartIndex(Math.max(0, startIndex - studentsPerPage))
  }

  const handleNext = () => {
    setStartIndex(Math.min(connectedStudents.length - studentsPerPage, startIndex + studentsPerPage))
  }

  const canGoBack = startIndex > 0
  const canGoForward = startIndex + studentsPerPage < connectedStudents.length

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
        <img
          src="/Images/logo1.png"
          alt="Logo"
          className="h-28 w-auto"
        />
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
            {pin} {/* O PIN agora vem do estado que é inicializado pela URL */}
          </div>
          <div className="flex gap-2 justify-center">
            {/* O botão "Gerar Novo PIN" foi removido como solicitado anteriormente */}
            <Button size="sm" variant="outline" className="gap-1" onClick={handleCopyPin}>
              <LucideClipboard size={16} />
              Copiar
            </Button>
          </div>
        </Card>

        {/* Card dos Alunos - Ajuste fino */}
        <Card className="p-4 flex-1">
          <h2 className="text-xl font-bold mb-2 text-center">Alunos Conectados</h2>
          <div className="flex items-center justify-between h-full">
            <button
              onClick={handlePrevious}
              disabled={!canGoBack}
              className={`h-8 w-8 flex items-center justify-center rounded-full ${
                canGoBack ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400"
              }`}
            >
              &lt;
            </button>

            <div className="flex justify-center gap-2 flex-1">
              {visibleStudents.map((student) => (
                <div key={student.id} className="flex flex-col items-center">
                  <div className={`h-12 w-12 ${student.color} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold">{student.id}</span>
                  </div>
                  <span className="mt-1 text-xs text-center">{student.name}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!canGoForward}
              className={`h-8 w-8 flex items-center justify-center rounded-full ${
                canGoForward ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400"
              }`}
            >
              &gt;
            </button>
          </div>
        </Card>

        {/* Botão de ação - Compactado levemente */}
        <Button className="w-full py-3 text-base">Iniciar Atividade</Button>

        {/* Menu inferior - Sem alterações */}
        <div className="flex justify-center gap-3">
          <Button variant="ghost" size="sm">Relatórios</Button>
          <Button variant="ghost" size="sm">Temas</Button>
          <Button variant="ghost" size="sm">Configurações</Button>
        </div>
      </div>
    </div>
  )
}
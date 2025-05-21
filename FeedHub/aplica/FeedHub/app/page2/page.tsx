'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LucideClipboard } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"

// Definição da interface para o estudante, ajustada para kebab-case nas chaves
interface Student {
  'student-id': string; // Ajustado para 'student-id' com hífen
  name: string;
  'avatar-color': string; // Ajustado para 'avatar-color' com hífen
}

export default function GameWaitingRoom() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlPin = searchParams.get('pin')

  const [pin, setPin] = useState(urlPin ? urlPin.replace(/(\d{3})(\d{3})/, "$1 $2") : "000 000")
  const [connectedStudents, setConnectedStudents] = useState<Student[]>([]) // Estado para os alunos reais
  const [loadingStudents, setLoadingStudents] = useState(true) // Estado de carregamento
  const [error, setError] = useState<string | null>(null) // Estado de erro

  // Lógica do carousel
  const studentsPerPage = 5
  const [startIndex, setStartIndex] = useState(0)

  // Agora, o slice vai funcionar com os dados que estão chegando corretamente
  const visibleStudents = connectedStudents.slice(startIndex, startIndex + studentsPerPage)

  const handlePrevious = () => {
    setStartIndex(Math.max(0, startIndex - studentsPerPage))
  }

  const handleNext = () => {
    setStartIndex(Math.min(connectedStudents.length - studentsPerPage, startIndex + studentsPerPage))
  }

  const canGoBack = startIndex > 0
  const canGoForward = startIndex + studentsPerPage < connectedStudents.length

  // Função para buscar os alunos do backend
  const fetchConnectedStudents = useCallback(async () => {
    if (!urlPin) {
      setError("PIN da sala não disponível. Por favor, volte para a página inicial.");
      setLoadingStudents(false);
      return;
    }

    setLoadingStudents(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/rooms/${urlPin}/panel`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao buscar alunos conectados.');
      }

      const data = await res.json();
      console.log("Dados recebidos do backend:", data); // Adicionei este log para depuração!
      // Assumindo que 'data.students' é um array de objetos Student retornado pelo seu backend Clojure
      // As chaves no JSON virão em kebab-case (e.g., "student-id", "avatar-color")
      setConnectedStudents(data.students || []); // Garante que é um array, mesmo que vazio
      setStartIndex(0); 
    } catch (err: any) {
      console.error("Erro ao buscar alunos:", err.message);
      setError(`Erro ao carregar alunos: ${err.message}`);
    } finally {
      setLoadingStudents(false);
    }
  }, [urlPin]);

  // useEffect para buscar alunos na montagem do componente e a cada 5 segundos
  useEffect(() => {
    fetchConnectedStudents(); // Busca inicial

    const intervalId = setInterval(fetchConnectedStudents, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar o componente
  }, [fetchConnectedStudents]);

  const handleLogout = () => {
    router.push('/')
  }

  const handleCopyPin = () => {
    if (pin) {
      navigator.clipboard.writeText(pin.replace(/\s/g, ''))
      console.log(`PIN ${pin} copiado!`);
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
                className={`h-8 w-8 flex items-center justify-center rounded-full ${
                  canGoBack ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                &lt;
              </button>

              <div className="flex justify-center gap-2 flex-1 overflow-hidden">
                {visibleStudents.map((student) => (
                  // Corrigido para acessar com hífen 'student-id' e 'avatar-color'
                  <div key={student['student-id']} className="flex flex-col items-center flex-shrink-0 w-20">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold`}
                      style={{ backgroundColor: student['avatar-color'] }} // Acesso com hífen
                    >
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="mt-1 text-xs text-center truncate w-full">{student.name}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={!canGoForward}
                className={`h-8 w-8 flex items-center justify-center rounded-full ${
                  canGoForward ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
          <Button variant="ghost" size="sm">Relatórios</Button>
          <Button variant="ghost" size="sm">Temas</Button>
          <Button variant="ghost" size="sm">Configurações</Button>
        </div>
      </div>
    </div>
  )
}
"use client";

import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from 'react-hot-toast'; // <--- Importe o toast aqui!

export default function Home() {
  const router = useRouter();
  const [studentPin, setStudentPin] = useState<string>('');

  const handleStudentPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericPin = e.target.value.replace(/\D/g, '').substring(0, 6);
    setStudentPin(numericPin);
  };

  const handleStudentEntry = async () => {
    if (studentPin.trim() === '' || studentPin.trim().length !== 6) {
      toast.error('Por favor, digite um PIN de 6 dígitos válido para a sala.'); // <--- Toast para PIN inválido
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/api/rooms/${studentPin}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(`Erro ao verificar PIN: ${errorData.message || 'PIN inválido ou sala não encontrada.'}`); // <--- Toast para erro ao verificar PIN
        console.error('Erro ao verificar PIN:', errorData.message || 'PIN inválido ou sala não encontrada.', `Status: ${res.status}`);
        return;
      }

      // Se o PIN for válido e a sala existir
      toast.success(`Você entrou na sala com sucesso!`); // <--- TOAST DE SUCESSO AQUI!
      router.push(`/page3?pin=${encodeURIComponent(studentPin.trim())}`);
    } catch (error) {
      console.error('Erro na comunicação com o servidor ao verificar PIN:', error);
      toast.error('Erro de rede ao tentar verificar o PIN. Tente novamente.'); // <--- Toast para erro de rede
    }
  };

  const handleProfessorClick = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(`Falha ao criar sala: ${errorData.message || 'Erro desconhecido.'}`); // <--- Toast para erro ao criar sala
        console.error('Erro ao criar sala:', errorData.message || 'Erro desconhecido', `Status: ${res.status}`);
        return
      }

      const data = await res.json()
      const pin = data.pin

      toast.success(`Sala criada com sucesso!`); // <--- TOAST DE SUCESSO AQUI!
      router.push(`/page2?pin=${pin}`)
    } catch (error) {
      console.error('Erro na comunicação com o servidor:', error);
      toast.error('Erro de rede ao tentar criar a sala. Tente novamente.'); // <--- Toast para erro de rede
    }
  }

  return (
    <main className="flex min-h-screen w-screen flex-col items-center justify-center relative overflow-hidden">
      {/* Imagem de fundo */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/Images/Fundo1.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
        />
        <div className="absolute inset-0 bg-[#e9f2fc] opacity-90"></div>
      </div>

      {/* Conteúdo principal: Centralizado horizontal e verticalmente */}
      <div className="z-10 w-full max-w-xs flex flex-col items-center space-y-6">
        {/* Logo */}
        <div className="mb-2">
          <img
            src="/Images/logo1.png"
            alt="FeedHub Logo"
            className="h-32 md:h-36"
          />
        </div>

        {/* Componente de entrada de PIN do Aluno */}
        <div className="w-full bg-white rounded-xl p-6 shadow-lg text-center">
            <h2 className="text-xl font-semibold text-[#091e2c] mb-4">Ajude a melhorar suas aulas!</h2>
            <p className="text-gray-600 mb-6">Responda Anonimamente</p>
            <Input
                className="w-full py-3 px-4 text-center text-gray-600 text-lg rounded-lg
                           border-2 border-gray-300
                           focus:ring-0 focus:outline-none focus:border-blue-500
                           !ring-0 !outline-none !border-none !border-transparent
                           shadow-md
                           placeholder-shown:text-gray-400 placeholder-shown:opacity-100
                           focus:placeholder-transparent"
                placeholder="Digite o PIN da sala"
                value={studentPin}
                onChange={handleStudentPinChange}
                maxLength={6}
                type="tel" // Adicionado type="tel" para teclado numérico em mobiles
            />
            <Button
                onClick={handleStudentEntry}
                className="w-full mt-4 py-3 bg-[#091E2C] hover:bg-[#132A3C] text-white rounded-lg text-lg font-medium"
            >
                Entrar
            </Button>
        </div>

        {/* Rodapé */}
        <div className="text-center text-[#091e2c] text-sm mt-4">
          © 2025 FeedHub. Todos os direitos reservados.
        </div>
      </div>

      {/* Botões de navegação lateral (fora do container principal para não interferir na centralização dele) */}
      <div className="absolute bottom-8 right-4 md:right-8 z-10 flex items-center gap-2">
        <span className="text-sm text-[#091e2c] bg-white/80 px-3 py-1 rounded-full shadow-sm">
          Você é professor? Clique aqui
        </span>
        <button
          onClick={handleProfessorClick}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label="Área do professor"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full shadow-md border border-[#a8cff5] flex items-center justify-center hover:bg-[#f0f7ff]">
            <User className="h-6 w-6 text-[#1a3e55]" />
          </div>
        </button>
      </div>
    </main>
  )
}
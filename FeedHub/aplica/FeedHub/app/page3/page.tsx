"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

export default function LoginPage() {
  const [userName, setUserName] = useState("");
  const [roomPin, setRoomPin] = useState<string | null>(null); 
  const router = useRouter();
  const searchParams = useSearchParams();

  const avatarColors = [
    "#FF7043", "#FFA726", "#FFCA28", "#FFEE58",
    "#9CCC65", "#66BB6A", "#26A69A", "#26C6DA",
    "#29B6F6", "#42A5F5", "#5C6BC0", "#7E57C2",
    "#AB47BC", "#EC407A", "#EF5350",
    "#8D6E63", "#78909C", "#A8CFF5"
  ];

  useEffect(() => {
    const pinParam = searchParams.get('pin');
    if (pinParam) {
      setRoomPin(pinParam);
      console.log('PIN recebido na page3:', pinParam);
    } else {
      alert('PIN da sala não encontrado. Por favor, digite o PIN na página principal.');
      router.push('/');
    }
  }, [searchParams, router]);

  const handleNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(event.target.value);
  };

  const handleProceed = async () => { 
    if (userName.trim() === "") {
      alert("Por favor, digite seu nome para continuar!");
      return;
    }
    if (!roomPin) { 
      alert("Erro: PIN da sala não disponível. Tente novamente.");
      router.push('/');
      return;
    } 

    const randomIndex = Math.floor(Math.random() * avatarColors.length);
    const chosenColor = avatarColors[randomIndex];
    console.log('Cor do avatar gerada:', chosenColor);

    // Gerar o student_id uma única vez aqui
    const studentId = Math.random().toString(36).substring(2, 15); // <--- GERAR ID AQUI!
    console.log('Student ID gerado:', studentId);

    try {
      const res = await fetch(`http://localhost:3001/api/rooms/${roomPin}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId, // <--- USAR O ID GERADO AQUI!
          name: userName.trim(),
          avatar_color: chosenColor 
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Erro ao entrar na sala: ${errorData.message || 'Erro desconhecido'}`);
        console.error('Erro ao entrar na sala:', errorData);
        return;
      }

      const data = await res.json(); 
      console.log('Entrou na sala com sucesso:', data);

      // Redirecionar para page4, passando o studentId também!
      router.push(`/page4?name=${encodeURIComponent(userName.trim())}&pin=${encodeURIComponent(roomPin)}&color=${encodeURIComponent(chosenColor)}&student_id=${encodeURIComponent(studentId)}`); // <--- PASSAR student_id AQUI!

    } catch (error) {
      console.error('Erro na comunicação com o servidor ao entrar na sala:', error);
      alert('Erro de rede ao tentar entrar na sala. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/Images/Fundo1.png"
          alt="Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-sky-50/80"></div>
      </div>

      <div className="z-10 w-full max-w-md px-8 py-12 flex flex-col items-center">
        <div className="flex justify-center mb-6">
          <div className="w-48 h-auto relative">
            <Image
              src="/Images/logo1.png"
              alt="FeedHub Logo"
              width={192}
              height={64}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        <div className="w-full bg-white rounded-xl p-6 shadow-lg">
          <Input
            className="w-full py-3 px-4 text-center text-gray-600 text-lg rounded-lg
                       border-2 border-gray-300
                       focus:ring-0 focus:outline-none focus:border-blue-500
                       !ring-0 !outline-none !border-none !border-transparent
                       shadow-md
                       placeholder-shown:text-gray-400 placeholder-shown:opacity-100
                       focus:placeholder-transparent"
            placeholder="Digite seu nome"
            value={userName}
            onChange={handleNameInputChange}
          />

          <Button
            onClick={handleProceed}
            className="w-full mt-4 py-3 bg-[#091E2C] hover:bg-[#132A3C] text-white rounded-lg text-lg font-medium"
          >
            Ok, vamos lá!
          </Button>
        </div>

        <p className="text-white text-sm mt-6 opacity-80">Seja Criativo e se prepare !</p>
      </div>
    </div>
  );
}
'use client';

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function ProfileContent() {
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState("Convidado");
  const [currentAvatarColor, setCurrentAvatarColor] = useState("#A8CFF5");
  const [roomPin, setRoomPin] = useState<string | null>(null);

  useEffect(() => {
    const nameFromUrl = searchParams.get("name");
    const pinFromUrl = searchParams.get("pin");
    const colorFromUrl = searchParams.get("color"); // Lê a cor da URL

    if (nameFromUrl) {
      setUserName(decodeURIComponent(nameFromUrl));
    }
    if (pinFromUrl) {
      setRoomPin(decodeURIComponent(pinFromUrl));
    }
    if (colorFromUrl) {
      setCurrentAvatarColor(decodeURIComponent(colorFromUrl)); // Define a cor do avatar
    }

  }, [searchParams]);

  return (
    // O container mais externo que envolve tudo na página
    // Garante que ele ocupa a tela inteira e centraliza seu conteúdo
    <div className="flex min-h-screen w-screen flex-col items-center justify-center relative overflow-hidden">
      {/* Imagem de fundo */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/Images/Fundo1.png"
          alt="Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-sky-50/80" />
      </div>

      {/* Este é o div que contém a logo e o Card Principal */}
      {/* Ele agora só precisa ter 'max-w-sm' para definir o tamanho do painel,
            pois o pai (acima) já faz a centralização completa. */}
      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        {/* Logo FeedHub */}
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

        {/* Card Principal */}
        <div className="bg-white rounded-3xl shadow-lg p-5 flex flex-col items-center w-full flex-grow-0 min-h-0 overflow-auto">
          <div className="mb-4">
            {/* Avatar com a inicial e a cor recebida */}
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-md"
              style={{ backgroundColor: currentAvatarColor }} // Aplica a cor do avatar
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div
            className="w-full mt-3 text-white rounded-lg p-3 text-center"
            style={{ backgroundColor: currentAvatarColor }} // Aplica a cor ao fundo do nome
          >
            <span className="font-medium text-lg">{userName}</span>
          </div>

          <div className="w-full mt-3 bg-white border border-[#E9F2FC] rounded-full p-3 text-center">
            <h2 className="text-[#1A3E55] text-base font-medium">
              Confira se está no Hub
            </h2>
            {roomPin && <p className="text-gray-500 text-sm mt-1">PIN da Sala: <span className="font-semibold">{roomPin}</span></p>}
          </div>

          <p className="mt-4 text-gray-600 text-center">
            Aguardando o professor iniciar a sessão...
          </p>

        </div>
      </div>
    </div>
  );
}
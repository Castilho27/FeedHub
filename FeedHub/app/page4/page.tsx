// app/profile/page.tsx (Sua Página 4 - Perfil/Hub)
"use client"; // ESSENCIAL: Permite usar hooks do React e Next.js

import { useSearchParams } from 'next/navigation'; // Hook para ler parâmetros da URL
import { useState, useEffect } from 'react'; // Hooks para estado e efeitos colaterais
import ColorAvatarEditor from "@/components/color-avatar"; // Importe seu componente
import Image from "next/image";

export default function ProfilePage() {
  const searchParams = useSearchParams(); // Instância do hook para acessar os parâmetros de busca
  const [userName, setUserName] = useState("Convidado"); // Estado para armazenar o nome, com um valor padrão inicial

  // useEffect para ler o nome da URL assim que o componente é montado ou searchParams muda
  useEffect(() => {
    const nameFromUrl = searchParams.get('name'); // Tenta obter o valor do parâmetro 'name'
    if (nameFromUrl) { // Se o parâmetro 'name' existir na URL
      setUserName(decodeURIComponent(nameFromUrl)); // Decodifica o nome e atualiza o estado
    }
  }, [searchParams]); // A dependência [searchParams] garante que este efeito re-execute se os parâmetros da URL mudarem

  // Função para lidar com a mudança de cor do avatar (passada para ColorAvatarEditor)
  const [currentAvatarColor, setCurrentAvatarColor] = useState("#A8CFF5"); // Estado para a cor do avatar
  const handleAvatarColorChange = (newColor: string) => {
    setCurrentAvatarColor(newColor);
  };

  return (
    <main className="min-h-screen flex flex-col items-center pt-8 pb-4">
      {/* Imagem de fundo */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/Images/fundo1.png"
          alt="Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-sky-50/80"></div>
      </div>

      {/* Conteúdo Principal Centralizado e Ocupando o Espaço Disponível */}
      <div className="z-10 w-full max-w-sm flex flex-col items-center flex-grow">
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

        {/* Card Branco Principal - Conteúdo da Página 4 */}
        <div className="bg-white rounded-3xl shadow-lg p-5 flex flex-col items-center w-full flex-grow-0 min-h-0 overflow-auto">
          {/* Editor de Avatar */}
          <div className="mb-4">
            <ColorAvatarEditor onColorChange={handleAvatarColorChange} />
          </div>

          {/* Painel do Nome - EXIBE O NOME CAPTURADO DA PÁGINA ANTERIOR */}
          <div
            className="w-full mt-3 text-white rounded-lg p-3 text-center"
            style={{ backgroundColor: currentAvatarColor }}
          >
            <span className="font-medium text-lg">{userName}</span> {/* AQUI: O nome digitado será exibido! */}
          </div>

          {/* Botão "Confira se está no Hub" */}
          <div className="w-full mt-3 bg-white border border-[#E9F2FC] rounded-full p-3 text-center">
            <h2 className="text-[#1A3E55] text-base font-medium">Confira se está no Hub</h2>
          </div>
        </div>
      </div>
    </main>
  );
}
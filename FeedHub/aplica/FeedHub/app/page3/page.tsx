// app/page3/page.tsx (Sua Página de Login)
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from 'next/image'; // Importe Image para a imagem de fundo

export default function LoginPage() {
  const [userName, setUserName] = useState("");
  const router = useRouter();

  const handleNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(event.target.value);
  };

  const handleProceed = () => {
    if (userName.trim() === "") {
      alert("Por favor, digite seu nome para continuar!");
      return;
    }
    router.push(`/page4?name=${encodeURIComponent(userName.trim())}`);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Imagem de fundo */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/Images/Fundo1.png" // Caminho da sua imagem de fundo
          alt="Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-sky-50/80"></div> {/* Camada semi-transparente */}
      </div>

      <div className="z-10 w-full max-w-md px-8 py-12 flex flex-col items-center">
        {/* Logo FeedHub */}
        <div className="flex justify-center mb-6">
          <div className="w-48 h-auto relative"> {/* Ajuste o tamanho conforme sua logo original */}
            <Image
              src="/Images/logo1.png" // Caminho da sua logo
              alt="FeedHub Logo"
              width={192} // Adicione width e height para otimização da imagem
              height={64}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full bg-white rounded-xl p-6 shadow-lg">
          <Input
            className="w-full py-3 px-4 text-center text-gray-600 text-lg rounded-lg
                       border-2 border-gray-300
                       focus:ring-0 focus:outline-none focus:border-blue-500
                       !ring-0 !outline-none !border-none !border-transparent
                       shadow-md
                       placeholder-shown:text-gray-400 placeholder-shown:opacity-100
                       focus:placeholder-transparent" // Classes para o placeholder sumir e bordas
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

        {/* Warning text */}
        <p className="text-white text-sm mt-6 opacity-80">Seja Criativo e se prepare !</p>
      </div>
    </div>
  );
}
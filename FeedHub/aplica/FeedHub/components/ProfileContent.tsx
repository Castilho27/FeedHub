'use client';

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import ColorAvatarEditor from "@/components/color-avatar";
import Image from "next/image";

export default function ProfileContent() {
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState("Convidado");

  useEffect(() => {
    const nameFromUrl = searchParams.get("name");
    if (nameFromUrl) {
      setUserName(decodeURIComponent(nameFromUrl));
    }
  }, [searchParams]);

  const [currentAvatarColor, setCurrentAvatarColor] = useState("#A8CFF5");
  const handleAvatarColorChange = (newColor: string) => {
    setCurrentAvatarColor(newColor);
  };

  return (
    <>
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

        {/* Card Principal */}
        <div className="bg-white rounded-3xl shadow-lg p-5 flex flex-col items-center w-full flex-grow-0 min-h-0 overflow-auto">
          <div className="mb-4">
            <ColorAvatarEditor onColorChange={handleAvatarColorChange} />
          </div>

          <div
            className="w-full mt-3 text-white rounded-lg p-3 text-center"
            style={{ backgroundColor: currentAvatarColor }}
          >
            <span className="font-medium text-lg">{userName}</span>
          </div>

          <div className="w-full mt-3 bg-white border border-[#E9F2FC] rounded-full p-3 text-center">
            <h2 className="text-[#1A3E55] text-base font-medium">
              Confira se está no Hub
            </h2>
          </div>
        </div>
      </div>
    </>
  );
}

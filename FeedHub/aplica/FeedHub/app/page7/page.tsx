"use client"; 

import { useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoPlace } from "@/components/logo-place"; 

export default function FeedbackCompletedPage() {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => {
  
      router.push('/');
    }, 5000); 

    return () => clearTimeout(timer); 
  }, [router]);

  const handleGoHome = () => {
    router.push('/'); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col items-center justify-center p-4 text-center">
      <header className="absolute top-0 w-full p-4 flex justify-center">
        <LogoPlace /> 
      </header>

      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full flex flex-col items-center justify-center">
        <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Feedback Enviado!</h1>
        <p className="text-gray-600 mb-8">
          Agradecemos o seu feedback. Ele é muito importante!
        </p>

        <div className="flex flex-col gap-4 w-full">
          <Button onClick={handleGoHome} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 rounded-xl">
            Voltar para a Página Inicial
          </Button>
        </div>
      </div>
    </div>
  );
}
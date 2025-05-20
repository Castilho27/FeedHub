'use client'

import PinEntry from "@/components/pin-entry"
import { User } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Home() {
  const router = useRouter()

  const handleUserClick = async () => {
    try {
      const res = await fetch('https://feedhub-theta.vercel.app/api/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})


      if (!res.ok) {
        alert('Erro ao criar sala')
        return
      }

      const data = await res.json()
      const pin = data.pin

      alert(`Sala criada! PIN: ${pin}`)

      // Aqui você pode redirecionar para outra página, se quiser:
      // router.push(`/professor?sala=${pin}`)

    } catch (error) {
      alert('Erro na comunicação com o servidor')
      console.error(error)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 relative">
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

      {/* Conteúdo principal */}
      <div className="flex flex-col items-center justify-center w-full max-w-xs flex-1 space-y-6 -mt-8">
        {/* Logo */}
        <div className="mb-2">
          <img 
            src="/Images/logo1.png" 
            alt="FeedHub Logo" 
            className="h-32 md:h-36"
          />
        </div>

        {/* Componente PIN */}
        <PinEntry />

        {/* Rodapé */}
        <div className="text-center text-[#091e2c] text-sm mt-4">
          © 2025 FeedHub. Todos os direitos reservados.
        </div>
      </div>

      {/* Botão do professor com texto */}
      <div className="absolute bottom-8 right-4 md:right-8 z-10 flex items-center gap-2">
        <span className="text-sm text-[#091e2c] bg-white/80 px-3 py-1 rounded-full shadow-sm">
          Você é professor? Clique aqui
        </span>
        <button 
          onClick={handleUserClick}
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

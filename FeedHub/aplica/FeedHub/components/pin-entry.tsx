"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function PinEntry() {
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!pin.trim()) {
      setError("Por favor, digite o PIN")
      return
    }

    if (!/^\d+$/.test(pin)) {
      setError("O PIN deve conter apenas números")
      return
    }

    // Verifica se é o PIN especial 113113
    if (pin === "113113") {
      router.push('/page3')
      return
    }

    setError("")
    alert(`PIN ${pin} enviado! Redirecionando...`)
    // Aqui seria o redirecionamento normal para outras salas
  }

  return (
    <Card className="w-full bg-white shadow-sm border border-[#a8cff5] rounded-xl overflow-hidden">
      <CardContent className="pt-6 pb-6">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
          <div className="text-center mb-1">
            <h2 className="text-lg font-medium text-[#091e2c] mb-1">Ajude a melhorar suas aulas!</h2>
            <p className="text-[#1a3e55] text-xs">Responda Anonimamente</p>
          </div>

          <Input
            type="text"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              if (error) setError("")
            }}
            placeholder="Digite o PIN da sala"
            className="text-center text-base h-12 text-[#091e2c] font-medium bg-[#e9f2fc]/50 border-[#a8cff5] focus-visible:ring-[#1a3e55] rounded-lg"
            maxLength={6}
          />

          {error && <p className="text-red-500 text-xs mt-0">{error}</p>}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-gradient-to-b from-[#1a3e55] to-[#091E2C] hover:from-[#1a3e55] hover:to-[#1a3e55] transition-all text-white rounded-lg shadow-sm"
          >
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
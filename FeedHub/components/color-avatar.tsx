// components/color-avatar.tsx
"use client"

import { useState, useEffect } from "react" // Importe useEffect
import { Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const colorOptions = [
  // Blues
  { name: "Azul Claro", value: "#A8CFF5" },
  { name: "Azul Médio", value: "#55ACE7" },
  { name: "Azul", value: "#4085B4" },
  { name: "Azul Escuro", value: "#2D6083" },
  { name: "Azul Marinho", value: "#1A3E55" },
  { name: "Azul Noite", value: "#091E2C" },

  // Greens
  { name: "Verde Água", value: "#7FDBCA" },
  { name: "Verde Claro", value: "#A8F5CF" },
  { name: "Verde", value: "#55E78A" },
  { name: "Verde Escuro", value: "#2D8360" },

  // Reds/Pinks
  { name: "Rosa Claro", value: "#F5A8CF" },
  { name: "Rosa", value: "#E755AC" },
  { name: "Vermelho", value: "#E75555" },
  { name: "Vermelho Escuro", value: "#832D2D" },

  // Yellows/Oranges
  { name: "Amarelo Claro", value: "#F5EFA8" },
  { name: "Amarelo", value: "#E7D155" },
  { name: "Laranja Claro", value: "#F5C3A8" },
  { name: "Laranja", value: "#E78A55" },

  // Purples
  { name: "Lilás", value: "#CFA8F5" },
  { name: "Roxo", value: "#8A55E7" },

  // Neutrals
  { name: "Branco", value: "#FFFFFF" },
  { name: "Cinza Claro", value: "#E0E0E0" },
  { name: "Cinza", value: "#A0A0A0" },
  { name: "Preto", value: "#303030" },
]

interface ColorAvatarEditorProps {
  onColorChange: (color: string) => void; // Adicione esta prop
}

export default function ColorAvatarEditor({ onColorChange }: ColorAvatarEditorProps) {
  const [selectedColor, setSelectedColor] = useState("#A8CFF5")
  const [isOpen, setIsOpen] = useState(false)

  // Use useEffect para chamar onColorChange quando a cor for selecionada
  // Isso garante que a cor inicial também seja passada para o pai
  useEffect(() => {
    onColorChange(selectedColor);
  }, [selectedColor, onColorChange]); // Dependências: re-executa se selectedColor ou onColorChange mudarem

  return (
    <div className="relative">
      <div
        className="w-40 h-40 rounded-full flex items-center justify-center"
        style={{ backgroundColor: selectedColor }}
      />

      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-0 right-0 bg-white p-3 rounded-full shadow-md hover:bg-gray-50 transition-colors"
        aria-label="Editar cor"
      >
        <Pencil className="w-5 h-5 text-[#4085B4]" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-[#2D6083]">Escolha sua cor</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-3 p-4 max-h-[400px] overflow-y-auto">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                className="w-12 h-12 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: color.value,
                  borderColor: selectedColor === color.value ? "#2D6083" : "transparent",
                  transform: selectedColor === color.value ? "scale(1.1)" : "scale(1)",
                }}
                onClick={() => {
                  setSelectedColor(color.value)
                  setIsOpen(false)
                  // onColorChange(color.value) // Não precisamos mais chamar aqui diretamente devido ao useEffect
                }}
                aria-label={`Selecionar cor ${color.name}`}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
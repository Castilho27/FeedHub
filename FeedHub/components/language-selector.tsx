import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LanguageSelector() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-white hover:bg-white/20 rounded-full"
      aria-label="Selecionar idioma"
    >
      <Globe className="h-5 w-5" />
    </Button>
  )
}

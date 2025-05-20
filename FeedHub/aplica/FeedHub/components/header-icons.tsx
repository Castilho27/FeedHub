import { Flag } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HeaderIcons() {
  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="text-[#1a3e55] hover:text-[#a8cff5] hover:bg-white/50 rounded-full transition-colors"
        aria-label="Selecionar idioma"
      >
        <Flag className="h-5 w-5" />
      </Button>
    </div>
  )
}

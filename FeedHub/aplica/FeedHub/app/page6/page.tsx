import { LogoPlace } from "@/components/logo-place"
import { FeedbackCard } from "@/components/feedback-card"
import { Download, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StudentFeedbackDashboard() {
  // Sample student feedback data
  const studentFeedback = [
    { id: 1, rating: 8, name: "Mais Infos", studentName: "Ana Silva", comment: "Gostei da aula dada" },
    { id: 2, rating: 1, name: "Mais Infos", studentName: "João Costa", comment: "Vagueza" },
    { id: 3, rating: 8, name: "Mais Infos", studentName: "Maria Santos", comment: "Vagueza" },
    {
      id: 4,
      rating: 10,
      name: "Mais Infos",
      studentName: "Pedro Oliveira",
      comment: "Vou esquecer-me rápido de tudo o que aprendi, um retrocesso se comparado",
    },
    {
      id: 5,
      rating: 10,
      name: "Mais Infos",
      studentName: "Sofia Martins",
      comment: "Vou esquecer-me rápido de tudo o que aprendi, um retrocesso se comparado",
    },
    {
      id: 6,
      rating: 10,
      name: "Mais Infos",
      studentName: "Lucas Ferreira",
      comment: "Vou esquecer-me rápido de tudo o que aprendi, um retrocesso se comparado",
    },
    { id: 7, rating: 10, name: "Mais Infos", studentName: "Beatriz Almeida", comment: "Satisfatoriamente bom" },
    { id: 8, rating: 8, name: "Menos Honesto", studentName: "Rafael Sousa", comment: "Gostei bastante Gostaria" },
    { id: 9, rating: 8, name: "Mais Infos", studentName: "Carolina Dias", comment: "Gostei bastante Gostaria" },
    { id: 10, rating: 9, name: "Mais Infos", studentName: "Tiago Ribeiro", comment: "Gostei bastante Gostaria" },
    { id: 11, rating: 9, name: "Menos Honesto", studentName: "Mariana Gomes", comment: "Gostei bastante Gostaria" },
    { id: 12, rating: 10, name: "Mais Infos", studentName: "Gabriel Lopes", comment: "Gostei bastante Gostaria" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <header className="container mx-auto p-4 flex justify-between items-center">
        <LogoPlace />
        <div className="flex gap-4">
          <Button variant="ghost" size="icon" className="text-sky-500 hover:bg-sky-100">
            <Camera className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-sky-500 hover:bg-sky-100">
            <Download className="w-6 h-6" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-12">
        <h1 className="text-3xl font-bold text-gray-800 my-6">Opiniões dos Alunos</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentFeedback.map((feedback) => (
            <FeedbackCard
              key={feedback.id}
              rating={feedback.rating}
              name={feedback.name}
              studentName={feedback.studentName}
              comment={feedback.comment}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

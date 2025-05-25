"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeedbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Pega os parâmetros da URL
  const pin = searchParams.get("pin") || "";
  const studentId = searchParams.get("student_id") || "";

  const [selectedRating, setSelectedRating] = useState<number>(8);
  const [comment, setComment] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!pin) throw new Error("PIN da sala inválido");
      if (!studentId) throw new Error("ID do estudante não encontrado");

      const response = await fetch(`http://localhost:3001/api/rooms/${pin}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "student-id": studentId,
          message: `Nota: ${selectedRating}/10 | Comentário: ${comment}`,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Erro ao enviar feedback");

      alert("Feedback enviado com sucesso!");
      setComment("");
      router.push(`/room/${pin}/completed`);
    } catch (error: any) {
      alert(`Falha no envio: ${error.message}`);
      console.error("Erro detalhado:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm p-8 relative">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>

        <h1 className="text-center text-2xl md:text-3xl font-medium text-slate-700 mb-8">
          Como você se sentiu com essa atividade?
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 md:gap-3 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => setSelectedRating(number)}
                className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-sm md:text-base font-medium transition-colors
                  ${
                    selectedRating === number
                      ? "bg-blue-400 text-white"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                {number}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nos conte o motivo da sua nota..."
              className="w-full h-32 p-4 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !comment.trim()}
            className={`w-full bg-blue-400 hover:bg-blue-500 text-white font-medium py-4 rounded-xl transition-colors
              ${isLoading ? "opacity-70 cursor-not-allowed" : ""}
              ${!comment.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Enviando..." : "Enviar feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}

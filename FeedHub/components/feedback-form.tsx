"use client"

import type React from "react"

import { useState } from "react"

export default function FeedbackForm() {
  const [selectedRating, setSelectedRating] = useState<number>(8)
  const [comment, setComment] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    console.log({ rating: selectedRating, comment })
    alert("Feedback enviado com sucesso!")
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-sm p-8">
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
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-400 hover:bg-blue-500 text-white font-medium py-4 rounded-xl transition-colors"
        >
          Enviar feedback
        </button>
      </form>
    </div>
  )
}

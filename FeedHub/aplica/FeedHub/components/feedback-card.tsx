"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface FeedbackCardProps {
  rating: number
  name: string
  studentName: string
  comment: string
}

export default function FeedbackCard({ rating, name, studentName, comment }: FeedbackCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="p-0">
        <div className="flex flex-col items-center">
          <div className="relative w-full flex justify-center py-6">
            <div className="bg-sky-300 rounded-full w-20 h-20 flex items-center justify-center">
              <span className="text-4xl font-bold">{rating}</span>
            </div>
          </div>

          <div className="w-full">
            <div className="bg-sky-300 text-center py-2 px-4 text-white font-medium flex items-center justify-center">
              {name}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 p-0 h-6 w-6 text-white hover:bg-sky-400 hover:text-white"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </Button>
            </div>

            <div className="p-4 text-center">
              <div className="font-medium text-gray-800 mb-2">{studentName}</div>
              <div
                className={`text-gray-600 bg-gray-50 p-3 rounded transition-all duration-200 ${
                  isExpanded
                    ? "text-sm min-h-[120px] max-h-[300px] overflow-y-auto"
                    : "text-xs max-h-[40px] overflow-hidden"
                }`}
              >
                {comment}
              </div>
              {!isExpanded && (
                <div className="mt-1 text-xs text-sky-500 cursor-pointer" onClick={() => setIsExpanded(true)}>
                  Ver mais...
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

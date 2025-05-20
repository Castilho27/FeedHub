import { GraduationCap } from "lucide-react"

export function FeedHubLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-white p-1.5 rounded-md">
        <GraduationCap className="h-6 w-6 text-[#2D6083]" />
      </div>
      <h1 className="text-white text-3xl font-bold">FeedHub</h1>
    </div>
  )
}

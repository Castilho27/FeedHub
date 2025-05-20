export default function ClassroomBackground() {
  return (
    <div className="fixed inset-0 z-0 opacity-10">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-sky-200" />
      {/* Circular desks */}
      <div className="absolute bottom-10 left-10 w-20 h-20 rounded-full bg-gray-300" />
      <div className="absolute bottom-20 left-40 w-20 h-20 rounded-full bg-gray-300" />
      <div className="absolute bottom-5 right-20 w-20 h-20 rounded-full bg-gray-300" />
      <div className="absolute bottom-30 right-60 w-20 h-20 rounded-full bg-gray-300" />
      {/* Projection screen */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-1/3 h-1/4 bg-white border-4 border-gray-400 rounded-lg">
        <div className="absolute inset-2 bg-gray-100 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-2 p-2">
            <div className="h-6 w-6 rounded-full bg-red-400" />
            <div className="h-6 w-6 rounded-full bg-blue-400" />
            <div className="h-6 w-6 rounded-full bg-green-400" />
            <div className="h-6 w-6 rounded-full bg-yellow-400" />
          </div>
        </div>
      </div>
      {/* School items */}
      <div className="absolute bottom-40 left-20 w-10 h-16 bg-blue-500 rounded" /> {/* Backpack */}
      <div className="absolute bottom-30 right-30 w-16 h-12 bg-gray-200 rounded" /> {/* Notebook */}
      <div className="absolute bottom-50 left-60 w-14 h-10 bg-yellow-200 rounded" /> {/* Book */}
    </div>
  )
}

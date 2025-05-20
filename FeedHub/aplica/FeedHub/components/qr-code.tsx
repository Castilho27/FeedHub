interface QRCodeProps {
  value: string
  size?: number
}

export default function QRCode({ value, size = 100 }: QRCodeProps) {
  return (
    <div className="h-24 w-24 bg-white p-2 rounded-lg">
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(value)}`}
        alt="QR Code"
        className="w-full h-full"
      />
    </div>
  )
}

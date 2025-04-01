"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type ProcrastinationOverlayProps = {
  onClose: () => void
}

export function ProcrastinationOverlay({ onClose }: ProcrastinationOverlayProps) {
  const [open, setOpen] = useState(true)
  const [content, setContent] = useState<number>(Math.floor(Math.random() * 4))

  const handleClose = () => {
    setOpen(false)
    onClose()
  }

  const renderContent = () => {
    switch (content) {
      case 0:
        return (
          <div className="flex flex-col items-center">
            <img src="/placeholder.svg?height=200&width=400" alt="Nyan Cat" className="mb-4 rounded-lg" />
            <h3 className="text-xl font-bold mb-2">Время мемов!</h3>
            <p className="text-center mb-4">Ваш внутренний прокрастинатор требует срочной дозы мемов.</p>
          </div>
        )
      case 1:
        return (
          <div className="flex flex-col items-center">
            <div className="bg-blue-500 text-white p-8 rounded-lg mb-4 w-full max-w-md">
              <h3 className="text-xl font-bold mb-2">:(</h3>
              <p className="mb-4">Произошла критическая ошибка лени.</p>
              <p className="mb-4">Система остановлена для просмотра котиков.</p>
              <p className="text-sm">Код ошибки: PR0CR4ST1N4T10N</p>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="flex flex-col items-center">
            <div className="border border-red-500 bg-red-100 text-red-800 p-6 rounded-lg mb-4 w-full">
              <h3 className="text-xl font-bold mb-2">⚠️ ВНИМАНИЕ! ⚠️</h3>
              <p className="mb-2">Обнаружен критический уровень продуктивности!</p>
              <p>Срочно необходимо отвлечься на что-нибудь бесполезное.</p>
            </div>
          </div>
        )
      case 3:
      default:
        return (
          <div className="flex flex-col items-center">
            <div className="p-6 border rounded-lg mb-4 w-full text-center">
              <h3 className="text-xl font-bold mb-4">Ушел смотреть мемы</h3>
              <p className="text-4xl mb-4">🏝️ 🏖️ 😎</p>
              <p className="italic">Вернусь никогда</p>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Режим Прокрастинации Активирован!</DialogTitle>
        </DialogHeader>
        {renderContent()}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setContent((content + 1) % 4)}>
            Еще отвлечение
          </Button>
          <Button onClick={handleClose}>Вернуться к работе (зачем?)</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


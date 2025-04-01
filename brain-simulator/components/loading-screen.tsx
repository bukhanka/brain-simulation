"use client"

import { useEffect, useState } from "react"

export function LoadingScreen() {
  const [loadingText, setLoadingText] = useState("Компиляция лени... Пожалуйста, подождите (или нет)")

  useEffect(() => {
    const texts = [
      "Компиляция лени... Пожалуйста, подождите (или нет)",
      "Дефрагментация мыслей... найдено 3 мема и 1 баг",
      "Загрузка кофеина в систему...",
      "Поиск мотивации... 404 Not Found",
      "Инициализация прокрастинации...",
      "Калибровка уровня стресса...",
    ]

    const interval = setInterval(() => {
      setLoadingText(texts[Math.floor(Math.random() * texts.length)])
    }, 800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">{loadingText}</h2>
        <p className="text-muted-foreground">Загрузка мозга программиста...</p>
      </div>
    </div>
  )
}


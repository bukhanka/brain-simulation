"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useRef, useState } from "react"
import { generateEvent } from "@/lib/api/openai"
import { STORAGE_KEYS, STORAGE_UPDATE_EVENT, dispatchStorageUpdate } from "@/lib/storage-utils"

type EventLogProps = {
  events?: Array<{
    time: string
    text: string
  }>
  messages?: Array<{
    id: string
    sender: "user" | "ai"
    content: string
    timestamp: Date
  }>
  currentTask?: {
    title: string
    progress: number
  } | null
  autoProcrastinate?: boolean
}

export function EventLog({ events = [], messages = [], currentTask = null, autoProcrastinate = true }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  
  // Track previous state to avoid unnecessary updates
  const prevEventsRef = useRef<string>("")
  const isUpdatingRef = useRef(false)
  
  // Загружаем события из localStorage при первой загрузке
  const [brainEvents, setBrainEvents] = useState<Array<{time: string, text: string}>>(() => {
    if (typeof window !== 'undefined') {
      const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS)
      if (savedEvents) {
        try {
          prevEventsRef.current = savedEvents // Store initial state
          return JSON.parse(savedEvents)
        } catch (e) {
          console.error('Ошибка при загрузке событий из localStorage:', e)
        }
      }
    }
    return events || [] // Fallback to props events if available
  })
  
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)

  // Сохраняем события в localStorage при их изменении
  useEffect(() => {
    if (typeof window !== 'undefined' && brainEvents.length > 0 && !isUpdatingRef.current) {
      isUpdatingRef.current = true
      
      try {
        const eventsJson = JSON.stringify(brainEvents)
        
        // Only save if events actually changed
        if (prevEventsRef.current !== eventsJson) {
          prevEventsRef.current = eventsJson
          localStorage.setItem(STORAGE_KEYS.EVENTS, eventsJson)
          
          // Dispatch custom event
          if (typeof dispatchStorageUpdate === 'function') {
            dispatchStorageUpdate(STORAGE_KEYS.EVENTS, brainEvents)
          }
        }
      } finally {
        // Reset updating flag after a short delay
        setTimeout(() => {
          isUpdatingRef.current = false
        }, 50)
      }
    }
  }, [brainEvents])

  // Listen for custom storage updates
  useEffect(() => {
    const handleCustomStorageUpdate = (e: any) => {
      if (!isUpdatingRef.current && e.detail && e.detail.key === STORAGE_KEYS.EVENTS && e.detail.newValue) {
        try {
          const newEventsJson = e.detail.newValue
          
          // Only update if different from current state
          if (prevEventsRef.current !== newEventsJson) {
            prevEventsRef.current = newEventsJson
            const updatedEvents = JSON.parse(newEventsJson)
            setBrainEvents(updatedEvents)
          }
        } catch (e) {
          console.error('Ошибка при обновлении событий:', e)
        }
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener(STORAGE_UPDATE_EVENT, handleCustomStorageUpdate)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(STORAGE_UPDATE_EVENT, handleCustomStorageUpdate)
      }
    }
  }, [])

  // Эффект для автоматической генерации событий мозга
  useEffect(() => {
    if (!autoProcrastinate) return
    
    // Генерируем событие каждые 8-15 секунд
    const intervalId = setInterval(async () => {
      try {
        // Если у нас есть задача, есть 60% шанс сгенерировать событие
        if (currentTask && Math.random() < 0.6) {
          // Форматируем время
          const now = new Date()
          const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          
          // Добавляем новое случайное событие
          const randomEvent = await generateEvent()
          setBrainEvents(prev => [...prev, { time: timeString, text: randomEvent }])
        }
      } catch (error) {
        console.error("Ошибка при генерации события:", error)
      }
    }, Math.floor(Math.random() * 7000) + 8000) // 8-15 секунд
    
    return () => clearInterval(intervalId)
  }, [currentTask, autoProcrastinate])
  
  // Эффект для добавления сообщений чата в ленту событий
  useEffect(() => {
    if (messages.length === 0) return
    
    const latestMessage = messages[messages.length - 1]
    
    // Проверяем, не обрабатывали ли мы уже это сообщение
    if (latestMessage.id === lastMessageId) return
    
    // Обновляем ID последнего обработанного сообщения
    setLastMessageId(latestMessage.id)
    
    // Добавляем сообщение в ленту событий
    const timeString = latestMessage.timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
    
    // Только для сообщений от ИИ или по определенному шаблону для пользователя
    if (latestMessage.sender === "ai" || 
        (latestMessage.sender === "user" && 
         (latestMessage.content.toLowerCase().includes("статус") || 
          latestMessage.content.toLowerCase().includes("помощь")))) {
      
      const eventText = latestMessage.sender === "ai" 
        ? `ИИ: ${latestMessage.content.length > 50 ? latestMessage.content.substring(0, 50) + "..." : latestMessage.content}`
        : `Пользователь: ${latestMessage.content}`
      
      setBrainEvents(prev => [...prev, { time: timeString, text: eventText }])
    }
  }, [messages, lastMessageId])

  // Добавляем внешние события (переданные через props)
  useEffect(() => {
    if (events && events.length > 0) {
      // Проверяем, какие события новые (не присутствуют в текущем состоянии)
      const existingEvents = new Set(brainEvents.map(e => `${e.time}:${e.text}`))
      const newEvents = events.filter(e => !existingEvents.has(`${e.time}:${e.text}`))
      
      if (newEvents.length > 0) {
        setBrainEvents(prev => [...prev, ...newEvents])
      }
    }
  }, [events, brainEvents])

  useEffect(() => {
    // Scroll to the bottom when events change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [events, brainEvents])

  // Объединяем все события и сортируем по времени
  const allEvents = [...brainEvents].sort((a, b) => {
    // Преобразуем строковые представления времени в объекты Date для корректной сортировки
    const timeA = a.time.split(':').map(Number)
    const timeB = b.time.split(':').map(Number)
    
    // Сравниваем час, минуту, секунду
    if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0]
    if (timeA[1] !== timeB[1]) return timeA[1] - timeB[1]
    return timeA[2] - timeB[2]
  })

  // Очистка событий (для вызова из родительского компонента)
  useEffect(() => {
    // Явная проверка на сброс событий
    if (events && events.length === 0 && brainEvents.length > 0) {
      setBrainEvents([])
      localStorage.removeItem(STORAGE_KEYS.EVENTS)
    }
  }, [events, brainEvents.length])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Лента Событий</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-4rem)] p-4" ref={scrollRef}>
          <div className="space-y-2">
            {allEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Ожидание мыслительной активности...</p>
            ) : (
              allEvents.map((event, index) => (
                <div key={index} className="text-sm">
                  <span className="text-muted-foreground font-mono">[{event.time}]</span> <span>{event.text}</span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}


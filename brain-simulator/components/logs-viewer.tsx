"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Download, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type LogEntry = {
  timestamp: Date
  action: string
  details: Record<string, any>
}

type LogsViewerProps = {
  logs: LogEntry[]
  onExport?: () => void
}

export function LogsViewer({ logs, onExport }: LogsViewerProps) {
  const [filter, setFilter] = useState("")
  const [expandedLogs, setExpandedLogs] = useState<Record<number, boolean>>({})

  // Функция для фильтрации логов
  const filteredLogs = logs.filter(log => {
    if (!filter) return true
    return (
      log.action.toLowerCase().includes(filter.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(filter.toLowerCase())
    )
  })

  // Функция для форматирования даты
  const formatDate = (date: Date) => {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Функция для экспорта логов
  const handleExport = () => {
    if (onExport) {
      onExport()
      return
    }

    const logData = JSON.stringify(logs, null, 2)
    const blob = new Blob([logData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `brain-simulator-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Функция для переключения состояния развернутости лога
  const toggleLogExpand = (index: number) => {
    setExpandedLogs(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle>Журнал системы</CardTitle>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Фильтр"
              className="pl-8 pr-2 py-1 text-sm rounded-md border bg-background"
            />
          </div>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Экспорт
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-4rem)] p-2">
          {filteredLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">
              {filter ? "Логи не найдены по заданному фильтру" : "Логи отсутствуют"}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <Collapsible 
                  key={index} 
                  open={expandedLogs[index]} 
                  onOpenChange={() => toggleLogExpand(index)}
                  className="border rounded-md overflow-hidden"
                >
                  <CollapsibleTrigger className="w-full flex items-center justify-between p-2 hover:bg-muted/50 focus:outline-none text-left">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getActionColor(log.action)}`}></span>
                      <span className="text-sm font-medium">{log.action}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</span>
                    </div>
                    {expandedLogs[index] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-2 bg-muted/30 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-48">
                      {JSON.stringify(log.details, null, 2)}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Функция для определения цвета индикатора в зависимости от типа действия
function getActionColor(action: string): string {
  if (action.includes('error')) {
    return 'bg-red-500'
  } else if (action.includes('api_')) {
    return 'bg-blue-500'
  } else if (action.includes('task_')) {
    return 'bg-green-500'
  } else if (action.includes('user_')) {
    return 'bg-yellow-500'
  } else if (action.includes('ai_')) {
    return 'bg-purple-500'
  } else {
    return 'bg-gray-500'
  }
} 
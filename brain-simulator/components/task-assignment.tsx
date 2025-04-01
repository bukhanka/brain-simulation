"use client"

import { useState, useEffect } from "react"
import { CornerDownLeft, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

export type Task = {
  id: string
  title: string
  description: string
  status: "pending" | "in-progress" | "completed" | "failed"
  progress: number
  createdAt: Date
}

type TaskAssignmentProps = {
  tasks: Task[]
  currentTask: Task | null
  onCreateTask: (title: string, description: string) => Promise<void>
  isLoading?: boolean
}

export function TaskAssignment({ tasks, currentTask, onCreateTask, isLoading = false }: TaskAssignmentProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [hasCompletedTask, setHasCompletedTask] = useState(false)
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null)

  // Отслеживаем изменения в задачах для обнаружения завершенных
  useEffect(() => {
    if (currentTask?.status === "completed") {
      // Проверяем, не показывали ли мы уже уведомление для этой задачи
      if (currentTask.id !== completedTaskId) {
        setHasCompletedTask(true)
        setCompletedTaskId(currentTask.id)
        
        // Показываем уведомление в течение 5 секунд
        setTimeout(() => {
          setHasCompletedTask(false)
        }, 5000)
      }
    }
  }, [currentTask, completedTaskId])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() === "" || isLoading) return
    
    await onCreateTask(title.trim(), description.trim())
    setTitle("")
    setDescription("")
  }
  
  const getStatusText = (status: Task["status"]) => {
    switch(status) {
      case "pending": return "В ожидании"
      case "in-progress": return "В работе"
      case "completed": return "Выполнено"
      case "failed": return "Отменено"
    }
  }
  
  const getStatusColor = (status: Task["status"]) => {
    switch(status) {
      case "pending": return "bg-yellow-500"
      case "in-progress": return "bg-blue-500"
      case "completed": return "bg-green-500"
      case "failed": return "bg-red-500"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle>Задачи</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Уведомление о завершении задачи */}
        {hasCompletedTask && (
          <div className="m-2 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
            <h3 className="font-semibold text-green-800 dark:text-green-300">
              Задача успешно выполнена!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              {currentTask?.title} - задача выполнена и готова к проверке
            </p>
          </div>
        )}

        {/* Текущая задача */}
        {currentTask && (
          <div className="p-4 border-b">
            <h3 className="font-medium">Текущая задача</h3>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{currentTask.title}</h4>
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(currentTask.status)} bg-opacity-20 text-black dark:text-white`}>
                  {getStatusText(currentTask.status)}
                </span>
              </div>
              {currentTask.description && (
                <p className="text-sm mt-2 text-muted-foreground">{currentTask.description}</p>
              )}
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Прогресс</span>
                  <span>{currentTask.progress}%</span>
                </div>
                <Progress value={currentTask.progress} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {/* Форма добавления новой задачи */}
        <form onSubmit={handleSubmit} className="p-4 border-b">
          <h3 className="font-medium">
            {currentTask ? "Добавить новую задачу" : "Создать задачу"}
          </h3>
          <div className="mt-2 space-y-2">
            <Input
              placeholder="Название задачи"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
            <Textarea
              placeholder="Описание задачи (опционально)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={title.trim() === "" || isLoading}>
              {isLoading ? "Создание..." : "Создать задачу"}
              {!isLoading && <Plus className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </form>

        {/* История задач */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="font-medium p-4 pb-2">История задач</h3>
          <ScrollArea className="flex-1">
            <div className="space-y-3 p-4 pt-0">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Нет выполненных задач
                </p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">{task.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)} bg-opacity-20 text-black dark:text-white`}>
                        {getStatusText(task.status)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Прогресс: {task.progress}%</span>
                      <span>{formatDate(task.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
} 
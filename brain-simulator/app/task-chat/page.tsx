"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ChatInterface } from "@/components/chat-interface" 
import { TaskAssignment } from "@/components/task-assignment"
import { EventLog } from "@/components/event-log"
import { LogsViewer } from "@/components/logs-viewer"
import { AdvancedCodingPanel } from "@/components/advanced-coding-panel"
import { useTaskChatApi } from "@/hooks/use-task-chat-api"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, History, Trash2, RefreshCcw, Code, MessageCircle, Database } from "lucide-react"
import { DataManager } from "@/components/data-manager"

export default function TaskChatPage() {
  const { 
    messages, 
    tasks, 
    currentTask, 
    loading, 
    error, 
    sendMessage, 
    createTask,
    getLogs,
    clearHistory
  } = useTaskChatApi()
  
  const [events, setEvents] = useState<Array<{time: string, text: string}>>([])
  const [activeTab, setActiveTab] = useState<string>("event-log")
  const [viewMode, setViewMode] = useState<"chat" | "advanced">("chat")
  const [showDataManager, setShowDataManager] = useState(false)
  
  // Функция для очистки событий при сохранении логов
  const handleClearEvents = () => {
    if (window.confirm('Очистить ленту событий? История чата и задачи будут сохранены.')) {
      setEvents([])
    }
  }
  
  // Функция для скачивания логов отдельно от виджета
  const handleDownloadLogs = () => {
    const logData = JSON.stringify(getLogs(), null, 2)
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

  // Добавляем эффект для фиксации событий при изменении статуса задачи
  useEffect(() => {
    if (!currentTask) return
    
    // Записываем важные события прогресса
    if (currentTask.progress % 25 === 0 && currentTask.progress > 0) {
      const now = new Date()
      const timeString = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
      
      setEvents(prev => [
        ...prev, 
        { 
          time: timeString, 
          text: `Прогресс задачи "${currentTask.title}" достиг ${currentTask.progress}%` 
        }
      ])
    }
  }, [currentTask])

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
      <div className="border-b pb-2 mb-2 flex justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "chat" | "advanced")}>
          <TabsList>
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4 mr-1" />
              Чат с ассистентом
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Code className="h-4 w-4 mr-1" />
              Продвинутое кодирование
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center" 
          onClick={() => setShowDataManager(!showDataManager)}
        >
          <Database className="h-4 w-4 mr-1" />
          {showDataManager ? "Скрыть управление данными" : "Управление данными"}
        </Button>
      </div>
      
      {showDataManager && (
        <div className="mb-4">
          <DataManager />
        </div>
      )}
      
      {viewMode === "chat" ? (
        <ResizablePanelGroup 
          direction="horizontal" 
          className="h-full w-full"
        >
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={60} minSize={30}>
                <TaskAssignment 
                  tasks={tasks} 
                  currentTask={currentTask} 
                  onCreateTask={createTask} 
                  isLoading={loading} 
                />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={40} minSize={20}>
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center p-2 border-b">
                    <Tabs defaultValue="event-log" value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList>
                        <TabsTrigger value="event-log">
                          <BarChart className="h-4 w-4 mr-1" />
                          События
                        </TabsTrigger>
                        <TabsTrigger value="logs">
                          <History className="h-4 w-4 mr-1" />
                          Логи
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="flex gap-1">
                      {activeTab === "event-log" ? (
                        <Button variant="ghost" size="icon" onClick={handleClearEvents} title="Очистить события">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={handleDownloadLogs} title="Скачать логи">
                            <RefreshCcw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={clearHistory} title="Очистить историю">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    {activeTab === "event-log" ? (
                      <EventLog 
                        events={events}
                        messages={messages}
                        currentTask={currentTask}
                        autoProcrastinate={true}
                      />
                    ) : (
                      <LogsViewer logs={getLogs()} />
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={70} minSize={40}>
            <ChatInterface 
              title="Чат с Ассистентом"
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={loading}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="h-full p-2">
          <AdvancedCodingPanel />
        </div>
      )}
      
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
} 
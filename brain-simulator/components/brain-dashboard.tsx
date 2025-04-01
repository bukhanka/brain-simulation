"use client"

import { useEffect, useState } from "react"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { AgentMap } from "@/components/agent-map"
import { VitalSignsPanel } from "@/components/vital-signs-panel"
import { TaskProgressWindow } from "@/components/task-progress-window"
import { EventLog } from "@/components/event-log"
import { ProcrastinationOverlay } from "@/components/procrastination-overlay"
import { LoadingScreen } from "@/components/loading-screen"
import { DataManager } from "@/components/data-manager"
import { Button } from "@/components/ui/button"
import { useBrainApi } from "@/hooks/use-brain-api"
import { AgentRole } from "@/lib/api/openai"
import { Database } from "lucide-react"
import { STORAGE_KEYS, STORAGE_UPDATE_EVENT } from "@/lib/storage-utils"
import React from "react"

export function BrainDashboard() {
  const { getAgentThoughts, generateCode, generateEvent, loading, error } = useBrainApi()
  const [appLoading, setAppLoading] = useState(true)
  const [activeAgent, setActiveAgent] = useState<AgentRole>(() => {
    // Attempt to load last active agent from localStorage
    if (typeof window !== 'undefined') {
      const savedAgent = localStorage.getItem("brain_simulator_active_agent");
      return (savedAgent as AgentRole) || "planner";
    }
    return "planner";
  })
  const [showProcrastination, setShowProcrastination] = useState(false)
  const [showDataManager, setShowDataManager] = useState(false)
  
  // Load vital signs from localStorage or use defaults
  const [vitalSigns, setVitalSigns] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedVitalSigns = localStorage.getItem("brain_simulator_vital_signs");
      if (savedVitalSigns) {
        try {
          return JSON.parse(savedVitalSigns);
        } catch (e) {
          console.error('Error loading vital signs from localStorage:', e);
        }
      }
    }
    return {
      focus: 80,
      energy: 70,
      dopamine: 50,
      stress: 30,
    };
  });
  
  // Загружаем существующие события из localStorage, если они есть
  const [events, setEvents] = useState<Array<{ time: string; text: string }>>(() => {
    if (typeof window !== 'undefined') {
      const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS)
      if (savedEvents) {
        try {
          return JSON.parse(savedEvents)
        } catch (e) {
          console.error('Ошибка при загрузке событий из localStorage:', e)
          return []
        }
      }
    }
    return []
  })
  
  // Проверяем наличие текущей задачи в localStorage
  const [task, setTask] = useState(() => {
    if (typeof window !== 'undefined') {
      const currentTask = localStorage.getItem(STORAGE_KEYS.CURRENT_TASK)
      if (currentTask && currentTask !== "null") {
        try {
          const parsedTask = JSON.parse(currentTask, (key, value) => {
            if (key === 'createdAt') return new Date(value)
            return value
          })
          
          if (parsedTask) {
            return {
              title: parsedTask.title || "Implement new feature",
              status: parsedTask.status || "In Progress 🤔",
              code: "// Инициализация кода...\n// Работаем над задачей: " + parsedTask.title + "\n\nfunction implementFeature() {\n  // TODO: Реализовать функционал\n  return 'Работа в процессе';\n}\n",
            }
          }
        } catch (e) {
          console.error('Ошибка при загрузке задачи из localStorage:', e)
        }
      }
    }
    
    return {
      title: "Implement new feature",
      status: "In Progress 🤔",
      code: "// Инициализация кода...\n// Ожидаем вдохновения...\n\nfunction createFeature() {\n  // TODO: Понять, что я делаю\n  return 'Что-то удивительное';\n}\n",
    }
  })

  // Add an event to the log
  const addEvent = React.useCallback((text: string) => {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
    setEvents((prev) => [...prev, { time, text }])
  }, [])

  // Update vital signs based on active agent
  const updateVitalSigns = React.useCallback((agent: AgentRole) => {
    setVitalSigns((prev: { focus: number; energy: number; dopamine: number; stress: number }) => {
      let newSigns = { ...prev }
      
      switch (agent) {
        case "procrastinator":
          newSigns.focus = Math.max(prev.focus - 30, 10)
          newSigns.dopamine = Math.min(prev.dopamine + 40, 100)
          newSigns.stress = Math.max(prev.stress - 20, 10)
          break
        case "critic":
          newSigns.stress = Math.min(prev.stress + 20, 100)
          break
        case "coder":
          newSigns.focus = Math.min(prev.focus + 10, 100)
          newSigns.energy = Math.max(prev.energy - 5, 0)
          break
        case "focus":
          newSigns.focus = Math.min(prev.focus + 15, 100)
          newSigns.stress = Math.max(prev.stress - 10, 0)
          break
        case "planner":
          newSigns.energy = Math.min(prev.energy + 5, 100)
          break
        default:
          // Apply small random fluctuations
          const randomChange = () => Math.floor(Math.random() * 11) - 5
          newSigns = {
            focus: Math.max(Math.min(prev.focus + randomChange(), 100), 0),
            energy: Math.max(Math.min(prev.energy + randomChange(), 100), 0),
            dopamine: Math.max(Math.min(prev.dopamine + randomChange(), 100), 0),
            stress: Math.max(Math.min(prev.stress + randomChange(), 100), 0),
          }
      }
      
      // Save updated vital signs to localStorage
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem("brain_simulator_vital_signs", JSON.stringify(newSigns));
        }
      } catch (e) {
        console.error('Error saving vital signs to localStorage:', e);
      }
      
      return newSigns
    })
  }, []);

  // Update code based on current task
  const updateCode = React.useCallback(async () => {
    if (!task || !task.title) return;
    
    const generatedCode = await generateCode(task.title)
    if (generatedCode) {
      setTask((prev) => ({
        ...prev,
        code: generatedCode,
      }))
      
      // Store the updated code in a localStorage variable so other components can access it
      try {
        const currentTask = localStorage.getItem(STORAGE_KEYS.CURRENT_TASK)
        if (currentTask && currentTask !== "null") {
          const parsedTask = JSON.parse(currentTask)
          
          // Store the generated code in a separate localStorage key
          localStorage.setItem('brain_simulator_generated_code', generatedCode)
          
          addEvent(`Код для задачи "${task.title}" обновлен`)
        }
      } catch (e) {
        console.error('Ошибка при обновлении кода:', e)
      }
      
      const statuses = [
        "In Progress 🤔",
        "Debugging 🔥",
        "Refactoring 🧹",
        "Reviewing 🔍",
        "Testing 🧪",
      ]
      
      if (Math.random() > 0.7) {
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)]
        setTask((prev) => ({
          ...prev,
          status: newStatus,
        }))
        addEvent(`Статус задачи обновлен: ${newStatus}`)
      }
    }
  }, [task, generateCode, addEvent])

  // Generate random event
  const fetchRandomEvent = React.useCallback(async () => {
    const event = await generateEvent()
    if (event) {
      addEvent(event)
    }
  }, [generateEvent, addEvent])

  // Следим за изменениями в localStorage для currentTask
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.CURRENT_TASK && e.newValue) {
        try {
          const parsedTask = JSON.parse(e.newValue, (key, value) => {
            if (key === 'createdAt') return new Date(value)
            return value
          })
          
          if (parsedTask) {
            // Если задача изменена, обновляем состояние и добавляем событие
            setTask({
              title: parsedTask.title,
              status: parsedTask.status || "In Progress 🤔",
              code: task.code, // Сохраняем текущий код
            })
            
            // Если есть прогресс, добавляем событие
            if (parsedTask.progress) {
              addEvent(`Прогресс задачи "${parsedTask.title}": ${parsedTask.progress}%`)
            }
            
            // Если задача завершена, добавляем соответствующее событие
            if (parsedTask.status === "completed") {
              addEvent(`Задача "${parsedTask.title}" завершена`)
            }
          }
        } catch (e) {
          console.error('Ошибка при обработке изменений localStorage:', e)
        }
      }
      
      // Также обновляем события при их изменении
      if (e.key === STORAGE_KEYS.EVENTS && e.newValue) {
        try {
          setEvents(JSON.parse(e.newValue))
        } catch (e) {
          console.error('Ошибка при обновлении событий:', e)
        }
      }
    }
    
    // Handler for our custom events in the same tab
    const handleCustomStorageUpdate = (e: any) => {
      if (e.detail) {
        if (e.detail.key === STORAGE_KEYS.CURRENT_TASK && e.detail.newValue) {
          try {
            const parsedTask = JSON.parse(e.detail.newValue)
            
            if (parsedTask) {
              // Если задача изменена, обновляем состояние и добавляем событие
              setTask({
                title: parsedTask.title,
                status: parsedTask.status || "In Progress 🤔",
                code: task.code, // Сохраняем текущий код
              })
              
              // Если есть прогресс, добавляем событие
              if (parsedTask.progress) {
                addEvent(`Прогресс задачи "${parsedTask.title}": ${parsedTask.progress}%`)
              }
              
              // Если задача завершена, добавляем соответствующее событие
              if (parsedTask.status === "completed") {
                addEvent(`Задача "${parsedTask.title}" завершена`)
              }
            }
          } catch (e) {
            console.error('Ошибка при обработке изменений из кастомного события:', e)
          }
        }
        
        // Также обновляем события при их изменении
        if (e.detail.key === STORAGE_KEYS.EVENTS && e.detail.newValue) {
          try {
            setEvents(JSON.parse(e.detail.newValue))
          } catch (e) {
            console.error('Ошибка при обновлении событий из кастомного события:', e)
          }
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(STORAGE_UPDATE_EVENT, handleCustomStorageUpdate)
    
    // Для обновления данных внутри той же вкладки
    const checkLocalStorageInterval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const currentTask = localStorage.getItem(STORAGE_KEYS.CURRENT_TASK)
        if (currentTask && currentTask !== "null") {
          try {
            const parsedTask = JSON.parse(currentTask)
            
            // Если появилась новая задача или изменился статус, обновляем код
            if (parsedTask.title !== task.title || parsedTask.status !== task.status) {
              updateCode() // Обновляем код для отображения
            }
          } catch (e) {
            // Игнорируем ошибки разбора
          }
        }
      }
    }, 5000) // Проверяем каждые 5 секунд
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(STORAGE_UPDATE_EVENT, handleCustomStorageUpdate)
      clearInterval(checkLocalStorageInterval)
    }
  }, [task, addEvent, updateCode])

  // Simulate agent changes
  useEffect(() => {
    // Initial loading screen
    const loadingTimer = setTimeout(() => {
      setAppLoading(false)
      
      // Only add initialization event if there are no existing events
      if (events.length === 0) {
        addEvent("Мозговая симуляция инициализирована. Удачи!")
      }
    }, 2000)

    // Simulate agent changes
    const agentTimer = setInterval(() => {
      const agents: AgentRole[] = ["planner", "coder", "procrastinator", "critic", "researcher", "focus"]
      const newAgent = agents[Math.floor(Math.random() * agents.length)] as AgentRole
      setActiveAgent(newAgent)
      
      // Save active agent to localStorage
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem("brain_simulator_active_agent", newAgent);
        }
      } catch (e) {
        console.error('Error saving active agent to localStorage:', e);
      }
      
      updateVitalSigns(newAgent)

      if (newAgent === "procrastinator") {
        setShowProcrastination(true)
        addEvent("Прокрастинатор захватил контроль! Продуктивность падает...")
      } else {
        setShowProcrastination(false)
      }

      if (newAgent === "critic") {
        addEvent("Критик анализирует код. Готовься к жёсткой критике!")
      }

      if (newAgent === "coder") {
        updateCode()
      }
    }, 15000) // Slower agent changes to reduce API calls

    // Generate random events periodically
    const eventTimer = setInterval(() => {
      if (Math.random() > 0.7) {
        fetchRandomEvent()
      }
    }, 12000) // Less frequent events to reduce API calls

    return () => {
      clearTimeout(loadingTimer)
      clearInterval(agentTimer)
      clearInterval(eventTimer)
    }
  }, [updateVitalSigns, addEvent, fetchRandomEvent, updateCode, events.length])

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && events.length > 0) {
      try {
        // Check size before attempting to store
        const eventsString = JSON.stringify(events);
        
        // If events are too large, trim them
        if (eventsString.length > 1 * 1024 * 1024) { // 1MB limit
          console.warn("Events log too large, trimming to reduce size");
          setEvents(prev => prev.slice(-50)); // Keep only last 50 events
          return; // Exit and wait for next update
        }
        
        localStorage.setItem(STORAGE_KEYS.EVENTS, eventsString);
      } catch (e) {
        console.error('Error storing events in localStorage:', e);
        // If quota exceeded, reduce events list size
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          setEvents(prev => prev.slice(-30)); // Keep only last 30 events
        }
      }
    }
  }, [events]);

  // Display error if API fails
  useEffect(() => {
    if (error) {
      // Check if it's a geographic restriction error
      if (error.includes('недоступна в вашем регионе')) {
        addEvent(`🚫 Ошибка доступа: API OpenAI недоступна в вашем регионе (Нидерланды). Необходимо настроить прокси в разрешенном регионе.`)
      } else {
        addEvent(`Ошибка связи с ИИ: ${error}`)
      }
    }
  }, [error])

  if (appLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="w-full h-[calc(100vh-2rem)] overflow-hidden">
      <div className="flex justify-end mb-2">
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
    
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={20}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={40} minSize={20}>
              <VitalSignsPanel vitalSigns={vitalSigns} />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={60}>
              <EventLog events={events} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={70}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={40} minSize={30}>
              <AgentMap activeAgent={activeAgent} />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={60}>
              <TaskProgressWindow task={task} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      {showProcrastination && <ProcrastinationOverlay onClose={() => setShowProcrastination(false)} />}
    </div>
  )
}


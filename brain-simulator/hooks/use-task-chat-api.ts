import { useState, useEffect, useRef } from "react"
import { Task } from "@/components/task-assignment"
import { v4 as uuidv4 } from "uuid"
import { AgentRole } from "@/lib/api/openai"
import { STORAGE_KEYS, dispatchStorageUpdate } from "@/lib/storage-utils"

type Message = {
  id: string
  sender: "user" | "ai"
  content: string
  timestamp: Date
}

type TaskChatApiState = {
  loading: boolean
  error: string | null
}

// Добавляем тип для логирования
type LogEntry = {
  timestamp: Date
  action: string
  details: Record<string, any>
}

export function useTaskChatApi() {
  const [state, setState] = useState<TaskChatApiState>({
    loading: false,
    error: null,
  })
  
  // Инициализация состояния из localStorage или с дефолтным значением
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES)
      if (savedMessages) {
        try {
          // Преобразуем строки timestamp обратно в объекты Date
          return JSON.parse(savedMessages, (key, value) => {
            if (key === 'timestamp') return new Date(value)
            return value
          })
        } catch (e) {
          console.error('Ошибка при загрузке сообщений из localStorage:', e)
        }
      }
    }
    
    return [{
      id: uuidv4(),
      sender: "ai",
      content: "Привет! Я ваш помощник для выполнения задач. Опишите, что вам нужно сделать.",
      timestamp: new Date(),
    }]
  })
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS)
      if (savedTasks) {
        try {
          return JSON.parse(savedTasks, (key, value) => {
            if (key === 'createdAt') return new Date(value)
            return value
          })
        } catch (e) {
          console.error('Ошибка при загрузке задач из localStorage:', e)
        }
      }
    }
    return []
  })
  
  const [currentTask, setCurrentTask] = useState<Task | null>(() => {
    if (typeof window !== 'undefined') {
      const savedTask = localStorage.getItem(STORAGE_KEYS.CURRENT_TASK)
      if (savedTask) {
        try {
          return JSON.parse(savedTask, (key, value) => {
            if (key === 'createdAt') return new Date(value)
            return value
          })
        } catch (e) {
          console.error('Ошибка при загрузке текущей задачи из localStorage:', e)
        }
      }
    }
    return null
  })

  // Система логирования
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS)
      if (savedLogs) {
        try {
          return JSON.parse(savedLogs, (key, value) => {
            if (key === 'timestamp') return new Date(value)
            return value
          })
        } catch (e) {
          console.error('Ошибка при загрузке логов из localStorage:', e)
        }
      }
    }
    return []
  })

  // Ref for auto-progress interval
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Simulation parameters
  const simulationConfig = {
    baseProgressInterval: 20000, // Base interval in ms (20 seconds)
    progressIncrement: 2, // Progress increment per interval
    variabilityFactor: 0.5, // Random variability (±50% of increment)
    contextUpdateFrequency: 3, // Updates to context history every N increments
    progressionStages: [
      { threshold: 25, message: "Начальный анализ задачи" },
      { threshold: 50, message: "Активная работа над решением" },
      { threshold: 75, message: "Финальное тестирование и доработка" },
      { threshold: 95, message: "Подготовка результатов" }
    ]
  }
  
  // Context history for task
  const [taskContext, setTaskContext] = useState<{
    stageHistory: string[];
    milestones: string[];
    currentStage: string;
  }>({
    stageHistory: [],
    milestones: [],
    currentStage: ""
  })

  // Функция для добавления записи в лог
  const addLogEntry = (action: string, details: Record<string, any>) => {
    const newLog: LogEntry = {
      timestamp: new Date(),
      action,
      details
    }
    
    setLogs(prev => {
      const updated = [...prev, newLog]
      // Ограничиваем количество логов до 1000 записей
      if (updated.length > 1000) {
        updated.shift() // Удаляем самую старую запись
      }
      return updated
    })
  }

  // Сохраняем состояние в localStorage при его изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
      
      // Dispatch custom event for real-time updates
      dispatchStorageUpdate(STORAGE_KEYS.MESSAGES, messages)
    }
  }, [messages])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
      
      // Dispatch custom event for real-time updates
      dispatchStorageUpdate(STORAGE_KEYS.TASKS, tasks)
    }
  }, [tasks])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TASK, JSON.stringify(currentTask))
      
      // Dispatch custom event for real-time updates
      dispatchStorageUpdate(STORAGE_KEYS.CURRENT_TASK, currentTask)
    }
  }, [currentTask])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs))
      
      // Dispatch custom event for real-time updates
      dispatchStorageUpdate(STORAGE_KEYS.LOGS, logs)
    }
  }, [logs])

  const callTaskApi = async <T>(
    action: string,
    params: Record<string, any> = {}
  ): Promise<T | null> => {
    setState({ loading: true, error: null })
    
    // Логируем вызов API
    addLogEntry('api_call', { action, params })

    try {
      const response = await fetch("/api/task-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          ...params,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Что-то пошло не так")
      }

      const data = await response.json()
      setState({ loading: false, error: null })
      
      // Логируем успешный ответ API
      addLogEntry('api_response', { action, success: true, data })
      
      return data
    } catch (error) {
      console.error(`Ошибка в ${action}:`, error)
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      })
      
      // Логируем ошибку API
      addLogEntry('api_error', { 
        action, 
        error: error instanceof Error ? error.message : "Неизвестная ошибка" 
      })
      
      return null
    }
  }

  // Проверяет завершение задачи и уведомляет заказчика
  const checkTaskCompletion = (task: Task, wasPrevious: number): Task => {
    const updatedTask = { ...task }
    
    // Если задача завершена, но ещё не было уведомления
    if (updatedTask.progress >= 100 && wasPrevious < 100) {
      updatedTask.status = "completed"
      
      // Добавляем уведомление о завершении задачи
      const completionMessage: Message = {
        id: uuidv4(),
        sender: "ai",
        content: `✅ Задача "${updatedTask.title}" успешно выполнена!\n\nМогу я чем-то ещё помочь?`,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, completionMessage])
      
      // Логируем завершение задачи
      addLogEntry('task_completed', { 
        taskId: updatedTask.id,
        title: updatedTask.title,
        executionTime: new Date().getTime() - updatedTask.createdAt.getTime()
      })
    }
    
    return updatedTask
  }

  // Функция для автоматического увеличения прогресса задачи
  const startAutoProgressSimulation = (task: Task) => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
    
    let updateCounter = 0
    
    progressIntervalRef.current = setInterval(() => {
      if (!currentTask) {
        // If no active task, clear the interval
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
        return
      }
      
      setCurrentTask(prevTask => {
        if (!prevTask) return null
        
        // Store previous progress for comparison
        const previousProgress = prevTask.progress
        
        // Calculate progress increment with randomness
        const randomFactor = 1 + (Math.random() * simulationConfig.variabilityFactor * 2 - simulationConfig.variabilityFactor)
        const increment = Math.max(1, Math.round(simulationConfig.progressIncrement * randomFactor))
        
        // Calculate new progress
        const newProgress = Math.min(prevTask.progress + increment, 100)
        
        // Update task context every N increments
        updateCounter++
        if (updateCounter >= simulationConfig.contextUpdateFrequency) {
          updateCounter = 0
          updateTaskContext(previousProgress, newProgress)
        }
        
        // Log progress update
        addLogEntry('progress_update', { 
          taskId: prevTask.id, 
          oldProgress: previousProgress,
          newProgress,
          trigger: "auto_simulation"
        })
        
        // Create updated task
        const updatedTask = { 
          ...prevTask,
          progress: newProgress
        }
        
        // Check for task completion
        return checkTaskCompletion(updatedTask, previousProgress)
      })
    }, simulationConfig.baseProgressInterval)
  }
  
  // Update task context in localStorage and dispatch update event
  const updateTaskContextInStorage = (updatedContext: typeof taskContext) => {
    try {
      localStorage.setItem('brain_simulator_task_context', JSON.stringify(updatedContext))
      
      // Dispatch event to notify other components if the function is available
      if (typeof dispatchStorageUpdate === 'function') {
        dispatchStorageUpdate('brain_simulator_task_context', updatedContext)
      }
    } catch (error) {
      console.error('Error updating task context in storage:', error)
    }
  }

  // Function to update task context based on progress
  const updateTaskContext = (oldProgress: number, newProgress: number) => {
    // Find the current stage based on progress
    const currentStage = simulationConfig.progressionStages
      .filter(stage => newProgress >= stage.threshold)
      .pop()?.message || "Начало работы"
    
    // Check if we've hit a new threshold
    const crossedThresholds = simulationConfig.progressionStages
      .filter(stage => oldProgress < stage.threshold && newProgress >= stage.threshold)
    
    setTaskContext(prev => {
      // Create new milestone messages for thresholds crossed
      const newMilestones = [...prev.milestones]
      
      crossedThresholds.forEach(threshold => {
        newMilestones.push(`Достигнуто ${threshold.threshold}%: ${threshold.message}`)
      })
      
      // Only update stage history if the stage has changed
      const newStageHistory = [...prev.stageHistory]
      if (currentStage !== prev.currentStage) {
        newStageHistory.push(`${new Date().toLocaleTimeString()}: ${currentStage}`)
      }
      
      const updatedContext = {
        stageHistory: newStageHistory,
        milestones: newMilestones,
        currentStage
      }
      
      // Update context in localStorage
      updateTaskContextInStorage(updatedContext)
      
      return updatedContext
    })
  }
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  // Function to generate a fallback response when API fails
  const generateFallbackResponse = (message: string, taskTitle: string, progress: number, stage: string): string => {
    const lowerMsg = message.toLowerCase();
    let response = "";
    
    // Determine the type of question/request
    if (lowerMsg.includes("статус") || lowerMsg.includes("прогресс") || lowerMsg.includes("как дела")) {
      response = `Я работаю над задачей "${taskTitle}". Текущий прогресс: ${progress}%, мы на этапе "${stage || "начальной работы"}". `;
      
      if (progress < 25) {
        response += "Только начал работу, анализирую требования и планирую решение.";
      } else if (progress < 50) {
        response += "Уже определил основную структуру и начал реализацию ключевых компонентов.";
      } else if (progress < 75) {
        response += "Большая часть функционала уже реализована, сейчас работаю над доработкой деталей.";
      } else if (progress < 95) {
        response += "Завершаю работу, провожу финальное тестирование и исправляю обнаруженные проблемы.";
      } else {
        response += "Задача практически завершена, выполняю финальные проверки перед сдачей.";
      }
    } 
    else if (lowerMsg.includes("срочно") || lowerMsg.includes("когда") || lowerMsg.includes("успе")) {
      response = `Работаю над задачей "${taskTitle}" максимально эффективно. `;
      
      if (progress < 50) {
        response += `Текущий прогресс ${progress}%, потребуется ещё некоторое время для завершения.`;
      } else if (progress < 90) {
        response += `Уже выполнено ${progress}%, близок к завершению. Скоро представлю результаты.`;
      } else {
        response += `Уже почти готово (${progress}%), финальные штрихи и задача будет завершена.`;
      }
    }
    else if (lowerMsg.includes("кто") || lowerMsg.includes("ты") || lowerMsg.includes("вы")) {
      response = `Я ваш ассистент по задаче "${taskTitle}". Помогаю в разработке и предоставляю актуальную информацию о прогрессе. `;
      response += `Сейчас мы на этапе "${stage || "работы над задачей"}" с прогрессом ${progress}%.`;
    }
    else if (lowerMsg.includes("где") || lowerMsg.includes("результат")) {
      if (progress < 50) {
        response = `Результаты по задаче "${taskTitle}" ещё в процессе разработки. Прогресс составляет ${progress}%. Продолжаю работу над решением.`;
      } else if (progress < 90) {
        response = `Проект "${taskTitle}" выполнен на ${progress}%. Скоро будет готов полный результат, сейчас ещё ведётся работа над финальными компонентами.`;
      } else {
        response = `Результаты практически готовы (${progress}%). Задача "${taskTitle}" находится на финальной стадии доработки и скоро будет полностью завершена.`;
      }
    }
    else if (lowerMsg.includes("отмен") || lowerMsg.includes("стоп")) {
      response = `Понял, прекращаю работу над задачей "${taskTitle}". Текущий прогресс (${progress}%) будет сохранён.`;
    }
    else {
      // Generic response based on progress
      response = `Продолжаю работу над задачей "${taskTitle}". `;
      
      if (progress < 30) {
        response += "Анализирую задачу и приступаю к разработке первых компонентов. Есть хорошие идеи, как это реализовать.";
      } else if (progress < 60) {
        response += "Активно разрабатываю решение. Основная структура уже создана, реализую ключевые функции.";
      } else if (progress < 90) {
        response += "Работа идёт хорошо, большая часть функционала уже реализована. Сейчас занимаюсь доработкой и тестированием.";
      } else {
        response += "Практически завершил задачу, выполняю финальные проверки и оптимизацию кода. Результат будет готов очень скоро.";
      }
    }
    
    return response;
  };

  // Добавляем сообщение от пользователя и получаем ответ от ИИ
  const sendMessage = async (content: string) => {
    // Добавляем сообщение пользователя
    const userMessage: Message = {
      id: uuidv4(),
      sender: "user",
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    
    // Логируем сообщение пользователя
    addLogEntry('user_message', { messageId: userMessage.id, content })

    // Показываем статус загрузки
    setState({ loading: true, error: null })

    try {
      let aiResponse = ""
      
      // Используем реальный API-вызов к brain API
      if (currentTask) {
        // Если есть текущая задача, отправляем ее вместе с сообщением
        const agentRole = determineAgentRole(content)
        
        // Get last 5 messages for context
        const recentMessages = messages.slice(-5).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
        
        // Add task context to the API call for better context
        const contextInfo = {
          progress: currentTask.progress,
          stage: taskContext.currentStage,
          milestones: taskContext.milestones,
          history: taskContext.stageHistory,
          conversation: recentMessages,
          task_description: currentTask.description || "",
          status: currentTask.status
        }
        
        // Логируем выбор роли агента
        addLogEntry('agent_selected', { 
          role: agentRole, 
          taskId: currentTask.id, 
          basedOn: content 
        })
        
        try {
        const data = await callTaskApi<{ thought: string }>("getThoughts", {
          agent: agentRole,
            task: currentTask.title,
            context: contextInfo,
            message: content,
            recentMessages: recentMessages
        })
        
          if (data && data.thought) {
          aiResponse = data.thought
            
            // Включаем информацию о текущем прогрессе, если пользователь спрашивает о статусе
            if (content.toLowerCase().includes("статус") || content.toLowerCase().includes("прогресс")) {
              // Добавляем детальную информацию о прогрессе и этапах работы
              aiResponse += `\n\n📊 Текущий прогресс: ${currentTask.progress}%\n📋 Этап: ${taskContext.currentStage || "Начало работы"}\n`
              
              // Добавляем последние 2-3 вехи проекта, если они есть
              if (taskContext.milestones.length > 0) {
                aiResponse += "\n🏆 Достигнутые вехи:\n";
                const recentMilestones = taskContext.milestones.slice(-3);
                recentMilestones.forEach(milestone => {
                  aiResponse += `- ${milestone}\n`;
                });
              }
            }
          } else {
            // Use fallback response if API returned empty response
            aiResponse = generateFallbackResponse(
              content, 
              currentTask.title, 
              currentTask.progress, 
              taskContext.currentStage
            )
            
            // Log that we used a fallback
            addLogEntry('fallback_response_used', { 
              reason: 'empty_api_response',
              message: content
            })
          }
        } catch (error) {
          // Use fallback response if API call failed
          aiResponse = generateFallbackResponse(
            content, 
            currentTask.title, 
            currentTask.progress, 
            taskContext.currentStage
          )
          
          // Log that we used a fallback
          addLogEntry('fallback_response_used', { 
            reason: 'api_error',
            error: error instanceof Error ? error.message : "Unknown error"
          })
        }
          
          // Сохраняем текущий прогресс для сравнения
          const previousProgress = currentTask.progress
          
          // Обновляем прогресс задачи в зависимости от ответа
          const updatedTask = { ...currentTask }
          
          // Обрабатываем команды в сообщении
        if (content.toLowerCase().includes("отмен") || content.toLowerCase().includes("стоп")) {
            updatedTask.status = "failed" as const
            setCurrentTask(null)
            setTasks(prev => [...prev, updatedTask])
            aiResponse = `Задача "${updatedTask.title}" отменена.`
            
            // Логируем отмену задачи
            addLogEntry('task_cancelled', { 
              taskId: updatedTask.id, 
              title: updatedTask.title 
            })
          } else if (Math.random() > 0.7) {
            // Случайно увеличиваем прогресс с шансом 30%
            updatedTask.progress = Math.min(updatedTask.progress + 5, 100)
            
            // Логируем прогресс
            addLogEntry('progress_update', { 
              taskId: updatedTask.id, 
              oldProgress: previousProgress,
              newProgress: updatedTask.progress,
              trigger: "random"
            })
          }
          
          // Проверяем завершение задачи
          const finalTask = checkTaskCompletion(updatedTask, previousProgress)
          setCurrentTask(finalTask)
      } else {
        // Если нет активной задачи, используем фокус-агента
        const data = await callTaskApi<{ thought: string }>("getThoughts", {
          agent: "focus",
          task: content
        })
        
        aiResponse = data?.thought || "Что-то пошло не так при получении ответа."
      }

      // Добавляем ответ ИИ
      const aiMessage: Message = {
        id: uuidv4(),
        sender: "ai",
        content: aiResponse,
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, aiMessage])
      
      // Логируем ответ ИИ
      addLogEntry('ai_response', { 
        messageId: aiMessage.id, 
        content: aiResponse,
        length: aiResponse.length
      })
      
      setState({ loading: false, error: null })
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error)
      
      // Generate fallback response if we have a current task
      if (currentTask) {
        const fallbackResponse = generateFallbackResponse(
          content,
          currentTask.title,
          currentTask.progress,
          taskContext.currentStage
        )
        
        // Add the fallback message
        const fallbackMessage: Message = {
          id: uuidv4(),
          sender: "ai",
          content: fallbackResponse,
          timestamp: new Date(),
        }
        
        setMessages((prev) => [...prev, fallbackMessage])
        
        // Log the fallback
        addLogEntry('fallback_response_used', { 
          reason: 'exception',
          error: error instanceof Error ? error.message : "Unknown error"
        })
        
        setState({ loading: false, error: null })
        return
      }
      
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Не удалось получить ответ",
      })
      
      // Логируем ошибку
      addLogEntry('message_error', { 
        error: error instanceof Error ? error.message : "Неизвестная ошибка"
      })
    }
  }

  // Вспомогательная функция для определения подходящей роли агента на основе сообщения
  const determineAgentRole = (message: string): AgentRole => {
    const lowerMsg = message.toLowerCase()
    
    // Create a scoring system based on message keywords
    let scores = {
      coder: 0,
      planner: 0,
      critic: 0,
      researcher: 0,
      focus: 0,
      procrastinator: 0
    };
    
    // Score keywords for coder role
    if (lowerMsg.includes("код") || lowerMsg.includes("напиши") || lowerMsg.includes("реализуй") || 
        lowerMsg.includes("программ") || lowerMsg.includes("функци") || lowerMsg.includes("разраб")) {
      scores.coder += 3;
    }
    
    // Score keywords for planner role
    if (lowerMsg.includes("план") || lowerMsg.includes("шаги") || lowerMsg.includes("этапы") || 
        lowerMsg.includes("стратег") || lowerMsg.includes("организ") || lowerMsg.includes("спланир")) {
      scores.planner += 3;
    }
    
    // Score keywords for critic role
    if (lowerMsg.includes("проверь") || lowerMsg.includes("оцени") || lowerMsg.includes("проблем") || 
        lowerMsg.includes("ошибк") || lowerMsg.includes("улучши") || lowerMsg.includes("исправь")) {
      scores.critic += 3;
    }
    
    // Score keywords for researcher role
    if (lowerMsg.includes("найди") || lowerMsg.includes("информац") || lowerMsg.includes("докум") || 
        lowerMsg.includes("исследуй") || lowerMsg.includes("изучи") || lowerMsg.includes("проанализ")) {
      scores.researcher += 3;
    }
    
    // Score keywords for focus role
    if (lowerMsg.includes("мотивац") || lowerMsg.includes("сосредоточ") || lowerMsg.includes("сконцентр") || 
        lowerMsg.includes("помоги") || lowerMsg.includes("фокус") || lowerMsg.includes("почему")) {
      scores.focus += 3;
    }
    
    // Additional relevant question/answer patterns
    if (lowerMsg.includes("срочно") || lowerMsg.includes("когда") || lowerMsg.includes("время") || 
        lowerMsg.includes("успе") || lowerMsg.includes("дедлайн")) {
      scores.planner += 2;
    }
    
    if (lowerMsg.includes("результат") || lowerMsg.includes("готово") || lowerMsg.includes("закончи") || 
        lowerMsg.includes("получил") || lowerMsg.includes("где")) {
      scores.focus += 2;
    }
    
    if (lowerMsg.includes("кто") || lowerMsg.includes("что") || lowerMsg.includes("как") || 
        lowerMsg.includes("почему") || lowerMsg.includes("зачем")) {
      scores.researcher += 2;
    }
    
    if (lowerMsg.includes("стату") || lowerMsg.includes("прогресс") || lowerMsg.includes("готов")) {
      scores.focus += 2;
    }
    
    // Procrastinator chance only if very short message or unclear request
    if (message.length < 5 || (message.match(/[?!]/g) || []).length > 2) {
      scores.procrastinator = Math.random() * 2; // Give a random chance but lower than normal roles
    }
    
    // Find the highest scoring role
    let maxScore = 0;
    let selectedRole: AgentRole = "coder"; // Default
    
    for (const [role, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        selectedRole = role as AgentRole;
      }
    }
    
    // If no clear winner (max score is 0), use coder as default
    if (maxScore === 0) {
      // 10% chance for procrastinator if message is unclear
      if (Math.random() < 0.1) {
        return "procrastinator";
      }
      return "coder";
    }
    
    return selectedRole;
  }

  // Создаем новую задачу
  const createTask = async (title: string, description: string) => {
    // Если уже есть активная задача, добавляем её в историю
    if (currentTask) {
      setTasks(prev => [...prev, {...currentTask, status: "failed" as const}])
      
      // Логируем прекращение предыдущей задачи
      addLogEntry('task_interrupted', { 
        taskId: currentTask.id,
        title: currentTask.title,
        progress: currentTask.progress
      })
    }
    
    // Создаем новую задачу
    const newTask: Task = {
      id: uuidv4(),
      title,
      description,
      status: "in-progress",
      progress: 0,
      createdAt: new Date(),
    }
    
    setCurrentTask(newTask)
    
    // Reset task context for new task
    setTaskContext({
      stageHistory: ["Начало работы над задачей"],
      milestones: [],
      currentStage: "Начало работы"
    })
    
    // Update storage with initial context
    updateTaskContextInStorage({
      stageHistory: ["Начало работы над задачей"],
      milestones: [],
      currentStage: "Начало работы"
    })
    
    // Start auto-progress simulation for the new task
    startAutoProgressSimulation(newTask)
    
    // Логируем создание новой задачи
    addLogEntry('task_created', { 
      taskId: newTask.id, 
      title, 
      description 
    })
    
    try {
      // Get planner thoughts
      const data = await callTaskApi<{ thought: string }>("getThoughts", {
        agent: "planner",
        task: title
      })
      
      // Add system message about new task
      const systemMessage: Message = {
        id: uuidv4(),
        sender: "ai",
        content: data?.thought || `Принял новую задачу: "${title}". Начинаю работу!`,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, systemMessage])
      
      // Log planner response
      addLogEntry('planner_response', { 
        messageId: systemMessage.id,
        content: systemMessage.content,
        taskId: newTask.id
      })

      // Generate sample code for the task and store it
      try {
        // Use the existing API method instead of a direct fetch
        const codeData = await callTaskApi<{ code: string }>("generateCode", {
          task: title
        });
        
        if (codeData && codeData.code) {
          // Store the generated code in localStorage for sharing with other components
          localStorage.setItem('brain_simulator_generated_code', codeData.code);
          
          // Dispatch event to notify other components
          if (typeof dispatchStorageUpdate === 'function') {
            dispatchStorageUpdate('brain_simulator_generated_code', codeData.code);
          }
        }
      } catch (codeError) {
        console.error("Ошибка при генерации кода:", codeError);
        
        // Fallback code generation if API fails
        const fallbackCode = `// Автоматически сгенерированный код для задачи: ${title}\n\nfunction implementTask() {\n  // TODO: Реализация задачи\n  console.log("Работаем над задачей: ${title}");\n  return "В процессе разработки";\n}\n\n// Экспортируем функцию\nexport { implementTask };`;
        
        localStorage.setItem('brain_simulator_generated_code', fallbackCode);
        if (typeof dispatchStorageUpdate === 'function') {
          dispatchStorageUpdate('brain_simulator_generated_code', fallbackCode);
        }
      }
    } catch (error) {
      console.error("Ошибка при создании задачи:", error)
      // Add fallback message on error
      const fallbackMessage: Message = {
        id: uuidv4(),
        sender: "ai",
        content: `Принял новую задачу: "${title}". Начинаю работу!`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, fallbackMessage])
      
      // Log task creation error
      addLogEntry('task_creation_error', { 
        taskId: newTask.id,
        error: error instanceof Error ? error.message : "Неизвестная ошибка"
      })
      
      // Generate fallback code
      const fallbackCode = `// Резервный код для задачи: ${title}\n\nfunction implementTask() {\n  // TODO: Реализация задачи\n  console.log("Работаем над задачей: ${title}");\n  return "В процессе разработки";\n}\n\n// Экспортируем функцию\nexport { implementTask };`;
      
      localStorage.setItem('brain_simulator_generated_code', fallbackCode);
      if (typeof dispatchStorageUpdate === 'function') {
        dispatchStorageUpdate('brain_simulator_generated_code', fallbackCode);
      }
    }
  }

  // Функция для доступа к логам (для отладки)
  const getLogs = () => {
    return logs
  }

  // Функция для очистки истории
  const clearHistory = () => {
    if (window.confirm('Вы уверены, что хотите очистить всю историю? Это действие нельзя отменить.')) {
      setMessages([{
        id: uuidv4(),
        sender: "ai",
        content: "История чата очищена. Я готов помочь с вашими задачами!",
        timestamp: new Date(),
      }])
      setTasks([])
      setCurrentTask(null)
      
      // Сохраняем лог очистки, но не очищаем сами логи и события
      addLogEntry('history_cleared', { timestamp: new Date() })
      
      // Важно: не очищаем события из localStorage
      // localStorage.removeItem(STORAGE_KEYS.EVENTS); - эта строка отсутствует
    }
  }

  return {
    loading: state.loading,
    error: state.error,
    messages,
    tasks,
    currentTask,
    taskContext, // Expose task context for UI components
    sendMessage,
    createTask,
    getLogs,
    clearHistory,
  }
} 
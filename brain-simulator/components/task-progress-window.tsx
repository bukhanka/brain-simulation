import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState, useRef } from "react"
import { STORAGE_KEYS, STORAGE_UPDATE_EVENT } from "@/lib/storage-utils"
import { useBrainApi } from "@/hooks/use-brain-api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Timeline, TimelineItem } from "@/components/ui/timeline"

type TaskProgressProps = {
  task: {
    title: string
    status: string
    code: string
  }
}

export function TaskProgressWindow({ task }: TaskProgressProps) {
  // Get the brain API for code generation
  const { generateCode } = useBrainApi()
  
  // Get the current task from localStorage
  const [currentTask, setCurrentTask] = useState<{
    title: string;
    status: string;
    progress: number;
    code: string;
    description?: string;
  } | null>(null)
  
  // Task context information
  const [taskContext, setTaskContext] = useState<{
    stageHistory: string[];
    milestones: string[];
    currentStage: string;
  }>({
    stageHistory: [],
    milestones: [],
    currentStage: ""
  })
  
  // Add refs to track previous task state and update status
  const prevTaskRef = useRef<string>("")
  const isUpdatingRef = useRef(false)
  
  // Function to update code for a task
  const updateCodeForTask = async (taskTitle: string) => {
    try {
      // Generate new code based on the task title
      const newCode = await generateCode(taskTitle);
      if (newCode && currentTask) {
        setCurrentTask(prev => ({
          ...prev!,
          code: newCode
        }));
      }
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };
  
  useEffect(() => {
    // Update from localStorage whenever task changes or component mounts
    const checkLocalStorage = async () => {
      if (typeof window !== 'undefined' && !isUpdatingRef.current) {
        isUpdatingRef.current = true
        
        const storedTask = localStorage.getItem(STORAGE_KEYS.CURRENT_TASK)
        if (storedTask && storedTask !== "null") {
          try {
            // Compare with previous stored task to avoid unnecessary updates
            if (prevTaskRef.current === storedTask) {
              isUpdatingRef.current = false
              return
            }
            
            prevTaskRef.current = storedTask
            const parsedTask = JSON.parse(storedTask, (key, value) => {
              if (key === 'createdAt') return new Date(value)
              return value
            })
            
            if (parsedTask) {
              // Check if the task title has changed
              const titleChanged = !currentTask || currentTask.title !== parsedTask.title
              
              // Check if there's a stored code in localStorage
              let codeToUse = currentTask?.code
              try {
                const storedCode = localStorage.getItem('brain_simulator_generated_code')
                if (storedCode && storedCode.length > 10) {
                  codeToUse = storedCode
                }
              } catch (e) {
                // Ignore errors reading localStorage
              }
              
              // If no code found, create a placeholder
              if (!codeToUse) {
                codeToUse = `// Инициализация кода...\n// Работаем над задачей: ${parsedTask.title}\n\nfunction implementFeature() {\n  // TODO: Реализовать функционал\n  return 'Работа в процессе';\n}\n`
              }
              
              // Update the task with data from localStorage
              setCurrentTask({
                title: parsedTask.title || task.title,
                status: parsedTask.status || task.status,
                progress: parsedTask.progress || 0,
                // Use the shared code or placeholder
                code: codeToUse,
                description: parsedTask.description || ""
              })
              
              // Try to load task context if it exists
              try {
                const storedContext = localStorage.getItem('brain_simulator_task_context')
                if (storedContext) {
                  setTaskContext(JSON.parse(storedContext))
                }
              } catch (e) {
                console.error('Error loading task context:', e)
              }
              
              // If title changed, we need to generate new code
              if (titleChanged) {
                // Small delay to ensure state is updated first
                setTimeout(() => {
                  updateCodeForTask(parsedTask.title)
                }, 100)
              }
            }
          } catch (e) {
            console.error('Ошибка при загрузке задачи из localStorage:', e)
          }
        } else {
          // If no stored task, use the prop
          setCurrentTask({
            title: task.title,
            status: task.status,
            progress: 0,
            code: task.code
          })
        }
        
        // Reset updating flag after a short delay
        setTimeout(() => {
          isUpdatingRef.current = false
        }, 50)
      }
    }
    
    checkLocalStorage()
    
    // Listen for custom storage updates
    const handleCustomStorageUpdate = (e: any) => {
      if (!isUpdatingRef.current && e.detail && 
         (e.detail.key === STORAGE_KEYS.CURRENT_TASK || e.detail.key === 'brain_simulator_task_context')) {
        checkLocalStorage()
      }
    }
    
    // Add event listener for localStorage changes and custom events
    window.addEventListener('storage', checkLocalStorage)
    window.addEventListener(STORAGE_UPDATE_EVENT, handleCustomStorageUpdate)
    
    return () => {
      window.removeEventListener('storage', checkLocalStorage)
      window.removeEventListener(STORAGE_UPDATE_EVENT, handleCustomStorageUpdate)
    }
  }, [task, currentTask, generateCode])
  
  if (!currentTask) return null
  
  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="w-full">
          <CardTitle>{currentTask.title}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">
              {currentTask.status}
            </Badge>
            {currentTask.progress > 0 && (
              <span className="text-xs">{currentTask.progress}% выполнено</span>
            )}
          </div>
          {currentTask.description && (
            <p className="text-sm mt-2 text-muted-foreground">{currentTask.description}</p>
          )}
          {currentTask.progress > 0 && (
            <div className="mt-2 w-full">
              <Progress value={currentTask.progress} className="h-2" />
            </div>
          )}
          {taskContext.currentStage && (
            <p className="text-xs mt-1 text-muted-foreground">
              Текущий этап: {taskContext.currentStage}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="code" className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="code">Код</TabsTrigger>
            <TabsTrigger value="progress">Прогресс</TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="mt-0">
            <div className="rounded-md bg-muted p-4">
              <pre className="text-sm font-mono overflow-auto whitespace-pre-wrap">
                <code>{currentTask.code}</code>
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="progress" className="mt-0">
            <div className="space-y-4">
              {/* Progress Summary */}
              <div className="rounded-md bg-muted p-4">
                <h3 className="text-sm font-medium mb-2">Сводка прогресса</h3>
                <div className="flex justify-between text-xs mb-1">
                  <span>Общий прогресс</span>
                  <span>{currentTask.progress}%</span>
                </div>
                <Progress value={currentTask.progress} className="h-3" />
                
                <div className="mt-3 text-sm">
                  <p>Текущий этап: <span className="font-medium">{taskContext.currentStage || "Начало работы"}</span></p>
                </div>
              </div>
              
              {/* Milestones */}
              {taskContext.milestones && taskContext.milestones.length > 0 && (
                <div className="rounded-md bg-muted p-4">
                  <h3 className="text-sm font-medium mb-2">Ключевые вехи</h3>
                  <ul className="space-y-1 text-sm">
                    {taskContext.milestones.map((milestone, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">🏆</span>
                        <span>{milestone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Progress Timeline */}
              {taskContext.stageHistory && taskContext.stageHistory.length > 0 && (
                <div className="rounded-md bg-muted p-4">
                  <h3 className="text-sm font-medium mb-2">История выполнения</h3>
                  <Timeline>
                    {taskContext.stageHistory.map((stage, index) => (
                      <TimelineItem key={index} title={stage} />
                    ))}
                  </Timeline>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}


"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LayoutDashboard, 
  Code, 
  CodeXml, 
  FileCode, 
  CheckCircle, 
  XCircle,
  Play,
  Eraser,
  Book,
  Clipboard,
  Blocks
} from "lucide-react"
import { ScrollArea } from "./ui/scroll-area"
import { useBrainApi } from "@/hooks/use-brain-api"
import { CodeReviewResult, TestResult, FileModule } from "@/hooks/use-brain-api"
import { toast } from "@/components/ui/use-toast"

export function AdvancedCodingPanel() {
  const { 
    loading,
    error,
    context,
    addToContext,
    clearContext,
    generateComplexCode,
    generateProject,
    reviewCode,
    testCode
  } = useBrainApi()

  const [taskDescription, setTaskDescription] = useState("")
  const [projectStructure, setProjectStructure] = useState("")
  const [requirements, setRequirements] = useState("")
  const [code, setCode] = useState("")
  const [explanation, setExplanation] = useState("")
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testCases, setTestCases] = useState("")
  const [specification, setSpecification] = useState("")
  const [generatedModules, setGeneratedModules] = useState<FileModule[]>([])
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("editor")

  // Generate complex code with project structure awareness
  const handleGenerateCode = async () => {
    if (!taskDescription) {
      toast({
        title: "Ошибка",
        description: "Необходимо указать описание задачи",
        variant: "destructive"
      })
      return
    }

    try {
      // Record action in context
      addToContext(`Пользователь запросил генерацию кода: ${taskDescription.substring(0, 50)}...`)
      
      const result = await generateComplexCode(taskDescription, projectStructure)
      if (result) {
        setCode(result.code)
        setExplanation(result.explanation)
        setActiveTab("editor")
        
        toast({
          title: "Успешно",
          description: "Код сгенерирован",
        })
        
        // Add to context
        addToContext(`Сгенерирован код: ${result.code.substring(0, 50)}...`)
      }
    } catch (err) {
      console.error("Error generating code:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать код",
        variant: "destructive"
      })
    }
  }

  // Review code against requirements
  const handleReviewCode = async () => {
    if (!code || !requirements) {
      toast({
        title: "Ошибка",
        description: "Необходимо указать код и требования",
        variant: "destructive"
      })
      return
    }

    try {
      addToContext(`Пользователь запросил ревью кода на соответствие требованиям`)
      
      const result = await reviewCode(code, requirements)
      if (result) {
        setReviewResult(result)
        setActiveTab("review")
        
        toast({
          title: result.passes ? "Ревью успешно" : "Найдены проблемы",
          description: result.passes ? "Код соответствует требованиям" : `Найдено ${result.issues.length} проблем`,
          variant: result.passes ? "default" : "destructive"
        })
        
        addToContext(`Ревью кода: ${result.passes ? "Успешно" : "Есть проблемы"}`)
      }
    } catch (err) {
      console.error("Error reviewing code:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить ревью кода",
        variant: "destructive"
      })
    }
  }

  // Test code with provided test cases
  const handleTestCode = async () => {
    if (!code || !testCases) {
      toast({
        title: "Ошибка",
        description: "Необходимо указать код и тестовые сценарии",
        variant: "destructive"
      })
      return
    }

    try {
      addToContext(`Пользователь запустил тестирование кода`)
      
      const testCasesArray = testCases.split('\n').filter(tc => tc.trim() !== '')
      const result = await testCode(code, testCasesArray)
      
      if (result) {
        setTestResult(result)
        setActiveTab("testing")
        
        toast({
          title: result.success ? "Тесты пройдены" : "Тесты не пройдены",
          description: result.success ? "Все тесты успешно пройдены" : "Некоторые тесты не пройдены",
          variant: result.success ? "default" : "destructive"
        })
        
        addToContext(`Результаты тестирования: ${result.success ? "Успешно" : "Есть проблемы"}`)
      }
    } catch (err) {
      console.error("Error testing code:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить тестирование",
        variant: "destructive"
      })
    }
  }

  // Generate multi-module project
  const handleGenerateProject = async () => {
    if (!specification) {
      toast({
        title: "Ошибка",
        description: "Необходимо указать спецификацию проекта",
        variant: "destructive"
      })
      return
    }

    try {
      addToContext(`Пользователь запросил генерацию проекта: ${specification.substring(0, 50)}...`)
      
      const modules = await generateProject(specification)
      if (modules && modules.length > 0) {
        setGeneratedModules(modules)
        setSelectedModuleIndex(0)
        setActiveTab("modules")
        
        toast({
          title: "Проект сгенерирован",
          description: `Создано ${modules.length} файлов`,
        })
        
        addToContext(`Сгенерирован проект из ${modules.length} файлов`)
      }
    } catch (err) {
      console.error("Error generating project:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать проект",
        variant: "destructive"
      })
    }
  }

  // Clear all data
  const handleClearAll = () => {
    setCode("")
    setExplanation("")
    setReviewResult(null)
    setTestResult(null)
    setGeneratedModules([])
    setTaskDescription("")
    setProjectStructure("")
    setRequirements("")
    setTestCases("")
    setSpecification("")
    clearContext()
    setActiveTab("editor")
    
    toast({
      title: "Очищено",
      description: "Все данные сброшены",
    })
  }

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (activeTab === "modules" && generatedModules.length > 0) {
      navigator.clipboard.writeText(generatedModules[selectedModuleIndex].content)
    } else {
      navigator.clipboard.writeText(code)
    }
    
    toast({
      title: "Скопировано",
      description: "Код скопирован в буфер обмена",
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {/* Left Panel - Context and Inputs */}
      <div className="space-y-4 col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Расширенное программирование с ИИ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="task" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="task" className="flex-1">
                  <Code className="h-4 w-4 mr-1" />
                  Задача
                </TabsTrigger>
                <TabsTrigger value="project" className="flex-1">
                  <Blocks className="h-4 w-4 mr-1" />
                  Проект
                </TabsTrigger>
                <TabsTrigger value="context" className="flex-1">
                  <Book className="h-4 w-4 mr-1" />
                  Контекст
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="task" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Описание задачи</label>
                  <Textarea 
                    placeholder="Опишите задачу, которую нужно решить..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Структура проекта (необязательно)</label>
                  <Textarea 
                    placeholder="Опишите структуру проекта, в который должен встроиться код..."
                    value={projectStructure}
                    onChange={(e) => setProjectStructure(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handleGenerateCode} 
                  className="w-full"
                  disabled={loading || !taskDescription}
                >
                  <CodeXml className="h-4 w-4 mr-1" />
                  Сгенерировать код
                </Button>
              </TabsContent>
              
              <TabsContent value="project" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Спецификация проекта</label>
                  <Textarea 
                    placeholder="Подробно опишите проект, который нужно сгенерировать..."
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    rows={6}
                  />
                </div>
                
                <Button 
                  onClick={handleGenerateProject} 
                  className="w-full"
                  disabled={loading || !specification}
                >
                  <FileCode className="h-4 w-4 mr-1" />
                  Сгенерировать проект
                </Button>
              </TabsContent>
              
              <TabsContent value="context" className="h-[300px]">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {context.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Контекст пуст. ИИ не имеет информации о предыдущих взаимодействиях.</p>
                    ) : (
                      context.map((item, index) => (
                        <div key={index} className="text-sm border-l-2 border-muted-foreground pl-2">
                          {item}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={clearContext}
                >
                  <Eraser className="h-4 w-4 mr-1" />
                  Очистить контекст
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Right Panel - Editor and Results */}
      <div className="col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="editor" className="flex-1">
                  <Code className="h-4 w-4 mr-1" />
                  Редактор
                </TabsTrigger>
                <TabsTrigger value="review" className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Ревью
                </TabsTrigger>
                <TabsTrigger value="testing" className="flex-1">
                  <Play className="h-4 w-4 mr-1" />
                  Тестирование
                </TabsTrigger>
                <TabsTrigger value="modules" className="flex-1">
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Модули
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent className="pt-4">
            {/* Editor Tab */}
            <TabsContent value="editor" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Код</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCopyCode}
                    disabled={!code}
                  >
                    <Clipboard className="h-4 w-4 mr-1" />
                    Копировать
                  </Button>
                </div>
                <div className="relative">
                  <Textarea 
                    className="font-mono min-h-[300px] resize-none bg-muted"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Сгенерированный код появится здесь..."
                  />
                </div>
              </div>
              
              {explanation && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Объяснение</label>
                  <div className="text-sm border rounded-md p-3 bg-muted">
                    {explanation}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Требования для ревью</label>
                <Textarea 
                  placeholder="Опишите требования к коду для проверки..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleReviewCode} 
                className="w-full"
                disabled={loading || !code || !requirements}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Выполнить ревью кода
              </Button>
            </TabsContent>
            
            {/* Code Review Tab */}
            <TabsContent value="review" className="space-y-4">
              {reviewResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-md ${reviewResult.passes ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                    <div className="flex items-center">
                      {reviewResult.passes ? (
                        <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-300 mr-2" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-700 dark:text-red-300 mr-2" />
                      )}
                      <span className="font-medium">
                        {reviewResult.passes ? 'Код проходит ревью!' : 'Код не соответствует требованиям'}
                      </span>
                    </div>
                  </div>
                  
                  {reviewResult.issues.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Выявленные проблемы</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {reviewResult.issues.map((issue, i) => (
                          <li key={i} className="text-sm">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {reviewResult.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Рекомендации по улучшению</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {reviewResult.suggestions.map((suggestion, i) => (
                          <li key={i} className="text-sm">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] border rounded-md">
                  <p className="text-muted-foreground">Результаты ревью будут отображены здесь</p>
                </div>
              )}
            </TabsContent>
            
            {/* Testing Tab */}
            <TabsContent value="testing" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Тестовые сценарии (по одному на строку)</label>
                <Textarea 
                  placeholder="Опишите тестовые сценарии для проверки кода..."
                  value={testCases}
                  onChange={(e) => setTestCases(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleTestCode} 
                className="w-full"
                disabled={loading || !code || !testCases}
              >
                <Play className="h-4 w-4 mr-1" />
                Запустить тесты
              </Button>
              
              {testResult ? (
                <div className="space-y-4 mt-4">
                  <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                    <div className="flex items-center">
                      {testResult.success ? (
                        <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-300 mr-2" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-700 dark:text-red-300 mr-2" />
                      )}
                      <span className="font-medium">
                        {testResult.success ? 'Все тесты пройдены!' : 'Некоторые тесты не пройдены'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Результаты тестирования</h3>
                    <div className="space-y-2">
                      {testResult.results.map((result, i) => (
                        <div key={i} className={`p-3 rounded-md border ${result.passed ? 'border-green-300' : 'border-red-300'}`}>
                          <div className="flex items-center">
                            {result.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{result.case}</p>
                              <p className="text-xs text-muted-foreground">{result.output}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] border rounded-md">
                  <p className="text-muted-foreground">Результаты тестирования будут отображены здесь</p>
                </div>
              )}
            </TabsContent>
            
            {/* Modules Tab */}
            <TabsContent value="modules" className="space-y-4">
              {generatedModules.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {generatedModules.map((module, i) => (
                      <Button
                        key={i}
                        variant={selectedModuleIndex === i ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedModuleIndex(i)}
                        className="flex-shrink-0"
                      >
                        <FileCode className="h-4 w-4 mr-1" />
                        {module.path.split('/').pop()}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">{generatedModules[selectedModuleIndex]?.path}</label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCopyCode}
                      >
                        <Clipboard className="h-4 w-4 mr-1" />
                        Копировать
                      </Button>
                    </div>
                    <div className="relative">
                      <Textarea 
                        className="font-mono min-h-[350px] resize-none bg-muted"
                        value={generatedModules[selectedModuleIndex]?.content}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[350px] border rounded-md">
                  <p className="text-muted-foreground">Сгенерированные файлы проекта будут отображены здесь</p>
                </div>
              )}
            </TabsContent>
          </CardContent>
          
          <CardFooter className="pt-0">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleClearAll}
            >
              <Eraser className="h-4 w-4 mr-1" />
              Очистить все
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="fixed bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
          Обработка запроса...
        </div>
      )}
    </div>
  )
} 
"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  Check, 
  XCircle,
  RotateCcw,
  FileJson
} from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { exportDataAsFile, importDataFromJson, clearAllData } from "@/lib/storage-utils"
import { useToast } from "@/components/ui/use-toast"

export function DataManager() {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [importResult, setImportResult] = useState<'success' | 'error' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Handle export functionality
  const handleExport = () => {
    exportDataAsFile()
    toast({
      title: "Данные экспортированы",
      description: "Файл с резервной копией данных был загружен",
    })
  }

  // Handle import file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string
        const success = importDataFromJson(jsonData)
        
        if (success) {
          setImportResult('success')
          setTimeout(() => {
            setIsImportDialogOpen(false)
            setImportResult(null)
            window.location.reload() // Reload to apply imported data
          }, 1500)
        } else {
          setImportResult('error')
        }
      } catch (error) {
        console.error("Error importing data:", error)
        setImportResult('error')
      }
    }
    reader.readAsText(file)
  }

  // Handle reset confirmation
  const handleReset = () => {
    clearAllData()
    setIsResetDialogOpen(false)
    toast({
      title: "Данные сброшены",
      description: "Все данные мозгового симулятора были удалены",
      variant: "destructive"
    })
    setTimeout(() => {
      window.location.reload() // Reload to apply reset
    }, 1000)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Управление данными
          </CardTitle>
          <CardDescription>
            Экспорт, импорт и сброс данных мозгового симулятора
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleExport} className="flex items-center justify-center">
              <Download className="mr-2 h-4 w-4" />
              Экспорт данных
            </Button>
            
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center justify-center">
                  <Upload className="mr-2 h-4 w-4" />
                  Импорт данных
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Импорт данных</DialogTitle>
                  <DialogDescription>
                    Загрузите файл резервной копии для восстановления данных мозгового симулятора.
                  </DialogDescription>
                </DialogHeader>
                
                {importResult === 'success' ? (
                  <Alert className="bg-green-100 dark:bg-green-900">
                    <Check className="h-4 w-4 text-green-700 dark:text-green-300" />
                    <AlertTitle>Успех!</AlertTitle>
                    <AlertDescription>
                      Данные успешно импортированы. Страница будет перезагружена.
                    </AlertDescription>
                  </Alert>
                ) : importResult === 'error' ? (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Ошибка!</AlertTitle>
                    <AlertDescription>
                      Не удалось импортировать данные. Убедитесь, что файл имеет правильный формат.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="py-4 flex flex-col items-center justify-center border-2 border-dashed rounded-md">
                      <FileJson className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-center text-sm text-muted-foreground mb-2">
                        Перетащите файл сюда или нажмите для выбора
                      </p>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Выбрать файл
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleFileSelect}
                      />
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Внимание!</AlertTitle>
                      <AlertDescription>
                        Импорт данных заменит все существующие данные в мозговом симуляторе.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    Отмена
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center justify-center">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Сбросить данные
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Сбросить все данные?</DialogTitle>
                  <DialogDescription>
                    Это действие удалит все данные мозгового симулятора, включая историю чата, задачи,
                    события и логи. Это действие нельзя отменить.
                  </DialogDescription>
                </DialogHeader>
                
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Внимание!</AlertTitle>
                  <AlertDescription>
                    Все данные будут удалены безвозвратно.
                  </AlertDescription>
                </Alert>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button variant="destructive" onClick={handleReset}>
                    Сбросить данные
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </>
  )
} 
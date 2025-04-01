"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Base64 encoded minimal placeholder images
const ROBOT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1ib3QiPjxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxMCIgeD0iMyIgeT0iMTEiIHJ4PSIyIi8+PHBhdGggZD0iTTEyIDJ2NCIvPjxwYXRoIGQ9Ik0xOSA1YzAtMi0zLTMtNy0zcy03IDEtNyAzIi8+PHBhdGggZD0iTTcgMTVoMiIvPjxwYXRoIGQ9Ik0xNSAxNWgyIi8+PC9zdmc+";
const USER_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS11c2VyIj48cGF0aCBkPSJNMTkgMjFjMC0zLjg3LTMuMzctNy01LjUtNyIvPjxwYXRoIGQ9Ik02IDEwLjI3QTAuNzkgMC43OSAwIDAgMSA1LjYgOWMtLjExLS43NC4MjYtMS40My43Ny0xLjkybC41LS41YTEuMzggMS4zOCAwIDAgMSAxLjQtLjM2IDEuOCAxLjggMCAwIDEgMS4xLjkzIDEuMDQgMS4wNCAwIDAgMS0uMDggMS4wOCAxLjA4IDEuMDggMCAwIDEtLjE3LjIxIDEuMDkgMS4wOSAwIDAgMS0uMjguMThjLS4yMi4wOS0uNDUuMTgtLjY4LjE2YTEuMTQgMS4xNCAwIDAgMS0uODItLjI5Yy0uMTctLjE2LS4zLS4zNy0uMzMtLjYyIi8+PHBhdGggZD0iTTI1LjVzLTEgLjUtMyAyLjVjLTEuODggMS44OC0xLjA1IDMuMDctMyA0LjUtLjc2LjU2LTEuNDcgMS0yIDEiLz48cGF0aCBkPSJNOC43NSAxMi44NWEuNTAuNSAwIDAgMSAuNDgtLjU1YzEuMTYtLjA2IDIuMDkuMzEgMi4zNyAxLjI1Ii8+PHBhdGggZD0iTTUuNTEgMTMuNDJhLjUuNSAwIDAgMS0uNDMtLjU5YzEuNTgtOC4xMyA1LjQtOC41IDUuNS04LjVhLjUuNSAwIDAgMSAuNS41YzAgLjI0LS4xNC41My0uMzYuNzUtMi4yMiAyLjIyLS45NyA0LjY0LTQuNzEgNy44NCIvPjxwYXRoIGQ9Ik0xMiAxNmMwIDEuMDkuODkgOS43MyAyLjIgMTAuMjYuNDMuMTguOTYuMDcgMS40Ni0uMjMgMS43LTEuMDIgMy4yLTQuMTQgMi4xLTYuODMtLjUyLTEuMjYtLjA3LTIuNjMuODktMy44NSIvPjxwYXRoIGQ9Ik0xMi4yMiAxMmMxLjA2IDAgMS44LjQ4IDIuMjMgMS40Ii8+PHBhdGggZD0iTTIwLjM0IDExLjUzQTUuODkgNS44OSAwIDAgMSAyMiA4LjVjLS43LTQuMjItNC4xMi03LjUtOC00LjY2LTEuMTkuODctMi4xIDIuMTEtMi44OSAzLjY5IEvPjxwYXRoIGQ9Ik0xNiA5LjVjMi41LTguMSA1LjUgMCA1LjUgNS41UzE3IDIwIDE0LjczIDE5Ljc1QTUuNjYgNS42NiAwIDAgMSAxMi4wMSAxOC44Ii8+PC9zdmc+";

type Message = {
  id: string
  sender: "user" | "ai"
  content: string
  timestamp: Date
}

type ChatInterfaceProps = {
  title: string
  onSendMessage: (message: string) => Promise<void>
  messages: Message[]
  isLoading?: boolean
}

export function ChatInterface({ title, onSendMessage, messages, isLoading = false }: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  
  const handleSend = async () => {
    if (input.trim() === "" || isLoading) return
    
    await onSendMessage(input.trim())
    setInput("")
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex gap-2 max-w-[80%]">
                  {message.sender === "ai" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>ИИ</AvatarFallback>
                      <AvatarImage src={ROBOT_AVATAR} alt="AI" />
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {message.sender === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>Вы</AvatarFallback>
                      <AvatarImage src={USER_AVATAR} alt="User" />
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              placeholder="Напишите сообщение..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSend} 
              disabled={input.trim() === "" || isLoading}
              variant="default"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
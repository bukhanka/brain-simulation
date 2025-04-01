"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Brain, Code, Coffee, Search, ThumbsDown, Youtube } from "lucide-react"
import { useBrainApi } from "@/hooks/use-brain-api"
import { AgentRole } from "@/lib/api/openai"

type AgentType = {
  id: AgentRole
  name: string
  title: string
  icon: React.ReactNode
  motto: string
  defaultThought: string
}

export function AgentMap({ activeAgent }: { activeAgent: AgentRole }) {
  const { getAgentThoughts } = useBrainApi()
  const [agentThoughts, setAgentThoughts] = useState<Record<string, string>>({})
  const [currentTask] = useState("Implement new feature")

  // Memoize the agents array to prevent recreation on each render
  const agents = useMemo<AgentType[]>(() => [
    {
      id: "planner",
      name: "Планировщик",
      title: "Главный Ленивец",
      icon: <Brain className="h-8 w-8" />,
      motto: "Завтра сделаем план на сегодня",
      defaultThought: "Так, нужно составить план... Завтра",
    },
    {
      id: "coder",
      name: "Кодер",
      title: "Кодовая Макака",
      icon: <Code className="h-8 w-8" />,
      motto: "Работает? Не трогай!",
      defaultThought: "Кажется, я понял... а нет, не понял",
    },
    {
      id: "procrastinator",
      name: "Прокрастинатор",
      title: "Повелитель Ютуба",
      icon: <Youtube className="h-8 w-8" />,
      motto: "Зачем делать сегодня то, что можно не делать вообще?",
      defaultThought: "Еще одно видео не повредит",
    },
    {
      id: "critic",
      name: "Критик",
      title: "Душнила Внутренний",
      icon: <ThumbsDown className="h-8 w-8" />,
      motto: "Это можно было сделать лучше",
      defaultThought: "Кто писал этот код? А, это был я...",
    },
    {
      id: "researcher",
      name: "Исследователь",
      title: "Гуглмастер 5000",
      icon: <Search className="h-8 w-8" />,
      motto: "Еще один поисковый запрос не повредит",
      defaultThought: "Надо погуглить лучшие практики... снова",
    },
    {
      id: "focus",
      name: "Фокус",
      title: "Редкий Гость",
      icon: <Coffee className="h-8 w-8" />,
      motto: "Дайте мне кофе, и я сверну горы",
      defaultThought: "Так, сконцентрируемся на задаче",
    },
  ], []);

  // Initialize thoughts with default values - use useCallback
  const initializeThoughts = useCallback(() => {
    const initialThoughts: Record<string, string> = {}
    agents.forEach((agent) => {
      initialThoughts[agent.id] = agent.defaultThought
    })
    setAgentThoughts(initialThoughts)
  }, [agents]);

  useEffect(() => {
    initializeThoughts();
  }, [initializeThoughts]);

  // Update thoughts for the active agent - don't include getAgentThoughts in dependencies
  useEffect(() => {
    let isMounted = true;
    
    const updateActiveAgentThought = async () => {
      try {
        const thought = await getAgentThoughts(activeAgent, currentTask)
        if (thought && isMounted) {
          setAgentThoughts((prev) => ({
            ...prev,
            [activeAgent]: thought,
          }))
        }
      } catch (error) {
        console.error("Error fetching agent thought:", error)
      }
    }

    updateActiveAgentThought()
    
    return () => {
      isMounted = false;
    };
  }, [activeAgent, currentTask]) // Removed getAgentThoughts from dependencies

  // Memoize agent cards to prevent unnecessary re-renders
  const agentCards = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <TooltipProvider key={agent.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={`transition-all ${
                  activeAgent === agent.id ? "border-primary shadow-lg animate-pulse" : "opacity-70"
                }`}
              >
                <CardHeader className="flex flex-row items-center gap-2 p-4">
                  <div
                    className={`p-2 rounded-full ${
                      activeAgent === agent.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {agent.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{agent.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">aka {agent.title}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm italic">"{agentThoughts[agent.id] || agent.defaultThought}"</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                <strong>Жизненное кредо:</strong> {agent.motto}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  ), [agents, activeAgent, agentThoughts]);

  return (
    <div className="p-4 h-full overflow-auto bg-muted/30">
      <h2 className="text-2xl font-bold mb-4">Мозговой Центр</h2>
      {agentCards}
    </div>
  );
}


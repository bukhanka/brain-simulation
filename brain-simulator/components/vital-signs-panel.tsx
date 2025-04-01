import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"

type VitalSignsProps = {
  vitalSigns: {
    focus: number
    energy: number
    dopamine: number
    stress: number
  }
}

export function VitalSignsPanel({ vitalSigns }: VitalSignsProps) {
  const getProgressVariant = (value: number, type: string) => {
    if (type === "focus" && value < 20) return "destructive"
    if (type === "energy" && value < 15) return "destructive"
    if (type === "stress" && value > 80) return "destructive"
    return "default"
  }

  const getTooltipText = (type: string, value: number) => {
    switch (type) {
      case "focus":
        return value < 20 ? "Фокус: Потерян где-то между вкладками браузера" : "Концентрация на задаче"
      case "energy":
        return value < 15 ? "Нужно больше кофе!" : "Уровень энергии для кодинга"
      case "dopamine":
        return value > 80 ? "Слишком много мемов!" : "Уровень мотивации и удовольствия"
      case "stress":
        return value > 80 ? "АААААА! Дедлайн горит!" : "Уровень стресса и давления"
      default:
        return ""
    }
  }

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <CardTitle>Витальные Показатели</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <TooltipProvider>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="focus">Фокус</Label>
              <span className="text-sm">{vitalSigns.focus}%</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress
                  id="focus"
                  value={vitalSigns.focus}
                  className={vitalSigns.focus < 20 ? "animate-shake" : ""}
                  variant={getProgressVariant(vitalSigns.focus, "focus")}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{getTooltipText("focus", vitalSigns.focus)}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="energy">Заряд Кофеина</Label>
              <span className="text-sm">{vitalSigns.energy}%</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress
                  id="energy"
                  value={vitalSigns.energy}
                  variant={getProgressVariant(vitalSigns.energy, "energy")}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{getTooltipText("energy", vitalSigns.energy)}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="dopamine">Дофамин</Label>
              <span className="text-sm">{vitalSigns.dopamine}%</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress id="dopamine" value={vitalSigns.dopamine} />
              </TooltipTrigger>
              <TooltipContent>
                <p>{getTooltipText("dopamine", vitalSigns.dopamine)}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="stress">Стресс</Label>
              <span className="text-sm">{vitalSigns.stress}%</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress
                  id="stress"
                  value={vitalSigns.stress}
                  variant={getProgressVariant(vitalSigns.stress, "stress")}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{getTooltipText("stress", vitalSigns.stress)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}


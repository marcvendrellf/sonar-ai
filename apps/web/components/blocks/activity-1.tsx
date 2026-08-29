import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AgentActivity = {
  id: string
  agent: string
  initials: string
  action: string
  target: string
  time: string
  badge: "source" | "system"
}

const activities = [
  {
    id: "source-verified",
    agent: "Scout",
    initials: "SC",
    action: "verified the event timestamp in",
    target: "Reuters replay fixture",
    time: "09:42:18",
    badge: "source",
  },
  {
    id: "edge-added",
    agent: "Cartographer",
    initials: "CA",
    action: "added a sourced relationship to",
    target: "Nordic Semiconductor",
    time: "09:42:31",
    badge: "source",
  },
  {
    id: "claim-challenged",
    agent: "Skeptic",
    initials: "SK",
    action: "challenged the demand assumption for",
    target: "European suppliers",
    time: "09:42:46",
    badge: "source",
  },
  {
    id: "order-resized",
    agent: "Marshal",
    initials: "MA",
    action: "resized a paper order to preserve",
    target: "minimum cash",
    time: "09:43:04",
    badge: "system",
  },
] satisfies ReadonlyArray<AgentActivity>

export function AgentActivityFeed() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Agent activity</CardTitle>
        <CardDescription>Only sourced work and system checkpoints appear here.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="divide-y divide-border">
          {activities.map((activity) => (
            <li key={activity.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar className="mt-0.5 size-8 border border-border">
                <AvatarFallback className="bg-secondary text-[10px] font-semibold">
                  {activity.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-5 text-muted-foreground">
                    <span className="font-medium text-foreground">{activity.agent}</span>{" "}
                    {activity.action}{" "}
                    <span className="font-medium text-foreground">{activity.target}</span>
                  </p>
                  <time className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {activity.time}
                  </time>
                </div>
                <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-wider">
                  {activity.badge}
                </Badge>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

export default AgentActivityFeed

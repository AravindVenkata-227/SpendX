import GoalProgressItemCard, { AddGoalCard } from "@/components/dashboard/goal-progress-item-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Goal } from "@/types";
import { Plane, Smartphone, ShieldAlert, Target } from "lucide-react";

const goals: Goal[] = [
  { id: 'g1', name: 'Vacation to Bali', targetAmount: 75000, savedAmount: 32500, icon: Plane },
  { id: 'g2', name: 'New Laptop', targetAmount: 120000, savedAmount: 45000, icon: Smartphone },
  { id: 'g3', name: 'Emergency Fund Top-up', targetAmount: 50000, savedAmount: 48000, icon: ShieldAlert },
];

export default function GoalsSection() {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <CardTitle>Savings Goals</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalProgressItemCard key={goal.id} goal={goal} />
          ))}
          <AddGoalCard />
        </div>
      </CardContent>
    </Card>
  );
}

import type { Goal } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface GoalProgressItemCardProps {
  goal: Goal;
}

export default function GoalProgressItemCard({ goal }: GoalProgressItemCardProps) {
  const progressPercentage = (goal.savedAmount / goal.targetAmount) * 100;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <goal.icon className="h-6 w-6 text-primary" />
            <CardTitle className="text-md font-semibold">{goal.name}</CardTitle>
          </div>
        </div>
        <CardDescription className="text-xs">
          ₹{goal.savedAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={progressPercentage} className="h-2 mb-2" />
        <p className="text-xs text-muted-foreground text-right">
          {Math.round(progressPercentage)}% complete
        </p>
      </CardContent>
    </Card>
  );
}

export function AddGoalCard() {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center h-full border-dashed border-2 hover:border-primary cursor-pointer">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <PlusCircle className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-muted-foreground">Add New Goal</p>
      </CardContent>
    </Card>
  );
}

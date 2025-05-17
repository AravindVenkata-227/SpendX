
import type { UIGoal } from "@/types"; // Changed from Goal to UIGoal
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

interface GoalProgressItemCardProps {
  goal: UIGoal;
  onEdit: (goal: UIGoal) => void;
  onDelete: (goalId: string) => void;
}

export default function GoalProgressItemCard({ goal, onEdit, onDelete }: GoalProgressItemCardProps) {
  const progressPercentage = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
  const IconComponent = goal.icon; // UIGoal has the component directly

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="h-6 w-6 text-primary" />
            <CardTitle className="text-md font-semibold">{goal.name}</CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(goal)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Goal</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(goal.id)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete Goal</span>
            </Button>
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

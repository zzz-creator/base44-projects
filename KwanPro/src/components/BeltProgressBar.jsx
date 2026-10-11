import { BELT_COLORS, calculateMonthsInBelt } from "../utils/beltUtils";

export default function BeltProgressBar({ student, requirement }) {
  if (!requirement) return null;
  const classes = student.classes_in_current_belt || 0;
  const requiredClasses = requirement.required_classes || 1;
  const classProgress = Math.min((classes / requiredClasses) * 100, 100);
  const months = calculateMonthsInBelt(student.belt_start_date);
  const timeProgress = Math.min((months / (requirement.minimum_months || 1)) * 100, 100);
  const colors = BELT_COLORS[student.current_belt] || BELT_COLORS.White;

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground font-medium">Classes Attended</span>
          <span className="font-semibold">{classes} / {requiredClasses}</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${classProgress >= 100 ? "bg-green-500" : `bg-gradient-to-r from-blue-400 to-blue-600`}`}
            style={{ width: `${classProgress}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground font-medium">Time in Rank</span>
          <span className="font-semibold">{months} / {requirement.minimum_months} months</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${timeProgress >= 100 ? "bg-green-500" : "bg-gradient-to-r from-purple-400 to-purple-600"}`}
            style={{ width: `${timeProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Currency, formatAmount } from "@/lib/api";
import { 
  Receipt, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  HandCoins, 
  Settings,
  Clock 
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

interface ActivityTimelineProps {
  activities: Activity[];
  currency?: Currency;
}

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "expense_added":
      return <Receipt className="w-4 h-4" />;
    case "expense_deleted":
      return <Trash2 className="w-4 h-4" />;
    case "member_added":
      return <UserPlus className="w-4 h-4" />;
    case "settlement_recorded":
      return <HandCoins className="w-4 h-4" />;
    default:
      return <Settings className="w-4 h-4" />;
  }
};

const getActivityColor = (type: Activity["type"]) => {
  switch (type) {
    case "expense_added":
      return "bg-blue-500/10 text-blue-600";
    case "expense_deleted":
      return "bg-red-500/10 text-red-600";
    case "member_added":
      return "bg-emerald-500/10 text-emerald-600";
    case "settlement_recorded":
      return "bg-purple-500/10 text-purple-600";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getActivityBadge = (type: Activity["type"]) => {
  switch (type) {
    case "expense_added":
      return { label: "Expense", variant: "default" as const };
    case "expense_deleted":
      return { label: "Deleted", variant: "destructive" as const };
    case "member_added":
      return { label: "Member", variant: "secondary" as const };
    case "settlement_recorded":
      return { label: "Settlement", variant: "outline" as const };
    default:
      return { label: "Update", variant: "secondary" as const };
  }
};

export const ActivityTimeline = ({ activities, currency = "USD" }: ActivityTimelineProps) => {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity yet. Add expenses or members to see activity here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-primary" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          
          {activities.map((activity, index) => {
            const badge = getActivityBadge(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div
                key={activity._id}
                className="relative pl-10 pb-4 last:pb-0"
              >
                {/* Timeline dot */}
                <div 
                  className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${colorClass}`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {activity.description}
                    </span>
                    <Badge variant={badge.variant} className="text-xs">
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(parseISO(activity.createdAt), { addSuffix: true })}
                    </span>
                    {activity.amount && (
                      <>
                        <span>•</span>
                        <span className="font-medium">
                          {formatAmount(activity.amount, currency)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

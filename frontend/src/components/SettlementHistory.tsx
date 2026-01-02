import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, History, ArrowRight, CheckCircle2, Undo2, Clock } from "lucide-react";
import { settlementsAPI, Currency, formatAmount } from "@/lib/api";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface SettlementRecord {
  _id: string;
  from: string;
  to: string;
  amount: number;
  settledAt: string;
  createdAt: string;
}

interface SettlementHistoryProps {
  groupId: string;
  currency: Currency;
  refreshKey?: number;
  onUndoSuccess?: () => void;
}

const UNDO_WINDOW_MINUTES = 15;

export const SettlementHistory = ({ groupId, currency, refreshKey = 0, onUndoSuccess }: SettlementHistoryProps) => {
  const [history, setHistory] = useState<SettlementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await settlementsAPI.getHistory(groupId);
        setHistory(data as SettlementRecord[]);
      } catch (err) {
        console.error("Failed to fetch settlement history:", err);
        setError("Failed to load settlement history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [groupId, refreshKey]);

  const canUndo = (settlement: SettlementRecord): boolean => {
    const settlementTime = new Date(settlement.settledAt || settlement.createdAt);
    const minutesAgo = differenceInMinutes(new Date(), settlementTime);
    return minutesAgo < UNDO_WINDOW_MINUTES;
  };

  const getTimeRemaining = (settlement: SettlementRecord): string => {
    const settlementTime = new Date(settlement.settledAt || settlement.createdAt);
    const minutesAgo = differenceInMinutes(new Date(), settlementTime);
    const remaining = UNDO_WINDOW_MINUTES - minutesAgo;
    if (remaining <= 0) return "";
    if (remaining === 1) return "1 min left";
    return `${remaining} mins left`;
  };

  const handleUndo = async (settlement: SettlementRecord) => {
    setUndoingId(settlement._id);
    try {
      await settlementsAPI.undoSettlement(settlement._id);
      setHistory(prev => prev.filter(s => s._id !== settlement._id));
      toast({
        title: "Settlement undone",
        description: `Reversed: ${settlement.from} → ${settlement.to} ${formatAmount(settlement.amount, currency)}`,
      });
      onUndoSuccess?.();
    } catch (err) {
      toast({
        title: "Failed to undo",
        description: err instanceof Error ? err.message : "Cannot undo this settlement",
        variant: "destructive",
      });
    } finally {
      setUndoingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No settlements yet</h3>
          <p className="text-muted-foreground">
            Settle debts from the pending settlements to see history here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-primary" />
          Settlement History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((settlement, index) => {
          const isUndoable = canUndo(settlement);
          const timeRemaining = getTimeRemaining(settlement);
          
          return (
            <div
              key={settlement._id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{settlement.from}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{settlement.to}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(settlement.settledAt || settlement.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0">
                  {formatAmount(settlement.amount, currency)}
                </Badge>
                {isUndoable && (
                  <div className="flex items-center gap-2">
                    {timeRemaining && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeRemaining}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUndo(settlement)}
                      disabled={undoingId === settlement._id}
                      className="h-7 px-2 text-muted-foreground hover:text-destructive"
                    >
                      {undoingId === settlement._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Undo2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
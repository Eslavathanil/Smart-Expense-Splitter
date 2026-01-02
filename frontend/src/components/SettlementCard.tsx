import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ArrowRight, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Settlement, Currency, formatAmount, CURRENCY_SYMBOLS } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SettlementCardProps {
  settlement: Settlement;
  currency: Currency;
  index: number;
  onSettle: (settlement: Settlement) => Promise<void>;
  largeSettlementThreshold?: number;
}

const LARGE_SETTLEMENT_DEFAULT = 100;

export const SettlementCard = ({ 
  settlement, 
  currency, 
  index, 
  onSettle,
  largeSettlementThreshold = LARGE_SETTLEMENT_DEFAULT 
}: SettlementCardProps) => {
  const [isSettling, setIsSettling] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const [showPartial, setShowPartial] = useState(false);
  const [partialAmount, setPartialAmount] = useState(settlement.amount.toFixed(2));
  const [partialError, setPartialError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const validateAmount = (value: string): boolean => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      setPartialError("Enter a valid amount");
      return false;
    }
    if (num > settlement.amount) {
      setPartialError(`Cannot exceed ${formatAmount(settlement.amount, currency)}`);
      return false;
    }
    setPartialError(null);
    return true;
  };

  const executeSettlement = async (amount: number) => {
    setIsSettling(true);
    try {
      await onSettle({ ...settlement, amount });
      setIsSettled(true);
    } catch {
      setIsSettling(false);
    }
  };

  const handleSettle = async (amount?: number) => {
    const settleAmount = amount ?? settlement.amount;
    
    if (showPartial && !validateAmount(partialAmount)) {
      return;
    }
    
    const finalAmount = showPartial ? parseFloat(partialAmount) : settleAmount;
    
    // Check if this is a large settlement that needs confirmation
    if (finalAmount >= largeSettlementThreshold) {
      setPendingAmount(finalAmount);
      setShowConfirmDialog(true);
      return;
    }
    
    await executeSettlement(finalAmount);
  };

  const handleConfirmSettlement = async () => {
    setShowConfirmDialog(false);
    if (pendingAmount !== null) {
      await executeSettlement(pendingAmount);
      setPendingAmount(null);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmDialog(false);
    setPendingAmount(null);
  };

  if (isSettled) {
    const settledAmount = showPartial ? parseFloat(partialAmount) : settlement.amount;
    return (
      <Card className="animate-settle-success border-emerald-500/50 bg-emerald-500/5">
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-success-pulse">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-emerald-600">Settlement Complete!</p>
              <p className="text-sm text-muted-foreground">
                {settlement.from} paid {settlement.to} {formatAmount(settledAmount, currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className="opacity-0 animate-fade-up transition-all duration-300 hover:shadow-md"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <CardContent className="py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-destructive">
                    {settlement.from?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{settlement.from}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{settlement.to}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-emerald-600">
                    {settlement.to?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-primary">
                  {formatAmount(settlement.amount, currency)}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPartial(!showPartial)}
                    className="text-xs text-muted-foreground"
                  >
                    Partial
                    {showPartial ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleSettle()}
                    disabled={isSettling}
                    className="min-w-[90px]"
                  >
                    {isSettling ? (
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      </span>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Settle
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Partial Payment Section */}
            {showPartial && (
              <div className="flex items-center gap-3 pt-2 border-t border-border animate-fade-in">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Pay partial:</span>
                    <div className="relative flex-1 max-w-[150px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={settlement.amount}
                        value={partialAmount}
                        onChange={(e) => {
                          setPartialAmount(e.target.value);
                          if (partialError) validateAmount(e.target.value);
                        }}
                        className="pl-7 h-8 text-sm"
                        placeholder="Amount"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      of {formatAmount(settlement.amount, currency)}
                    </span>
                  </div>
                  {partialError && (
                    <p className="text-xs text-destructive mt-1">{partialError}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSettle(parseFloat(partialAmount))}
                  disabled={isSettling || !partialAmount}
                >
                  Pay {partialAmount && !isNaN(parseFloat(partialAmount)) 
                    ? formatAmount(parseFloat(partialAmount), currency) 
                    : 'Partial'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Large Settlement Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Large Settlement</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to record a payment of{" "}
              <span className="font-semibold text-foreground">
                {pendingAmount !== null ? formatAmount(pendingAmount, currency) : ''}
              </span>{" "}
              from <span className="font-medium">{settlement.from}</span> to{" "}
              <span className="font-medium">{settlement.to}</span>.
              <br /><br />
              This is a large amount. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirmation}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSettlement}>
              Yes, Record Settlement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
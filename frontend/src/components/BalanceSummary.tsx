import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { Expense, Member, Currency, formatAmount } from "@/lib/api";

interface BalanceSummaryProps {
  expenses: Expense[];
  members: Member[] | string[];
  currency?: Currency;
}

interface MemberBalance {
  name: string;
  paid: number;
  owes: number;
  balance: number;
}

export const BalanceSummary = ({ expenses, members, currency = "USD" }: BalanceSummaryProps) => {
  const memberNames = useMemo(() => {
    return members.map((m) => (typeof m === "string" ? m : m.name));
  }, [members]);

  const balances = useMemo<MemberBalance[]>(() => {
    const balanceMap: Record<string, { paid: number; owes: number }> = {};

    memberNames.forEach((name) => {
      balanceMap[name] = { paid: 0, owes: 0 };
    });

    expenses.forEach((expense) => {
      const { paidBy, amount, splitWith, splitType, splitAmounts } = expense;

      if (balanceMap[paidBy]) {
        balanceMap[paidBy].paid += amount;
      }

      // Calculate splits based on split type
      if (splitType === "custom" && splitAmounts) {
        // Handle splitAmounts as object or Map-like structure
        const entries = splitAmounts instanceof Map 
          ? Array.from(splitAmounts.entries()) 
          : Object.entries(splitAmounts);
        entries.forEach(([member, splitAmount]) => {
          if (balanceMap[member]) {
            balanceMap[member].owes += Number(splitAmount);
          }
        });
      } else if (splitType === "percentage" && splitAmounts) {
        const entries = splitAmounts instanceof Map 
          ? Array.from(splitAmounts.entries()) 
          : Object.entries(splitAmounts);
        entries.forEach(([member, percentage]) => {
          const splitAmount = (amount * Number(percentage)) / 100;
          if (balanceMap[member]) {
            balanceMap[member].owes += splitAmount;
          }
        });
      } else if (splitWith && splitWith.length > 0) {
        // Equal split (default)
        const splitAmount = amount / splitWith.length;
        splitWith.forEach((member) => {
          if (balanceMap[member]) {
            balanceMap[member].owes += splitAmount;
          }
        });
      }
    });

    return Object.entries(balanceMap).map(([name, { paid, owes }]) => ({
      name,
      paid,
      owes,
      balance: paid - owes,
    }));
  }, [expenses, memberNames]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="w-5 h-5 text-primary" />
          Member Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {balances.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add members to see balances
          </p>
        ) : (
          balances.map((member) => (
            <div
              key={member.name}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Paid: {formatAmount(member.paid, currency)} • Owes: {formatAmount(member.owes, currency)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.balance > 0.01 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0">
                      +{formatAmount(member.balance, currency)}
                    </Badge>
                  </>
                ) : member.balance < -0.01 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-0">
                      -{formatAmount(Math.abs(member.balance), currency)}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">
                    Settled
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
        {totalExpenses > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Per person average:</span>
              <span className="font-medium text-foreground">
                {formatAmount(totalExpenses / Math.max(memberNames.length, 1), currency)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export const calculateOptimalSettlements = (
  expenses: Expense[],
  members: Member[] | string[]
): Settlement[] => {
  const memberNames = members.map((m) => (typeof m === "string" ? m : m.name));
  const balances: Record<string, number> = {};

  memberNames.forEach((name) => {
    balances[name] = 0;
  });

  expenses.forEach((expense) => {
    const { paidBy, amount, splitWith, splitType, splitAmounts } = expense;
    
    balances[paidBy] = (balances[paidBy] || 0) + amount;
    
    if (splitType === "custom" && splitAmounts) {
      const entries = splitAmounts instanceof Map 
        ? Array.from(splitAmounts.entries()) 
        : Object.entries(splitAmounts);
      entries.forEach(([member, splitAmount]) => {
        balances[member] = (balances[member] || 0) - Number(splitAmount);
      });
    } else if (splitType === "percentage" && splitAmounts) {
      const entries = splitAmounts instanceof Map 
        ? Array.from(splitAmounts.entries()) 
        : Object.entries(splitAmounts);
      entries.forEach(([member, percentage]) => {
        const splitAmount = (amount * Number(percentage)) / 100;
        balances[member] = (balances[member] || 0) - splitAmount;
      });
    } else if (splitWith && splitWith.length > 0) {
      const splitAmount = amount / splitWith.length;
      splitWith.forEach((member) => {
        balances[member] = (balances[member] || 0) - splitAmount;
      });
    }
  });

  const settlements: Settlement[] = [];
  const debtors = Object.entries(balances)
    .filter(([_, balance]) => balance < -0.01)
    .map(([name, balance]) => ({ name, balance }))
    .sort((a, b) => a.balance - b.balance);
  const creditors = Object.entries(balances)
    .filter(([_, balance]) => balance > 0.01)
    .map(([name, balance]) => ({ name, balance }))
    .sort((a, b) => b.balance - a.balance);

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    if (amount > 0.01) {
      settlements.push({ from: debtor.name, to: creditor.name, amount: Math.round(amount * 100) / 100 });
    }

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) i++;
    if (creditor.balance < 0.01) j++;
  }

  return settlements;
};

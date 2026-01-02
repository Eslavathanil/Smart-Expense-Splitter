import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Users, UserMinus, AlertTriangle } from "lucide-react";
import { Member, Currency, formatAmount } from "@/lib/api";

interface MemberBalance {
  name: string;
  balance: number;
}

interface MemberListProps {
  members: Member[] | string[];
  balances: MemberBalance[];
  currency: Currency;
  isCreator: boolean;
  onRemoveMember: (memberName: string) => Promise<void>;
}

export const MemberList = ({
  members,
  balances,
  currency,
  isCreator,
  onRemoveMember,
}: MemberListProps) => {
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const memberNames = members.map((m) => (typeof m === "string" ? m : m.name));

  const getMemberBalance = (name: string): number => {
    const balance = balances.find((b) => b.name === name);
    return balance?.balance || 0;
  };

  const hasPendingBalance = (name: string): boolean => {
    const balance = getMemberBalance(name);
    return Math.abs(balance) > 0.01;
  };

  const handleRemoveClick = (memberName: string) => {
    setMemberToRemove(memberName);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      await onRemoveMember(memberToRemove);
    } finally {
      setIsRemoving(false);
      setMemberToRemove(null);
    }
  };

  const getMemberToRemoveBalance = () => {
    if (!memberToRemove) return 0;
    return getMemberBalance(memberToRemove);
  };

  const canRemoveMember = (name: string): boolean => {
    return !hasPendingBalance(name);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Group Members ({memberNames.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {memberNames.map((name) => {
            const balance = getMemberBalance(name);
            const hasBalance = hasPendingBalance(name);

            return (
              <div
                key={name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{name}</p>
                    {hasBalance && (
                      <p className="text-xs text-muted-foreground">
                        Balance: {balance > 0 ? "+" : ""}
                        {formatAmount(balance, currency)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasBalance && (
                    <Badge
                      variant="outline"
                      className={
                        balance > 0
                          ? "border-emerald-500/50 text-emerald-600"
                          : "border-red-500/50 text-red-600"
                      }
                    >
                      {balance > 0 ? "Owed" : "Owes"}
                    </Badge>
                  )}

                  {isCreator && memberNames.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveClick(name)}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {hasPendingBalance(memberToRemove || "") && (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              Remove {memberToRemove}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hasPendingBalance(memberToRemove || "") ? (
                <div className="space-y-2">
                  <p className="text-amber-600 font-medium">
                    Warning: This member has a pending balance of{" "}
                    {formatAmount(Math.abs(getMemberToRemoveBalance()), currency)}
                  </p>
                  <p>
                    {getMemberToRemoveBalance() > 0
                      ? `${memberToRemove} is owed money. Removing them will clear this balance.`
                      : `${memberToRemove} owes money. Removing them will clear this debt.`}
                  </p>
                  <p className="text-muted-foreground">
                    It's recommended to settle all balances before removing a member.
                  </p>
                </div>
              ) : (
                <p>
                  Are you sure you want to remove {memberToRemove} from this group? This action
                  cannot be undone.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            {canRemoveMember(memberToRemove || "") ? (
              <AlertDialogAction onClick={handleConfirmRemove} disabled={isRemoving}>
                {isRemoving ? "Removing..." : "Remove Member"}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {isRemoving ? "Removing..." : "Remove Anyway"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

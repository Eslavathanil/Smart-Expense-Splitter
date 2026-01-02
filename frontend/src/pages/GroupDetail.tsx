import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  groupsAPI, 
  expensesAPI, 
  settlementsAPI, 
  activityAPI,
  Group, 
  Expense, 
  Settlement,
  Activity,
  Currency,
  formatAmount,
  CURRENCY_SYMBOLS
} from "@/lib/api";
import { memberSchema, type MemberFormData } from "@/lib/validations";
import { categories, getCategoryConfig } from "@/lib/categories";
import { BalanceSummary, calculateOptimalSettlements } from "@/components/BalanceSummary";
import { CategoryFilter, CategoryBadge } from "@/components/CategoryFilter";
import { CSVExport } from "@/components/CSVExport";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExpenseForm } from "@/components/ExpenseForm";
import { SettlementHistory } from "@/components/SettlementHistory";
import { SettlementCard } from "@/components/SettlementCard";
import { MemberList } from "@/components/MemberList";
import {
  Wallet,
  ArrowLeft,
  Plus,
  Users,
  Receipt,
  PieChart,
  Check,
  Trash2,
  ArrowRight,
  Loader2,
  UserPlus,
  Scale,
  Settings,
  Clock,
  History,
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [memberBalances, setMemberBalances] = useState<{ name: string; balance: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettlementsLoading, setIsSettlementsLoading] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [settlementHistoryKey, setSettlementHistoryKey] = useState(0);
  const { toast } = useToast();

  const currency: Currency = group?.currency || "USD";
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const memberForm = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    if (groupId) {
      fetchData();
    }
  }, [groupId]);

  const fetchData = async () => {
    try {
      setIsSettlementsLoading(true);
      const [groupData, expensesData] = await Promise.all([
        groupsAPI.getById(groupId!),
        expensesAPI.getByGroup(groupId!),
      ]);
      setGroup(groupData);
      setExpenses(expensesData);
      
      // Fetch pending settlements from backend
      try {
        const settlementsData = await settlementsAPI.getByGroup(groupId!);
        setSettlements(Array.isArray(settlementsData) ? settlementsData : []);
      } catch (err) {
        console.error('Failed to fetch settlements from backend, using fallback:', err);
        const calculated = calculateOptimalSettlements(expensesData, groupData.members);
        setSettlements(calculated);
      }

      // Fetch member balances
      try {
        const balances = await settlementsAPI.getBalances(groupId!);
        setMemberBalances(balances);
      } catch {
        setMemberBalances([]);
      }

      // Fetch activity timeline
      try {
        const activityData = await activityAPI.getByGroup(groupId!);
        setActivities(Array.isArray(activityData) ? activityData : []);
      } catch {
        setActivities([]);
      }
    } catch (error) {
      console.error('Failed to load group data:', error);
      toast({
        title: "Error",
        description: "Failed to load group data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsSettlementsLoading(false);
    }
  };

  const memberNames = useMemo(() => {
    return group?.members.map(m => typeof m === 'string' ? m : m.name) || [];
  }, [group]);

  const isCreator = useMemo(() => {
    return group?.createdBy === user?._id;
  }, [group, user]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const expenseCountByCategory = useMemo(() => {
    return expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (selectedCategories.length === 0) return expenses;
    return expenses.filter(e => selectedCategories.includes(e.category));
  }, [expenses, selectedCategories]);

  const categoryData = useMemo(() => {
    return categories
      .map(cat => ({
        name: cat.name,
        value: expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0),
        color: cat.color,
      }))
      .filter(c => c.value > 0);
  }, [expenses]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAddExpense = async (data: {
    title: string;
    amount: number;
    paidBy: string;
    category: string;
    splitType: "equal" | "percentage" | "custom";
    splitWith: string[];
    splitAmounts?: Record<string, number>;
  }) => {
    setIsSubmitting(true);
    try {
      const expense = await expensesAPI.create(groupId!, {
        title: data.title,
        amount: data.amount,
        paidBy: data.paidBy,
        category: data.category,
        splitWith: data.splitWith,
        splitType: data.splitType,
        splitAmounts: data.splitAmounts,
      });
      const newExpenses = [expense, ...expenses];
      setExpenses(newExpenses);
      setIsAddExpenseOpen(false);
      toast({
        title: "Expense added!",
        description: `${data.title} - ${formatAmount(data.amount, currency)}`,
      });
      
      // Refresh settlements and activity
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add expense",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (data: MemberFormData) => {
    setIsSubmitting(true);
    try {
      const updatedGroup = await groupsAPI.addMember(groupId!, {
        name: data.name,
        email: data.email || undefined,
      });
      setGroup(updatedGroup);
      memberForm.reset();
      setIsAddMemberOpen(false);
      toast({
        title: "Member added!",
        description: `${data.name} has been added to the group.`,
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add member",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberName: string) => {
    try {
      const updatedGroup = await groupsAPI.removeMember(groupId!, memberName);
      setGroup(updatedGroup);
      toast({
        title: "Member removed",
        description: `${memberName} has been removed from the group.`,
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await expensesAPI.delete(groupId!, expenseId);
      const updatedExpenses = expenses.filter(e => e._id !== expenseId);
      setExpenses(updatedExpenses);
      toast({
        title: "Expense deleted",
        description: "The expense has been removed.",
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const handleSettleDebt = async (settlement: Settlement) => {
    try {
      // Optimistically remove from pending list for instant UI feedback
      setSettlements(prev => prev.filter(s => 
        !(s.from === settlement.from && s.to === settlement.to && s.amount === settlement.amount)
      ));
      
      await settlementsAPI.markSettled(groupId!, settlement);
      
      toast({
        title: "Settled!",
        description: `${settlement.from} paid ${settlement.to} ${formatAmount(settlement.amount, currency)}`,
      });
      
      // Increment history key to trigger re-fetch of history
      setSettlementHistoryKey(prev => prev + 1);
      
      // Refresh all data to ensure consistency
      fetchData();
    } catch (error) {
      // Revert on error - refetch to restore state
      fetchData();
      toast({
        title: "Error",
        description: "Failed to mark as settled",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCurrency = async (newCurrency: Currency) => {
    try {
      const updatedGroup = await groupsAPI.update(groupId!, { currency: newCurrency });
      setGroup(updatedGroup);
      toast({
        title: "Currency updated",
        description: `Group currency changed to ${newCurrency}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update currency",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await groupsAPI.delete(groupId!);
      toast({
        title: "Group deleted",
        description: "The group has been permanently deleted.",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center py-8 px-12">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Group not found</h2>
            <Link to="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{group.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {memberNames.length} members • {currencySymbol} {currency}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a member</DialogTitle>
                    <DialogDescription>
                      Add someone to this expense group
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...memberForm}>
                    <form onSubmit={memberForm.handleSubmit(handleAddMember)} className="space-y-4 mt-4">
                      <FormField
                        control={memberForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Member name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={memberForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (optional)</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="member@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsAddMemberOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Adding..." : "Add Member"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Settings Dialog */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Group Settings</DialogTitle>
                    <DialogDescription>
                      Manage your group settings
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Currency</label>
                      <Select value={currency} onValueChange={(value) => handleUpdateCurrency(value as Currency)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                          <SelectItem value="INR">₹ INR (Indian Rupee)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Group
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete group?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{group.name}" and all its expenses. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteGroup}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <ThemeToggle />
              <CSVExport expenses={expenses} groupName={group.name} currency={currency} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-foreground">{formatAmount(totalExpenses, currency)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Per Person</p>
                  <p className="text-2xl font-bold text-foreground">
                    {memberNames.length > 0 ? formatAmount(totalExpenses / memberNames.length, currency) : formatAmount(0, currency)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Settlements</p>
                  <p className="text-2xl font-bold text-foreground">{settlements.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Scale className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balance Summary */}
        <div className="mb-8">
          <BalanceSummary expenses={expenses} members={group.members} currency={currency} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 max-w-2xl">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="settlements">Settle</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">All Expenses</h2>
              <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add new expense</DialogTitle>
                    <DialogDescription>
                      Enter the details of the expense ({currencySymbol} {currency})
                    </DialogDescription>
                  </DialogHeader>
                  <ExpenseForm
                    members={memberNames}
                    currency={currency}
                    isSubmitting={isSubmitting}
                    onSubmit={handleAddExpense}
                    onCancel={() => setIsAddExpenseOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Category Filter */}
            <Card className="p-4">
              <CategoryFilter
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategoryToggle}
                onClearFilters={() => setSelectedCategories([])}
                expenseCountByCategory={expenseCountByCategory}
              />
            </Card>

            {filteredExpenses.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    {expenses.length === 0 ? "No expenses yet" : "No matching expenses"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {expenses.length === 0 
                      ? "Add your first expense to get started"
                      : "Try adjusting your category filters"}
                  </p>
                  {expenses.length === 0 && (
                    <Button onClick={() => setIsAddExpenseOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.map((expense, index) => {
                  const catConfig = getCategoryConfig(expense.category);
                  const Icon = catConfig.icon;
                  
                  return (
                    <Card 
                      key={expense._id} 
                      className="opacity-0 animate-fade-up hover:shadow-md transition-shadow"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${catConfig.color}20` }}
                            >
                              <Icon 
                                className="w-5 h-5" 
                                style={{ color: catConfig.color }}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{expense.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-sm text-muted-foreground">
                                  Paid by {expense.paidBy}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <CategoryBadge category={expense.category} />
                                {expense.splitType && expense.splitType !== "equal" && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-xs text-primary capitalize">
                                      {expense.splitType} split
                                    </span>
                                  </>
                                )}
                                {expense.date && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-sm text-muted-foreground">
                                      {format(parseISO(expense.date), "MMM d, yyyy")}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-lg font-semibold text-foreground">
                              {formatAmount(expense.amount, currency)}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExpense(expense._id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="space-y-6">
            {/* Member Balances Overview */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">Member Balances</h2>
              <Card>
                <CardContent className="py-4">
                  {memberBalances.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No balance data available</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {memberBalances.map((member, index) => (
                        <div
                          key={member.name}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 opacity-0 animate-fade-up"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            member.balance > 0.01 
                              ? 'bg-emerald-500/10' 
                              : member.balance < -0.01 
                                ? 'bg-destructive/10' 
                                : 'bg-muted'
                          }`}>
                            <span className={`text-sm font-medium ${
                              member.balance > 0.01 
                                ? 'text-emerald-600' 
                                : member.balance < -0.01 
                                  ? 'text-destructive' 
                                  : 'text-muted-foreground'
                            }`}>
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{member.name}</p>
                            <p className={`text-sm font-semibold ${
                              member.balance > 0.01 
                                ? 'text-emerald-600' 
                                : member.balance < -0.01 
                                  ? 'text-destructive' 
                                  : 'text-muted-foreground'
                            }`}>
                              {member.balance > 0.01 
                                ? `+${formatAmount(member.balance, currency)}` 
                                : member.balance < -0.01 
                                  ? formatAmount(member.balance, currency)
                                  : 'Settled'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settlement Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-foreground">Settlement Suggestions</h2>
                <p className="text-sm text-muted-foreground">
                  Optimized to minimize transactions
                </p>
              </div>
              
              {isSettlementsLoading ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Calculating...</h3>
                    <p className="text-muted-foreground">Computing optimal settlements</p>
                  </CardContent>
                </Card>
              ) : settlements.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <Check className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                    <h3 className="text-lg font-semibold mb-2">All settled up!</h3>
                    <p className="text-muted-foreground">
                      {expenses.length === 0 
                        ? "Add expenses to see settlement suggestions" 
                        : "No pending settlements"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {settlements.map((settlement, index) => (
                    <SettlementCard
                      key={`${settlement.from}-${settlement.to}-${index}`}
                      settlement={settlement}
                      currency={currency}
                      index={index}
                      onSettle={handleSettleDebt}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Settlement History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Settlement History</h2>
            <SettlementHistory 
              groupId={groupId!} 
              currency={currency} 
              refreshKey={settlementHistoryKey}
              onUndoSuccess={() => fetchData()}
            />
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Group Members</h2>
            <MemberList
              members={group.members}
              balances={memberBalances}
              currency={currency}
              isCreator={isCreator}
              onRemoveMember={handleRemoveMember}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
            <ActivityTimeline activities={activities} currency={currency} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Spending Analytics</h2>
            {categoryData.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <PieChart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                  <p className="text-muted-foreground">Add expenses to see analytics</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatAmount(value, currency)} />
                          <Legend />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryData.map((cat) => {
                      const config = getCategoryConfig(cat.name);
                      const Icon = config.icon;
                      
                      return (
                        <div key={cat.name} className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" style={{ color: cat.color }} />
                              <span className="font-medium">{cat.name}</span>
                            </div>
                            <span className="text-muted-foreground">
                              {formatAmount(cat.value, currency)} ({((cat.value / totalExpenses) * 100).toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(cat.value / totalExpenses) * 100}%`,
                                backgroundColor: cat.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GroupDetail;

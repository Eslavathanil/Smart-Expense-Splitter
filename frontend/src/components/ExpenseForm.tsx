import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { categories } from "@/lib/categories";
import { Currency, CURRENCY_SYMBOLS } from "@/lib/api";
import { Users, Percent, Calculator, SplitSquareVertical } from "lucide-react";

const expenseFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  paidBy: z.string().min(1, "Please select who paid"),
  category: z.string().min(1, "Please select a category"),
  splitType: z.enum(["equal", "percentage", "custom"]),
  splitWith: z.array(z.string()).min(1, "Select at least one person to split with"),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  members: string[];
  currency: Currency;
  isSubmitting: boolean;
  onSubmit: (data: {
    title: string;
    amount: number;
    paidBy: string;
    category: string;
    splitType: "equal" | "percentage" | "custom";
    splitWith: string[];
    splitAmounts?: Record<string, number>;
  }) => void;
  onCancel: () => void;
}

export const ExpenseForm = ({
  members,
  currency,
  isSubmitting,
  onSubmit,
  onCancel,
}: ExpenseFormProps) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({});
  const [splitError, setSplitError] = useState<string | null>(null);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: "",
      amount: "",
      paidBy: "",
      category: "",
      splitType: "equal",
      splitWith: members,
    },
  });

  const splitType = form.watch("splitType");
  const splitWith = form.watch("splitWith");
  const amount = form.watch("amount");

  // Initialize split amounts when members change
  useEffect(() => {
    const initialAmounts: Record<string, string> = {};
    members.forEach((member) => {
      if (splitType === "percentage") {
        initialAmounts[member] = (100 / members.length).toFixed(1);
      } else {
        initialAmounts[member] = "";
      }
    });
    setSplitAmounts(initialAmounts);
  }, [members, splitType]);

  const handleSplitAmountChange = (member: string, value: string) => {
    setSplitAmounts((prev) => ({ ...prev, [member]: value }));
    setSplitError(null);
  };

  const validateSplitAmounts = (): Record<string, number> | null => {
    const parsedAmount = parseFloat(amount) || 0;
    const result: Record<string, number> = {};

    if (splitType === "percentage") {
      let totalPercent = 0;
      for (const member of splitWith) {
        const percent = parseFloat(splitAmounts[member] || "0");
        if (isNaN(percent) || percent < 0) {
          setSplitError(`Invalid percentage for ${member}`);
          return null;
        }
        result[member] = percent;
        totalPercent += percent;
      }
      if (Math.abs(totalPercent - 100) > 0.1) {
        setSplitError(`Percentages must add up to 100% (currently ${totalPercent.toFixed(1)}%)`);
        return null;
      }
    } else if (splitType === "custom") {
      let totalCustom = 0;
      for (const member of splitWith) {
        const customAmount = parseFloat(splitAmounts[member] || "0");
        if (isNaN(customAmount) || customAmount < 0) {
          setSplitError(`Invalid amount for ${member}`);
          return null;
        }
        result[member] = customAmount;
        totalCustom += customAmount;
      }
      if (Math.abs(totalCustom - parsedAmount) > 0.01) {
        setSplitError(
          `Split amounts must equal total (${currencySymbol}${totalCustom.toFixed(2)} of ${currencySymbol}${parsedAmount.toFixed(2)})`
        );
        return null;
      }
    }

    return result;
  };

  const handleFormSubmit = (data: ExpenseFormData) => {
    let splitAmountsData: Record<string, number> | undefined;

    if (data.splitType !== "equal") {
      const validated = validateSplitAmounts();
      if (!validated) return;
      splitAmountsData = validated;
    }

    onSubmit({
      title: data.title,
      amount: parseFloat(data.amount),
      paidBy: data.paidBy,
      category: data.category,
      splitType: data.splitType,
      splitWith: data.splitWith,
      splitAmounts: splitAmountsData,
    });
  };

  const getEqualSplitAmount = () => {
    const parsedAmount = parseFloat(amount) || 0;
    const count = splitWith.length || 1;
    return (parsedAmount / count).toFixed(2);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Dinner at restaurant" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({currencySymbol})</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paidBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paid by</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select who paid" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.name} value={cat.name}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Split Type Selection */}
        <FormField
          control={form.control}
          name="splitType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Split Type</FormLabel>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={field.value === "equal" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => field.onChange("equal")}
                >
                  <Users className="w-4 h-4" />
                  Equal
                </Button>
                <Button
                  type="button"
                  variant={field.value === "percentage" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => field.onChange("percentage")}
                >
                  <Percent className="w-4 h-4" />
                  Percentage
                </Button>
                <Button
                  type="button"
                  variant={field.value === "custom" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => field.onChange("custom")}
                >
                  <Calculator className="w-4 h-4" />
                  Custom
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Split With Selection */}
        <FormField
          control={form.control}
          name="splitWith"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <SplitSquareVertical className="w-4 h-4" />
                Split between
              </FormLabel>
              <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                {members.map((member) => (
                  <div key={member} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`member-${member}`}
                        checked={field.value.includes(member)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, member]);
                          } else {
                            field.onChange(field.value.filter((m) => m !== member));
                          }
                        }}
                      />
                      <label
                        htmlFor={`member-${member}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {member}
                      </label>
                    </div>

                    {/* Show split amount input for non-equal splits */}
                    {field.value.includes(member) && splitType !== "equal" && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step={splitType === "percentage" ? "0.1" : "0.01"}
                          min="0"
                          className="w-24 h-8 text-sm"
                          placeholder={splitType === "percentage" ? "%" : currencySymbol}
                          value={splitAmounts[member] || ""}
                          onChange={(e) => handleSplitAmountChange(member, e.target.value)}
                        />
                        <span className="text-xs text-muted-foreground w-8">
                          {splitType === "percentage" ? "%" : currencySymbol}
                        </span>
                      </div>
                    )}

                    {/* Show equal split preview */}
                    {field.value.includes(member) && splitType === "equal" && amount && (
                      <Badge variant="secondary" className="text-xs">
                        {currencySymbol}
                        {getEqualSplitAmount()}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <FormMessage />
              {splitError && <p className="text-sm text-destructive mt-1">{splitError}</p>}
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

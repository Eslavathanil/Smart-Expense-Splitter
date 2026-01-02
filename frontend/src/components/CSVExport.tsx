import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, CalendarIcon, FileDown } from "lucide-react";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { Expense, Currency, CURRENCY_SYMBOLS } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CSVExportProps {
  expenses: Expense[];
  groupName?: string;
  currency?: Currency;
}

export const CSVExport = ({ expenses, groupName, currency = "USD" }: CSVExportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  const filteredExpenses = expenses.filter((expense) => {
    if (!startDate && !endDate) return true;

    try {
      const expenseDate = parseISO(expense.date);
      const start = startDate ? startOfDay(startDate) : new Date(0);
      const end = endDate ? endOfDay(endDate) : new Date(8640000000000000);

      return isWithinInterval(expenseDate, { start, end });
    } catch {
      return true;
    }
  });

  const exportToCSV = () => {
    if (filteredExpenses.length === 0) {
      toast({
        title: "No expenses",
        description: "No expenses found for the selected date range.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Title", "Amount", "Paid By", "Category", "Split With"];
    const rows = filteredExpenses.map((e) => [
      e.date,
      `"${e.title.replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      e.paidBy,
      e.category,
      `"${e.splitWith.join(", ")}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const dateRange =
      startDate && endDate
        ? `_${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}`
        : startDate
        ? `_from_${format(startDate, "yyyy-MM-dd")}`
        : endDate
        ? `_until_${format(endDate, "yyyy-MM-dd")}`
        : "";

    a.download = `${(groupName || "expenses").replace(/\s+/g, "_")}${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${filteredExpenses.length} expense(s) to CSV.`,
    });

    setIsOpen(false);
  };

  const clearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            Export Expenses
          </DialogTitle>
          <DialogDescription>
            Select a date range to filter expenses for export. Leave empty to export all.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => (endDate ? date > endDate : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => (startDate ? date < startDate : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {(startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={clearDates} className="w-full">
              Clear date range
            </Button>
          )}

          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredExpenses.length}</span> expense
              {filteredExpenses.length !== 1 ? "s" : ""} will be exported
              {startDate || endDate ? " for the selected range" : ""}.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={exportToCSV} disabled={filteredExpenses.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categories, getCategoryConfig } from "@/lib/categories";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onClearFilters: () => void;
  expenseCountByCategory?: Record<string, number>;
}

export const CategoryFilter = ({
  selectedCategories,
  onCategoryToggle,
  onClearFilters,
  expenseCountByCategory = {},
}: CategoryFilterProps) => {
  const hasFilters = selectedCategories.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Filter by Category</span>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-7 px-2 text-xs">
            Clear filters
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategories.includes(category.name);
          const count = expenseCountByCategory[category.name] || 0;

          return (
            <Button
              key={category.name}
              variant="outline"
              size="sm"
              onClick={() => onCategoryToggle(category.name)}
              className={cn(
                "h-8 gap-1.5 transition-all",
                isSelected && "border-2",
                !isSelected && count === 0 && "opacity-50"
              )}
              style={{
                borderColor: isSelected ? category.color : undefined,
                backgroundColor: isSelected ? `${category.color}15` : undefined,
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: category.color }} />
              <span>{category.name}</span>
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                  style={{
                    backgroundColor: isSelected ? `${category.color}25` : undefined,
                    color: isSelected ? category.color : undefined,
                  }}
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export const CategoryBadge = ({ category }: { category: string }) => {
  const config = getCategoryConfig(category);
  const Icon = config.icon;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
      }}
    >
      <Icon className="w-3 h-3" />
      {category}
    </div>
  );
};

import {
  Utensils,
  Car,
  Home,
  PartyPopper,
  ShoppingBag,
  MoreHorizontal,
  Plane,
  Heart,
  Zap,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export interface CategoryConfig {
  name: string;
  icon: LucideIcon;
  color: string;
  bgClass: string;
}

export const categories: CategoryConfig[] = [
  { name: "Food", icon: Utensils, color: "#0d9488", bgClass: "bg-teal-500/10" },
  { name: "Transport", icon: Car, color: "#0891b2", bgClass: "bg-cyan-500/10" },
  { name: "Accommodation", icon: Home, color: "#6366f1", bgClass: "bg-indigo-500/10" },
  { name: "Entertainment", icon: PartyPopper, color: "#ec4899", bgClass: "bg-pink-500/10" },
  { name: "Shopping", icon: ShoppingBag, color: "#f59e0b", bgClass: "bg-amber-500/10" },
  { name: "Travel", icon: Plane, color: "#8b5cf6", bgClass: "bg-violet-500/10" },
  { name: "Health", icon: Heart, color: "#ef4444", bgClass: "bg-red-500/10" },
  { name: "Utilities", icon: Zap, color: "#eab308", bgClass: "bg-yellow-500/10" },
  { name: "Work", icon: Briefcase, color: "#3b82f6", bgClass: "bg-blue-500/10" },
  { name: "Other", icon: MoreHorizontal, color: "#6b7280", bgClass: "bg-gray-500/10" },
];

export const categoryNames = categories.map((c) => c.name);

export const getCategoryConfig = (name: string): CategoryConfig => {
  return categories.find((c) => c.name === name) || categories[categories.length - 1];
};

export const categoryColors: Record<string, string> = categories.reduce(
  (acc, cat) => ({ ...acc, [cat.name]: cat.color }),
  {}
);

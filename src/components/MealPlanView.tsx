"use client";

import { UtensilsCrossed, Flame, Target, ChevronDown } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface Meal {
  name: string;
  items: string[];
  calories: number;
  protein: number;
}

interface DayPlan {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal;
}

const mealPlanData: DayPlan[] = [
  {
    day: "Monday",
    breakfast: {
      name: "Oatmeal with Eggs",
      items: ["1 cup oats", "2 whole eggs (scrambled)", "1 banana", "1 tbsp honey"],
      calories: 520,
      protein: 28,
    },
    lunch: {
      name: "Grilled Chicken with Rice",
      items: ["150g chicken breast", "1 cup white rice", "1 cup mixed vegetables", "1 tbsp olive oil"],
      calories: 580,
      protein: 45,
    },
    dinner: {
      name: "Baked Fish with Sweet Potato",
      items: ["150g tilapia/catfish", "1 medium sweet potato", "1 cup spinach", "1 tbsp olive oil"],
      calories: 510,
      protein: 42,
    },
    snacks: {
      name: "Greek Yogurt + Nuts",
      items: ["1 cup Greek yogurt", "10 almonds", "1 apple"],
      calories: 380,
      protein: 22,
    },
  },
  {
    day: "Tuesday",
    breakfast: {
      name: "Egg Toast & Smoothie",
      items: ["2 whole eggs", "2 slices whole wheat bread", "1 banana", "1 cup milk"],
      calories: 540,
      protein: 30,
    },
    lunch: {
      name: "Beans & Chicken",
      items: ["1 cup cooked beans", "150g chicken breast", "1 plantain", "mixed salad"],
      calories: 620,
      protein: 48,
    },
    dinner: {
      name: "Grilled Fish with Rice",
      items: ["150g mackerel", "1 cup rice", "1 cup okra", "1 tbsp olive oil"],
      calories: 540,
      protein: 44,
    },
    snacks: {
      name: "Yogurt & Banana",
      items: ["1 cup Greek yogurt", "1 banana", "1 tbsp honey"],
      calories: 320,
      protein: 20,
    },
  },
  {
    day: "Wednesday",
    breakfast: {
      name: "Oatmeal Power Bowl",
      items: ["1 cup oats", "2 tbsp peanut butter", "1 banana", "1 cup milk"],
      calories: 580,
      protein: 24,
    },
    lunch: {
      name: "Chicken Stir-Fry",
      items: ["150g chicken breast", "1 cup rice", "1 cup mixed peppers", "1 tbsp soy sauce"],
      calories: 560,
      protein: 46,
    },
    dinner: {
      name: "Baked Fish & Vegetables",
      items: ["150g catfish", "1 sweet potato", "1 cup broccoli", "1 tbsp olive oil"],
      calories: 480,
      protein: 40,
    },
    snacks: {
      name: "Greek Yogurt + Honey",
      items: ["1 cup Greek yogurt", "2 tbsp honey", "10 cashews"],
      calories: 360,
      protein: 18,
    },
  },
  {
    day: "Thursday",
    breakfast: {
      name: "Eggs & Toast",
      items: ["3 egg whites + 1 whole egg", "2 slices whole wheat bread", "1 avocado half", "1 orange"],
      calories: 490,
      protein: 32,
    },
    lunch: {
      name: "Turkey Wrap",
      items: ["150g lean turkey/chicken", "2 whole wheat wraps", "lettuce", "tomato", "1 tbsp mayo"],
      calories: 520,
      protein: 44,
    },
    dinner: {
      name: "Grilled Chicken & Rice",
      items: ["150g chicken breast", "1 cup rice", "1 cup mixed vegetables", "1 tbsp olive oil"],
      calories: 550,
      protein: 45,
    },
    snacks: {
      name: "Protein Shake + Nuts",
      items: ["1 scoop protein powder", "1 banana", "15 almonds"],
      calories: 380,
      protein: 35,
    },
  },
  {
    day: "Friday",
    breakfast: {
      name: "Oatmeal with Eggs",
      items: ["1 cup oats", "2 whole eggs", "1 banana", "1 tbsp honey"],
      calories: 520,
      protein: 28,
    },
    lunch: {
      name: "Fish Peppersoup Style",
      items: ["150g catfish", "pepper soup mix", "1 cup rice", "mixed vegetables"],
      calories: 540,
      protein: 42,
    },
    dinner: {
      name: "Grilled Chicken & Sweet Potato",
      items: ["150g chicken breast", "1 large sweet potato", "1 cup spinach", "1 tbsp olive oil"],
      calories: 520,
      protein: 45,
    },
    snacks: {
      name: "Greek Yogurt + Fruit",
      items: ["1 cup Greek yogurt", "1 apple", "2 tbsp honey"],
      calories: 340,
      protein: 18,
    },
  },
  {
    day: "Saturday",
    breakfast: {
      name: "Protein Pancakes",
      items: ["3 egg whites", "1/2 cup oats", "1 banana", "1 tbsp honey", "1 tbsp peanut butter"],
      calories: 480,
      protein: 35,
    },
    lunch: {
      name: "Chicken & Beans",
      items: ["150g chicken breast", "1 cup beans", "1 plantain", "mixed salad"],
      calories: 640,
      protein: 52,
    },
    dinner: {
      name: "Grilled Fish with Rice",
      items: ["150g tilapia", "1 cup rice", "1 cup vegetables", "1 tbsp olive oil"],
      calories: 520,
      protein: 42,
    },
    snacks: {
      name: "Cottage Cheese + Nuts",
      items: ["1 cup cottage cheese", "15 almonds", "1 banana"],
      calories: 360,
      protein: 24,
    },
  },
  {
    day: "Sunday",
    breakfast: {
      name: "Egg & Avocado Toast",
      items: ["3 eggs (scrambled)", "2 slices whole wheat toast", "1/2 avocado", "1 orange"],
      calories: 560,
      protein: 30,
    },
    lunch: {
      name: "Grilled Chicken Meal",
      items: ["150g chicken breast", "1 cup rice", "1 cup mixed vegetables", "1 tbsp olive oil"],
      calories: 580,
      protein: 46,
    },
    dinner: {
      name: "Light Fish & Vegetables",
      items: ["150g fish", "1 cup sweet potato", "1 cup leafy greens", "1 tbsp olive oil"],
      calories: 480,
      protein: 40,
    },
    snacks: {
      name: "Yogurt Parfait",
      items: ["1 cup Greek yogurt", "1/2 cup granola", "1 banana", "1 tbsp honey"],
      calories: 400,
      protein: 20,
    },
  },
];

export function MealPlanView() {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const totalWeeklyCalories = mealPlanData.reduce((sum, day) => {
    return sum + day.breakfast.calories + day.lunch.calories + day.dinner.calories + day.snacks.calories;
  }, 0);

  const avgDailyCalories = Math.round(totalWeeklyCalories / 7);
  const avgDailyProtein = Math.round(
    mealPlanData.reduce((sum, day) => {
      return sum + day.breakfast.protein + day.lunch.protein + day.dinner.protein + day.snacks.protein;
    }, 0) / 7
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Meal Plan</h1>
        </div>
        <p className="text-gray-400">Weekly nutrition plan for fat loss & muscle gain (2000-2100 kcal)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-gray-400 text-sm">Daily Calories</span>
          </div>
          <div className="text-2xl font-bold">{avgDailyCalories} <span className="text-sm font-normal text-gray-400">kcal</span></div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <span className="text-gray-400 text-sm">Daily Protein</span>
          </div>
          <div className="text-2xl font-bold">{avgDailyProtein}g</div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
            <span className="text-gray-400 text-sm">Weekly Total</span>
          </div>
          <div className="text-2xl font-bold">{totalWeeklyCalories.toLocaleString()} <span className="text-sm font-normal text-gray-400">kcal</span></div>
        </div>
      </div>

      {/* Weekly Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-gray-400">Day</th>
                <th className="text-left p-4 font-medium text-gray-400">Breakfast</th>
                <th className="text-left p-4 font-medium text-gray-400">Lunch</th>
                <th className="text-left p-4 font-medium text-gray-400">Dinner</th>
                <th className="text-left p-4 font-medium text-gray-400">Snacks</th>
                <th className="text-center p-4 font-medium text-gray-400">Calories</th>
                <th className="text-center p-4 font-medium text-gray-400">Protein</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {mealPlanData.map((dayPlan) => {
                const dayCalories = dayPlan.breakfast.calories + dayPlan.lunch.calories + dayPlan.dinner.calories + dayPlan.snacks.calories;
                const dayProtein = dayPlan.breakfast.protein + dayPlan.lunch.protein + dayPlan.dinner.protein + dayPlan.snacks.protein;
                const isExpanded = expandedDay === dayPlan.day;

                return (
                  <>
                    <tr
                      key={dayPlan.day}
                      className="border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedDay(isExpanded ? null : dayPlan.day)}
                    >
                      <td className="p-4 font-medium">{dayPlan.day}</td>
                      <td className="p-4">
                        <div className="font-medium">{dayPlan.breakfast.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{dayPlan.lunch.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{dayPlan.dinner.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{dayPlan.snacks.name}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-sm font-medium",
                          dayCalories >= 1950 && dayCalories <= 2150 ? "bg-emerald-500/20 text-emerald-400" :
                          dayCalories > 2150 ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                        )}>
                          {dayCalories}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-sm font-medium",
                          dayProtein >= 130 ? "bg-cyan-500/20 text-cyan-400" : "bg-gray-500/20 text-gray-400"
                        )}>
                          {dayProtein}g
                        </span>
                      </td>
                      <td className="p-4">
                        <ChevronDown className={cn(
                          "w-5 h-5 text-gray-400 transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-black/20">
                        <td colSpan={8} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <h4 className="font-medium text-emerald-400 mb-2">Breakfast</h4>
                              <ul className="text-sm text-gray-300 space-y-1">
                                {dayPlan.breakfast.items.map((item, i) => (
                                  <li key={i}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-cyan-400 mb-2">Lunch</h4>
                              <ul className="text-sm text-gray-300 space-y-1">
                                {dayPlan.lunch.items.map((item, i) => (
                                  <li key={i}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-orange-400 mb-2">Dinner</h4>
                              <ul className="text-sm text-gray-300 space-y-1">
                                {dayPlan.dinner.items.map((item, i) => (
                                  <li key={i}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-purple-400 mb-2">Snacks</h4>
                              <ul className="text-sm text-gray-300 space-y-1">
                                {dayPlan.snacks.items.map((item, i) => (
                                  <li key={i}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-surface/50 border border-border rounded-xl">
        <h3 className="font-medium mb-2">Meal Plan Tips</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Click on any row to see detailed food items</li>
          <li>• Protein target: 130-150g daily for muscle preservation</li>
          <li>• Stay hydrated - drink 2-3L water daily</li>
          <li>• Meal prep on Sundays to save time during the week</li>
        </ul>
      </div>
    </div>
  );
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

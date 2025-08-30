import { DeepPartial } from "ai";
import { z } from "zod";

export const expenseSchema = z.object({
  expense: z.object({
    id: z.number().optional().describe("Unique identifier for the expense"),
    category: z
      .string()
      .describe(
        "Category of the expense. Allowed categories: TRAVEL, MEALS, ENTERTAINMENT, OFFICE SUPPLIES, OTHER."
      ),
    amount: z.number().describe("Amount of the expense in USD."),
    date: z.string().describe("Date of the expense, in dd-MMM format."),
    details: z.string().describe("Name of the product or service."),
    participants: z.string().describe("Participants in the expense, as comma-separated text"),
    user_id: z.string().uuid().optional().describe("User ID who owns this expense"),
    created_at: z.string().optional().describe("When the expense was created"),
  }),
});

// define a type for the partial notifications during generation
export type PartialExpense = DeepPartial<typeof expenseSchema>["expense"];

export type Expense = z.infer<typeof expenseSchema>["expense"];

// Add a type for database operations with proper types
export type ExpenseWithId = {
  id: number;
  category: string;
  amount: number;
  date: string;
  details: string;
  participants: string;
  user_id: string;
  created_at: string;
};
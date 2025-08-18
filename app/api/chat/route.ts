import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { expenseSchema } from "./schema";
import { createClient } from "@supabase/supabase-js";

// Make sure to replace these with your actual env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { expense }: { expense: string } = await req.json();

  const result = streamObject({
    model: openai("gpt-4-turbo"),
    system:
      "You categorize expenses into one of the following categories: " +
      "TRAVEL, MEALS, ENTERTAINMENT, OFFICE SUPPLIES, OTHER." +
      // provide date (including day of week) for reference:
      "The current date is: " +
      new Date()
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          weekday: "short",
        })
        .replace(/(\w+), (\w+) (\d+), (\d+)/, "$4-$2-$3 ($1)") +
      ". When no date is supplied, use the current date.",
    prompt: `Please categorize the following expense: "${expense}"`,
    schema: expenseSchema,
    onFinish: async ({ object }) => {
      if (object?.expense) {
        try {
          const { data, error } = await supabase
            .from('Expenses')
            .insert([object.expense])
            .select()
            .single();

          if (error) {
            console.error('Error saving expense to Supabase:', error);
          } else {
            console.log('Expense saved successfully:', data);
          }
        } catch (err) {
          console.error('Unexpected error saving expense:', err);
        }
      }
    },
  });

  return result.toTextStreamResponse();
}

import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { expenseSchema } from "./schema";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

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
      console.log('🔍 Server onFinish called with:', object);
      console.log('🔍 Server object type:', typeof object);
      console.log('🔍 Server object keys:', object ? Object.keys(object) : 'null');
      
      if (object?.expense) {
        console.log('🔍 Server object.expense:', object.expense);
        try {
          // Convert participants array to comma-separated string for database
          const expenseData = {
            ...object.expense,
            participants: Array.isArray(object.expense.participants) 
              ? object.expense.participants.join(', ') 
              : object.expense.participants || '',
            user_id: user.id
          };

          console.log('expenseData:', expenseData);

          const { data, error } = await supabase
            .from('Expenses')
            .insert([expenseData])
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
      } else {
        console.log('🔍 Server: Object is null or missing expense property');
        console.log('🔍 Server object structure:', JSON.stringify(object, null, 2));
      }
    },
  });

  return result.toTextStreamResponse();
}
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
  });

  return result.toTextStreamResponse();
}
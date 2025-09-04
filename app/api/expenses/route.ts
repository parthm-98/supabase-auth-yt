import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expenseData = await req.json();
    
    // Add user_id to the expense data
    const expenseWithUser = {
      ...expenseData,
      user_id: user.id
    };

    console.log('Saving expense to Supabase:', expenseWithUser);

    const { data, error } = await supabase
      .from('Expenses')
      .insert([expenseWithUser])
      .select()
      .single();

    if (error) {
      console.error('Error saving expense to Supabase:', error);
      return NextResponse.json({ error: 'Failed to save expense' }, { status: 500 });
    }

    console.log('Expense saved successfully:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error saving expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

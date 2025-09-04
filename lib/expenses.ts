import { createBrowserClient } from '@supabase/ssr';
import { ExpenseWithId } from '@/app/api/chat/schema';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function loadUserExpenses(): Promise<ExpenseWithId[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('Expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading expenses:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in loadUserExpenses:', error);
    return [];
  }
}

export async function deleteUserExpense(expenseId: number): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('Expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUserExpense:', error);
    return false;
  }
}
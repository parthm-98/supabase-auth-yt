/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/jsx-key */

"use client";

import { experimental_useObject } from "ai/react";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { CornerDownLeft, LogOut } from "lucide-react";
import { expenseSchema, ExpenseWithId } from "@/app/api/chat/schema";
import ExpenseView from "@/components/ExpenseView";
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { loadUserExpenses, deleteUserExpense } from '@/lib/expenses';

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [expenses, setExpenses] = useState<ExpenseWithId[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Check authentication status
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  // Load user expenses when authenticated
  useEffect(() => {
    if (user) {
      loadUserExpenses().then(setExpenses);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully!");
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Error signing out");
    }
  };

  const { submit, isLoading, object } = experimental_useObject({
    api: "/api/chat",
    schema: expenseSchema,
    onError: (error) => {
      console.error('🔍 AI SDK error:', error);
      toast.error("You've been rate limited, please try again later!");
    },
  });

  // Debug: Log expenses state changes
  useEffect(() => {
    console.log('🔍 Expenses state changed:', expenses);
    console.log('🔍 Expenses length:', expenses.length);
    console.log('🔍 Is loading:', isLoading);
    console.log('🔍 Object:', object);
  }, [expenses, isLoading, object]);

  // Add expense when AI completes
  useEffect(() => {
    if (!isLoading && object && user) {
      const expenseData = object.expense || object;
      
      if (expenseData?.category && expenseData?.amount && expenseData?.details && expenseData?.date) {
        // Check if this expense already exists
        const exists = expenses.some(exp => 
          exp.details === expenseData.details && 
          exp.amount === expenseData.amount &&
          exp.date === expenseData.date
        );
        
        if (!exists) {
          const newExpense: ExpenseWithId = {
            id: Date.now(),
            category: expenseData.category,
            amount: expenseData.amount,
            date: expenseData.date,
            details: expenseData.details,
            participants: expenseData.participants || '',
            user_id: user.id,
            created_at: new Date().toISOString(),
          };
          
          setExpenses(prev => [newExpense, ...prev]);
          setInput("");
          inputRef.current?.focus();
        }
      }
    }
  }, [isLoading, object, user, expenses]);

  const handleDeleteExpense = async (expenseToDelete: ExpenseWithId) => {
    try {
      // First remove from local state for immediate UI feedback
      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseToDelete.id));
      
      // Then delete from database
      const success = await deleteUserExpense(expenseToDelete.id);
      
      if (success) {
        toast.success("Expense deleted successfully!");
      } else {
        // If deletion failed, restore the expense in UI
        setExpenses((prev) => [...prev, expenseToDelete]);
        toast.error("Failed to delete expense. Please try again.");
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error("Error deleting expense");
    }
  };

  const handleEditExpense = (expenseToEdit: ExpenseWithId) => {
    // TODO: Implement edit functionality
    toast.info("Edit functionality coming soon!");
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex flex-col pt-4 h-dvh bg-white dark:bg-zinc-900">
      {/* Header with logout button */}
      <div className="flex justify-between items-center px-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Expense Tracker
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user.user_metadata?.full_name || user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content - keeping existing layout */}
      <div className="flex flex-row justify-center">
        <div className="flex flex-col justify-between gap-4">
          <form
            className="flex flex-col gap-2 relative items-center"
            onSubmit={(event) => {
              event.preventDefault();

              const form = event.target as HTMLFormElement;

              const input = form.elements.namedItem(
                "expense"
              ) as HTMLInputElement;

              if (input.value.trim()) {
                submit({ expense: input.value });
              }
            }}
          >
            <div className="relative w-full md:max-w-[500px] max-w-[calc(100dvw-32px)]">
              <input
                name="expense"
                className="bg-zinc-100 rounded-md px-2 py-1.5 w-full outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300 disabled:text-zinc-400 disabled:cursor-not-allowed placeholder:text-zinc-400 pr-10"
                placeholder="Add an expense"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                }}
                disabled={isLoading}
                ref={inputRef}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 dark:text-zinc-500 flex flex-row gap-2 items-center">
                <p className="text-sm">Press</p>
                <CornerDownLeft className="w-4 h-4" />
              </div>
            </div>
          </form>

          {expenses.length > 0 || isLoading ? (
            <div className="flex flex-col gap-4 h-full w-dvw items-center">
              {isLoading && object?.expense && (
                <div className="opacity-50">
                  <ExpenseView 
                    expense={object.expense as any} 
                    onDelete={() => {}} 
                    onEdit={() => {}} 
                  />
                </div>
              )}

              {expenses.map((expense, index) => (
                <ExpenseView 
                  key={`${expense.id}-${expense.details}-${index}`} 
                  expense={expense}
                  onDelete={() => handleDeleteExpense(expense)}
                  onEdit={() => handleEditExpense(expense)}
                />
                ))}
            </div>
          ) : (
            <motion.div className="h-[350px] px-4 w-full md:w-[500px] md:px-0">
              <div className="border rounded-lg p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:border-zinc-700">
                <p className="text-base text-zinc-800 dark:text-zinc-300">
                Hate clicking through cells to add expenses? Just type it.
                </p>
                <p>
                  {" "}
                  I am{" "}
                  <Link
                    className="text-blue-500 dark:text-blue-400"
                    href="https://www.linkedin.com/in/parthmehta98/"
                    target="_blank"
                  >
                    Parth Mehta{" "}
                  </Link>
                  — built this so one line like Uber $32 last night is enough.
                  
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
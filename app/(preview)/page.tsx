/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/jsx-key */

"use client";

import { VercelIcon } from "@/components/icons";
import { ObjectIcon } from "@/components/icons";
import { experimental_useObject } from "ai/react";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { Expense, expenseSchema, PartialExpense } from "@/app/api/chat/schema";
import ExpenseView from "@/components/ExpenseView";

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const { submit, isLoading, object } = experimental_useObject({
    api: "/api/chat",
    schema: expenseSchema,
    onFinish({ object }) {
      if (object != null) {
        setExpenses((prev) => [object.expense, ...prev]);
        setInput("");
        inputRef.current?.focus();
      }
    },
    onError: () => {
      toast.error("You've been rate limited, please try again later!");
    },
  });

  const handleDeleteExpense = (expenseToDelete: Expense) => {
    setExpenses((prev) => prev.filter((expense) => expense !== expenseToDelete));
    toast.success("Expense deleted successfully!");
  };

  const handleEditExpense = (expenseToEdit: Expense) => {
    // TODO: Implement edit functionality
    toast.info("Edit functionality coming soon!");
  };

  return (
    <div className="flex flex-row justify-center pt-20 h-dvh bg-white dark:bg-zinc-900">
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
          <input
            name="expense"
            className="bg-zinc-100 rounded-md px-2 py-1.5 w-full outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300 md:max-w-[500px] max-w-[calc(100dvw-32px)] disabled:text-zinc-400 disabled:cursor-not-allowed placeholder:text-zinc-400"
            placeholder="Expense a transaction..."
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
            disabled={isLoading}
            ref={inputRef}
          />
        </form>

        {expenses.length > 0 || isLoading ? (
          <div className="flex flex-col gap-4 h-full w-dvw items-center">
            {isLoading && object?.expense && (
              <div className="opacity-50">
                <ExpenseView 
                  expense={object.expense} 
                  onDelete={() => {}} 
                  onEdit={() => {}} 
                />
              </div>
            )}

            {expenses.map((expense, index) => (
              <ExpenseView 
                key={`${expense.details}-${expense.date}-${index}`} 
                expense={expense}
                onDelete={() => handleDeleteExpense(expense)}
                onEdit={() => handleEditExpense(expense)}
              />
            ))}
          </div>
        ) : (
          <motion.div className="h-[350px] px-4 w-full md:w-[500px] md:px-0 pt-20">
            <div className="border rounded-lg p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:border-zinc-700">
              <p>
                I was frustrated to always click around different table cells to add my expenses. So I built this product.
              </p>
              <p>
                {" "}
                My name is{" "}
                <Link
                  className="text-blue-500 dark:text-blue-400"
                  href="https://sdk.vercel.ai/docs/ai-sdk-ui/object-generation"
                  target="_blank"
                >
                  Parth Mehta.{" "}
                </Link>
                Currently a {" "}
                <Link
                  className="text-decoration: underline"
                  href="https://sdk.vercel.ai/docs/ai-sdk-ui/object-generation"
                  target="_blank"
                >
                  builder
                </Link>{" "} at LinkedIn.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { useState } from "react";
import { Expense, ExpenseWithId } from "@/app/api/chat/schema";
import ContextMenu from "./ContextMenu";

interface ExpenseViewProps {
  expense: Expense | ExpenseWithId;
  onDelete?: () => void;
  onEdit?: () => void;
}

const ExpenseView = ({ expense, onDelete, onEdit }: ExpenseViewProps) => {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handleEdit = () => {
    handleCloseContextMenu();
    onEdit?.();
  };

  const handleDelete = () => {
    handleCloseContextMenu();
    onDelete?.();
  };

  return (
    <>
      <motion.div
        className={`relative flex flex-row gap-2 w-full md:w-[500px] md:px-0`}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        onContextMenu={handleContextMenu}
      >
        <div className="flex flex-row gap-4 w-full hover:bg-slate-100 -my-2 py-2 rounded-md">
          <div className="text-zinc-400 dark:text-zinc-400 w-16">
            {expense?.date}
          </div>
          <div className="text-zinc-800 dark:text-zinc-300 flex-1 capitalize flex flex-row gap-2 items-center">
            <div>{expense?.details}</div>
          </div>
          <div className="text-zinc-600 dark:text-zinc-300 text-xs bg-zinc-200 rounded-md flex flex-row items-center p-1 font-medium capitalize h-fit dark:bg-zinc-700 dark:text-zinc-300">
            {expense?.category?.toLowerCase()}
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 w-8 text-right">
            ${expense?.amount}
          </div>
        </div>
      </motion.div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={handleCloseContextMenu}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
};

export default ExpenseView;

import { createFileRoute } from '@tanstack/react-router'
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from './../components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./../components/ui/sheet";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";

import { useUIStore } from "@repo/store";
import { todoFormSchema, type TodoForm } from "@repo/schemas";


type Todo = {
  id: number;
  text: string;
  done: boolean;
  date: string;
  endDate: string;
};





const api = {
  getTodos: async (): Promise<Todo[]> => {
    const res = await fetch(`https://last-my-2fw9hls9p-gokul-webzeniths-projects.vercel.app/`);
    if (!res.ok) throw new Error("Failed to fetch todos");
    return res.json();
  },

  addTodo: async (data: TodoForm) => {
    const res = await fetch(`https://last-my-2fw9hls9p-gokul-webzeniths-projects.vercel.app/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add todo");
    return res.json();
  },

  updateTodo: async (id: number, data: Todo) => {
    const res = await fetch(`https://last-my-2fw9hls9p-gokul-webzeniths-projects.vercel.app/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update todo");
    return res.json();
  },

  patchTodo: async (id: number, data: Partial<Todo>) => {
    const res = await fetch(`https://last-my-2fw9hls9p-gokul-webzeniths-projects.vercel.app/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to patch todo");
    return res.json();
  },

  deleteTodo: async (id: number) => {
    const res = await fetch(`https://last-my-2fw9hls9p-gokul-webzeniths-projects.vercel.app/todos/${id}`,
    { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete todo");
    return res.json();
  },
};

export const Route = createFileRoute('/_Dashboard/work')({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient();


  const {
    sheetOpen,
    editTodo,
    openSheet,
    closeSheet,
    setEditTodo,
    clearEditTodo,
  } = useUIStore();

  const today = new Date().toISOString().split("T")[0];

  const { data: items = [], isLoading, isError, error } = useQuery({
    queryKey: ["todos"],
    queryFn: api.getTodos,
  });

 
  const addMutation = useMutation({
    mutationFn: api.addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Todo }) => api.updateTodo(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Todo> }) => api.patchTodo(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TodoForm>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      text: "",
      date: "",
      endDate: "",
      done: false,
    },
  });

  const onSubmit = (data: TodoForm) => {
    if (!editTodo) {
      
      addMutation.mutate({
        text: data.text,
        date: data.date,
        endDate: data.endDate,
        done: data.done,
      });
    } else {
      
      const updates: Partial<Todo> = {};

      if (data.text !== editTodo.text) updates.text = data.text;
      if (data.date !== editTodo.date) updates.date = data.date;
      if (data.endDate !== editTodo.endDate) updates.endDate = data.endDate;
      if (data.done !== editTodo.done) updates.done = data.done;

      const changedFieldsCount = Object.keys(updates).length;

      if (changedFieldsCount === 1) {
       
        patchMutation.mutate({
          id: editTodo.id,
          data: updates,
        });
      } 
      else if (changedFieldsCount > 1) {
      
        updateMutation.mutate({
          id: editTodo.id,
          data: {
            ...editTodo,
            ...updates,
          },
        });
      }

      clearEditTodo();
    }

    reset();
    closeSheet();
  };

  
  const onDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("taskId", String(id));
  };

  const onDrop = (e: React.DragEvent, done: boolean) => {
    const id = Number(e.dataTransfer.getData("taskId"));
    patchMutation.mutate({ id, data: { done } });
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  if (isLoading) return <div className="p-6">Loading todos...</div>;
  if (isError) return <div className="p-6 text-red-600">{(error as Error).message}</div>;

  const progressItems = items.filter(i => !i.done);
  const doneItems = items.filter(i => i.done);

  return (
    <>
    
      <div className='flex justify-end'>
        <Sheet open={sheetOpen} >
          <SheetTrigger asChild>
            <Button onClick={() => {
              reset();
              clearEditTodo();
              openSheet();
            }}>Add Todo</Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[420px]">
            <SheetHeader>
              <SheetTitle>{editTodo ? "Edit Todo" : "Add Todo"}</SheetTitle>
            </SheetHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">

              <div className="space-y-1">
                <label className="text-sm font-medium">Text</label>
                <input {...register("text")} className="w-full border rounded-md px-3 py-2 text-sm" />
                {errors.text && <p className="text-red-500 text-xs">{errors.text.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={watch("done") ? "done" : "progress"}
                  onChange={(e) => setValue("done", e.target.value === "done")}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="progress">Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label>Start Date</label>
                <input type="date" min={today} {...register("date")} className="input" />
                {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
              </div>

              <div>
                <label>End Date</label>
                <input type="date" min={today} {...register("endDate") } className="input" />
                {errors.endDate && <p className="text-red-500 text-xs">{errors.endDate.message}</p>}
              </div>

              <Button type="submit" className="w-full">
                {editTodo ? "Update" : "Add"}
              </Button>

            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">

       
        <div onDragOver={allowDrop} onDrop={(e) => onDrop(e, false)} className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">In Progress</h3>
          {progressItems.map(item => (
            <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id)} className="border rounded-md p-3 mb-2 flex justify-between items-center w-full">
              <div>
                <div className="font-medium">{item.text}</div>
                <div className="text-xs text-gray-600">{item.date} → {item.endDate}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => {
                  setEditTodo(item);
                  setValue("text", item.text);
                  setValue("date", item.date);
                  setValue("endDate", item.endDate);
                  setValue("done", item.done);
                }}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>

       
        <div onDragOver={allowDrop} onDrop={(e) => onDrop(e, true)} className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Done</h3>
          {doneItems.map(item => (
            <div key={item.id} draggable onDragStart={(e) => onDragStart(e, item.id)} className="border rounded-md p-3 mb-2 flex justify-between items-center w-full">
              <div>
                <div className="font-medium">{item.text}</div>
                <div className="text-xs text-gray-600">{item.date} → {item.endDate}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => {
                  setEditTodo(item);
                  setValue("text", item.text);
                  setValue("date", item.date);
                  setValue("endDate", item.endDate);
                  setValue("done", item.done);
                }}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>

      </div>
      </>
  );
}
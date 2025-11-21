
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Trash2, PlusCircle } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Trigger, HttpMethod, Schedule, Folder as FolderType } from "@/lib/types";
import { Switch } from "../ui/switch";

const payloadItemSchema = z.object({
  key: z.string().min(1, "Key cannot be empty."),
  value: z.string(),
});

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50),
  url: z.string().url("Please enter a valid URL."),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  folderId: z.string().optional(),
  scheduledAt: z.date({
    required_error: "A date for the trigger is required.",
  }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  isRecurring: z.boolean().default(false),
  intervalAmount: z.coerce.number().optional(),
  intervalUnit: z.enum(["seconds", "minutes", "hours", "days", "weeks", "months", "years"]).optional(),
  limit: z.coerce.number().int().positive().optional(),
  timeout: z.coerce.number().int().positive().optional(),
  payload: z.array(payloadItemSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.isRecurring) {
    if (data.intervalAmount === undefined || data.intervalAmount <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A positive number is required.", path: ["intervalAmount"] });
    }
    if (!data.intervalUnit) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Unit is required.", path: ["intervalUnit"] });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

type CreateTriggerSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (trigger: Omit<Trigger, 'id' | 'status' | 'runCount' | 'executionHistory'>, folderId: string | null, id?: string) => void;
  trigger: Trigger | null;
  folders: FolderType[];
  currentFolderId: string | null;
};

export function CreateTriggerSheet({
  isOpen,
  onOpenChange,
  onSave,
  trigger,
  folders,
  currentFolderId,
}: CreateTriggerSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      method: "GET",
      time: "09:00",
      isRecurring: false,
      payload: [],
      folderId: currentFolderId || "null",
      timeout: 5000,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payload",
  });

  useEffect(() => {
    if (isOpen) {
      if (trigger) {
        const nextRunDate = parseISO(trigger.nextRun);
        const schedule = trigger.schedule;
        form.reset({
          name: trigger.name,
          url: trigger.url,
          method: trigger.method,
          folderId: currentFolderId || "null",
          scheduledAt: nextRunDate,
          time: format(nextRunDate, "HH:mm"),
          isRecurring: schedule.type === 'interval',
          intervalAmount: schedule.type === 'interval' ? schedule.amount : undefined,
          intervalUnit: schedule.type === 'interval' ? schedule.unit : undefined,
          limit: trigger.limit,
          timeout: trigger.timeout || 5000,
          payload: trigger.payload ? Object.entries(trigger.payload).map(([key, value]) => ({ key, value: String(value) })) : [],
        });
      } else {
        form.reset({
          name: "",
          url: "",
          method: "GET",
          scheduledAt: new Date(),
          time: format(new Date(), "HH:mm"),
          isRecurring: false,
          limit: undefined,
          timeout: 5000,
          payload: [],
          folderId: currentFolderId || "null",
        });
      }
    }
  }, [isOpen, trigger, form, currentFolderId]);

  function onSubmit(values: FormValues) {
    const [hours, minutes] = values.time.split(":").map(Number);
    const combinedDateTime = new Date(values.scheduledAt);
    combinedDateTime.setHours(hours, minutes, 0, 0);

    let schedule: Schedule;
    if (values.isRecurring && values.intervalAmount && values.intervalUnit) {
      schedule = { type: "interval", amount: values.intervalAmount, unit: values.intervalUnit };
    } else {
      schedule = { type: "one-time" };
    }

    const payload = values.payload?.reduce((acc, { key, value }) => {
      if (key) {
        try {
          acc[key] = JSON.parse(value);
        } catch (e) {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    const triggerData = {
      name: values.name,
      url: values.url,
      method: values.method as HttpMethod,
      nextRun: combinedDateTime.toISOString(),
      schedule: schedule,
      limit: values.limit,
      timeout: values.timeout,
      payload: (payload && Object.keys(payload).length > 0) ? payload : undefined,
    };

    const targetFolderId = values.folderId === "null" ? null : values.folderId;
    onSave(triggerData, targetFolderId, trigger?.id);
  }

  const watchedIsRecurring = form.watch("isRecurring");
  const watchedMethod = form.watch("method");
  const canHavePayload = watchedMethod === 'POST' || watchedMethod === 'PUT';
  const isEditing = !!trigger;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-lg w-full flex flex-col bg-black/80 backdrop-blur-xl border-white/10 text-white shadow-[0_0_50px_rgba(255,95,31,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <SheetHeader>
          <SheetTitle className="text-white bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold text-2xl">
            {isEditing ? "Edit Trigger" : "Create New Trigger"}
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            {isEditing ? "Update the details of your webhook trigger." : "Configure a new webhook to be triggered at a specific time."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
            <ScrollArea className="flex-1 pr-4 -mr-6">
              <div className="space-y-6 py-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Trigger Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Daily Sales Report" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/50 transition-all duration-300" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="folderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Folder</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/50">
                            <SelectValue placeholder="Select a folder" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                          <SelectItem value="null" className="focus:bg-white/10 focus:text-white">None (Top-Level)</SelectItem>
                          {folders.map(folder => (
                            <SelectItem key={folder.id} value={folder.id} className="focus:bg-white/10 focus:text-white">{folder.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Webhook URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://api.example.com/webhook" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/50 transition-all duration-300" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">HTTP Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/50">
                            <SelectValue placeholder="Select an HTTP method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                          <SelectItem value="GET" className="focus:bg-white/10 focus:text-white">GET</SelectItem>
                          <SelectItem value="POST" className="focus:bg-white/10 focus:text-white">POST</SelectItem>
                          <SelectItem value="PUT" className="focus:bg-white/10 focus:text-white">PUT</SelectItem>
                          <SelectItem value="DELETE" className="focus:bg-white/10 focus:text-white">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {canHavePayload && (
                  <div className="space-y-4 rounded-md border border-white/10 bg-white/5 p-4">
                    <FormLabel className="text-gray-300">JSON Payload</FormLabel>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`payload.${index}.key`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs text-gray-400">Key</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. userId" {...field} className="bg-black/50 border-white/10 text-white placeholder:text-gray-600" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`payload.${index}.value`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs text-gray-400">Value</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 123" {...field} className="bg-black/50 border-white/10 text-white placeholder:text-gray-600" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button variant="ghost" size="icon" onClick={() => remove(index)} className="hover:bg-white/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ key: "", value: "" })} className="border-white/10 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Variable
                    </Button>
                  </div>
                )}

                <Separator className="bg-white/10" />

                <h3 className="text-lg font-medium text-white">Schedule & Limits</h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-gray-300">Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-black/90 border-white/10 text-white backdrop-blur-xl" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                              className="bg-transparent text-white"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Time (24h)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Recurring Trigger
                        </FormLabel>
                        <FormMessage />
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchedIsRecurring && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="intervalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Every</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g. 5"
                              {...field}
                              onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                              value={field.value ?? ''}
                              className="bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="intervalUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>&nbsp;</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/50">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                              <SelectItem value="seconds" className="focus:bg-white/10 focus:text-white">Seconds</SelectItem>
                              <SelectItem value="minutes" className="focus:bg-white/10 focus:text-white">Minutes</SelectItem>
                              <SelectItem value="hours" className="focus:bg-white/10 focus:text-white">Hours</SelectItem>
                              <SelectItem value="days" className="focus:bg-white/10 focus:text-white">Days</SelectItem>
                              <SelectItem value="weeks" className="focus:bg-white/10 focus:text-white">Weeks</SelectItem>
                              <SelectItem value="months" className="focus:bg-white/10 focus:text-white">Months</SelectItem>
                              <SelectItem value="years" className="focus:bg-white/10 focus:text-white">Years</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Usage Limit (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g. 10"
                          {...field}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                          value={field.value ?? ''}
                          className="bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Timeout (ms)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g. 5000"
                          {...field}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                          value={field.value ?? ''}
                          className="bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>

            <SheetFooter className="pt-6 border-t border-white/10">
              <SheetClose asChild>
                <Button type="button" variant="outline" className="bg-transparent border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(255,95,31,0.5)] hover:shadow-[0_0_25px_rgba(255,95,31,0.8)] transition-all duration-300">
                Save Trigger
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
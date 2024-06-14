"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DarkModeToggle } from "@/components/dark-mode-toggle";

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme.",
  }),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

const defaultValues: Partial<AppearanceFormValues> = {
  theme: "system",
};

export function AppearanceForm() {
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form className="space-y-8">
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Theme</FormLabel>
              <FormDescription>Select the theme for the app.</FormDescription>
              <FormMessage />
              <FormItem>
                <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                  <FormControl>
                    <DarkModeToggle />
                  </FormControl>
                </FormLabel>
              </FormItem>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Em, Flex, Strong, Text } from "@radix-ui/themes";
import { useCreatePoll } from "@/hooks/mutations/useCreatePoll";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import useAnchorProgram from "@/hooks/useAnchorProgram";
import { TbLoader2 } from "react-icons/tb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryOptions, decayOptions } from "@/types/options";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IoIosInformationCircleOutline } from "react-icons/io";

const formSchema = z.object({
  question: z
    .string()
    .min(2, {
      message: "Question must be at least 2 characters.",
    })
    .max(100, {
      message: "Question must not be more than 100 characters.",
    }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  category: z.number().min(0).max(10),
  decay: z.number(),
});

export function CreationForm() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const program = useAnchorProgram();
  const {
    mutate: createPoll,
    isPending: isCreatingPoll,
    isSuccess,
    isError,
    isIdle,
    error,
  } = useCreatePoll(program, connection, wallet);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      description: "",
      category: 0,
      decay: Number.parseFloat(decayOptions[0].value),
    },
  });

  function onSubmit() {
    createPoll({
      form,
    });
  }

  return (
    <div className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
      <Text size={"2"} className="text-muted-foreground">
        Create your own poll here.
      </Text>
      <Separator className="my-4" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question</FormLabel>
                <FormControl>
                  <Input
                    maxLength={100}
                    placeholder="Will SOL hit $1000 by end of 2025?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Explain exactly under which conditions this question will resolve to Yes or No!"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={(newValue) =>
                    field.onChange(Number.parseInt(newValue))
                  }
                  defaultValue={form.getValues().category.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a suitable category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryOptions.map((category) => {
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />{" "}
          <FormField
            control={form.control}
            name="decay"
            render={({ field }) => (
              <FormItem>
                <Flex gap={"2"}>
                  <FormLabel>Duration</FormLabel>
                  <Popover>
                    <PopoverTrigger>
                      <IoIosInformationCircleOutline />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="text-sm">
                      Please specify roughly how long it will take until the
                      poll can be resolved. E.g. the poll is about an election
                      that will happen in{" "}
                      <span className="font-bold text-primary">14 month</span>.
                      Select either{" "}
                      <span className="font-bold text-primary">
                        &apos;Months&apos;
                      </span>{" "}
                      or{" "}
                      <span className="font-bold text-primary">
                        &apos;Years&apos;
                      </span>{" "}
                      then.
                    </PopoverContent>
                  </Popover>
                </Flex>
                <Select
                  onValueChange={(newValue) =>
                    field.onChange(Number.parseFloat(newValue))
                  }
                  defaultValue={form.getValues().decay.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an approximate duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {decayOptions.map((decay) => {
                      return (
                        <SelectItem key={decay.value} value={decay.value}>
                          {decay.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={isCreatingPoll} type="submit">
            {isCreatingPoll && (
              <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Text>Submit</Text>
          </Button>
        </form>
      </Form>
    </div>
  );
}

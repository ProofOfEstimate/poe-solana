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
import { Flex, Text } from "@radix-ui/themes";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreatePoll } from "@/hooks/mutations/useCreatePoll";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import useAnchorProgram from "@/hooks/useAnchorProgram";
import { Poll } from "@/types/poe_types";
import { useResolvePoll } from "@/hooks/mutations/useResolvePoll";
import { useState } from "react";
import { TbLoader2 } from "react-icons/tb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryOptions, decayOptions } from "@/types/options";

const formSchema = z.object({
  question: z
    .string()
    .min(2, {
      message: "Question must be at least 2 characters.",
    })
    .max(120, {
      message: "Question must not be more than 120 characters.",
    }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  category: z.number().min(0).max(10),
  decay: z.number(),
});

type CreationFormProps = {
  createdPolls: Poll[];
};

export function CreationForm({ createdPolls }: CreationFormProps) {
  const [pollIndex, setPollIndex] = useState(-1);
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

  const { mutate: resolvePoll, isPending: isResolving } = useResolvePoll(
    program,
    connection,
    wallet
  );

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
    <>
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
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
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
                  <FormLabel>Duration</FormLabel>
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
      <Text as="p" mt={"9"} size={"2"} className="text-muted-foreground">
        Manage your created polls.
      </Text>
      <Separator className="my-4" />
      <Table>
        <TableCaption>A list of your created polls.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-auto">Answer</TableHead>
            <TableHead className="w-full">Question</TableHead>
            <TableHead className="w-1/5">Estimate</TableHead>
          </TableRow>
        </TableHeader>
        {createdPolls.map((poll, index) => {
          return (
            <TableBody key={poll.id}>
              <TableRow>
                <TableCell className="text-center">
                  {poll.result === null ? (
                    isResolving && index === pollIndex ? (
                      <Button disabled variant={"outline"}>
                        <TbLoader2 className="h-4 w-4 animate-spin" />
                      </Button>
                    ) : (
                      <Flex gap={"2"}>
                        <Button
                          onClick={() => {
                            setPollIndex(index);
                            resolvePoll({
                              pollId: poll.id,
                              result: true,
                            });
                          }}
                          disabled={isResolving}
                          variant={"outline"}
                        >
                          Yes
                        </Button>
                        <Button
                          onClick={() => {
                            setPollIndex(index);
                            resolvePoll({
                              pollId: poll.id,
                              result: false,
                            });
                          }}
                          disabled={isResolving}
                          variant={"outline"}
                        >
                          No
                        </Button>
                      </Flex>
                    )
                  ) : poll.result ? (
                    "Yes"
                  ) : (
                    "No"
                  )}
                </TableCell>
                <TableCell>{poll.question}</TableCell>
                <TableCell>
                  {poll.collectiveEstimate !== null
                    ? (poll.collectiveEstimate / 10000).toFixed(2) + " %"
                    : "-"}
                </TableCell>
              </TableRow>
            </TableBody>
          );
        })}
      </Table>
    </>
  );
}

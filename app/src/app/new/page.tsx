"use client";

import { PollCard } from "@/components/poll-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllPolls } from "@/hooks/queries/useAllPolls";
import useAnchorProgram from "@/hooks/useAnchorProgram";
import { Grid, Heading } from "@radix-ui/themes";

export default function New() {
  const program = useAnchorProgram();
  const { data: polls, isLoading } = useAllPolls(program);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col justify-start items-start px-4 sm:px-12 lg:px-24 py-4 sm:py-8">
        <Heading
          className="py-4"
          as="h1"
          size={{
            initial: "5",
            xs: "7",
            xl: "8",
          }}
        >
          New Polls
        </Heading>
        <Grid
          columns={{
            initial: "1",
            md: "2",
            lg: "3",
          }}
          gapX={{
            md: "5",
            lg: "9",
          }}
          gapY={"5"}
          m={"auto"}
        >
          <Skeleton className="w-[380px] h-72 rounded-lg" />
          <Skeleton className="w-[380px] h-72 rounded-lg" />
          <Skeleton className="w-[380px] h-72 rounded-lg" />
          <Skeleton className="w-[380px] h-72 rounded-lg" />
          <Skeleton className="w-[380px] h-72 rounded-lg" />
        </Grid>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col justify-start items-start px-4 sm:px-12 lg:px-24 py-4 sm:py-8">
      <Heading
        className="py-4"
        as="h1"
        size={{
          initial: "5",
          xs: "7",
          xl: "8",
        }}
      >
        New Polls
      </Heading>
      <Grid
        columns={{
          initial: "1",
          md: "2",
          lg: "3",
        }}
        gapX={{
          md: "5",
          lg: "9",
        }}
        gapY={"5"}
        m={"auto"}
      >
        {polls !== undefined &&
          polls
            .filter((poll) => poll.result === null)
            .map((poll) => (
              <PollCard
                key={poll.id}
                pollId={poll.id}
                question={poll.question}
              />
            ))}
      </Grid>
    </main>
  );
}

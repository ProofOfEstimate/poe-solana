"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Flex, Grid, Text } from "@radix-ui/themes";
import { PollCard } from "./poll-card";
import useAnchorProgram from "@/hooks/useAnchorProgram";

import { useMyPollsTabsStore } from "@/hooks/states/useMyPollsTabsStore";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  FilterState,
  usePollFilterStore,
} from "@/hooks/states/usePollFilterStore";
import { useAllPollsByUser } from "@/hooks/queries/useAllPollsByUser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useState } from "react";
import { useResolvePoll } from "@/hooks/mutations/useResolvePoll";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { TbLoader2 } from "react-icons/tb";
import { useAllPolls } from "@/hooks/queries/useAllPolls";
import { useRouter } from "next/navigation";

const MyPollsTab = () => {
  const tab = useMyPollsTabsStore((state) => state.tab);
  const setTab = useMyPollsTabsStore((state) => state.setTab);

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="w-full justify-start gap-8 h-12 px-2">
        <TabsTrigger value="created">Created Polls</TabsTrigger>
        <TabsTrigger value="joined">Joined Polls</TabsTrigger>
      </TabsList>
      <TabsContent value="created">
        <CreatedPolls />
      </TabsContent>
      <TabsContent value="joined">
        <JoinedPolls />
      </TabsContent>
    </Tabs>
  );
};

export default MyPollsTab;

const JoinedPolls = () => {
  const program = useAnchorProgram();
  const wallet = useWallet();

  const filter = usePollFilterStore((state) => state.filter);
  const setFilter = usePollFilterStore((state) => state.setFilter);

  const { data: userPolls, isLoading: isLoadingUserPolls } = useAllPollsByUser(
    program,
    wallet.publicKey
  );
  return (
    <Flex direction={"column"} gap="2" mt={"8"}>
      <Select
        value={filter as string}
        onValueChange={(value) => setFilter(value as FilterState)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={"filter"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>
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
      >
        {userPolls
          ?.filter((poll) => {
            switch (filter) {
              case "all":
                return true;
              case "active":
                return poll.result === null;
              case "resolved":
                return poll.result !== null;
              default:
                return true;
            }
          })
          .map((poll) => {
            return (
              <PollCard
                key={poll.id}
                pollId={poll.id}
                question={poll.question}
              />
            );
          })}
      </Grid>
    </Flex>
  );
};

const CreatedPolls = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const program = useAnchorProgram();
  const { mutate: resolvePoll, isPending: isResolving } = useResolvePoll(
    program,
    connection,
    wallet
  );

  const router = useRouter();

  const { data: allPolls, isLoading: isLoadingPolls } = useAllPolls(program);
  const createdPolls =
    allPolls !== undefined
      ? allPolls.filter(
          (poll) => poll.creator.toBase58() === wallet.publicKey?.toBase58()
        )
      : [];

  const [pollIndex, setPollIndex] = useState(-1);

  return (
    <>
      <Text as="p" my={"8"} size={"2"} className="text-muted-foreground">
        Resolve your created polls.
      </Text>

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
              <TableRow onClick={() => router.push("/poll/" + poll.id)}>
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
};

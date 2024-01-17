"use client";

import { RequestAirdrop } from "@/components/request-airdrop";
import { useRegisterUser } from "@/hooks/mutations/useRegisterUser";
import { useUserAccount } from "@/hooks/queries/useUserAccount";
import { useUserSolBalance } from "@/hooks/queries/useUserSolBalance";
import useAnchorProgram from "@/hooks/useAnchorProgram";
import { Flex, Heading, Text } from "@radix-ui/themes";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreationForm } from "./creation-form";
import Analytics from "./analytics";
import { useAllPolls } from "@/hooks/queries/useAllPolls";
import { useAllPollsByUser } from "@/hooks/queries/useAllPollsByUser";
import Polls from "./polls";
import { useToast } from "@/components/ui/use-toast";
import { TbLoader2, TbCopy } from "react-icons/tb";
import { useDashboardTabsStore } from "@/hooks/states/useDashboardTabsStore";

export default function Dashboard() {
  const { toast } = useToast();
  const tab = useDashboardTabsStore((state) => state.tab);
  const setTab = useDashboardTabsStore((state) => state.setTab);
  const wallet = useWallet();
  const { connection } = useConnection();
  const program = useAnchorProgram();
  const {
    data: balance,
    isSuccess: isSuccessBalance,
    isLoading: isLoadingBalance,
  } = useUserSolBalance(connection, wallet.publicKey);
  const { data: userAccount } = useUserAccount(
    program,
    connection,
    wallet.publicKey
  );
  const { data: allPolls, isLoading: isLoadingPolls } = useAllPolls(program);

  const { data: userPolls, isLoading: isLoadingUserPolls } = useAllPollsByUser(
    program,
    wallet.publicKey
  );

  const { mutate: registerUser, isPending: isRegisteringUser } =
    useRegisterUser(program, connection, wallet);

  if (!wallet.publicKey) {
    return (
      <main className="flex min-h-screen flex-col justify-center items-center px-4 sm:px-24 lg:px-48 py-24">
        <div className="text-3xl font-bold">Please connect your wallet!</div>
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
        Dashboard
      </Heading>
      <Flex direction={"column"} align={"start"} pb={"4"}>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger>
              <Flex
                gap={"2"}
                align={"center"}
                onClick={() => {
                  navigator.clipboard.writeText(
                    wallet.publicKey?.toBase58() ?? ""
                  );
                  toast({ variant: "default", title: "Copied!" });
                }}
              >
                <Text>
                  {wallet.publicKey.toBase58().slice(0, 4) +
                    "..." +
                    wallet.publicKey.toBase58().slice(-4)}
                </Text>
                <TbCopy />
              </Flex>
            </TooltipTrigger>
            <TooltipContent side="right">
              <Text size={"1"}>{wallet.publicKey.toBase58()}</Text>
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Text>
          Balance:{" "}
          {isSuccessBalance
            ? balance + " SOL"
            : isLoadingBalance
            ? "loading..."
            : "An error occured, please refresh page!"}
        </Text>
        {balance !== undefined && balance < 0.1 && <RequestAirdrop />}
      </Flex>

      {userAccount !== null ? (
        <Tabs value={tab} onValueChange={setTab} className="space-y-4 w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="polls">Polls</TabsTrigger>
            <TabsTrigger value="creation">Creation</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Under construction 🏗️</TabsContent>
          <TabsContent value="analytics">
            {" "}
            <Analytics score={userAccount?.score} />
          </TabsContent>
          <TabsContent value="polls">
            <Polls polls={userPolls} />
          </TabsContent>
          <TabsContent value="creation">
            <CreationForm
              createdPolls={
                allPolls !== undefined
                  ? allPolls.filter(
                      (poll) =>
                        poll.creator.toBase58() === wallet.publicKey?.toBase58()
                    )
                  : []
              }
            />
          </TabsContent>
        </Tabs>
      ) : (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger>
              <Button
                disabled={isRegisteringUser}
                variant={"default"}
                onClick={() => registerUser()}
              >
                {isRegisteringUser && (
                  <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Text>Create User Account</Text>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="w-60">
              <Text size={"1"}>
                You need to create a user account to participate in polls. Your
                user account will store your estimation score.
              </Text>
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {/*
      <div>User account: {userAccount ? userAccount.score : "no user"}</div>
      {isPending && <div>Is pending</div>}
      {isSuccessUserAccount && <div>Success mutation</div>}
      {isErrorUserAccount && <div>{error.name + error.message}</div>}
      {isLoadingUserAccount && <div>idle mutation</div>}
      <div className="hover:cursor-pointer" onClick={() => mutate()}>
        Register user
      </div> */}
    </main>
  );
}

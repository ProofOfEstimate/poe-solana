"use client";

import MyPollsTab from "@/components/my-polls-tab";
import { PollCard } from "@/components/poll-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllPollsByUser } from "@/hooks/queries/useAllPollsByUser";
import { usePollFilterStore } from "@/hooks/states/usePollFilterStore";
import useAnchorProgram from "@/hooks/useAnchorProgram";
import { Flex, Grid, Heading } from "@radix-ui/themes";
import { useWallet } from "@solana/wallet-adapter-react";
import { FC } from "react";
import { CreationForm } from "./creation-form";

const CreatePoll: FC = () => {
  return (
    <main className="flex min-h-screen flex-col justify-start items-start px-4 sm:px-12 lg:px-16 py-4 sm:py-8">
      <Heading
        className="py-4"
        as="h1"
        size={{
          initial: "5",
          xs: "7",
          xl: "8",
        }}
      >
        Create Poll
      </Heading>
      <CreationForm />
    </main>
  );
};

export default CreatePoll;

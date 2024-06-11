"use client";

import MyPollsTab from "@/components/my-polls-tab";

import { Heading } from "@radix-ui/themes";
import { FC } from "react";

const Polls: FC = () => {
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
        My Polls
      </Heading>
      <MyPollsTab />
    </main>
  );
};

export default Polls;

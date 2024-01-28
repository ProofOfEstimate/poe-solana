"use client";

import HomeTabs from "@/components/home-tabs";
import { Heading } from "@radix-ui/themes";

export default function Home() {
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
        Home
      </Heading>
      <HomeTabs />
    </main>
  );
}

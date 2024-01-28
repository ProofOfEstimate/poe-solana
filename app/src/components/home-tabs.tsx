"use client";

import { useHomeTabsState } from "@/hooks/states/useHomeTabsStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Grid, Heading } from "@radix-ui/themes";
import { PollCard } from "./poll-card";
import useAnchorProgram from "@/hooks/useAnchorProgram";
import { useAllPolls } from "@/hooks/queries/useAllPolls";
import { Skeleton } from "./ui/skeleton";
import { categoryOptions } from "@/types/options";
import { Badge } from "./ui/badge";
import CategoryBadgeFilter from "./category-badge-filter";
import { useCategoryFilterStore } from "@/hooks/states/useCategoryFilterStore";

const HomeTabs = () => {
  const tab = useHomeTabsState((state) => state.tab);
  const setTab = useHomeTabsState((state) => state.setTab);

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="w-full justify-start gap-8 h-12 px-2">
        <TabsTrigger value="all">All Polls</TabsTrigger>
        <TabsTrigger value="new">New Polls</TabsTrigger>
        <TabsTrigger value="trending">Trending</TabsTrigger>
      </TabsList>
      <CategoryBadgeFilter className="py-4" />
      <TabsContent value="all">
        <AllPolls />
      </TabsContent>
      <TabsContent value="new">
        <AllPolls />
      </TabsContent>
      <TabsContent value="trending">
        <AllPolls />
      </TabsContent>
    </Tabs>
  );
};

export default HomeTabs;

const AllPolls = () => {
  const program = useAnchorProgram();
  const { data: polls, isLoading } = useAllPolls(program);
  const categories = useCategoryFilterStore((state) => state.filter);
  if (isLoading) {
    return (
      <>
        <Heading
          className="py-4"
          as="h1"
          size={{
            initial: "5",
            xs: "7",
            xl: "8",
          }}
        >
          All active Polls
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
          <Skeleton className="w-[320px] sm:w-[380px] h-72 rounded-lg" />
          <Skeleton className="w-[320px] sm:w-[380px] h-72 rounded-lg" />
          <Skeleton className="w-[320px] sm:w-[380px] h-72 rounded-lg" />
          <Skeleton className="w-[320px] sm:w-[380px] h-72 rounded-lg" />
          <Skeleton className="w-[320px] sm:w-[380px] h-72 rounded-lg" />
        </Grid>
      </>
    );
  }

  return (
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
      my={"4"}
    >
      {polls !== undefined &&
        polls
          .filter(
            (poll) =>
              poll.result === null &&
              (categories.includes(poll.category.toString()) ||
                categories.length === 0)
          )
          .map((poll) => (
            <PollCard key={poll.id} pollId={poll.id} question={poll.question} />
          ))}
    </Grid>
  );
};

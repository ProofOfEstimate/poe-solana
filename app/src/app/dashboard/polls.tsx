import { PollCard } from "@/components/poll-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePollFilterStore } from "@/hooks/states/usePollFilterStore";
import { Poll } from "@/types/poe_types";
import { Flex, Grid } from "@radix-ui/themes";
import { FC } from "react";

type PollsProps = {
  polls: Poll[] | undefined;
};

type FilterStates = "all" | "active" | "resolved";

const Polls: FC<PollsProps> = ({ polls }) => {
  const filter = usePollFilterStore((state) => state.filter);
  const setFilter = usePollFilterStore((state) => state.setFilter);

  return (
    <Flex direction={"column"} gap="2">
      <Select
        value={filter as string}
        onValueChange={(value) => setFilter(value as FilterStates)}
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
        {polls
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

export default Polls;

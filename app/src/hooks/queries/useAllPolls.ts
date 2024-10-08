import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Program } from "@coral-xyz/anchor";
import { Poe } from "@/idl/poe";
import { Poll } from "@/types/poe_types";

const allPollsKey = "allPolls";

const getAllPolls = async (program: Program<Poe>) => {
  const polls = await program.account.poll.all();

  return polls.map((poll) => poll.account) as unknown as Poll[];
};

const useAllPolls = (program: Program<Poe>) => {
  return useQuery({
    queryKey: [allPollsKey],
    queryFn: async () => await getAllPolls(program),
    enabled: !!program,
    placeholderData: keepPreviousData,
  });
};

export { useAllPolls, getAllPolls, allPollsKey };

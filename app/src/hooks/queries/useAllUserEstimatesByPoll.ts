import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { Poe } from "@/idl/poe";

const allUserPredictionsByPollKey = "allUserPredictionsByPollKey";

const getAllUserPredictionsByPoll = async (
  program: Program<Poe>,
  pollId: number
) => {
  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), new BN(pollId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  return await program.account.userEstimate.all([
    {
      memcmp: {
        offset: 40, // discriminator + publickey
        bytes: pollPda.toBase58(),
      },
    },
  ]);
};

const useAllUserPredictionsByPoll = (program: Program<Poe>, pollId: number) => {
  return useQuery({
    queryKey: [allUserPredictionsByPollKey, pollId],
    queryFn: async () => await getAllUserPredictionsByPoll(program, pollId),
    enabled: !!program,
  });
};

export {
  useAllUserPredictionsByPoll,
  getAllUserPredictionsByPoll,
  allUserPredictionsByPollKey,
};

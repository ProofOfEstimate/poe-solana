import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BN, Program } from "@coral-xyz/anchor";
import { Poe } from "@/idl/poe";
import { PublicKey } from "@solana/web3.js";

type UserEstimateData = {
  name: Date;
  lowerEstimate: number | null;
  upperEstimate: number | null;
};

const userEstimateUpdatesByPollKey = "userEstimateUpdatesByPoll";

const getUserEstimateUpdatesByPoll = async (
  program: Program<Poe>,
  pollId: number,
  publicKey: PublicKey | null
) => {
  if (publicKey === null) {
    return;
  }

  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), new BN(pollId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const userEstimateUpdates = await program.account.userEstimateUpdate.all([
    {
      memcmp: {
        offset: 40, // discriminator
        bytes: publicKey.toBase58(),
      },
    },
  ]);

  const updateData = userEstimateUpdates
    .filter((update) => update.account.poll.toBase58() === pollPda.toBase58())
    .map((update) => {
      return {
        timestamp: update.account.timestamp.toNumber(),
        lowerEstimate: update.account.lowerEstimate,
        upperEstimate: update.account.upperEstimate,
      };
    });

  updateData.sort((a, b) => a.timestamp - b.timestamp);

  let estimates = [];
  let today = new Date().getTime();
  for (let i = 0; i < updateData.length - 1; i++) {
    const time = updateData[i].timestamp;
    const lower = updateData[i].lowerEstimate;
    const upper = updateData[i].upperEstimate;

    const nextTime = updateData[i + 1].timestamp;
    // Fill with data between updates, not necessary
    for (let j = 0; j < nextTime - time; j = j + 60 * 60) {
      estimates.push({
        name: time + j,
        lowerEstimate: lower !== null ? lower : null,
        upperEstimate: upper !== null ? upper : null,
      } as unknown as UserEstimateData);
    }
    estimates.push({
      name: nextTime,
      lowerEstimate: lower !== null ? lower : null,
      upperEstimate: upper !== null ? upper : null,
    } as unknown as UserEstimateData);
  }
  const lastTimestamp = updateData[updateData.length - 1].timestamp;
  const lastLower = updateData[updateData.length - 1].lowerEstimate;
  const lastUpper = updateData[updateData.length - 1].upperEstimate;
  for (let k = 0; k < today / 1000 - lastTimestamp; k = k + 60) {
    estimates.push({
      name: lastTimestamp + k,
      lowerEstimate: lastLower !== null ? lastLower : null,
      upperEstimate: lastUpper !== null ? lastUpper : null,
    } as unknown as UserEstimateData);
  }

  return estimates;
};

const useUserEstimateUpdatesByPoll = (
  program: Program<Poe>,
  pollId: number,
  publicKey: PublicKey | null
) => {
  return useQuery({
    queryKey: [userEstimateUpdatesByPollKey, pollId],
    queryFn: async () =>
      await getUserEstimateUpdatesByPoll(program, pollId, publicKey),
    enabled: !!program,
    placeholderData: keepPreviousData,
  });
};

export {
  useUserEstimateUpdatesByPoll,
  getUserEstimateUpdatesByPoll,
  userEstimateUpdatesByPollKey,
};

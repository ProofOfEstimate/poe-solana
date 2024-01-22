import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BN, Program } from "@coral-xyz/anchor";
import { Poe } from "@/idl/poe";
import { PublicKey } from "@solana/web3.js";

type EstimateData = {
  name: Date;
  estimate: number | null;
  confidenceInterval: number[] | null;
  userEstimate: number | null;
  userInterval: number[] | null;
};

const estimateUpdatesByPollKey = "estimateUpdatesByPoll";

const getEstimateUpdatesByPoll = async (
  program: Program<Poe>,
  pollId: number,
  publicKey: PublicKey | null
) => {
  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), new BN(pollId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const pollAccount = await program.account.poll.fetch(pollPda);

  const estimateUpdates = await program.account.pollEstimateUpdate.all([
    {
      memcmp: {
        offset: 8, // discriminator
        bytes: pollPda.toBase58(),
      },
    },
  ]);

  const userEstimateUpdates = await program.account.userEstimateUpdate.all([
    {
      memcmp: {
        offset: 40, // discriminator
        bytes: publicKey?.toBase58() || "",
      },
    },
  ]);

  const userEstimateUpdateData = userEstimateUpdates.map((update) => {
    return {
      timestamp: update.account.timestamp.toNumber(),
      userLower: update.account.lowerEstimate,
      userUpper: update.account.upperEstimate,
    };
  });
  estimateUpdates.sort(
    (a, b) => a.account.timestamp.toNumber() - b.account.timestamp.toNumber()
  );

  let prevLower: number | null = null;
  let prevUpper: number | null = null;
  const updateData = estimateUpdates.map((update) => {
    const timestamp = update.account.timestamp.toNumber();
    const element = userEstimateUpdateData.find(
      (e) => e.timestamp === timestamp
    );
    if (element !== undefined) {
      prevLower = element.userLower;
      prevUpper = element.userUpper;
    }

    return {
      timestamp: timestamp,
      estimate: update.account.estimate,
      deviation:
        update.account.variance !== null
          ? Math.sqrt(update.account.variance / 2)
          : null,
      userLower: prevLower,
      userUpper: prevUpper,
    };
  });

  updateData.sort((a, b) => a.timestamp - b.timestamp);

  let estimates = [];
  let today = new Date().getTime();

  let lastDisplayTime =
    updateData[updateData.length - 1].timestamp > today / 1000
      ? today / 1000
      : updateData[updateData.length - 1].timestamp;

  for (let i = 0; i < updateData.length - 1; i++) {
    const time = updateData[i].timestamp;
    const estimate = updateData[i].estimate;
    const deviation = updateData[i].deviation;
    const userLower = updateData[i].userLower;
    const userUpper = updateData[i].userUpper;

    const nextTime = updateData[i + 1].timestamp;
    // Fill with data between updates, not necessary but a smoother experience
    for (let j = 0; j < nextTime - time; j = j + 60) {
      estimates.push({
        name: time + j,
        estimate: estimate !== null ? estimate / 10000 : null,
        confidenceInterval:
          deviation !== null && estimate !== null
            ? [estimate / 10000 - deviation, estimate / 10000 + deviation]
            : null,
        userEstimate:
          userLower !== null && userUpper !== null
            ? (userLower + userUpper) / 2
            : null,
        userInterval:
          userLower !== null && userUpper !== null
            ? [
                (userLower + userUpper) / 2 - (userUpper - userLower) / 2,
                (userLower + userUpper) / 2 + (userUpper - userLower) / 2,
              ]
            : null,
      } as unknown as EstimateData);
    }
    estimates.push({
      name: nextTime,
      estimate: estimate !== null ? estimate / 10000 : null,
      confidenceInterval:
        deviation !== null && estimate !== null
          ? [estimate / 10000 - deviation, estimate / 10000 + deviation]
          : null,
      userEstimate:
        userLower !== null && userUpper !== null
          ? (userLower + userUpper) / 2
          : null,
      userInterval:
        userLower !== null && userUpper !== null
          ? [
              (userLower + userUpper) / 2 - (userUpper - userLower) / 2,
              (userLower + userUpper) / 2 + (userUpper - userLower) / 2,
            ]
          : null,
    } as unknown as EstimateData);
  }
  const lastTimestamp = updateData[updateData.length - 1].timestamp;
  const lastEstimate = updateData[updateData.length - 1].estimate;
  const lastDeviation = updateData[updateData.length - 1].deviation;
  const lastLower = updateData[updateData.length - 1].userLower;
  const lastUpper = updateData[updateData.length - 1].userUpper;
  for (let k = 0; k < lastDisplayTime - lastTimestamp; k = k + 1) {
    estimates.push({
      name: lastTimestamp + k,
      estimate: lastEstimate !== null ? lastEstimate / 10000 : null,
      confidenceInterval:
        lastDeviation !== null && lastEstimate !== null
          ? [
              lastEstimate / 10000 - lastDeviation,
              lastEstimate / 10000 + lastDeviation,
            ]
          : null,
      userEstimate:
        lastLower !== null && lastUpper !== null
          ? (lastLower + lastUpper) / 2
          : null,
      userInterval:
        lastLower !== null && lastUpper !== null
          ? [
              (lastLower + lastUpper) / 2 - (lastUpper - lastLower) / 2,
              (lastLower + lastUpper) / 2 + (lastUpper - lastLower) / 2,
            ]
          : null,
    } as unknown as EstimateData);
  }

  return estimates;
};

const useEstimateUpdatesByPoll = (
  program: Program<Poe>,
  pollId: number,
  publicKey: PublicKey | null
) => {
  return useQuery({
    queryKey: [estimateUpdatesByPollKey, pollId],
    queryFn: async () =>
      await getEstimateUpdatesByPoll(program, pollId, publicKey),
    enabled: !!program,
    placeholderData: keepPreviousData,
    refetchInterval: 1000,
  });
};

export {
  useEstimateUpdatesByPoll,
  getEstimateUpdatesByPoll,
  estimateUpdatesByPollKey,
};

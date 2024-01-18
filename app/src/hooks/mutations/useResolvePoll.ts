import { Poe } from "@/idl/poe";
import { BN, Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userSolBalanceKey } from "../queries/useUserSolBalance";
import { pollByIdKey } from "../queries/usePollById";
import { allPollsKey } from "../queries/useAllPolls";
import { userScoreKey } from "../queries/useUserScore";
import { useToast } from "@/components/ui/use-toast";
import { WalletNotConnectedError } from "@/errors/WalletNotConnectedError";
import {
  connectWalletText,
  transactionSuccessfullText,
} from "@/texts/toastTitles";
import { sendVersionedTransaction } from "../../../utils/sendVersionedTransaction";

const resolvePoll = async (
  program: Program<Poe>,
  connection: Connection,
  wallet: WalletContextState,
  pollId: number,
  result: boolean
) => {
  if (!wallet.publicKey) {
    throw new WalletNotConnectedError(connectWalletText);
  }

  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), new BN(pollId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  let [scoreListPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("scoring_list"), pollPda.toBuffer()],
    program.programId
  );

  const resolvePollInstruction = await program.methods
    .resolvePoll(result)
    .accounts({
      poll: pollPda,
      scoringList: scoreListPda,
    })
    .instruction();

  await sendVersionedTransaction([resolvePollInstruction], wallet, connection);
};

const useResolvePoll = (
  program: Program<Poe>,
  connection: Connection,
  wallet: WalletContextState
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ pollId, result }: { pollId: number; result: boolean }) =>
      resolvePoll(program, connection, wallet, pollId, result),
    onSuccess: (_, variables) => {
      toast({
        variant: "default",
        title: transactionSuccessfullText,
        description: `Poll resolved to ${variables.result ? "Yes." : "No."}`,
      });
      queryClient.invalidateQueries({
        queryKey: [pollByIdKey, variables.pollId],
      });
      queryClient.invalidateQueries({
        queryKey: [allPollsKey],
      });
      queryClient.invalidateQueries({
        queryKey: [
          userScoreKey,
          variables.pollId,
          connection.rpcEndpoint,
          wallet.publicKey?.toBase58() || "",
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          userSolBalanceKey,
          connection.rpcEndpoint,
          wallet.publicKey?.toBase58() || "",
        ],
      });
    },
    onError: (e) => {
      toast({
        variant: "destructive",
        title: e.name,
        description: e.message,
      });
    },
  });
};

export { useResolvePoll };

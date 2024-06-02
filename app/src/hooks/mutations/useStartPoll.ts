import { Poe } from "@/idl/poe";
import { BN, Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userSolBalanceKey } from "../queries/useUserSolBalance";
import { allPollsKey } from "../queries/useAllPolls";
import { useToast } from "@/components/ui/use-toast";
import {
  connectWalletText,
  transactionSuccessfullText,
} from "@/texts/toastTitles";
import { WalletNotConnectedError } from "@/errors/WalletNotConnectedError";
import { userAccountKey } from "../queries/useUserAccount";
import { sendVersionedTransaction } from "../../../utils/sendVersionedTransaction";

const startPoll = async (
  program: Program<Poe>,
  connection: Connection,
  wallet: WalletContextState,
  pollId: number
) => {
  if (!wallet.publicKey) {
    throw new WalletNotConnectedError(connectWalletText);
  }

  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), new BN(pollId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const [scoreListPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("scoring_list"), pollPda.toBuffer()],
    program.programId
  );

  const startPollInstruction = await program.methods
    .startPoll()
    .accountsPartial({
      poll: pollPda,
      scoringList: scoreListPda,
    })
    .instruction();

  let instructions: TransactionInstruction[] = [startPollInstruction];

  await sendVersionedTransaction(instructions, wallet, connection);
};

const useStartPoll = (
  program: Program<Poe>,
  connection: Connection,
  wallet: WalletContextState
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ pollId }: { pollId: number }) =>
      startPoll(program, connection, wallet, pollId),
    onSuccess: () => {
      toast({
        variant: "default",
        title: transactionSuccessfullText,
        description: "Poll started.",
      });
      queryClient.invalidateQueries({
        queryKey: [allPollsKey],
      });
      queryClient.invalidateQueries({
        queryKey: [
          userSolBalanceKey,
          connection.rpcEndpoint,
          wallet.publicKey?.toBase58() || "",
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          userAccountKey,
          connection.rpcEndpoint,
          wallet.publicKey?.toBase58() || "",
        ],
      });
    },
    onError: (e) => {
      toast({ variant: "destructive", title: e.name, description: e.message });
    },
  });
};

export { useStartPoll };

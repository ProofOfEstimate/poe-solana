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
import { userEstimateKey } from "../queries/useUserEstimateByPoll";
import { pollByIdKey } from "../queries/usePollById";
import { userScoreKey } from "../queries/useUserScore";
import { WalletNotConnectedError } from "@/errors/WalletNotConnectedError";
import { useToast } from "@/components/ui/use-toast";
import {
  connectWalletText,
  transactionSuccessfullText,
} from "@/texts/toastTitles";

const updateEstimate = async (
  program: Program<Poe>,
  connection: Connection,
  wallet: WalletContextState,
  pollId: number,
  lowerEstimate: number | undefined,
  upperEstimate: number | undefined
) => {
  if (!wallet.publicKey) {
    throw new WalletNotConnectedError(connectWalletText);
  }

  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), new BN(pollId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  let pollAccount = await program.account.poll.fetch(pollPda);

  let [userEstimatePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_estimate"),
      pollPda.toBuffer(),
      wallet.publicKey.toBuffer(),
    ],
    program.programId
  );

  let userEstimateAccount = await program.account.userEstimate.fetch(
    userEstimatePda
  );

  let [userEstimateUpdatePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_estimate_update"),
      pollPda.toBuffer(),
      wallet.publicKey.toBuffer(),
      userEstimateAccount.numEstimateUpdates.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  let [estimateUpdatePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("estimate_update"),
      pollPda.toBuffer(),
      pollAccount.numEstimateUpdates.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  let [scoreListPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("scoring_list"), pollPda.toBuffer()],
    program.programId
  );

  let [userScorePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_score"),
      pollPda.toBuffer(),
      wallet.publicKey.toBuffer(),
    ],
    program.programId
  );

  let signature: TransactionSignature = "";
  const updateEstimateInstruction = await program.methods
    .updateEstimate(
      lowerEstimate !== undefined ? lowerEstimate : 0,
      upperEstimate !== undefined ? upperEstimate : 0
    )
    .accounts({
      poll: pollPda,
      userEstimate: userEstimatePda,
      userEstimateUpdate: userEstimateUpdatePda,
      estimateUpdate: estimateUpdatePda,
      scoringList: scoreListPda,
      userScore: userScorePda,
    })
    .instruction();

  // Get the latest block hash to use on our transaction and confirmation
  let latestBlockhash = await connection.getLatestBlockhash();

  // Create a new TransactionMessage with version and compile it to version 0
  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [updateEstimateInstruction],
  }).compileToV0Message();

  // Create a new VersionedTransaction to support the v0 message
  const transaction = new VersionedTransaction(messageV0);

  // Send transaction and await for signature
  signature = await wallet.sendTransaction(transaction, connection);

  // Await for confirmation
  return await connection.confirmTransaction(
    { signature, ...latestBlockhash },
    "confirmed"
  );
};

const useUpdateEstimate = (
  program: Program<Poe>,
  connection: Connection,
  wallet: WalletContextState
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      pollId,
      lowerEstimate,
      upperEstimate,
    }: {
      pollId: number;
      lowerEstimate: number | undefined;
      upperEstimate: number | undefined;
    }) =>
      updateEstimate(
        program,
        connection,
        wallet,
        pollId,
        lowerEstimate,
        upperEstimate
      ),
    onSuccess: (_, variables) => {
      toast({
        variant: "default",
        title: transactionSuccessfullText,
        description: "Estimate updated.",
      });
      queryClient.invalidateQueries({
        queryKey: [
          userEstimateKey,
          variables.pollId,
          connection.rpcEndpoint,
          wallet.publicKey?.toBase58() || "",
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [pollByIdKey, variables.pollId],
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

export { useUpdateEstimate };

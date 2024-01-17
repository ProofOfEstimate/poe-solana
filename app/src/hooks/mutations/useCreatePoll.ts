import { Poe } from "@/idl/poe";
import { Program } from "@coral-xyz/anchor";
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
import { UseFormReturn } from "react-hook-form";
import { allPollsKey } from "../queries/useAllPolls";
import { useToast } from "@/components/ui/use-toast";
import {
  connectWalletText,
  transactionSuccessfullText,
} from "@/texts/toastTitles";
import { WalletNotConnectedError } from "@/errors/WalletNotConnectedError";

const createPoll = async (
  program: Program<Poe>,
  connection: Connection,
  wallet: WalletContextState,
  form: UseFormReturn<
    {
      question: string;
      description: string;
    },
    any,
    undefined
  >
) => {
  if (!wallet.publicKey) {
    throw new WalletNotConnectedError(connectWalletText);
  }

  const [statePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poe_state")],
    program.programId
  );
  const stateAccount = await program.account.poeState.fetch(statePda);

  const idSeed = stateAccount.numPolls.toArrayLike(Buffer, "le", 8);
  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), idSeed],
    program.programId
  );

  const [scoreListPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("scoring_list"), pollPda.toBuffer()],
    program.programId
  );

  let signature: TransactionSignature = "";
  const createPollInstruction = await program.methods
    .createPoll(form.getValues().question, form.getValues().description, null)
    .accounts({
      resolver: wallet.publicKey,
      state: statePda,
      poll: pollPda,
      scoringList: scoreListPda,
    })
    .instruction();

  // Get the latest block hash to use on our transaction and confirmation
  const latestBlockhash = await connection.getLatestBlockhash();

  // Create a new TransactionMessage with version and compile it to version 0
  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [createPollInstruction],
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

const useCreatePoll = (
  program: Program<Poe>,
  connection: Connection,
  wallet: WalletContextState
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      form,
    }: {
      form: UseFormReturn<
        {
          question: string;
          description: string;
        },
        any,
        undefined
      >;
    }) => createPoll(program, connection, wallet, form),
    onSuccess: (_, variables) => {
      toast({
        variant: "default",
        title: transactionSuccessfullText,
        description: "Poll created.",
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
      variables.form.setValue("question", "");
      variables.form.setValue("description", "");
    },
    onError: (e) => {
      toast({ variant: "destructive", title: e.name, description: e.message });
    },
  });
};

export { useCreatePoll };

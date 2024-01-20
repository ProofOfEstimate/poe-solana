import { Poe } from "@/idl/poe";
import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
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
import { userAccountKey } from "../queries/useUserAccount";
import { sendVersionedTransaction } from "../../../utils/sendVersionedTransaction";

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

  let [userPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), wallet.publicKey.toBuffer()],
    program.programId
  );
  const userAccount = await connection.getAccountInfo(userPda);

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

  const createPollInstruction = await program.methods
    .createPoll(form.getValues().question, form.getValues().description, null)
    .accounts({
      resolver: wallet.publicKey,
      state: statePda,
      poll: pollPda,
      scoringList: scoreListPda,
    })
    .instruction();

  let instructions: TransactionInstruction[] = [];
  if (userAccount === null) {
    const registerUserInstruction = await program.methods
      .registerUser()
      .accounts({ user: userPda })
      .instruction();
    instructions = [registerUserInstruction, createPollInstruction];
  } else {
    instructions = [createPollInstruction];
  }

  await sendVersionedTransaction(instructions, wallet, connection);
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
      queryClient.invalidateQueries({
        queryKey: [
          userAccountKey,
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

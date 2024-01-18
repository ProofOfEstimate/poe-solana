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
import { userAccountKey } from "../queries/useUserAccount";
import { userSolBalanceKey } from "../queries/useUserSolBalance";
import { useToast } from "@/components/ui/use-toast";
import {
  connectWalletText,
  transactionSuccessfullText,
} from "@/texts/toastTitles";
import { WalletNotConnectedError } from "@/errors/WalletNotConnectedError";
import { sendVersionedTransaction } from "../../../utils/sendVersionedTransaction";

const registerUser = async (
  program: Program<Poe>,
  connection: Connection,
  wallet: WalletContextState
) => {
  if (!wallet.publicKey) {
    throw new WalletNotConnectedError(connectWalletText);
  }

  let [userPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), wallet.publicKey.toBuffer()],
    program.programId
  );

  const registerUserInstruction = await program.methods
    .registerUser()
    .accounts({ user: userPda })
    .instruction();

  await sendVersionedTransaction([registerUserInstruction], wallet, connection);
};

const useRegisterUser = (
  program: Program<Poe>,
  connection: Connection,
  wallet: WalletContextState
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => registerUser(program, connection, wallet),
    onSuccess: () => {
      toast({
        variant: "default",
        title: transactionSuccessfullText,
        description: "User is registered.",
      });
      queryClient.invalidateQueries({
        queryKey: [
          userAccountKey,
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

export { useRegisterUser };

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

  let signature: TransactionSignature = "";
  const registerUserInstruction = await program.methods
    .registerUser()
    .accounts({ user: userPda })
    .instruction();

  // Get the latest block hash to use on our transaction and confirmation
  let latestBlockhash = await connection.getLatestBlockhash();

  // Create a new TransactionMessage with version and compile it to version 0
  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [registerUserInstruction],
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
      // toast.success("Transaction successful: User registered");
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

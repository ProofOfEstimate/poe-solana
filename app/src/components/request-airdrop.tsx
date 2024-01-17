import { WalletNotConnectedError } from "@/errors/WalletNotConnectedError";
import { userSolBalanceKey } from "@/hooks/queries/useUserSolBalance";
import { connectWalletText } from "@/texts/toastTitles";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, TransactionSignature } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/react-query";
import { FC, useCallback, useState } from "react";
import { useToast } from "./ui/use-toast";

export const RequestAirdrop: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const onClick = useCallback(async () => {
    if (!publicKey) {
      throw new WalletNotConnectedError(connectWalletText);
    }

    let signature: TransactionSignature = "";

    setIsLoading(true);
    try {
      signature = await connection.requestAirdrop(
        publicKey,
        LAMPORTS_PER_SOL / 5
      );

      // Get the lates block hash to use on our transaction and confirmation
      let latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        "confirmed"
      );

      queryClient.invalidateQueries({
        queryKey: [
          userSolBalanceKey,
          connection.rpcEndpoint,
          publicKey.toBase58(),
        ],
      });

      toast({ title: "Airdrop successful!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: error.name,
        description: error.message,
      });

      console.log("error", `Airdrop failed! ${error?.message}`, signature);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, queryClient, toast]);

  return (
    <button
      className="px-2 bg-gradient-to-br rounded-md from-indigo-500/50 to-fuchsia-500/50 disabled:from-gray-400 disabled:to-gray-400 enabled:hover:from-white enabled:hover:to-purple-300 text-black text-xs"
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="animate-pulse">Loading...</span>
      ) : (
        <span>Airdrop</span>
      )}
    </button>
  );
};

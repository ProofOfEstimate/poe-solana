import { useEffect, useState } from "react";
import { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Poe, IDL } from "@/idl/poe";
import { Keypair } from "@solana/web3.js";

export default function useAnchorProgram(): Program<Poe> {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [program, setProgram] = useState<Program<Poe> | null>(null);

  useEffect(() => {
    let provider;
    if (wallet) {
      provider = new AnchorProvider(connection, wallet, {});
    } else {
      provider = new AnchorProvider(
        connection,
        {
          publicKey: Keypair.generate().publicKey,
          signAllTransactions: async (txes) => txes,
          signTransaction: async (tx) => tx,
        },
        {}
      );
    }

    const program = new Program(
      IDL as Idl,
      "CTrJepGaLrejcRmoRAhC3vdyF2JvJPjT8vebCWutMDYE",
      provider
    ) as unknown as Program<Poe>;
    setProgram(program);
  }, [wallet, connection]);

  return program as Program<Poe>;
}

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { clusterApiUrl } from "@solana/web3.js";
import { Poe } from "../target/types/poe";
import os from "os";

export const idWallet = os.homedir() + "/.config/solana/id.json";

process.env.ANCHOR_PROVIDER_URL = clusterApiUrl("devnet");
process.env.ANCHOR_WALLET = idWallet;

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.poe as Program<Poe>;

  let [statePda, _stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("poe_state")],
    program.programId
  );

  let [mintPda, mintBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("poeken_mint")],
    program.programId
  );

  let [escrowPda, _escrowBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("escrow")],
    program.programId
  );

  await program.methods
    .initialize()
    .accounts({ state: statePda, mint: mintPda, escrowAccount: escrowPda })
    .rpc();
})()
  .then(() => console.log("POE initialized!"))
  .catch((e) => console.log(e));

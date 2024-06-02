import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Poe } from "../target/types/poe";
import os from "os";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

export const idWallet = os.homedir() + "/.config/solana/id.json";

process.env.ANCHOR_PROVIDER_URL = clusterApiUrl("devnet");
process.env.ANCHOR_WALLET = idWallet;

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.poe as Program<Poe>;

  const uri =
    "https://cdn.jsdelivr.net/gh/proofofestimate/poeken/bonk_poe.json";
  const name = "Bonk";
  const symbol = "BONK";

  let [auth, _authBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("auth")],
    program.programId
  );

  let [mintPda, mintBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("poeken_mint")],
    program.programId
  );

  const tokenMetaData = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
  let [metadata, _] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), tokenMetaData.toBuffer(), mintPda.toBuffer()],
    tokenMetaData
  );

  console.log("Metadata", metadata.toBase58());

  await program.methods
    .addMetadata(uri, name, symbol)
    .accountsPartial({
      auth: auth,
      mint: mintPda,
      metadata: metadata,
      tokenMetadataProgram: tokenMetaData,
    })
    .rpc();
})()
  .then(() => console.log("Metadata added!"))
  .catch((e) => console.log(e));

import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from "@solana/web3.js";
import os from "os";

export const idWallet = os.homedir() + "/.config/solana/id.json";

// Insert this env variable in terminal with own api url
// process.env.ANCHOR_PROVIDER_URL = clusterApiUrl("devnet");
process.env.ANCHOR_WALLET = idWallet;

(async () => {
  const toPublicKey = new PublicKey(
    "B8ZcFLg7ddkRR6cyoBcJWGSY9sWgckX7FVssSy9CY36x"
  );
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  await provider.connection.requestAirdrop(toPublicKey, 2 * LAMPORTS_PER_SOL);

  return (await provider.connection.getBalance(toPublicKey)) / LAMPORTS_PER_SOL;
})()
  .then((balance) => console.log("Airdrop received! Balance:", balance))
  .catch((e) => console.log(e));

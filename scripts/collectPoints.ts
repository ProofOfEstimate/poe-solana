import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Poe } from "../target/types/poe";
import os from "os";
import { publicKey } from "@metaplex-foundation/umi";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export const idWallet = os.homedir() + "/.config/solana/id.json";

process.env.ANCHOR_PROVIDER_URL = clusterApiUrl("devnet");
process.env.ANCHOR_WALLET = idWallet;

const pollId = 0;

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.poe as Program<Poe>;

  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), new anchor.BN(pollId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  let [scoreListPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("scoring_list"), pollPda.toBuffer()],
    program.programId
  );

  let [escrowPda, _escrowBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow")],
    program.programId
  );

  let [mintPda, mintBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("poeken_mint")],
    program.programId
  );

  const allUserEstimates = await program.account.userEstimate.all([
    {
      memcmp: {
        offset: 40, // discriminator
        bytes: pollPda.toBase58(),
      },
    },
  ]);

  const allUsers = allUserEstimates.map((e) => e.account.forecaster);
  console.log("All Users", allUsers);

  allUsers.forEach(async (publicKey) => {
    let [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), publicKey.toBuffer()],
      program.programId
    );

    let [userPredictionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_estimate"), pollPda.toBuffer(), publicKey.toBuffer()],
      program.programId
    );

    let [userScorePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_score"), pollPda.toBuffer(), publicKey.toBuffer()],
      program.programId
    );

    const tokenAccountAddress = await getAssociatedTokenAddress(
      mintPda,
      publicKey
    );
    try {
      await program.methods
        .collectPoints()
        .accountsPartial({
          forecaster: publicKey,
          user: userPda,
          poll: pollPda,
          userEstimate: userPredictionPda,
          scoringList: scoreListPda,
          userScore: userScorePda,
          mint: mintPda,
          escrowAccount: escrowPda,
          forecasterTokenAccount: tokenAccountAddress,
        })
        .rpc();
    } catch (e) {
      console.log(e);
    }
  });
})()
  .then(() => console.log("POE initialized!"))
  .catch((e) => console.log(e));

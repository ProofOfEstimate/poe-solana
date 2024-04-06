import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Poe } from "../target/types/poe";

import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddress,
  getMint,
} from "@solana/spl-token";

const confirmTx = async (signature: string) => {
  const latestBlockhash = await anchor
    .getProvider()
    .connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction(
    {
      signature,
      ...latestBlockhash,
    },
    "confirmed"
  );
  return signature;
};

describe("poe", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.poe as Program<Poe>;
  const precision = 4; // Same constant as in program

  const result = true;
  const question = "First question";
  const description = "Describe exactly when it will resolve to true";
  const category = 2;

  // TODO: Adapt test to account for temporal decay
  const decay_rate = 0.04;

  const estimate = 92;
  const estimate2 = 10;
  const updatedSecondPrediction = 40;

  const uncertainty1 = 6;
  const uncertainty2 = 4;

  const secondUser = Keypair.generate();

  it("pre-funds payer wallet with sol and spl token", async () => {
    const solAmount = 100 * LAMPORTS_PER_SOL;
    await program.provider.connection
      .requestAirdrop(secondUser.publicKey, solAmount)
      .then(confirmTx);
    const solBalance = await program.provider.connection.getBalance(
      secondUser.publicKey
    );

    expect(solBalance).to.eq(solAmount, "Wrong sol amount");
  });

  it("initializes Poe", async () => {
    let [statePda, stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
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
      .accounts({
        state: statePda,
        mint: mintPda,
        escrowAccount: escrowPda,
      })
      .rpc();

    let stateAccount = await program.account.poeState.fetch(statePda);

    expect(stateAccount.numPolls.toString()).to.eq(
      "0",
      "Wrong number of polls"
    );
    expect(stateAccount.score).to.eq(0, "Wrong score");
    expect(stateAccount.bump).to.eq(stateBump, "Wrong bump");
  });

  it("registers user!", async () => {
    let [user1Pda, bump1] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), program.provider.publicKey.toBuffer()],
      program.programId
    );
    let [user2Pda, bump2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), secondUser.publicKey.toBuffer()],
      program.programId
    );

    let [mintPda, mintBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poeken_mint")],
      program.programId
    );

    const tokenAccountAddress1 = await getAssociatedTokenAddress(
      mintPda,
      program.provider.publicKey
    );

    const tokenAccountAddress2 = await getAssociatedTokenAddress(
      mintPda,
      secondUser.publicKey
    );

    await program.methods
      .registerUser()
      .accounts({
        user: user1Pda,
        mint: mintPda,
        tokenAccount: tokenAccountAddress1,
      })
      .rpc();
    await program.methods
      .registerUser()
      .accounts({
        payer: secondUser.publicKey,
        user: user2Pda,
        mint: mintPda,
        tokenAccount: tokenAccountAddress2,
      })
      .signers([secondUser])
      .rpc();

    const user1Account = await program.account.user.fetch(user1Pda);
    const user2Account = await program.account.user.fetch(user2Pda);

    const info = await getAccount(
      program.provider.connection,
      tokenAccountAddress1
    );
    const amount = Number(info.amount);
    const mint = await getMint(program.provider.connection, info.mint);
    const balance = amount / 10 ** mint.decimals;

    expect(user1Account.score).to.eq(1.0);
    expect(user1Account.bump).to.eq(bump1);
    expect(user2Account.score).to.eq(1.0);
    expect(user2Account.bump).to.eq(bump2);
    // expect(balance).to.eq(101, "Wrong token balance");
  });

  it("creates poll!", async () => {
    const [statePda, _stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poe_state")],
      program.programId
    );
    let stateAccount = await program.account.poeState.fetch(statePda);

    const [pollPda, pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), stateAccount.numPolls.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [scoringListAddress, scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    await program.methods
      .createPoll(question, description, category, decay_rate)
      .accounts({
        resolver: secondUser.publicKey,
        state: statePda,
        poll: pollPda,
        scoringList: scoringListAddress,
      })
      .rpc();

    stateAccount = await program.account.poeState.fetch(statePda);
    const pollAccount = await program.account.poll.fetch(pollPda);
    const scoringAccount = await program.account.scoringList.fetch(
      scoringListAddress
    );

    expect(stateAccount.numPolls.toString()).to.eq(
      "1",
      "Wrong number of polls"
    );
    expect(pollAccount.creator.toBase58()).to.be.eq(
      program.provider.publicKey.toBase58()
    );
    expect(pollAccount.question).to.eq(question, "Wrong question.");
    expect(pollAccount.description).to.eq(description, "Wrong description");
    expect(pollAccount.decayRate).to.approximately(decay_rate, 1e-6);
    expect(pollAccount.numForecasters.toString()).to.eq("0");
    expect(pollAccount.numEstimateUpdates.toString()).to.eq("0");
    expect(pollAccount.collectiveEstimate).to.eq(null);
    expect(pollAccount.accumulatedWeights).to.eq(0.0);
    expect(pollAccount.endSlot).to.eq(null, "End slot is not None");
    expect(pollAccount.bump).to.eq(pollBump);
    expect(scoringAccount.options.length).to.eq(101, "Wrong array length");
    expect(scoringAccount.bump).to.eq(scoringBump);
  });

  it("makes a prediction!", async () => {
    const [statePda, _stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poe_state")],
      program.programId
    );
    let stateAccount = await program.account.poeState.fetch(statePda);
    const pollId = stateAccount.numPolls.sub(new anchor.BN(1));
    const [pollPda, pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), pollId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [userPda, _userBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), program.provider.publicKey.toBuffer()],
      program.programId
    );

    const [userEstimatePda, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    const [userEstimateUpdatePda, _userUpdateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate_update"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    const [estimateUpdatePda, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll_estimate_update"),
          pollPda.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    const [scoringListPda, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    const [userScorePda, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [mintPda, mintBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poeken_mint")],
      program.programId
    );

    const forecasterTokenAccountAddress = await getAssociatedTokenAddress(
      mintPda,
      program.provider.publicKey
    );

    let [escrowPda, _escrowBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow")],
      program.programId
    );

    await program.methods
      .makeEstimate(estimate - uncertainty1, estimate + uncertainty1)
      .accounts({
        user: userPda,
        poll: pollPda,
        userEstimate: userEstimatePda,
        userEstimateUpdate: userEstimateUpdatePda,
        pollEstimateUpdate: estimateUpdatePda,
        scoringList: scoringListPda,
        userScore: userScorePda,
        forecasterTokenAccount: forecasterTokenAccountAddress,
        mint: mintPda,
        escrowAccount: escrowPda,
      })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollPda);
    const userAccount = await program.account.user.fetch(userPda);
    const userEstimateAccount = await program.account.userEstimate.fetch(
      userEstimatePda
    );
    const userEstimateUpdateAccount =
      await program.account.userEstimateUpdate.fetch(userEstimateUpdatePda);
    const updateAccount = await program.account.pollEstimateUpdate.fetch(
      estimateUpdatePda
    );
    const scoringAccount = await program.account.scoringList.fetch(
      scoringListPda
    ); // need to write tests for this

    expect(userAccount.participationCount).to.eq(
      1,
      "Wrong participation count"
    );
    expect(updateAccount.poll.toBase58()).to.be.eq(pollPda.toBase58());
    expect(userEstimateAccount.poll.toBase58()).to.be.eq(pollPda.toBase58());
    expect(userEstimateAccount.forecaster.toBase58()).to.be.eq(
      program.provider.publicKey.toBase58()
    );
    expect(pollAccount.numEstimateUpdates.toString()).to.eq(
      "1",
      "Wrong number of prediction updates."
    );
    expect(userEstimateAccount.lowerEstimate).to.eq(
      estimate - uncertainty1,
      "Wrong lower prediction."
    );
    expect(userEstimateAccount.upperEstimate).to.eq(
      estimate + uncertainty1,
      "Wrong upper prediction."
    );
    expect(userEstimateUpdateAccount.lowerEstimate).to.eq(
      estimate - uncertainty1,
      "Wrong lower prediction."
    );
    expect(userEstimateUpdateAccount.upperEstimate).to.eq(
      estimate + uncertainty1,
      "Wrong upper prediction."
    );
    expect(pollAccount.collectiveEstimate).to.approximately(
      10 ** precision * estimate,
      2,
      "Wrong crowd prediction."
    );
    expect(pollAccount.variance).to.approximately(
      2 * uncertainty1 * uncertainty1,
      0.01,
      "Wrong variance"
    );
    expect(pollAccount.accumulatedWeights).to.approximately(
      (1 - (2 * uncertainty1) / 100) * userAccount.score,
      1e-6,
      "Wrong accumulated weights"
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "1",
      "Wrong number of predictions."
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account."
    );
    expect(updateAccount.estimate).to.eq(
      10 ** precision * estimate,
      "Wrong prediction stored."
    );
  });

  it("updates crowd prediction when second user makes prediction!", async () => {
    let [pollPda, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollPda);

    let [user1Pda, _user1Bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), program.provider.publicKey.toBuffer()],
      program.programId
    );

    let [user2Pda, _user2Bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), secondUser.publicKey.toBuffer()],
      program.programId
    );

    let [userEstimatePda, predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate"),
          pollPda.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [userEstimateUpdatePda, _userUpdateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate_update"),
          pollPda.toBuffer(),
          secondUser.publicKey.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [estimateUpdatePda, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll_estimate_update"),
          pollPda.toBuffer(),
          pollAccount.numEstimateUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListPda, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    let [userScorePda, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollPda.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [mintPda, mintBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poeken_mint")],
      program.programId
    );

    const forecasterTokenAccountAddress = await getAssociatedTokenAddress(
      mintPda,
      secondUser.publicKey
    );

    let [escrowPda, _escrowBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow")],
      program.programId
    );

    await program.methods
      .makeEstimate(estimate2 - uncertainty2, estimate2 + uncertainty2)
      .accounts({
        forecaster: secondUser.publicKey,
        user: user2Pda,
        poll: pollPda,
        userEstimate: userEstimatePda,
        userEstimateUpdate: userEstimateUpdatePda,
        pollEstimateUpdate: estimateUpdatePda,
        scoringList: scoringListPda,
        userScore: userScorePda,
        forecasterTokenAccount: forecasterTokenAccountAddress,
        mint: mintPda,
        escrowAccount: escrowPda,
      })
      .signers([secondUser])
      .rpc();

    pollAccount = await program.account.poll.fetch(pollPda);
    const user1Account = await program.account.user.fetch(user1Pda);
    const user2Account = await program.account.user.fetch(user2Pda);
    const userEstimateAccount = await program.account.userEstimate.fetch(
      userEstimatePda
    );
    const userEstimateUpdateAccount =
      await program.account.userEstimateUpdate.fetch(userEstimateUpdatePda);
    const updateAccount = await program.account.pollEstimateUpdate.fetch(
      estimateUpdatePda
    );
    const scoringAccount = await program.account.scoringList.fetch(
      scoringListPda
    );
    const userScoreAccount = await program.account.userScore.fetch(
      userScorePda
    );
    console.log("user score", userScoreAccount);

    const weight1 = (1 - (2 * uncertainty1) / 100) * user1Account.score;
    const weight2 = (1 - (2 * uncertainty2) / 100) * user2Account.score;

    const variance =
      (weight1 *
        (estimate -
          uncertainty1 -
          pollAccount.collectiveEstimate / 10 ** precision) **
          2 +
        weight1 *
          (estimate +
            uncertainty1 -
            pollAccount.collectiveEstimate / 10 ** precision) **
            2 +
        weight2 *
          (estimate2 -
            uncertainty2 -
            pollAccount.collectiveEstimate / 10 ** precision) **
            2 +
        weight2 *
          (estimate2 +
            uncertainty2 -
            pollAccount.collectiveEstimate / 10 ** precision) **
            2) /
      (2 * pollAccount.accumulatedWeights -
        pollAccount.accumulatedWeightsSquared / pollAccount.accumulatedWeights);

    expect(user2Account.participationCount).to.eq(
      1,
      "Wrong participation count"
    );
    expect(updateAccount.poll.toBase58()).to.eq(pollPda.toBase58());
    expect(userEstimateAccount.forecaster.toBase58()).to.eq(
      secondUser.publicKey.toBase58()
    );
    expect(userEstimateAccount.poll.toBase58()).to.eq(pollPda.toBase58());
    expect(pollAccount.numEstimateUpdates.toString()).to.eq(
      "2",
      "Wrong number of prediction updates."
    );
    expect(userEstimateAccount.lowerEstimate).to.eq(
      estimate2 - uncertainty2,
      "Wrong prediction."
    );
    expect(userEstimateAccount.upperEstimate).to.eq(
      estimate2 + uncertainty2,
      "Wrong prediction."
    );
    expect(userEstimateUpdateAccount.lowerEstimate).to.eq(
      estimate2 - uncertainty2,
      "Wrong prediction."
    );
    expect(userEstimateUpdateAccount.upperEstimate).to.eq(
      estimate2 + uncertainty2,
      "Wrong prediction."
    );
    expect(pollAccount.accumulatedWeights).to.approximately(
      weight1 + weight2,
      1e-4,
      "Wrong accumulated weights"
    );
    expect(userEstimateAccount.bump).to.eq(predictionBump, "Wrong bump.");
    expect(pollAccount.collectiveEstimate).to.approximately(
      Math.floor(
        (weight1 * 10 ** precision * estimate +
          weight2 * 10 ** precision * estimate2) /
          (weight1 + weight2)
      ),
      2,
      "Wrong crowd prediction."
    );
    expect(pollAccount.variance).to.approximately(
      variance,
      0.01,
      "Wrong variance"
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "2",
      "Wrong number of predictions."
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account."
    );
    expect(updateAccount.estimate).to.approximately(
      Math.floor(
        (weight1 * 10 ** precision * estimate +
          weight2 * 10 ** precision * estimate2) /
          (weight1 + weight2)
      ),
      1e-6,
      "Wrong prediction stored."
    );
    expect(scoringAccount.cost[estimate]).to.eq(0, "Wrong cost.");
    expect(scoringAccount.cost[estimate + 1]).to.be.greaterThan(
      0,
      "Wrong cost."
    );
    expect(scoringAccount.cost[estimate - 1]).to.be.lessThan(0, "Wrong cost.");
  });

  it("updates crowd prediction when user updates own prediction!", async () => {
    const [pollPda, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollPda);

    const [user1Pda, _user1Bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), program.provider.publicKey.toBuffer()],
      program.programId
    );

    const [user2Pda, _user2Bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), secondUser.publicKey.toBuffer()],
      program.programId
    );

    const [userEstimatePda, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate"),
          pollPda.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );
    let userEstimateAccount = await program.account.userEstimate.fetch(
      userEstimatePda
    );

    const [userEstimateUpdatePda, _userUpdateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate_update"),
          pollPda.toBuffer(),
          secondUser.publicKey.toBuffer(),
          userEstimateAccount.numEstimateUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [estimateUpdatePda, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll_estimate_update"),
          pollPda.toBuffer(),
          pollAccount.numEstimateUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListPda, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    let [userScorePda, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollPda.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );

    await program.methods
      .updateEstimate(updatedSecondPrediction, updatedSecondPrediction)
      .accounts({
        forecaster: secondUser.publicKey,
        poll: pollPda,
        userEstimate: userEstimatePda,
        userEstimateUpdate: userEstimateUpdatePda,
        estimateUpdate: estimateUpdatePda,
        scoringList: scoringListPda,
        userScore: userScorePda,
      })
      .signers([secondUser])
      .rpc();

    pollAccount = await program.account.poll.fetch(pollPda);
    const user1Account = await program.account.user.fetch(user1Pda);
    const user2Account = await program.account.user.fetch(user2Pda);
    const weight1 = (1 - (2 * uncertainty1) / 100) * user1Account.score;
    const weight2 = user2Account.score;

    userEstimateAccount = await program.account.userEstimate.fetch(
      userEstimatePda
    );
    const userEstimateUpdateAccount =
      await program.account.userEstimateUpdate.fetch(userEstimateUpdatePda);
    const updateAccount = await program.account.pollEstimateUpdate.fetch(
      estimateUpdatePda
    );
    const userScoreAccount = await program.account.userScore.fetch(
      userScorePda
    );

    const variance =
      (weight1 *
        (estimate -
          uncertainty1 -
          pollAccount.collectiveEstimate / 10 ** precision) **
          2 +
        weight1 *
          (estimate +
            uncertainty1 -
            pollAccount.collectiveEstimate / 10 ** precision) **
            2 +
        weight2 *
          (updatedSecondPrediction -
            pollAccount.collectiveEstimate / 10 ** precision) **
            2 +
        weight2 *
          (updatedSecondPrediction -
            pollAccount.collectiveEstimate / 10 ** precision) **
            2) /
      (2 * pollAccount.accumulatedWeights -
        pollAccount.accumulatedWeightsSquared / pollAccount.accumulatedWeights);

    expect(updateAccount.poll.toBase58()).to.eq(pollPda.toBase58());
    expect(pollAccount.numEstimateUpdates.toString()).to.eq(
      "3",
      "Wrong number of prediction updates."
    );
    expect(userEstimateAccount.lowerEstimate).to.eq(
      updatedSecondPrediction,
      "Wrong prediction."
    );
    expect(userEstimateAccount.upperEstimate).to.eq(
      updatedSecondPrediction,
      "Wrong prediction."
    );
    expect(userEstimateUpdateAccount.lowerEstimate).to.eq(
      updatedSecondPrediction,
      "Wrong prediction."
    );
    expect(userEstimateUpdateAccount.upperEstimate).to.eq(
      updatedSecondPrediction,
      "Wrong prediction."
    );
    expect(pollAccount.collectiveEstimate).to.approximately(
      Math.floor(
        (weight1 * 10 ** precision * estimate +
          weight2 * 10 ** precision * updatedSecondPrediction) /
          (weight1 + weight2)
      ),
      1,
      "Wrong crowd prediction."
    );
    expect(pollAccount.variance).to.approximately(
      variance,
      0.01,
      "Wrong variance"
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "2",
      "Wrong number of predictions"
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account"
    );
    expect(updateAccount.estimate).to.approximately(
      Math.floor(
        (weight1 * 10 ** precision * estimate +
          weight2 * 10 ** precision * updatedSecondPrediction) /
          (weight1 + weight2)
      ),
      1,
      "Wrong prediction stored."
    );
  });

  it("updates crowd prediction when user removes own prediction!", async () => {
    let [user2Pda, _user1Bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), secondUser.publicKey.toBuffer()],
      program.programId
    );

    const [pollPda, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollPda);

    let [userEstimatePda, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate"),
          pollPda.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [estimateUpdatePda, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll_estimate_update"),
          pollPda.toBuffer(),
          pollAccount.numEstimateUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListPda, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    let [userScorePda, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollPda.toBuffer(),
          secondUser.publicKey.toBuffer(),
        ],
        program.programId
      );

    await program.methods
      .removeEstimate()
      .accounts({
        forecaster: secondUser.publicKey,
        user: user2Pda,
        poll: pollPda,
        userEstimate: userEstimatePda,
        estimateUpdate: estimateUpdatePda,
        scoringList: scoringListPda,
        userScore: userScorePda,
      })
      .signers([secondUser])
      .rpc();

    pollAccount = await program.account.poll.fetch(pollPda);
    let updateAccount = await program.account.pollEstimateUpdate.fetch(
      estimateUpdatePda
    );

    const user2Account = await program.account.user.fetch(user2Pda);

    expect(user2Account.participationCount).to.eq(
      0,
      "Wrong participation count"
    );
    expect(updateAccount.poll.toBase58()).to.eq(pollPda.toBase58());
    expect(pollAccount.numEstimateUpdates.toString()).to.eq(
      "4",
      "Wrong number of prediction updates."
    );
    expect(pollAccount.collectiveEstimate).to.approximately(
      10 ** precision * estimate,
      5,
      "Wrong crowd prediction."
    );
    expect(pollAccount.variance).to.approximately(
      2 * uncertainty1 * uncertainty1,
      0.1,
      "Wrong variance."
    );
    expect(pollAccount.accumulatedWeights).to.approximately(
      (1 - (2 * uncertainty1) / 100) * 1.0,
      1e-6,
      "Wrong accumulated weights."
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "1",
      "Wrong number of predictions."
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account."
    );
    expect(updateAccount.estimate).to.approximately(
      10 ** precision * estimate,
      5,
      "Wrong prediction stored."
    );
  });

  it("removes crowd prediction when every user removes own prediction!", async () => {
    const [user1Pda, _user1Bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), program.provider.publicKey.toBuffer()],
      program.programId
    );

    const [pollPda, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollPda);

    let [userEstimatePda, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [estimateUpdatePda, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll_estimate_update"),
          pollPda.toBuffer(),
          pollAccount.numEstimateUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListPda, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    let [userScorePda, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    await program.methods
      .removeEstimate()
      .accounts({
        forecaster: program.provider.publicKey,
        user: user1Pda,
        poll: pollPda,
        userEstimate: userEstimatePda,
        estimateUpdate: estimateUpdatePda,
        scoringList: scoringListPda,
        userScore: userScorePda,
      })
      .rpc();

    pollAccount = await program.account.poll.fetch(pollPda);
    let updateAccount = await program.account.pollEstimateUpdate.fetch(
      estimateUpdatePda
    );

    const user1Account = await program.account.user.fetch(user1Pda);

    expect(user1Account.participationCount).to.eq(
      0,
      "Wrong participation count"
    );
    expect(pollAccount.numEstimateUpdates.toString()).to.eq(
      "5",
      "Wrong number of prediction updates."
    );
    expect(pollAccount.collectiveEstimate).to.eq(
      null,
      "Wrong crowd prediction."
    );
    expect(pollAccount.variance).to.eq(null, "Wrong variance.");
    expect(pollAccount.accumulatedWeights).to.approximately(
      0.0,
      1e-6,
      "Wrong accumulated weights."
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "0",
      "Wrong number of predictions."
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account."
    );
    expect(updateAccount.estimate).to.eq(null, "Wrong prediction stored.");
  });

  it("can make again a prediction after removing it!", async () => {
    const [pollPda, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollPda);

    let [userPda, _userBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), program.provider.publicKey.toBuffer()],
      program.programId
    );

    let [userEstimatePda, _userEstimateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [userEstimateUpdatePda, _userUpdateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate_update"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [estimateUpdatePda, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll_estimate_update"),
          pollPda.toBuffer(),
          pollAccount.numEstimateUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListPda, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    let [userScorePda, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );
    // console.log("User score making again", pollAddress);

    let [mintPda, mintBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poeken_mint")],
      program.programId
    );

    const forecasterTokenAccountAddress = await getAssociatedTokenAddress(
      mintPda,
      program.provider.publicKey
    );

    let [escrowPda, _escrowBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow")],
      program.programId
    );

    await program.methods
      .makeEstimate(estimate - uncertainty2, estimate + uncertainty2)
      .accounts({
        user: userPda,
        poll: pollPda,
        userEstimate: userEstimatePda,
        userEstimateUpdate: userEstimateUpdatePda,
        pollEstimateUpdate: estimateUpdatePda,
        scoringList: scoringListPda,
        userScore: userScorePda,
        forecasterTokenAccount: forecasterTokenAccountAddress,
        mint: mintPda,
        escrowAccount: escrowPda,
      })
      .rpc();

    pollAccount = await program.account.poll.fetch(pollPda);

    const userEstimateAccount = await program.account.userEstimate.fetch(
      userEstimatePda
    );

    const userEstimateUpdateAccount =
      await program.account.userEstimateUpdate.fetch(userEstimateUpdatePda);

    const updateAccount = await program.account.pollEstimateUpdate.fetch(
      estimateUpdatePda
    );
    const scoringAccount = await program.account.scoringList.fetch(
      scoringListPda
    );

    // console.log("Scoring", scoringAccount);

    expect(userEstimateAccount.forecaster.toBase58()).to.eq(
      program.provider.publicKey.toBase58()
    );
    expect(userEstimateAccount.poll.toBase58()).to.eq(pollPda.toBase58());
    expect(userEstimateAccount.lowerEstimate).to.eq(
      estimate - uncertainty2,
      "Wrong lower estimate"
    );
    expect(userEstimateAccount.upperEstimate).to.eq(
      estimate + uncertainty2,
      "Wrong upper estimate"
    );
    expect(userEstimateUpdateAccount.lowerEstimate).to.eq(
      estimate - uncertainty2,
      "Wrong lower estimate"
    );
    expect(userEstimateUpdateAccount.upperEstimate).to.eq(
      estimate + uncertainty2,
      "Wrong upper estimate"
    );

    expect(updateAccount.poll.toBase58()).to.eq(pollPda.toBase58());
    expect(pollAccount.numEstimateUpdates.toString()).to.eq(
      "6",
      "Wrong number of prediction updates."
    );
    expect(pollAccount.accumulatedWeights).to.approximately(
      (1 - (2 * uncertainty2) / 100) * 1.0,
      1e-4,
      "Wrong accumulated weights."
    );
    expect(userEstimateAccount.lowerEstimate).to.eq(
      estimate - uncertainty2,
      "Wrong prediction."
    );
    expect(userEstimateAccount.upperEstimate).to.eq(
      estimate + uncertainty2,
      "Wrong prediction."
    );
    expect(pollAccount.collectiveEstimate).to.approximately(
      10 ** precision * estimate,
      1e-6,
      "Wrong crowd prediction."
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "1",
      "Wrong number of predictions."
    );
    expect(updateAccount.bump).to.eq(
      updateBump,
      "Wrong bump for prediction update account."
    );
    expect(updateAccount.estimate).to.eq(
      10 ** precision * estimate,
      "Wrong prediction stored."
    );
  });

  it("resolves poll!", async () => {
    const [pollPda, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    let [scoringListAddress, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    await program.methods
      .resolvePoll(result)
      .accounts({
        resolver: secondUser.publicKey,
        poll: pollPda,
        scoringList: scoringListAddress,
      })
      .signers([secondUser])
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollPda);

    const scoringAccount = await program.account.scoringList.fetch(
      scoringListAddress
    );

    expect(pollAccount.numEstimateUpdates.toString()).to.eq(
      "6",
      "Wrong number of prediction updates."
    );
    expect(pollAccount.accumulatedWeights).to.approximately(
      (1 - (2 * uncertainty2) / 100) * 1.0,
      8,
      "Wrong accumulated weights."
    );
    expect(pollAccount.collectiveEstimate).to.approximately(
      10 ** precision * estimate,
      1e-6,
      "Wrong crowd prediction."
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "1",
      "Wrong number of predictions."
    );
    expect(pollAccount.result).to.eq(result, "Wrong result.");
  });

  it("collects points!", async () => {
    let [user1Pda, _user1Bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), program.provider.publicKey.toBuffer()],
      program.programId
    );

    let [user2Pda, _user2Bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), secondUser.publicKey.toBuffer()],
      program.programId
    );

    const [pollPda, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollPda);

    let [userEstimatePda, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [scoringListPda, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    let [userScorePda, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    await program.methods
      .collectPoints()
      .accounts({
        payer: secondUser.publicKey,
        forecaster: program.provider.publicKey,
        user: user1Pda,
        poll: pollPda,
        userEstimate: userEstimatePda,
        scoringList: scoringListPda,
        userScore: userScorePda,
      })
      .signers([secondUser])
      .rpc();

    pollAccount = await program.account.poll.fetch(pollPda);
    const user1Account = await program.account.user.fetch(user1Pda);
    const user2Account = await program.account.user.fetch(user2Pda);

    const userEstimateAccount = await program.account.userEstimate.fetch(
      userEstimatePda
    );
    const scoringAccount = await program.account.scoringList.fetch(
      scoringListPda
    );

    // Depending on crowd prediction, this could be wrong
    if (estimate <= 50) {
      expect(user1Account.score).to.eq(1.0, "Wrong user swcore");
      expect(user1Account.correctAnswersCount).to.eq(
        0,
        "Wrong correct answer count"
      );
    } else {
      expect(user1Account.score).to.be.greaterThan(1.0, "Wrong user score");
      expect(user1Account.correctAnswersCount).to.eq(
        1,
        "Wrong correct answer count"
      );
    }
    expect(user2Account.score).to.eq(1.0, "Wrong user 2 score");
    expect(user2Account.participationCount).to.eq(
      0,
      "Wrong user 2 participation count"
    );

    expect(pollAccount.numEstimateUpdates.toString()).to.eq(
      "6",
      "Wrong number of prediction updates."
    );
    expect(pollAccount.accumulatedWeights).to.approximately(
      (1 - (2 * uncertainty2) / 100) * 1.0,
      8,
      "Wrong accumulated weights."
    );
    expect(userEstimateAccount.lowerEstimate).to.eq(
      estimate - uncertainty2,
      "Wrong prediction."
    );
    expect(userEstimateAccount.upperEstimate).to.eq(
      estimate + uncertainty2,
      "Wrong prediction."
    );
    expect(pollAccount.collectiveEstimate).to.approximately(
      10 ** precision * estimate,
      1e-6,
      "Wrong crowd prediction."
    );
    expect(pollAccount.numForecasters.toString()).to.eq(
      "1",
      "Wrong number of predictions."
    );
  });
});

describe("precision", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.poe as Program<Poe>;
  const precision = 4; // Same constant as in program

  const question = "Question";
  const description = "Description";
  const category = 2;
  const decay_rate = 0.4;

  const estimate = 80;
  const updatedEstimate = 100;

  const uncertainty = 6;

  const secondUser = Keypair.generate();

  beforeEach(async () => {
    let [statePda, _stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poe_state")],
      program.programId
    );

    // let [user1Pda, _bump1] = anchor.web3.PublicKey.findProgramAddressSync(
    //   [Buffer.from("user"), program.provider.publicKey.toBuffer()],
    //   program.programId
    // );
    // let [user2Pda, _bump2] = anchor.web3.PublicKey.findProgramAddressSync(
    //   [Buffer.from("user"), secondUser.publicKey.toBuffer()],
    //   program.programId
    // );

    // await program.methods.registerUser().accounts({ user: user1Pda }).rpc();
    // await program.methods
    //   .registerUser()
    //   .accounts({ payer: secondUser.publicKey, user: user2Pda })
    //   .signers([secondUser])
    //   .rpc();

    let stateAccount = await program.account.poeState.fetch(statePda);

    const [pollPda, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), stateAccount.numPolls.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [scoringListAddress, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    await program.methods
      .createPoll(question, description, category, decay_rate)
      .accounts({
        resolver: secondUser.publicKey,
        state: statePda,
        poll: pollPda,
        scoringList: scoringListAddress,
      })
      .rpc();
  });

  it("makes a prediction!", async () => {
    const [pollPda, pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [userPda, _userBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), program.provider.publicKey.toBuffer()],
      program.programId
    );

    const [userEstimatePda, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    const [userEstimateUpdatePda, _userUpdateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate_update"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    const [estimateUpdatePda, updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll_estimate_update"),
          pollPda.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    const [scoringListPda, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    const [userScorePda, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    let [mintPda, mintBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poeken_mint")],
      program.programId
    );

    const forecasterTokenAccountAddress = await getAssociatedTokenAddress(
      mintPda,
      program.provider.publicKey
    );

    let [escrowPda, _escrowBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow")],
      program.programId
    );

    await program.methods
      .makeEstimate(estimate - uncertainty, estimate + uncertainty)
      .accounts({
        user: userPda,
        poll: pollPda,
        userEstimate: userEstimatePda,
        userEstimateUpdate: userEstimateUpdatePda,
        pollEstimateUpdate: estimateUpdatePda,
        scoringList: scoringListPda,
        userScore: userScorePda,
        forecasterTokenAccount: forecasterTokenAccountAddress,
        mint: mintPda,
        escrowAccount: escrowPda,
      })
      .rpc();

    const pollAccount = await program.account.poll.fetch(pollPda);

    expect(pollAccount.collectiveEstimate).to.approximately(
      10 ** precision * estimate,
      0.001,
      "Wrong crowd prediction."
    );
    expect(pollAccount.variance).to.approximately(
      2 * uncertainty * uncertainty,
      0.0000001,
      "Wrong variance"
    );
  });

  it("updates crowd prediction when user updates own prediction!", async () => {
    const [pollPda, _pollBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    let pollAccount = await program.account.poll.fetch(pollPda);

    const [userEstimatePda, _predictionBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );
    let userEstimateAccount = await program.account.userEstimate.fetch(
      userEstimatePda
    );

    const [userEstimateUpdatePda, _userUpdateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_estimate_update"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
          userEstimateAccount.numEstimateUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [estimateUpdatePda, _updateBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("poll_estimate_update"),
          pollPda.toBuffer(),
          pollAccount.numEstimateUpdates.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    let [scoringListPda, _scoringBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("scoring_list"), pollPda.toBuffer()],
        program.programId
      );

    let [userScorePda, _userScoreBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_score"),
          pollPda.toBuffer(),
          program.provider.publicKey.toBuffer(),
        ],
        program.programId
      );

    await program.methods
      .updateEstimate(updatedEstimate, updatedEstimate)
      .accounts({
        poll: pollPda,
        userEstimate: userEstimatePda,
        userEstimateUpdate: userEstimateUpdatePda,
        estimateUpdate: estimateUpdatePda,
        scoringList: scoringListPda,
        userScore: userScorePda,
      })
      .rpc();

    pollAccount = await program.account.poll.fetch(pollPda);

    expect(pollAccount.collectiveEstimate).to.approximately(
      updatedEstimate * 10 ** precision,
      0.0000001,
      "Wrong crowd prediction."
    );
    expect(pollAccount.variance).to.approximately(
      0,
      0.0000001,
      "Wrong variance"
    );
  });
});

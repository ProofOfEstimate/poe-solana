import { Keypair } from "@solana/web3.js";

const generateKey = async () => {
  let desiredKey = false;
  let maxCount = 10000000;
  let counter = 0;

  while (!desiredKey && counter < maxCount) {
    const keyPair = Keypair.generate();

    if (keyPair.publicKey.toString().slice(0, 3).toLowerCase() === "poe") {
      console.log("Public Key:", keyPair.publicKey.toString());
      console.log("Secret Key:", keyPair.secretKey);
      desiredKey = true;
      return;
    }
    counter += 1;
  }
};

generateKey();

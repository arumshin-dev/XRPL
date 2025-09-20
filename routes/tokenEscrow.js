const express = require('express');
const { Client, Wallet } = require('xrpl');
const { encodeForSigning, encode } = require('ripple-binary-codec');
const { sign: kpSign, deriveKeypair } = require('ripple-keypairs');
const router = express.Router();

const Now = () => Math.floor(Date.now() / 1000) - 946_684_800;

// Create IOU escrow
router.post('/create/iou', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { sourceSeed, destinationAddress, currency, issuer, value, finishAfter, cancelAfter } = req.body;
    
    if (!sourceSeed || !destinationAddress || !currency || !issuer || !value) {
      return res.status(400).json({
        success: false,
        error: 'sourceSeed, destinationAddress, currency, issuer, and value are required'
      });
    }

    await client.connect();
    const sourceWallet = Wallet.fromSeed(sourceSeed.trim());

    const tx = {
      TransactionType: "EscrowCreate",
      Account: sourceWallet.address,
      Destination: destinationAddress,
      Amount: {
        currency,
        issuer,
        value
      },
      FinishAfter: finishAfter || (Now() + 30),
      CancelAfter: cancelAfter || (Now() + 120)
    };

    const prepared = await client.autofill(tx);
    
    // Raw signing for IOU escrow
    const toSign = {
      ...prepared,
      SigningPubKey: sourceWallet.publicKey
    };
    
    const { privateKey } = deriveKeypair(sourceSeed);
    const signingData = encodeForSigning(toSign);
    const signature = kpSign(signingData, privateKey);
    
    const signedTx = { ...toSign, TxnSignature: signature };
    const tx_blob = encode(signedTx);
    
    const result = await client.submitAndWait(tx_blob);

    res.json({
      success: true,
      data: {
        owner: sourceWallet.address,
        offerSequence: prepared.Sequence,
        result: result.result
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await client.disconnect();
  }
});

// Create MPT escrow
router.post('/create/mpt', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { sourceSeed, destinationAddress, mptIssuanceId, value, finishAfter, cancelAfter } = req.body;
    
    if (!sourceSeed || !destinationAddress || !mptIssuanceId || !value) {
      return res.status(400).json({
        success: false,
        error: 'sourceSeed, destinationAddress, mptIssuanceId, and value are required'
      });
    }

    await client.connect();
    const sourceWallet = Wallet.fromSeed(sourceSeed.trim());

    const tx = {
      TransactionType: "EscrowCreate",
      Account: sourceWallet.address,
      Destination: destinationAddress,
      Amount: {
        mpt_issuance_id: mptIssuanceId,
        value
      },
      FinishAfter: finishAfter || (Now() + 30),
      CancelAfter: cancelAfter || (Now() + 120)
    };

    const prepared = await client.autofill(tx);
    
    // Raw signing for MPT escrow
    const toSign = {
      ...prepared,
      SigningPubKey: sourceWallet.publicKey
    };
    
    const { privateKey } = deriveKeypair(sourceSeed);
    const signingData = encodeForSigning(toSign);
    const signature = kpSign(signingData, privateKey);
    
    const signedTx = { ...toSign, TxnSignature: signature };
    const tx_blob = encode(signedTx);
    
    const result = await client.submitAndWait(tx_blob);

    res.json({
      success: true,
      data: {
        owner: sourceWallet.address,
        offerSequence: prepared.Sequence,
        result: result.result
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await client.disconnect();
  }
});

// Finish escrow
router.post('/finish', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { finisherSeed, ownerAddress, offerSequence } = req.body;
    
    if (!finisherSeed || !ownerAddress || !offerSequence) {
      return res.status(400).json({
        success: false,
        error: 'finisherSeed, ownerAddress, and offerSequence are required'
      });
    }

    await client.connect();
    const finisherWallet = Wallet.fromSeed(finisherSeed.trim());

    const tx = {
      TransactionType: "EscrowFinish",
      Account: finisherWallet.address,
      Owner: ownerAddress,
      OfferSequence: offerSequence
    };

    const prepared = await client.autofill(tx);
    const signed = finisherWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    res.json({
      success: true,
      data: {
        transactionHash: signed.hash,
        result: result.result
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await client.disconnect();
  }
});

// Cancel escrow
router.post('/cancel', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { cancellerSeed, ownerAddress, offerSequence } = req.body;
    
    if (!cancellerSeed || !ownerAddress || !offerSequence) {
      return res.status(400).json({
        success: false,
        error: 'cancellerSeed, ownerAddress, and offerSequence are required'
      });
    }

    await client.connect();
    const cancellerWallet = Wallet.fromSeed(cancellerSeed.trim());

    const tx = {
      TransactionType: "EscrowCancel",
      Account: cancellerWallet.address,
      Owner: ownerAddress,
      OfferSequence: offerSequence
    };

    const prepared = await client.autofill(tx);
    const signed = cancellerWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    res.json({
      success: true,
      data: {
        transactionHash: signed.hash,
        result: result.result
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await client.disconnect();
  }
});

module.exports = router;
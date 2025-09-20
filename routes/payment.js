const express = require('express');
const { Client, Wallet } = require('xrpl');
const router = express.Router();

// Send XRP
router.post('/xrp', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { senderSeed, destinationAddress, amount } = req.body;
    
    if (!senderSeed || !destinationAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'senderSeed, destinationAddress, and amount are required'
      });
    }

    await client.connect();
    const senderWallet = Wallet.fromSeed(senderSeed.trim());

    const tx = {
      TransactionType: "Payment",
      Account: senderWallet.address,
      Destination: destinationAddress,
      Amount: amount.toString() // XRP in drops
    };

    const prepared = await client.autofill(tx);
    const signed = senderWallet.sign(prepared);
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

// Send IOU
router.post('/iou', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { senderSeed, destinationAddress, currency, issuer, value } = req.body;
    
    if (!senderSeed || !destinationAddress || !currency || !issuer || !value) {
      return res.status(400).json({
        success: false,
        error: 'senderSeed, destinationAddress, currency, issuer, and value are required'
      });
    }

    await client.connect();
    const senderWallet = Wallet.fromSeed(senderSeed.trim());

    const tx = {
      TransactionType: "Payment",
      Account: senderWallet.address,
      Destination: destinationAddress,
      Amount: {
        currency,
        issuer,
        value
      }
    };

    const prepared = await client.autofill(tx);
    const signed = senderWallet.sign(prepared);
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
const express = require('express');
const { Client, Wallet } = require('xrpl');
const router = express.Router();

// Create trust line
router.post('/create', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { userSeed, currency, issuer, limit } = req.body;
    
    if (!userSeed || !currency || !issuer || !limit) {
      return res.status(400).json({
        success: false,
        error: 'userSeed, currency, issuer, and limit are required'
      });
    }

    await client.connect();
    const userWallet = Wallet.fromSeed(userSeed.trim());

    const tx = {
      TransactionType: "TrustSet",
      Account: userWallet.address,
      LimitAmount: {
        currency,
        issuer,
        value: limit.toString()
      }
    };

    const prepared = await client.autofill(tx);
    const signed = userWallet.sign(prepared);
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

// Authorize trust line (for RequireAuth issuers)
router.post('/authorize', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { issuerSeed, userAddress, currency } = req.body;
    
    if (!issuerSeed || !userAddress || !currency) {
      return res.status(400).json({
        success: false,
        error: 'issuerSeed, userAddress, and currency are required'
      });
    }

    await client.connect();
    const issuerWallet = Wallet.fromSeed(issuerSeed.trim());

    const tx = {
      TransactionType: "TrustSet",
      Account: issuerWallet.address,
      LimitAmount: {
        currency,
        issuer: userAddress,
        value: "0"
      },
      Flags: 0x00010000 // tfSetAuth
    };

    const prepared = await client.autofill(tx);
    const signed = issuerWallet.sign(prepared);
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
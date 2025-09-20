const express = require('express');
const { Client, Wallet } = require('xrpl');
const router = express.Router();

// Set account flags
router.post('/flags', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { accountSeed, setFlag, clearFlag } = req.body;
    
    if (!accountSeed) {
      return res.status(400).json({
        success: false,
        error: 'accountSeed is required'
      });
    }

    await client.connect();
    const accountWallet = Wallet.fromSeed(accountSeed.trim());

    const tx = {
      TransactionType: "AccountSet",
      Account: accountWallet.address
    };

    if (setFlag !== undefined) tx.SetFlag = setFlag;
    if (clearFlag !== undefined) tx.ClearFlag = clearFlag;

    const prepared = await client.autofill(tx);
    const signed = accountWallet.sign(prepared);
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
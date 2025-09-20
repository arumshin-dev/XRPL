const express = require('express');
const { Client, Wallet } = require('xrpl');
const router = express.Router();

// Create AMM
router.post('/create', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { adminSeed, amount, amount2, tradingFee } = req.body;
    
    if (!adminSeed || !amount || !amount2) {
      return res.status(400).json({
        success: false,
        error: 'adminSeed, amount, and amount2 are required'
      });
    }

    await client.connect();
    const adminWallet = Wallet.fromSeed(adminSeed.trim());

    const tx = {
      TransactionType: "AMMCreate",
      Account: adminWallet.address,
      Amount: amount,
      Amount2: amount2,
      TradingFee: tradingFee || 30
    };

    const prepared = await client.autofill(tx);
    const currentLedger = await client.getLedgerIndex();
    prepared.LastLedgerSequence = currentLedger + 50;

    const signed = adminWallet.sign(prepared);
    const result = await client.submit(signed.tx_blob);

    res.json({
      success: true,
      data: {
        transactionHash: signed.hash,
        result
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

// Get AMM info
router.get('/info', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { asset, asset2 } = req.query;
    
    if (!asset || !asset2) {
      return res.status(400).json({
        success: false,
        error: 'asset and asset2 are required'
      });
    }

    await client.connect();

    const request = {
      command: "amm_info",
      asset: JSON.parse(asset),
      asset2: JSON.parse(asset2)
    };

    const result = await client.request(request);

    res.json({
      success: true,
      data: result.result
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

// AMM Deposit
router.post('/deposit', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { userSeed, asset, asset2, amount, amount2, flags } = req.body;
    
    if (!userSeed || !asset || !asset2) {
      return res.status(400).json({
        success: false,
        error: 'userSeed, asset, and asset2 are required'
      });
    }

    await client.connect();
    const userWallet = Wallet.fromSeed(userSeed.trim());

    const tx = {
      TransactionType: "AMMDeposit",
      Account: userWallet.address,
      Asset: asset,
      Asset2: asset2,
      Amount: amount,
      Amount2: amount2,
      Flags: flags || 0x00100000 // tfTwoAsset
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

// AMM Withdraw
router.post('/withdraw', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { userSeed, asset, asset2, lpTokenIn, flags } = req.body;
    
    if (!userSeed || !asset || !asset2 || !lpTokenIn) {
      return res.status(400).json({
        success: false,
        error: 'userSeed, asset, asset2, and lpTokenIn are required'
      });
    }

    await client.connect();
    const userWallet = Wallet.fromSeed(userSeed.trim());

    const tx = {
      TransactionType: "AMMWithdraw",
      Account: userWallet.address,
      Asset: asset,
      Asset2: asset2,
      LPTokenIn: lpTokenIn,
      Flags: flags || 0x00080000
    };

    const prepared = await client.autofill(tx);
    const currentLedger = await client.getLedgerIndex();
    prepared.LastLedgerSequence = currentLedger + 50;

    const signed = userWallet.sign(prepared);
    const submitResult = await client.submit(signed.tx_blob);

    // Manual polling for result
    const txHash = signed.hash;
    let attempts = 0;
    while (attempts < 20) {
      const txResult = await client.request({
        command: "tx",
        transaction: txHash
      });

      if (txResult.result.validated) {
        return res.json({
          success: true,
          data: {
            transactionHash: txHash,
            result: txResult.result
          }
        });
      }

      attempts++;
      await new Promise(r => setTimeout(r, 2000));
    }

    throw new Error("Transaction not validated (timeout)");
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await client.disconnect();
  }
});

// AMM Vote
router.post('/vote', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { userSeed, asset, asset2, tradingFee } = req.body;
    
    if (!userSeed || !asset || !asset2 || tradingFee === undefined) {
      return res.status(400).json({
        success: false,
        error: 'userSeed, asset, asset2, and tradingFee are required'
      });
    }

    await client.connect();
    const userWallet = Wallet.fromSeed(userSeed.trim());

    const tx = {
      TransactionType: "AMMVote",
      Account: userWallet.address,
      Asset: asset,
      Asset2: asset2,
      TradingFee: tradingFee
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

module.exports = router;
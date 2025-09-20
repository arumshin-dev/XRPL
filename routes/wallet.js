const express = require('express');
const { Client, Wallet } = require('xrpl');
const router = express.Router();

// Create new wallet
router.post('/create', async (req, res) => {
  try {
    const newWallet = Wallet.generate();
    res.json({
      success: true,
      data: {
        address: newWallet.address,
        seed: newWallet.seed,
        publicKey: newWallet.publicKey
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Load wallet from seed
router.post('/load', async (req, res) => {
  try {
    const { seed } = req.body;
    if (!seed) {
      return res.status(400).json({
        success: false,
        error: 'Seed is required'
      });
    }

    const wallet = Wallet.fromSeed(seed.trim());
    res.json({
      success: true,
      data: {
        address: wallet.address,
        publicKey: wallet.publicKey
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Fund wallet (Devnet faucet)
router.post('/fund', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { seed } = req.body;
    if (!seed) {
      return res.status(400).json({
        success: false,
        error: 'Seed is required'
      });
    }

    await client.connect();
    const wallet = Wallet.fromSeed(seed.trim());
    const result = await client.fundWallet(wallet);
    
    res.json({
      success: true,
      data: {
        address: wallet.address,
        balance: result.balance,
        transaction: result
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

// Get wallet info
router.get('/info/:address', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { address } = req.params;
    await client.connect();

    // Get XRP balance
    const balance = await client.getXrpBalance(address);
    
    // Get account info
    const accountInfo = await client.request({
      command: "account_info",
      account: address
    });

    // Get trust lines
    const trustLines = await client.request({
      command: "account_lines",
      account: address
    });

    res.json({
      success: true,
      data: {
        address,
        balance: balance + ' XRP',
        sequence: accountInfo.result.account_data.Sequence,
        flags: accountInfo.result.account_data.Flags,
        trustLines: trustLines.result.lines
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
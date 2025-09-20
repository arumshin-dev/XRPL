const express = require('express');
const { Client, Wallet } = require('xrpl');
const router = express.Router();

// Create MPT issuance
router.post('/issuance/create', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { adminSeed, assetScale, maximumAmount, flags } = req.body;
    
    if (!adminSeed) {
      return res.status(400).json({
        success: false,
        error: 'adminSeed is required'
      });
    }

    await client.connect();
    const adminWallet = Wallet.fromSeed(adminSeed.trim());

    const tx = {
      TransactionType: "MPTokenIssuanceCreate",
      Account: adminWallet.address,
      AssetScale: assetScale || 0,
      MaximumAmount: maximumAmount || "1000000000",
      Flags: flags || {
        tfMPTCanTransfer: true,
        tfMPTCanEscrow: true,
        tfMPTRequireAuth: false
      }
    };

    const prepared = await client.autofill(tx);
    const signed = adminWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const issuanceId = result.result.meta?.mpt_issuance_id;

    res.json({
      success: true,
      data: {
        transactionHash: signed.hash,
        issuanceId,
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

// Authorize holder
router.post('/authorize', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { adminSeed, mptIssuanceId, holderAddress } = req.body;
    
    if (!adminSeed || !mptIssuanceId || !holderAddress) {
      return res.status(400).json({
        success: false,
        error: 'adminSeed, mptIssuanceId, and holderAddress are required'
      });
    }

    await client.connect();
    const adminWallet = Wallet.fromSeed(adminSeed.trim());

    const tx = {
      TransactionType: "MPTokenAuthorize",
      Account: adminWallet.address,
      MPTokenIssuanceID: mptIssuanceId,
      Holder: holderAddress
    };

    const prepared = await client.autofill(tx);
    const signed = adminWallet.sign(prepared);
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

// Send MPT
router.post('/send', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { senderSeed, destinationAddress, mptIssuanceId, value } = req.body;
    
    if (!senderSeed || !destinationAddress || !mptIssuanceId || !value) {
      return res.status(400).json({
        success: false,
        error: 'senderSeed, destinationAddress, mptIssuanceId, and value are required'
      });
    }

    await client.connect();
    const senderWallet = Wallet.fromSeed(senderSeed.trim());

    const tx = {
      TransactionType: "Payment",
      Account: senderWallet.address,
      Destination: destinationAddress,
      Amount: {
        mpt_issuance_id: mptIssuanceId,
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

// Destroy issuance
router.post('/issuance/destroy', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { adminSeed, mptIssuanceId } = req.body;
    
    if (!adminSeed || !mptIssuanceId) {
      return res.status(400).json({
        success: false,
        error: 'adminSeed and mptIssuanceId are required'
      });
    }

    await client.connect();
    const adminWallet = Wallet.fromSeed(adminSeed.trim());

    const tx = {
      TransactionType: "MPTokenIssuanceDestroy",
      Account: adminWallet.address,
      MPTokenIssuanceID: mptIssuanceId
    };

    const prepared = await client.autofill(tx);
    const signed = adminWallet.sign(prepared);
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
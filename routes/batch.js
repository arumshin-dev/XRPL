const express = require('express');
const { Client, Wallet } = require('xrpl');
const router = express.Router();

// All or nothing batch
router.post('/all-or-nothing', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { userSeed, transactions } = req.body;
    
    if (!userSeed || !transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: 'userSeed and transactions array are required'
      });
    }

    await client.connect();
    const userWallet = Wallet.fromSeed(userSeed.trim());

    const ai = await client.request({ 
      command: "account_info", 
      account: userWallet.address 
    });
    const seq = ai.result.account_data.Sequence;

    const rawTransactions = transactions.map((tx, index) => ({
      RawTransaction: {
        ...tx,
        Flags: 0x40000000, // tfInnerBatchTxn
        Account: userWallet.address,
        Sequence: seq + index + 1,
        Fee: "0",
        SigningPubKey: ""
      }
    }));

    const outerTx = {
      TransactionType: "Batch",
      Account: userWallet.address,
      Flags: 0x00010000, // AllOrNothing
      RawTransactions: rawTransactions,
      Sequence: seq
    };

    const prepared = await client.autofill(outerTx);
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

// Independent batch
router.post('/independent', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { userSeed, transactions } = req.body;
    
    if (!userSeed || !transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: 'userSeed and transactions array are required'
      });
    }

    await client.connect();
    const userWallet = Wallet.fromSeed(userSeed.trim());

    const ai = await client.request({ 
      command: "account_info", 
      account: userWallet.address 
    });
    const seq = ai.result.account_data.Sequence;

    const rawTransactions = transactions.map((tx, index) => ({
      RawTransaction: {
        ...tx,
        Flags: 0x40000000, // tfInnerBatchTxn
        Account: userWallet.address,
        Sequence: seq + index + 1,
        Fee: "0",
        SigningPubKey: ""
      }
    }));

    const outerTx = {
      TransactionType: "Batch",
      Account: userWallet.address,
      Flags: 0x00080000, // Independent
      RawTransactions: rawTransactions,
      Sequence: seq
    };

    const prepared = await client.autofill(outerTx);
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

// Only one batch
router.post('/only-one', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { userSeed, transactions } = req.body;
    
    if (!userSeed || !transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: 'userSeed and transactions array are required'
      });
    }

    await client.connect();
    const userWallet = Wallet.fromSeed(userSeed.trim());

    const ai = await client.request({ 
      command: "account_info", 
      account: userWallet.address 
    });
    const seq = ai.result.account_data.Sequence;

    const rawTransactions = transactions.map((tx, index) => ({
      RawTransaction: {
        ...tx,
        Flags: 0x40000000, // tfInnerBatchTxn
        Account: userWallet.address,
        Sequence: seq + index + 1,
        Fee: "0",
        SigningPubKey: ""
      }
    }));

    const outerTx = {
      TransactionType: "Batch",
      Account: userWallet.address,
      Flags: 0x00020000, // OnlyOne
      RawTransactions: rawTransactions,
      Sequence: seq
    };

    const prepared = await client.autofill(outerTx);
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

// Until failure batch
router.post('/until-failure', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { userSeed, transactions } = req.body;
    
    if (!userSeed || !transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: 'userSeed and transactions array are required'
      });
    }

    await client.connect();
    const userWallet = Wallet.fromSeed(userSeed.trim());

    const ai = await client.request({ 
      command: "account_info", 
      account: userWallet.address 
    });
    const seq = ai.result.account_data.Sequence;

    const rawTransactions = transactions.map((tx, index) => ({
      RawTransaction: {
        ...tx,
        Flags: 0x40000000, // tfInnerBatchTxn
        Account: userWallet.address,
        Sequence: seq + index + 1,
        Fee: "0",
        SigningPubKey: ""
      }
    }));

    const outerTx = {
      TransactionType: "Batch",
      Account: userWallet.address,
      Flags: 0x00040000, // UntilFailure
      RawTransactions: rawTransactions,
      Sequence: seq
    };

    const prepared = await client.autofill(outerTx);
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
const express = require('express');
const { Client, Wallet } = require('xrpl');
const router = express.Router();

const toHex = (s) => Buffer.from(s, "utf8").toString("hex");
const now = () => Math.floor(Date.now() / 1000);

// Create credential
router.post('/create', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { issuerSeed, subjectAddress, credentialType, expiration, uri } = req.body;
    
    if (!issuerSeed || !subjectAddress || !credentialType) {
      return res.status(400).json({
        success: false,
        error: 'issuerSeed, subjectAddress, and credentialType are required'
      });
    }

    await client.connect();
    const issuerWallet = Wallet.fromSeed(issuerSeed.trim());

    const tx = {
      TransactionType: "CredentialCreate",
      Account: issuerWallet.address,
      Subject: subjectAddress,
      CredentialType: toHex(credentialType),
      Expiration: expiration || (now() + 3600), // 1 hour default
      URI: uri ? toHex(uri) : undefined
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

// Accept credential
router.post('/accept', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { subjectSeed, issuerAddress, credentialType } = req.body;
    
    if (!subjectSeed || !issuerAddress || !credentialType) {
      return res.status(400).json({
        success: false,
        error: 'subjectSeed, issuerAddress, and credentialType are required'
      });
    }

    await client.connect();
    const subjectWallet = Wallet.fromSeed(subjectSeed.trim());

    const tx = {
      TransactionType: "CredentialAccept",
      Account: subjectWallet.address,
      Issuer: issuerAddress,
      CredentialType: toHex(credentialType)
    };

    const prepared = await client.autofill(tx);
    const signed = subjectWallet.sign(prepared);
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

// Check credentials
router.get('/check/:address', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { address } = req.params;
    await client.connect();

    const all = [];
    let marker = undefined;

    do {
      const r = await client.request({
        command: "account_objects",
        account: address,
        limit: 400,
        ...(marker ? { marker } : {})
      });
      
      const creds = (r.result.account_objects || []).filter(
        (o) => o.LedgerEntryType === "Credential"
      );
      all.push(...creds);
      marker = r.result.marker;
    } while (marker);

    res.json({
      success: true,
      data: all
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

// Delete credential
router.post('/delete', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { subjectSeed, issuerAddress, credentialType } = req.body;
    
    if (!subjectSeed || !issuerAddress || !credentialType) {
      return res.status(400).json({
        success: false,
        error: 'subjectSeed, issuerAddress, and credentialType are required'
      });
    }

    await client.connect();
    const subjectWallet = Wallet.fromSeed(subjectSeed.trim());

    const tx = {
      TransactionType: "CredentialDelete",
      Account: subjectWallet.address,
      Issuer: issuerAddress,
      Subject: subjectWallet.address,
      CredentialType: toHex(credentialType)
    };

    const prepared = await client.autofill(tx);
    const signed = subjectWallet.sign(prepared);
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
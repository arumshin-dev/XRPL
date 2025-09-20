const express = require('express');
const { Client, Wallet } = require('xrpl');
const router = express.Router();

const toHex = (s) => Buffer.from(s, "utf8").toString("hex");

// Create domain
router.post('/create', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { adminSeed, acceptedCredentials } = req.body;
    
    if (!adminSeed || !acceptedCredentials) {
      return res.status(400).json({
        success: false,
        error: 'adminSeed and acceptedCredentials are required'
      });
    }

    await client.connect();
    const adminWallet = Wallet.fromSeed(adminSeed.trim());

    const tx = {
      TransactionType: "PermissionedDomainSet",
      Account: adminWallet.address,
      AcceptedCredentials: acceptedCredentials.map(cred => ({
        Credential: {
          Issuer: cred.issuer,
          CredentialType: toHex(cred.credentialType)
        }
      }))
    };

    const prepared = await client.autofill(tx);
    const signed = adminWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    // Extract domain ID from result
    const out = result.result ?? result;
    const created = (out.meta?.AffectedNodes || []).find(
      (n) => n.CreatedNode?.LedgerEntryType === "PermissionedDomain"
    );
    const domainId = created?.CreatedNode?.LedgerIndex || 
                    created?.CreatedNode?.NewFields?.DomainID || null;

    res.json({
      success: true,
      data: {
        transactionHash: signed.hash,
        domainId,
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

// Delete domain
router.post('/delete', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { adminSeed, domainId } = req.body;
    
    if (!adminSeed || !domainId) {
      return res.status(400).json({
        success: false,
        error: 'adminSeed and domainId are required'
      });
    }

    await client.connect();
    const adminWallet = Wallet.fromSeed(adminSeed.trim());

    const tx = {
      TransactionType: "PermissionedDomainDelete",
      Account: adminWallet.address,
      DomainID: domainId
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

// Get domain info
router.get('/info/:domainId', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { domainId } = req.params;
    await client.connect();

    const result = await client.request({
      command: "ledger_entry",
      index: domainId
    });

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

module.exports = router;
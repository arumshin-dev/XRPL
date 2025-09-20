const express = require('express');
const { Client, Wallet } = require('xrpl');
const router = express.Router();

// Create permissioned offer
router.post('/offer/create', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { userSeed, takerGets, takerPays, domainId, hybrid } = req.body;
    
    if (!userSeed || !takerGets || !takerPays || !domainId) {
      return res.status(400).json({
        success: false,
        error: 'userSeed, takerGets, takerPays, and domainId are required'
      });
    }

    await client.connect();
    const userWallet = Wallet.fromSeed(userSeed.trim());

    const tx = {
      TransactionType: "OfferCreate",
      Account: userWallet.address,
      TakerGets: takerGets,
      TakerPays: takerPays,
      DomainID: domainId,
      ...(hybrid ? { Flags: 0x00100000 } : {}) // tfHybrid
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

// Get book offers
router.get('/book', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { takerPays, takerGets, domainId, limit = 50 } = req.query;
    
    if (!takerPays || !takerGets) {
      return res.status(400).json({
        success: false,
        error: 'takerPays and takerGets are required'
      });
    }

    await client.connect();

    const request = {
      command: "book_offers",
      taker_pays: JSON.parse(takerPays),
      taker_gets: JSON.parse(takerGets),
      limit: parseInt(limit)
    };

    if (domainId) request.domain = domainId;

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

// Cancel offer
router.post('/offer/cancel', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    const { userSeed, offerSequence } = req.body;
    
    if (!userSeed || !offerSequence) {
      return res.status(400).json({
        success: false,
        error: 'userSeed and offerSequence are required'
      });
    }

    await client.connect();
    const userWallet = Wallet.fromSeed(userSeed.trim());

    const tx = {
      TransactionType: "OfferCancel",
      Account: userWallet.address,
      OfferSequence: offerSequence
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
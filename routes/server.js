const express = require('express');
const { Client } = require('xrpl');
const router = express.Router();

// Get server info
router.get('/info', async (req, res) => {
  const client = new Client("wss://s.devnet.rippletest.net:51233");
  
  try {
    await client.connect();

    const serverInfo = await client.request({
      command: "server_info"
    });

    const features = await client.request({
      command: "feature"
    });

    res.json({
      success: true,
      data: {
        version: serverInfo.result.info.build_version,
        features: features.result.features,
        serverInfo: serverInfo.result
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
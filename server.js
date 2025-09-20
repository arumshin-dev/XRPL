const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import route modules
const walletRoutes = require('./routes/wallet');
const paymentRoutes = require('./routes/payment');
const trustsetRoutes = require('./routes/trustset');
const accountsetRoutes = require('./routes/accountset');
const credentialRoutes = require('./routes/credential');
const permissionedDEXRoutes = require('./routes/permissionedDEX');
const permissionedDomainsRoutes = require('./routes/permissionedDomains');
const tokenEscrowRoutes = require('./routes/tokenEscrow');
const mptRoutes = require('./routes/mpt');
const batchRoutes = require('./routes/batch');
const ammRoutes = require('./routes/amm');
const serverRoutes = require('./routes/server');

// Use routes
app.use('/api/wallet', walletRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/trustset', trustsetRoutes);
app.use('/api/accountset', accountsetRoutes);
app.use('/api/credential', credentialRoutes);
app.use('/api/permissioned-dex', permissionedDEXRoutes);
app.use('/api/permissioned-domains', permissionedDomainsRoutes);
app.use('/api/token-escrow', tokenEscrowRoutes);
app.use('/api/mpt', mptRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/amm', ammRoutes);
app.use('/api/server', serverRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 XRPL Express Server running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}`);
});

module.exports = app;
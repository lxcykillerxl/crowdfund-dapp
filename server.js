const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { Web3 } = require('web3');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://demo:demo123@cluster0.mongodb.net/crowdfundDApp', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️ Continuing without MongoDB connection...');
  }
};

connectDB();

// Web3 setup - using Sepolia testnet for production demo
const web3 = new Web3(process.env.WEB3_PROVIDER_URL || 'https://sepolia.infura.io/v3/demo-key');
const contractAddress = process.env.CONTRACT_ADDRESS || '0x742d35Cc6634C0532925a3b8D404d1C8b2d69C42'; // Demo contract

const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "title", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "goal", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "CampaignCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "contributor", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "ContributionMade",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "campaigns",
    "outputs": [
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "uint256", "name": "goal", "type": "uint256"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
      {"internalType": "uint256", "name": "raised", "type": "uint256"},
      {"internalType": "bool", "name": "completed", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}],
    "name": "contribute",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_title", "type": "string"},
      {"internalType": "uint256", "name": "_goal", "type": "uint256"},
      {"internalType": "uint256", "name": "_deadline", "type": "uint256"}
    ],
    "name": "createCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}],
    "name": "releaseFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCampaignCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// MongoDB Schema
const campaignSchema = new mongoose.Schema({
  campaignId: Number,
  creator: String,
  title: String,
  goal: Number,
  deadline: Number,
  raised: Number,
  completed: Boolean,
  createdAt: { type: Date, default: Date.now }
});

const Campaign = mongoose.model('Campaign', campaignSchema);

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/campaigns', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Return demo data if DB not connected
      return res.json([
        {
          campaignId: 0,
          creator: '0x742d35Cc6634C0532925a3b8D404d1C8b2d69C42',
          title: 'Save the Ocean - Marine Conservation',
          goal: 5000000000000000000, // 5 ETH
          deadline: Math.floor(Date.now() / 1000) + 2592000, // 30 days
          raised: 1500000000000000000, // 1.5 ETH
          completed: false
        },
        {
          campaignId: 1,
          creator: '0x8ba1f109551bD432803012645Hac136c30C6756',
          title: 'Tech Education for Underprivileged Kids',
          goal: 3000000000000000000, // 3 ETH
          deadline: Math.floor(Date.now() / 1000) + 1728000, // 20 days
          raised: 3200000000000000000, // 3.2 ETH
          completed: true
        }
      ]);
    }
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/save-campaign', async (req, res) => {
  try {
    const { campaignId, creator, title, goal, deadline, raised, completed } = req.body;
    
    if (typeof campaignId !== 'number' || !creator || !title || !goal || !deadline) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (mongoose.connection.readyState === 1) {
      const campaign = new Campaign({
        campaignId,
        creator,
        title,
        goal,
        deadline,
        raised: raised || 0,
        completed: completed || false
      });
      await campaign.save();
      res.json(campaign);
    } else {
      res.json({ success: true, message: 'Demo mode - campaign saved locally' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/update-campaign', async (req, res) => {
  try {
    const { campaignId, raised, completed } = req.body;
    
    if (typeof campaignId !== 'number') {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }
    
    if (mongoose.connection.readyState === 1) {
      await Campaign.updateOne({ campaignId }, {
        raised: raised || 0,
        completed: completed || false
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }
    
    if (mongoose.connection.readyState === 1) {
      const campaign = await Campaign.findOne({ campaignId });
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json(campaign);
    } else {
      res.json({ message: 'Demo mode - campaign data not available' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CrowdFund3D Server running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
});
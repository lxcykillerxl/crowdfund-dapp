#!/bin/bash

echo "🚀 Deploying CrowdFund3D to GitHub..."

# Add all necessary files
git add .
git commit -m "Production ready: CrowdFund3D decentralized crowdfunding platform"

# Push to GitHub
git push -u origin main

echo "✅ Successfully pushed to GitHub!"
echo "🌐 Repository: https://github.com/lxcykillerxl/crowdfund-dapp"
echo ""
echo "🚀 Next steps:"
echo "1. Go to Railway.app"
echo "2. Connect your GitHub account"
echo "3. Select the crowdfund-dapp repository"
echo "4. Deploy with one click!"
echo ""
echo "🎉 Your app will be live in minutes!"
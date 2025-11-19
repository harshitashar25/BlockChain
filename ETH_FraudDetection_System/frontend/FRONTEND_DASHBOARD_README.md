# 🎨 Blockchain Monitor Dashboard - Frontend

A beautiful, real-time dashboard for monitoring blockchain wallet and contract activity.

## ✨ Features

- **Real-time Activity Feed** - See transactions as they happen
- **WebSocket Integration** - Live updates without page refresh
- **Address Tracking** - Add/remove wallets to monitor
- **Activity Filtering** - Filter by ETH, Tokens, NFTs, or Contracts
- **Webhook Configuration** - Set up webhooks for each tracked address
- **Transaction Details** - View full transaction information
- **Balance Tracking** - See balance changes in real-time
- **Multi-Activity Detection** - Detects ETH, tokens, NFTs, and contract calls
- **Etherscan Links** - Quick access to view transactions on Etherscan

## 🚀 Getting Started

### 1. Make sure backend is running

The frontend connects to the backend API at `http://localhost:5000` by default.

```bash
cd backend
npm start
```

### 2. Start the frontend

```bash
cd frontend
npm start
```

The dashboard will open at `http://localhost:3001` (port changed from 3000).

## 📊 Dashboard Components

### Header
- Connection status indicator
- Current block number
- Service title and description

### Stats Cards
- Tracked Wallets count
- Tracked Contracts count
- Total Activities detected
- Network name

### Add Address Section
- Input field for Ethereum address
- "Track Address" button
- Validates address format

### Tracked Addresses
- List of all tracked addresses
- Configure webhook button for each address
- Remove address button
- Quick link to Etherscan

### Activity Feed
- Real-time transaction feed
- Filter buttons (All, ETH, Token, NFT, Contract)
- Detailed transaction information:
  - From/To addresses
  - Transaction value
  - Block number
  - Status (success/failed)
  - Token transfers
  - NFT transfers
  - Contract interactions
  - Balance changes

## 🎯 Usage

### Adding an Address to Track

1. Enter an Ethereum address in the input field
2. Click "Track Address"
3. The address will appear in the "Tracked Addresses" section
4. Any activity on this address will appear in the Activity Feed

### Configuring Webhooks

1. Click "Configure Webhook" on any tracked address
2. Enter your webhook URL (e.g., `https://your-server.com/webhook`)
3. Click "Save"
4. Your server will receive POST requests whenever activity is detected

### Filtering Activities

Use the filter buttons at the top of the Activity Feed:
- **All** - Show all activities
- **ETH** - Show only ETH transfers
- **Token** - Show only token transfers (ERC20)
- **NFT** - Show only NFT transfers (ERC721/ERC1155)
- **Contract** - Show only contract interactions

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

If not set, defaults to:
- API: `http://localhost:5000`
- WebSocket: `ws://localhost:5000`

## 🎨 Design Features

- **Dark Theme** - Modern dark color scheme
- **Gradient Accents** - Purple/blue gradient for highlights
- **Real-time Updates** - Smooth animations for new activities
- **Responsive Layout** - Works on different screen sizes
- **Professional UI** - Clean, modern interface

## 📱 Activity Types Displayed

### ETH Transfer
- Shows native ETH transfers
- Displays value in ETH
- Shows balance changes

### Token Transfer (ERC20)
- Token contract address
- Token amount transferred
- From/To addresses

### NFT Transfer (ERC721/ERC1155)
- NFT contract address
- Token ID
- Standard (ERC721 or ERC1155)

### Contract Interaction
- Contract address
- Function name called
- Interaction details

## 🔗 Integration with Backend

The dashboard automatically connects to:
- **REST API** - For managing tracked addresses and fetching data
- **WebSocket** - For real-time activity updates

## 🐛 Troubleshooting

### Dashboard shows "Disconnected"
- Make sure the backend server is running on port 5000
- Check that WebSocket connection is working
- Verify CORS is enabled on the backend

### No activities showing
- Make sure you've added at least one address to track
- Wait for new blocks to be mined (Ethereum ~12 seconds)
- Check that the tracked address has recent activity

### Webhook not working
- Verify the webhook URL is correct
- Check that your server accepts POST requests
- Look at browser console for errors

## 📚 Next Steps

- Add more filtering options
- Add transaction graph visualization
- Add export functionality
- Add notification system
- Add multi-chain support UI

## 🎉 Enjoy!

Your blockchain monitoring dashboard is ready to track wallet activity in real-time!


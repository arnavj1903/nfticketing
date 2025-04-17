# Blockchain Event Ticketing System

A simple dApp that implements event ticketing as NFTs on the blockchain, preventing ticket fraud and allowing secure transfers.

## Features

- Create event with limited number of tickets
- Mint ticket NFTs
- View your tickets with QR code
- Transfer tickets to other users
- Verify ticket ownership
- Mark tickets as used
- Admin controls for event organizers

## Tech Stack

- Smart Contract: Solidity (ERC-721)
- Development Framework: Hardhat
- Frontend: HTML, CSS, Bootstrap, JavaScript
- Web3 Integration: ethers.js

## Prerequisites

- Node.js (v14+)
- npm or yarn
- MetaMask browser extension

## Setup Instructions

1. Clone this repository
   ```
   git clone <repository-url>
   cd blockchain-event-ticketing
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Install required packages
   ```
   npm install @openzeppelin/contracts @nomicfoundation/hardhat-toolbox
   ```

4. Compile the smart contracts
   ```
   npx hardhat compile
   ```

5. Start local Hardhat node
   ```
   npx hardhat node
   ```

6. Deploy the contract to the local network (in a new terminal)
   ```
   npx hardhat run scripts/deploy.js --network localhost
   ```
   
   Note the deployed contract address and update the `CONTRACT_ADDRESS` in `app.js`

7. Serve the frontend (in a new terminal)
   ```
   npx serve
   ```

8. Open your browser and navigate to `http://localhost:3000`

9. Connect your MetaMask to the Hardhat network:
   - Network Name: Hardhat
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

## Usage Instructions

1. Connect your MetaMask wallet by clicking the "Connect" button
2. Buy tickets by clicking the "Buy Ticket" button
3. View your tickets in the "My Tickets" section
4. Click on a ticket to view details, mark as used, or transfer it
5. If you're the event organizer (contract deployer), you can withdraw funds

## Project Structure

- `contracts/` - Contains the Solidity smart contract
- `scripts/` - Contains the deployment script
- `src/` - Frontend files (HTML, CSS, JS)
- `hardhat.config.js` - Hardhat configuration

## Additional Notes

- This is a simplified implementation for demonstration purposes
- The contract uses OpenZeppelin's ERC-721 implementation for NFT functionality
- The frontend connects to MetaMask and interacts with the deployed contract
- In a production environment, additional security measures would be necessary
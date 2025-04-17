// Constants
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // This will change after deployment
let currentAccount = null;
let provider;
let signer;
let contract;
let isOwner = false;

// Elements
const connectMessage = document.getElementById('connectMessage');
const eventDetails = document.getElementById('eventDetails');
const actionsPanel = document.getElementById('actionsPanel');
const organizerPanel = document.getElementById('organizerPanel');
const noTicketsMessage = document.getElementById('noTicketsMessage');
const myTickets = document.getElementById('myTickets');

// Initialize application
async function init() {
  // Check if MetaMask is installed
  if (typeof window.ethereum === 'undefined') {
    connectMessage.textContent = 'Please install MetaMask to use this application';
    connectMessage.classList.remove('alert-warning');
    connectMessage.classList.add('alert-danger');
    return;
  }
  
  // Setup event listeners
  setupEventListeners();
  
  // Connect to provider
  try {
    await connectWallet();
  } catch (error) {
    console.error('Failed to connect wallet:', error);
  }
}

// Connect wallet and initialize contract
async function connectWallet() {
  try {
    // Connect to MetaMask
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    handleAccountsChanged(accounts);
    
    // Setup provider
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    
    // Setup contract
    const abi = await getContractABI();
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    
    // Hide connect message
    connectMessage.style.display = 'none';
    
    // Check if user is the contract owner
    const owner = await contract.owner();
    isOwner = owner.toLowerCase() === currentAccount.toLowerCase();
    
    // Show organizer panel if user is owner
    if (isOwner) {
      organizerPanel.style.display = 'block';
    }
    
    // Load event details
    await loadEventDetails();
    
    // Load user's tickets
    await loadUserTickets();
    
    // Show panels
    eventDetails.style.display = 'block';
    actionsPanel.style.display = 'block';
    
  } catch (error) {
    console.error('Error connecting wallet:', error);
    connectMessage.textContent = 'Failed to connect wallet: ' + error.message;
    connectMessage.classList.remove('alert-warning');
    connectMessage.classList.add('alert-danger');
  }
}

// Setup event listeners
function setupEventListeners() {
  // MetaMask events
  window.ethereum.on('accountsChanged', handleAccountsChanged);
  window.ethereum.on('chainChanged', () => window.location.reload());
  
  // Button events
  document.getElementById('buyTicketBtn').addEventListener('click', buyTicket);
  document.getElementById('useTicketBtn').addEventListener('click', useTicket);
  document.getElementById('transferTicketBtn').addEventListener('click', showTransferModal);
  document.getElementById('confirmTransferBtn').addEventListener('click', transferTicket);
  document.getElementById('withdrawBtn').addEventListener('click', withdrawFunds);
}

// Handle accounts change
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    connectMessage.style.display = 'block';
    eventDetails.style.display = 'none';
    actionsPanel.style.display = 'none';
    organizerPanel.style.display = 'none';
    currentAccount = null;
  } else if (accounts[0] !== currentAccount) {
    currentAccount = accounts[0];
    // Update signer and contract to use the new account
    provider = new ethers.BrowserProvider(window.ethereum);
    provider.getSigner().then(newSigner => {
      signer = newSigner;
      getContractABI().then(abi => {
        contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        // Re-check owner status
        contract.owner().then(owner => {
          isOwner = owner.toLowerCase() === currentAccount.toLowerCase();
          if (isOwner) {
            organizerPanel.style.display = 'block';
          } else {
            organizerPanel.style.display = 'none';
          }
        });
        loadUserTickets();
      });
    });
  }
}

// Load event details from contract
async function loadEventDetails() {
  try {
    const eventName = await contract.eventName();
    const eventDate = await contract.eventDate();
    const eventVenue = await contract.eventVenue();
    const maxTickets = await contract.maxTickets();
    const totalSupply = await contract.totalSupply();
    const ticketPrice = await contract.TICKET_PRICE();
    
    document.getElementById('eventName').textContent = eventName;
    document.getElementById('eventDate').textContent = eventDate;
    document.getElementById('eventVenue').textContent = eventVenue;
    document.getElementById('ticketsAvailable').textContent = `${maxTickets - totalSupply} / ${maxTickets}`;
    document.getElementById('ticketPrice').textContent = ethers.formatEther(ticketPrice);
    
  } catch (error) {
    console.error('Error loading event details:', error);
  }
}

// Load user's tickets
async function loadUserTickets() {
  try {
    // Clear existing tickets
    myTickets.innerHTML = '';
    
    // Check balance
    const balance = await contract.balanceOf(currentAccount);
    
    if (balance > 0) {
      noTicketsMessage.style.display = 'none';
      
      // Loop through user's tickets
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(currentAccount, i);
        const metadata = await contract.getTicketMetadata(tokenId);
        const isUsed = await contract.isTicketUsed(tokenId);
        
        // Create ticket card
        const ticketCard = createTicketCard(tokenId, metadata, isUsed);
        myTickets.appendChild(ticketCard);
      }
      
    } else {
      noTicketsMessage.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error loading user tickets:', error);
  }
}

// Create ticket card element
function createTicketCard(ticketId, metadata, isUsed) {
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';
  
  const card = document.createElement('div');
  card.className = 'card my-ticket';
  card.dataset.ticketId = ticketId;
  
  if (isUsed) {
    card.classList.add('bg-light');
  }
  
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';
  
  const title = document.createElement('h5');
  title.className = 'card-title';
  title.textContent = `Ticket #${ticketId}`;
  
  const status = document.createElement('p');
  status.className = isUsed ? 'text-danger' : 'text-success';
  status.textContent = isUsed ? 'Used' : 'Valid';
  
  cardBody.appendChild(title);
  cardBody.appendChild(status);
  card.appendChild(cardBody);
  col.appendChild(card);
  
  // Add event listener to show modal
  card.addEventListener('click', () => showTicketModal(ticketId, metadata, isUsed));
  
  return col;
}

// Show ticket modal
async function showTicketModal(ticketId, metadata, isUsed) {
  try {
    // Parse metadata
    const parts = metadata.split(', ');
    const eventName = parts[0].replace('Event: ', '');
    const eventDate = parts[1].replace('Date: ', '');
    const eventVenue = parts[2].replace('Venue: ', '');
    
    // Set modal content
    document.getElementById('modalEventName').textContent = eventName;
    document.getElementById('modalEventDate').textContent = eventDate;
    document.getElementById('modalEventVenue').textContent = eventVenue;
    document.getElementById('modalTicketId').textContent = ticketId;
    document.getElementById('modalTicketStatus').textContent = isUsed ? 'Used' : 'Valid';
    document.getElementById('modalTicketStatus').className = isUsed ? 'text-danger' : 'text-success';
    
    // Button state
    document.getElementById('useTicketBtn').disabled = isUsed;
    document.getElementById('transferTicketBtn').disabled = isUsed;
    
    // Set ticket ID for actions
    document.getElementById('useTicketBtn').dataset.ticketId = ticketId;
    document.getElementById('transferTicketBtn').dataset.ticketId = ticketId;
    
    // Generate QR code
    const qrContainer = document.getElementById('qrCode');
    qrContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    qrContainer.appendChild(canvas);
    await QRCode.toCanvas(canvas, JSON.stringify({
      contractAddress: CONTRACT_ADDRESS,
      ticketId: ticketId.toString(),
      owner: currentAccount
    }), { width: 150 });
    
    // Show modal
    const ticketModal = new bootstrap.Modal(document.getElementById('ticketModal'));
    ticketModal.show();
    
  } catch (error) {
    console.error('Error showing ticket modal:', error);
  }
}

// Buy ticket
async function buyTicket() {
  try {
    const ticketPrice = await contract.TICKET_PRICE();
    
    // Send transaction
    const tx = await contract.mintTicket({ value: ticketPrice });
    
    // Wait for confirmation
    alert('Purchasing ticket... Please wait for confirmation.');
    await tx.wait();
    
    // Reload ticket info
    await loadEventDetails();
    await loadUserTickets();
    
    alert('Ticket purchased successfully!');
    
  } catch (error) {
    console.error('Error buying ticket:', error);
    alert('Failed to buy ticket: ' + error.message);
  }
}

// Mark ticket as used
async function useTicket() {
  try {
    const ticketId = document.getElementById('useTicketBtn').dataset.ticketId;
    
    // Send transaction
    const tx = await contract.useTicket(ticketId);
    
    // Wait for confirmation
    alert('Marking ticket as used... Please wait for confirmation.');
    await tx.wait();
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('ticketModal')).hide();
    
    // Reload ticket info
    await loadUserTickets();
    
    alert('Ticket marked as used successfully!');
    
  } catch (error) {
    console.error('Error using ticket:', error);
    alert('Failed to mark ticket as used: ' + error.message);
  }
}

// Show transfer modal
function showTransferModal() {
  const ticketId = document.getElementById('transferTicketBtn').dataset.ticketId;
  document.getElementById('confirmTransferBtn').dataset.ticketId = ticketId;
  
  // Hide ticket modal and show transfer modal
  bootstrap.Modal.getInstance(document.getElementById('ticketModal')).hide();
  const transferModal = new bootstrap.Modal(document.getElementById('transferModal'));
  transferModal.show();
}

// Transfer ticket
async function transferTicket() {
  try {
    const ticketId = document.getElementById('confirmTransferBtn').dataset.ticketId;
    const recipient = document.getElementById('recipientAddress').value.trim();
    
    // Validate recipient address
    if (!ethers.isAddress(recipient)) {
      alert('Please enter a valid Ethereum address');
      return;
    }
    
    // Send transaction
    const tx = await contract.transferFrom(currentAccount, recipient, ticketId);
    
    // Wait for confirmation
    alert('Transferring ticket... Please wait for confirmation.');
    await tx.wait();
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
    
    // Reload ticket info
    await loadUserTickets();
    
    alert('Ticket transferred successfully!');
    
  } catch (error) {
    console.error('Error transferring ticket:', error);
    alert('Failed to transfer ticket: ' + error.message);
  }
}

// Withdraw funds (organizer only)
async function withdrawFunds() {
  try {
    if (!isOwner) {
      alert('Only the event organizer can withdraw funds');
      return;
    }
    
    // Send transaction
    const tx = await contract.withdraw();
    
    // Wait for confirmation
    alert('Withdrawing funds... Please wait for confirmation.');
    await tx.wait();
    
    alert('Funds withdrawn successfully!');
    
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    alert('Failed to withdraw funds: ' + error.message);
  }
}

// Get contract ABI (in production, this would be loaded from a file)
async function getContractABI() {
  // This is a simplified ABI for demonstration purposes
  // In a real project, you would load this from the artifacts directory
  return [
    "function owner() view returns (address)",
    "function eventName() view returns (string)",
    "function eventDate() view returns (string)",
    "function eventVenue() view returns (string)",
    "function maxTickets() view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function TICKET_PRICE() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function ownerOf(uint256) view returns (address)",
    "function tokenOfOwnerByIndex(address, uint256) view returns (uint256)",
    "function getTicketMetadata(uint256) view returns (string)",
    "function isTicketUsed(uint256) view returns (bool)",
    "function mintTicket() payable returns (uint256)",
    "function useTicket(uint256)",
    "function transferFrom(address, address, uint256)",
    "function withdraw()"
  ];
}

// Initialize app when the page loads
window.addEventListener('DOMContentLoaded', init);
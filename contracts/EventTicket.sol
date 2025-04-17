// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventTicket is ERC721, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    uint256 public constant TICKET_PRICE = 0.01 ether;
    uint256 public maxTickets;
    string public eventName;
    string public eventDate;
    string public eventVenue;

    // Tracking used tickets to prevent reentry
    mapping(uint256 => bool) public usedTickets;

    // Metadata for tickets
    mapping(uint256 => string) public ticketMetadata;

    event TicketMinted(address owner, uint256 ticketId);
    event TicketUsed(uint256 ticketId);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _eventName,
        string memory _eventDate,
        string memory _eventVenue,
        uint256 _maxTickets
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        eventName = _eventName;
        eventDate = _eventDate;
        eventVenue = _eventVenue;
        maxTickets = _maxTickets;
    }

    function mintTicket() public payable returns (uint256) {
        require(totalSupply() < maxTickets, "All tickets have been sold");
        require(msg.value >= TICKET_PRICE, "Insufficient payment");

        uint256 ticketId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, ticketId);

        // Set default metadata
        ticketMetadata[ticketId] = string(abi.encodePacked(
            "Event: ", eventName, ", Date: ", eventDate, ", Venue: ", eventVenue, ", Ticket #", toString(ticketId)
        ));

        emit TicketMinted(msg.sender, ticketId);

        return ticketId;
    }

    // Modified to ensure only owner can mark tickets as used
    function useTicket(uint256 _ticketId) public onlyOwner {
        require(_ticketId < _tokenIdCounter, "Ticket does not exist");
        require(!usedTickets[_ticketId], "Ticket already used");

        usedTickets[_ticketId] = true;
        emit TicketUsed(_ticketId);
    }

    function isTicketUsed(uint256 _ticketId) public view returns (bool) {
        return usedTickets[_ticketId];
    }

    function getTicketMetadata(uint256 _ticketId) public view returns (string memory) {
        require(_ticketId < _tokenIdCounter, "Ticket does not exist"); // Ensure ticket exists
        return ticketMetadata[_ticketId];
    }

    // Required override for Solidity multiple inheritance
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Required override for Solidity multiple inheritance (OpenZeppelin v5.x)
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function setTicketMetadata(uint256 _ticketId, string memory _metadata) public {
        require(ownerOf(_ticketId) == msg.sender || msg.sender == owner(), "Not authorized");
        ticketMetadata[_ticketId] = _metadata;
    }

    // Updated withdraw function to ensure it works correctly
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }

    // Helper function to convert uint to string
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }
}
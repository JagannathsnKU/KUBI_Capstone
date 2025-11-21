// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ChainlinkOracle {
    function requestPlaidBalance(string calldata userId) external returns (bytes32 requestId);
}

contract PlaidQuestNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    address public oracle;
    
    struct QuestResult {
        bool completed;
        uint256 value;
        string details;
        uint256 tokenId; // NFT token ID for this quest
    }
    
    struct QuestNFT {
        string questId;
        address user;
        uint256 timestamp;
        string metadataURI;
    }
    
    // user => questId => QuestResult
    mapping(address => mapping(string => QuestResult)) public userQuestResults;
    
    // tokenId => QuestNFT
    mapping(uint256 => QuestNFT) public questNFTs;
    
    // user => questId => tokenId (for quick lookup)
    mapping(address => mapping(string => uint256)) public userQuestTokenIds;
    
    event QuestCompleted(address indexed user, string questId, bool completed, uint256 value, string details);
    event QuestNFTMinted(address indexed user, string questId, uint256 tokenId);
    
    constructor(address _oracle) ERC721("PlaidQuest Achievement", "PLAIDQ") Ownable(msg.sender) {
        oracle = _oracle; // Can be zero address if not using oracle
    }
    
    // Called by frontend to request Plaid balance via Chainlink
    function requestBalance(string calldata userId) external {
        ChainlinkOracle(oracle).requestPlaidBalance(userId);
    }
    
    // Called by oracle to fulfill quest and mint NFT
    function fulfillQuest(
        address user,
        string calldata questId,
        bool completed,
        uint256 value,
        string calldata details
    ) external returns (uint256) {
        require(msg.sender == oracle || msg.sender == owner(), "Only oracle or owner can fulfill");
        
        // Store quest result
        userQuestResults[user][questId] = QuestResult(completed, value, details, 0);
        
        // Only mint NFT if quest is completed
        uint256 tokenId = 0;
        if (completed) {
            // Check if NFT already exists for this quest
            if (userQuestTokenIds[user][questId] == 0) {
                // Mint new NFT
                tokenId = _tokenIdCounter;
                _tokenIdCounter++;
                
                _safeMint(user, tokenId);
                
                // Create metadata URI (can be updated later with IPFS)
                string memory metadataURI = string(abi.encodePacked(
                    "https://api.plaidquest.com/nft/",
                    toString(tokenId)
                ));
                
                _setTokenURI(tokenId, metadataURI);
                
                // Store NFT data
                questNFTs[tokenId] = QuestNFT({
                    questId: questId,
                    user: user,
                    timestamp: block.timestamp,
                    metadataURI: metadataURI
                });
                
                // Update quest result with token ID
                userQuestResults[user][questId].tokenId = tokenId;
                userQuestTokenIds[user][questId] = tokenId;
                
                emit QuestNFTMinted(user, questId, tokenId);
            } else {
                // NFT already exists
                tokenId = userQuestTokenIds[user][questId];
            }
        }
        
        emit QuestCompleted(user, questId, completed, value, details);
        return tokenId;
    }
    
    // Direct mint function for owner (simplified for quest completion)
    function mintQuestNFT(
        address to,
        string calldata questId,
        string calldata metadataURI
    ) external onlyOwner returns (uint256) {
        // Check if NFT already exists for this quest
        if (userQuestTokenIds[to][questId] != 0) {
            return userQuestTokenIds[to][questId];
        }
        
        // Mint new NFT
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        
        // Set token URI
        if (bytes(metadataURI).length > 0) {
            _setTokenURI(tokenId, metadataURI);
        } else {
            // Default metadata URI
            string memory defaultURI = string(abi.encodePacked(
                "https://api.plaidquest.com/nft/",
                toString(tokenId)
            ));
            _setTokenURI(tokenId, defaultURI);
        }
        
        // Store NFT data
        questNFTs[tokenId] = QuestNFT({
            questId: questId,
            user: to,
            timestamp: block.timestamp,
            metadataURI: bytes(metadataURI).length > 0 ? metadataURI : string(abi.encodePacked("https://api.plaidquest.com/nft/", toString(tokenId)))
        });
        
        // Update mappings
        userQuestTokenIds[to][questId] = tokenId;
        userQuestResults[to][questId] = QuestResult(true, 0, "", tokenId);
        
        emit QuestNFTMinted(to, questId, tokenId);
        emit QuestCompleted(to, questId, true, 0, "");
        
        return tokenId;
    }
    
    // Get NFT token ID for a user's quest
    function getQuestTokenId(address user, string calldata questId) external view returns (uint256) {
        return userQuestTokenIds[user][questId];
    }
    
    // Get all token IDs owned by a user
    function getUserTokenIds(address user) external view returns (uint256[] memory) {
        uint256 totalSupply = _tokenIdCounter;
        uint256[] memory tokenIds = new uint256[](totalSupply);
        uint256 count = 0;
        
        for (uint256 i = 0; i < totalSupply; i++) {
            if (_ownerOf(i) == user) {
                tokenIds[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tokenIds[i];
        }
        
        return result;
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
    
    // Override required by Solidity
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}


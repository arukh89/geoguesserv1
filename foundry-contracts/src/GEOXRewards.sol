// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GEOXRewards
 * @notice Claim GEOX tokens with signature verification + Dynamic NFT receipt
 * @dev Admin signs claim data, user claims with signature, receives tokens + NFT
 */
contract GEOXRewards is ERC721, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using Strings for uint256;

    // GEOX Token on Base Mainnet
    IERC20 public immutable geoxToken;
    
    // Admin signer address
    address public signer;
    
    // Claim deadline duration (3 days)
    uint256 public constant CLAIM_DEADLINE = 3 days;
    
    // Track claimed weeks per user
    mapping(address => mapping(uint256 => bool)) public hasClaimed;
    
    // Track used nonces to prevent replay
    mapping(bytes32 => bool) public usedSignatures;
    
    // NFT token ID counter
    uint256 private _tokenIdCounter;
    
    // User data for dynamic NFT
    struct UserData {
        uint256 tokenId;
        string username;
        string pfpUrl;
        uint256 totalPoints;
        uint256 highestRank;
        uint256 totalClaims;
        uint256 lastClaimWeek;
    }
    
    // Mapping from user address to their data
    mapping(address => UserData) public userData;
    
    // Mapping from tokenId to owner (for reverse lookup)
    mapping(uint256 => address) public tokenOwnerData;

    // Weekly reward amounts (in wei, 18 decimals)
    uint256[10] public weeklyRewards = [
        937_500 * 1e18,  // Rank 1
        675_000 * 1e18,  // Rank 2
        487_500 * 1e18,  // Rank 3
        375_000 * 1e18,  // Rank 4
        300_000 * 1e18,  // Rank 5
        262_500 * 1e18,  // Rank 6
        225_000 * 1e18,  // Rank 7
        187_500 * 1e18,  // Rank 8
        150_000 * 1e18,  // Rank 9
        150_000 * 1e18   // Rank 10
    ];

    event RewardClaimed(
        address indexed user,
        uint256 indexed weekId,
        uint256 rank,
        uint256 amount,
        uint256 points,
        uint256 tokenId
    );
    
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);

    constructor(
        address _geoxToken,
        address _signer
    ) ERC721("GEOX Explorer Badge", "GEOXBADGE") Ownable(msg.sender) {
        geoxToken = IERC20(_geoxToken);
        signer = _signer;
    }

    /**
     * @notice Claim weekly reward with admin signature
     * @param weekId Week identifier
     * @param rank User's rank (1-10)
     * @param points User's points for the week
     * @param username Farcaster username
     * @param pfpUrl Profile picture URL
     * @param deadline Signature expiry timestamp
     * @param signature Admin signature
     */
    function claimReward(
        uint256 weekId,
        uint256 rank,
        uint256 points,
        string calldata username,
        string calldata pfpUrl,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Signature expired");
        require(rank >= 1 && rank <= 10, "Invalid rank");
        require(!hasClaimed[msg.sender][weekId], "Already claimed this week");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            weekId,
            rank,
            points,
            username,
            pfpUrl,
            deadline
        ));
        
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        require(!usedSignatures[ethSignedHash], "Signature already used");
        require(ethSignedHash.recover(signature) == signer, "Invalid signature");
        
        // Mark as claimed
        hasClaimed[msg.sender][weekId] = true;
        usedSignatures[ethSignedHash] = true;
        
        // Get reward amount
        uint256 rewardAmount = weeklyRewards[rank - 1];
        
        // Transfer GEOX tokens
        require(geoxToken.transfer(msg.sender, rewardAmount), "Token transfer failed");
        
        // Handle NFT - mint new or update existing
        uint256 tokenId = _handleNFT(msg.sender, username, pfpUrl, points, rank, weekId);
        
        emit RewardClaimed(msg.sender, weekId, rank, rewardAmount, points, tokenId);
    }

    /**
     * @dev Mint new NFT or update existing one
     */
    function _handleNFT(
        address user,
        string calldata username,
        string calldata pfpUrl,
        uint256 points,
        uint256 rank,
        uint256 weekId
    ) internal returns (uint256) {
        UserData storage data = userData[user];
        
        if (data.tokenId == 0) {
            // First claim - mint new NFT
            _tokenIdCounter++;
            uint256 newTokenId = _tokenIdCounter;
            
            _safeMint(user, newTokenId);
            
            data.tokenId = newTokenId;
            data.username = username;
            data.pfpUrl = pfpUrl;
            data.totalPoints = points;
            data.highestRank = rank;
            data.totalClaims = 1;
            data.lastClaimWeek = weekId;
            
            tokenOwnerData[newTokenId] = user;
            
            return newTokenId;
        } else {
            // Update existing NFT data
            data.totalPoints += points;
            data.totalClaims++;
            data.lastClaimWeek = weekId;
            
            if (rank < data.highestRank) {
                data.highestRank = rank;
            }
            
            // Update username/pfp if changed
            if (bytes(username).length > 0) {
                data.username = username;
            }
            if (bytes(pfpUrl).length > 0) {
                data.pfpUrl = pfpUrl;
            }
            
            return data.tokenId;
        }
    }

    /**
     * @notice Generate on-chain SVG for NFT (Matrix theme)
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenOwnerData[tokenId] != address(0), "Token does not exist");
        
        address owner = tokenOwnerData[tokenId];
        UserData memory data = userData[owner];
        
        string memory svg = _generateSVG(data);
        
        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name":"GEOX Explorer Badge #', tokenId.toString(),
            '","description":"Dynamic NFT badge for GEOX Explorer game. Built by @ukyh89",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)),
            '","attributes":[',
            '{"trait_type":"Username","value":"', data.username, '"},',
            '{"trait_type":"Total Points","value":', data.totalPoints.toString(), '},',
            '{"trait_type":"Highest Rank","value":', data.highestRank.toString(), '},',
            '{"trait_type":"Total Claims","value":', data.totalClaims.toString(), '}',
            ']}'
        ))));
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /**
     * @dev Generate Matrix-themed SVG
     */
    function _generateSVG(UserData memory data) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">',
            '<defs>',
            '<linearGradient id="matrixGrad" x1="0%" y1="0%" x2="0%" y2="100%">',
            '<stop offset="0%" style="stop-color:#001a00"/>',
            '<stop offset="100%" style="stop-color:#000000"/>',
            '</linearGradient>',
            '</defs>',
            '<rect width="400" height="500" fill="url(#matrixGrad)"/>',
            _generateMatrixRain(),
            '<rect x="20" y="20" width="360" height="460" rx="10" fill="none" stroke="#00ff41" stroke-width="2" opacity="0.8"/>',
            '<text x="200" y="60" font-family="monospace" font-size="24" fill="#00ff41" text-anchor="middle" font-weight="bold">GEOX EXPLORER</text>',
            '<line x1="40" y1="80" x2="360" y2="80" stroke="#00ff41" stroke-width="1" opacity="0.5"/>',
            '<text x="200" y="140" font-family="monospace" font-size="18" fill="#00ff41" text-anchor="middle">@', data.username, '</text>',
            '<text x="200" y="200" font-family="monospace" font-size="14" fill="#00ff41" text-anchor="middle" opacity="0.8">TOTAL POINTS</text>',
            '<text x="200" y="240" font-family="monospace" font-size="36" fill="#00ff41" text-anchor="middle" font-weight="bold">', data.totalPoints.toString(), '</text>',
            '<text x="120" y="310" font-family="monospace" font-size="12" fill="#00ff41" text-anchor="middle" opacity="0.8">BEST RANK</text>',
            '<text x="120" y="340" font-family="monospace" font-size="24" fill="#00ff41" text-anchor="middle">#', data.highestRank.toString(), '</text>',
            '<text x="280" y="310" font-family="monospace" font-size="12" fill="#00ff41" text-anchor="middle" opacity="0.8">CLAIMS</text>',
            '<text x="280" y="340" font-family="monospace" font-size="24" fill="#00ff41" text-anchor="middle">', data.totalClaims.toString(), '</text>',
            '<line x1="40" y1="400" x2="360" y2="400" stroke="#00ff41" stroke-width="1" opacity="0.5"/>',
            '<text x="200" y="440" font-family="monospace" font-size="10" fill="#00ff41" text-anchor="middle" opacity="0.6">Built by @ukyh89</text>',
            '<text x="200" y="460" font-family="monospace" font-size="10" fill="#00ff41" text-anchor="middle" opacity="0.6">Base Mainnet</text>',
            '</svg>'
        ));
    }

    /**
     * @dev Generate matrix rain effect (simplified for gas)
     */
    function _generateMatrixRain() internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<g opacity="0.3" fill="#00ff41" font-family="monospace" font-size="10">',
            '<text x="30" y="100">1</text><text x="30" y="200">0</text><text x="30" y="300">1</text>',
            '<text x="70" y="150">0</text><text x="70" y="250">1</text><text x="70" y="350">0</text>',
            '<text x="330" y="120">1</text><text x="330" y="220">0</text><text x="330" y="320">1</text>',
            '<text x="370" y="170">0</text><text x="370" y="270">1</text><text x="370" y="370">0</text>',
            '</g>'
        ));
    }

    /**
     * @notice Update signer address
     */
    function setSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer");
        emit SignerUpdated(signer, _newSigner);
        signer = _newSigner;
    }

    /**
     * @notice Withdraw tokens (emergency)
     */
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @notice Get current week ID
     */
    function getCurrentWeekId() public view returns (uint256) {
        return block.timestamp / 1 weeks;
    }

    /**
     * @notice Check if user can claim for a week
     */
    function canClaim(address user, uint256 weekId) external view returns (bool) {
        return !hasClaimed[user][weekId];
    }

    /**
     * @notice Get user's NFT data
     */
    function getUserData(address user) external view returns (UserData memory) {
        return userData[user];
    }

    /**
     * @notice Override transfer to update tokenOwnerData
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = super._update(to, tokenId, auth);
        
        if (from != address(0) && to != address(0)) {
            // Transfer - update owner mapping
            tokenOwnerData[tokenId] = to;
            
            // Move user data to new owner
            userData[to] = userData[from];
            userData[to].tokenId = tokenId;
            delete userData[from];
        }
        
        return from;
    }
}

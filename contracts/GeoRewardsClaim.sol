// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GeoRewardsClaim
 * @notice Contract for users to claim GEO token rewards from Farcaster Geo Explorer
 * @dev Uses EIP-712 signatures for secure claim verification
 */
contract GeoRewardsClaim is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // GEO Token on Base Mainnet
    IERC20 public immutable geoToken;
    
    // Signer address (admin who approves rewards)
    address public signer;
    
    // Track claimed rewards: keccak256(fid, weekId) => claimed
    mapping(bytes32 => bool) public claimed;
    
    // Events
    event RewardClaimed(
        address indexed recipient,
        uint256 indexed fid,
        uint256 indexed weekId,
        uint256 amount
    );
    event SignerUpdated(address oldSigner, address newSigner);
    event TokensWithdrawn(address token, uint256 amount);

    // EIP-712 Domain
    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    
    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "Claim(address recipient,uint256 amount,uint256 fid,uint256 weekId,uint256 deadline)"
    );
    
    bytes32 public immutable DOMAIN_SEPARATOR;

    constructor(
        address _geoToken,
        address _signer,
        address _owner
    ) Ownable(_owner) {
        require(_geoToken != address(0), "Invalid token");
        require(_signer != address(0), "Invalid signer");
        
        geoToken = IERC20(_geoToken);
        signer = _signer;
        
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256("GeoRewardsClaim"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @notice Claim GEO token rewards
     * @param amount Amount of GEO tokens to claim (in wei)
     * @param fid Farcaster ID of the user
     * @param weekId Week identifier for the reward
     * @param deadline Timestamp after which signature is invalid
     * @param signature Admin signature authorizing the claim
     */
    function claim(
        uint256 amount,
        uint256 fid,
        uint256 weekId,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant {
        require(block.timestamp <= deadline, "Signature expired");
        require(amount > 0, "Amount must be > 0");
        
        // Check if already claimed
        bytes32 claimKey = keccak256(abi.encodePacked(fid, weekId));
        require(!claimed[claimKey], "Already claimed");
        
        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                msg.sender,
                amount,
                fid,
                weekId,
                deadline
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        
        address recoveredSigner = digest.recover(signature);
        require(recoveredSigner == signer, "Invalid signature");
        
        // Mark as claimed
        claimed[claimKey] = true;
        
        // Transfer tokens
        require(geoToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit RewardClaimed(msg.sender, fid, weekId, amount);
    }

    /**
     * @notice Check if a reward has been claimed
     * @param fid Farcaster ID
     * @param weekId Week identifier
     */
    function isClaimed(uint256 fid, uint256 weekId) external view returns (bool) {
        return claimed[keccak256(abi.encodePacked(fid, weekId))];
    }

    /**
     * @notice Get contract's GEO token balance
     */
    function getBalance() external view returns (uint256) {
        return geoToken.balanceOf(address(this));
    }

    /**
     * @notice Update signer address (only owner)
     */
    function setSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Invalid signer");
        emit SignerUpdated(signer, _signer);
        signer = _signer;
    }

    /**
     * @notice Withdraw tokens (only owner, for emergency)
     */
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
        emit TokensWithdrawn(token, amount);
    }

    /**
     * @notice Withdraw ETH (only owner, for emergency)
     */
    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}

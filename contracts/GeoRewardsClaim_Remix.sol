// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin imports for Remix IDE
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/utils/cryptography/ECDSA.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/utils/cryptography/MessageHashUtils.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GeoRewardsClaim
 * @notice Contract for users to claim GEO token rewards from Farcaster Geo Explorer
 * @dev Uses EIP-712 signatures for secure claim verification
 * 
 * DEPLOYMENT PARAMETERS:
 * - _geoToken: 0x19E426b33E21e4C3Bd555de40599C4f68d48630b (GEO token on Base)
 * - _signer: Your wallet address (will sign reward approvals)
 * - _owner: Your wallet address (contract owner)
 */
contract GeoRewardsClaim is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IERC20 public immutable geoToken;
    address public signer;
    mapping(bytes32 => bool) public claimed;
    
    event RewardClaimed(address indexed recipient, uint256 indexed fid, uint256 indexed weekId, uint256 amount);
    event SignerUpdated(address oldSigner, address newSigner);
    event TokensWithdrawn(address token, uint256 amount);

    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    
    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "Claim(address recipient,uint256 amount,uint256 fid,uint256 weekId,uint256 deadline)"
    );
    
    bytes32 public immutable DOMAIN_SEPARATOR;

    constructor(address _geoToken, address _signer, address _owner) Ownable(_owner) {
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

    function claim(
        uint256 amount,
        uint256 fid,
        uint256 weekId,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant {
        require(block.timestamp <= deadline, "Signature expired");
        require(amount > 0, "Amount must be > 0");
        
        bytes32 claimKey = keccak256(abi.encodePacked(fid, weekId));
        require(!claimed[claimKey], "Already claimed");
        
        bytes32 structHash = keccak256(
            abi.encode(CLAIM_TYPEHASH, msg.sender, amount, fid, weekId, deadline)
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        
        address recoveredSigner = digest.recover(signature);
        require(recoveredSigner == signer, "Invalid signature");
        
        claimed[claimKey] = true;
        require(geoToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit RewardClaimed(msg.sender, fid, weekId, amount);
    }

    function isClaimed(uint256 fid, uint256 weekId) external view returns (bool) {
        return claimed[keccak256(abi.encodePacked(fid, weekId))];
    }

    function getBalance() external view returns (uint256) {
        return geoToken.balanceOf(address(this));
    }

    function setSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Invalid signer");
        emit SignerUpdated(signer, _signer);
        signer = _signer;
    }

    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
        emit TokensWithdrawn(token, amount);
    }

    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}

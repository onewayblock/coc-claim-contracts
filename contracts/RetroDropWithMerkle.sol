// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title RetroDrop
 * @dev Contract for managing activity points claims using a Merkle tree.
 */
contract RetroDropWithMerkle is Ownable {
    /// @notice Root of the Merkle tree used for verifying claims
    bytes32 public merkleRoot;

    /// @notice Tracks whether a user has claimed their points
    mapping(address => uint256) public pointClaimed;

    /// @notice Reverts when a user tries to claim points more than once
    error PointsAlreadyClaimed();

    /// @notice Reverts when the provided Merkle proof is invalid
    error InvalidProof();

    /// @notice Reverts when the provided points value is zero or invalid
    error InvalidPoints();

    /// @notice Event emitted when the Merkle root is updated
    event MerkleRootUpdated(bytes32 newMerkleRoot);

    /// @notice Event emitted when points are claimed
    event PointClaimed(address indexed user, uint256 points);

    /**
     * @dev Constructor initializes the contract with a Merkle root and owner address.
     * @param _merkleRoot The initial Merkle tree root
     * @param _owner The address of the contract owner
     */
    constructor(bytes32 _merkleRoot, address _owner) Ownable(_owner) {
        merkleRoot = _merkleRoot;
    }

    /**
     * @dev Updates the Merkle root. Only the contract owner can call this function.
     * @param _newMerkleRoot The new Merkle root
     */
    function setMerkleRoot(bytes32 _newMerkleRoot) external onlyOwner {
        merkleRoot = _newMerkleRoot;
        emit MerkleRootUpdated(_newMerkleRoot);
    }

    /**
     * @dev Allows a user to claim their full points if eligible.
     * @param points The number of points the user is eligible to claim
     * @param proof The Merkle proof verifying the user's eligibility
     */
    function claimPoints(uint256 points, bytes32[] calldata proof) external {
        if (pointClaimed[msg.sender] > 0) {
            revert PointsAlreadyClaimed();
        }
        if (points == 0) {
            revert InvalidPoints();
        }

        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(msg.sender, points)))
        );
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) {
            revert InvalidProof();
        }

        pointClaimed[msg.sender] = points;

        emit PointClaimed(msg.sender, points);
    }

    /**
     * @dev Checks if a user is part of the current Merkle tree.
     * @param user The address of the user to check
     * @param points The number of points the user is eligible to claim
     * @param proof The Merkle proof verifying the user's eligibility
     * @return bool True if the user is part of the Merkle tree, false otherwise
     */
    function isParticipating(
        address user,
        uint256 points,
        bytes32[] calldata proof
    ) external view returns (bool) {
        if (pointClaimed[user] > 0 || points == 0) {
            return false;
        }

        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(user, points)))
        );
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }
}

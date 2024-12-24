// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

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
    mapping(address => bool) public hasClaimed;

    /// @notice Event emitted when the Merkle root is updated
    event MerkleRootUpdated(bytes32 newMerkleRoot);

    /// @notice Event emitted when points are claimed
    event PointsClaimed(address indexed user, uint256 points);

    /// @dev Constructor initializes the contract with a Merkle root
    /// @param _merkleRoot The initial Merkle tree root
    constructor(bytes32 _merkleRoot) Ownable(msg.sender) {
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
        require(!hasClaimed[msg.sender], "Points already claimed");
        require(points > 0, "Points must be greater than 0");

        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(msg.sender, points)))
        );
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");

        hasClaimed[msg.sender] = true;

        emit PointsClaimed(msg.sender, points);
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
        if (hasClaimed[user]) {
            return false;
        }

        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(user, points)))
        );
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }
}

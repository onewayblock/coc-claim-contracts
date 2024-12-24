// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol"; // Provides ownership functionality to the contract
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol"; // Library for working with ECDSA signatures
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol"; // Utility for Ethereum-signed message hashes

/**
 * @title ClaimSoftCurrency
 * @dev Contract for managing claims of activity points with signature verification.
 *      Includes functionality for secure backend signature validation.
 */
contract ClaimSoftCurrency is Ownable {
    using ECDSA for bytes32;

    /// @notice Address of the backend signer responsible for generating valid signatures
    address public backendSigner;

    /// @notice Tracks the total points claimed by each address
    mapping(address => uint256) public pointsClaimed;

    /// @notice Tracks whether a message hash has already been executed
    mapping(bytes32 => bool) private executedHashes;

    /// @notice Event emitted when points are successfully claimed
    event PointsClaimed(address indexed user, uint256 points);

    /// @notice Event emitted when the backend signer address is updated
    event BackendSignerChanged(address newBackendSigner);

    /**
     * @dev Constructor initializes the contract with a backend signer address.
     * @param _backendSigner The address of the backend signer
     */
    constructor(address _backendSigner) Ownable(msg.sender) {
        require(_backendSigner != address(0), "Invalid signer address");
        backendSigner = _backendSigner;
    }

    /**
     * @dev Allows a user to claim points by providing a valid signature.
     * @param points The number of points to claim
     * @param nonce A unique identifier for the transaction
     * @param signature The signature generated by the backend signer
     */
    function claimPoints(
        uint256 points,
        uint256 nonce,
        bytes memory signature
    ) external {
        bytes32 messageHash = keccak256(
            abi.encode(msg.sender, points, nonce, block.chainid)
        );

        require(_verifySignature(messageHash, signature), "Invalid signature");
        require(!executedHashes[messageHash], "Tx already executed");

        executedHashes[messageHash] = true;
        pointsClaimed[msg.sender] += points;

        emit PointsClaimed(msg.sender, points);
    }

    /**
     * @dev Updates the backend signer address. Only the contract owner can call this function.
     * @param newSigner The new backend signer address
     */
    function setBackendSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid new signer address");

        backendSigner = newSigner;

        emit BackendSignerChanged(newSigner);
    }

    /**
     * @dev Verifies the validity of a signature against a message hash.
     * @param messageHash The hash of the message being verified
     * @param signature The signature to verify
     * @return bool True if the signature is valid, false otherwise
     */
    function _verifySignature(
        bytes32 messageHash,
        bytes memory signature
    ) private view returns (bool) {
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );
        return ethSignedMessageHash.recover(signature) == backendSigner;
    }
}

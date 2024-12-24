# Smart Contract Auditing: RetroDrop & Claim

This repository contains three smart contracts: **RetroDrop**, **Claim**, and **RetroDropWithMerkle**, designed to handle activity point claims and rewards using secure signature verification and Merkle tree-based validation.

## Contracts Overview

### RetroDrop

- **Purpose**: Manages activity points awarded to users for specific actions.
- **Key Features**:
  - Verifies claims using a backend-generated signature.
  - Tracks claimed points for each user.
  - Supports updating the backend signer address by the contract owner.

### Claim

- **Purpose**: Facilitates point claims with flexibility in specifying the claimed points.
- **Key Features**:
  - Verifies the authenticity of claims using ECDSA signatures.
  - Tracks the cumulative points claimed by each user.
  - Allows the owner to update the backend signer address.

### RetroDropWithMerkle

- **Purpose**: Manages activity points claims using a Merkle tree for eligibility verification.
- **Key Features**:
  - Uses a Merkle root to validate whether a user is eligible to claim points.
  - Allows users to prove their eligibility using Merkle proofs.
  - Tracks whether a user has already claimed their points.
  - The owner can update the Merkle root.

## Contract Details

### Common Features

- **Signature Validation**: Contracts like **RetroDrop** and **Claim** use the `ECDSA` library to validate signatures.
- **Replay Protection**: All contracts prevent the reuse of transaction signatures through mappings of executed message hashes.
- **Ownership**: The contracts leverage OpenZeppelin's `Ownable` contract for secure administrative controls.

### **RetroDropWithMerkle** Specific Features

- **Merkle Tree Validation**: Instead of signature-based validation, this contract uses a Merkle tree for eligibility verification.
- **Merkle Proof**: Users must provide a Merkle proof to prove their eligibility for claiming points.
- **Points Claiming**: Similar to the other contracts, users can claim their points only if they are part of the Merkle tree and have not claimed them already.
- **Merkle Root Management**: The owner can update the Merkle root, which is used for verifying the eligibility of future claims.

### Events

- **BackendSignerChanged**: Triggered when the backend signer address changes (for **RetroDrop** and **Claim** contracts).
- **ActivityPointsClaimed**/**PointsClaimed**: Logs successful claims with user details and points awarded (for **RetroDrop** and **Claim** contracts).
- **MerkleRootUpdated**: Triggered when the Merkle root is updated (for **RetroDropWithMerkle** contract).

## Security Considerations

1. **Signature Verification**: Ensures that claims are authorized by the backend signer (in **RetroDrop** and **Claim** contracts).
2. **Merkle Proof Verification**: Ensures that a user is eligible for claiming points based on their proof in the Merkle tree (in **RetroDropWithMerkle** contract).
3. **Replay Protection**: Safeguards against reusing the same signature across transactions (in **RetroDrop** and **Claim** contracts).
4. **Access Control**: Only the owner can modify critical parameters like the backend signer address and Merkle root.

## Deployment

Ensure to replace placeholder values (e.g., `_backendSigner`, `_merkleRoot`) with actual deployment values. The owner account should be securely managed.

### RetroDrop with Merkle Root

For the **RetroDropWithMerkle** contract, make sure the Merkle root is updated before deploying, and ensure that eligible users' information is hashed and added to the Merkle tree.

## Testing

- **For RetroDrop and Claim**:

  - Validate signature verification with various scenarios, including invalid and replayed signatures.
  - Test the ownership functionality for administrative tasks.

- **For RetroDropWithMerkle**:
  - Test Merkle proof verification to ensure only eligible users can claim points.
  - Test updating the Merkle root and ensuring the eligibility of new claims based on the updated root.
  - Test that a user cannot claim points twice.

## License

This project is licensed under the MIT License.

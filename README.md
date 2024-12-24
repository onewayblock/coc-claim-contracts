# ClaimSoftCurrency, RetroDrop, and RetroDropWithMerkle Contracts

## Overview

This repository contains three smart contracts designed for managing point claims on-chain. Each contract has unique features and use cases tailored to specific scenarios:

1. **ClaimSoftCurrency**: A contract allowing users to claim points periodically, relying on backend-generated signatures for validation.
2. **RetroDrop**: A contract enabling eligible users to make a one-time claim of points using verified backend signatures.
3. **RetroDropWithMerkle**: A variation of RetroDrop that uses a Merkle tree for verifying user eligibility, eliminating the need for backend signature generation.

## Contracts

### 1. **ClaimSoftCurrency**

#### Purpose

- Designed to encourage on-chain activity by allowing users to claim points at regular intervals.
- The backend is fully trusted to handle eligibility checks and signature generation.

#### Workflow

1. A user triggers a claim action via the frontend.
2. The backend verifies the user's eligibility and generates a signature.
3. The user sends an on-chain transaction with the provided signature.
4. The contract validates the signature and updates the user's claimed points.

#### Key Features

- **Backend Signer**: Ensures that only valid claims are processed.
- **Mapping for Points Tracking**: Keeps a record of total points claimed by each user.
- **Replay Protection**: Prevents reuse of the same message hash through a nonce-based mechanism.

#### Key Functions

- `claimPoints(uint256 points, uint256 nonce, uint256 chainId, bytes memory signature)`: Allows users to claim points after verifying the backend's signature.
- `setBackendSigner(address newSigner)`: Updates the address of the backend signer (restricted to the owner).

---

### 2. **RetroDrop**

#### Purpose

- Allows eligible users to make a one-time claim of points as a reward for meeting specific criteria, e.g. interacting with smart contracts on Base chain.

#### Workflow

1. A list of eligible users is determined off-chain based on predefined criteria.
2. A user initiates a claim, and the backend generates a signature to verify eligibility.
3. The user submits an on-chain transaction with the signature.
4. The contract validates the claim and records it to ensure it is not repeated.

#### Key Features

- **One-Time Claim**: Users can only claim points once.
- **Activity Points Configuration**: The owner can define the number of points awarded per claim.
- **Signature Verification**: Validates claims using backend-generated signatures.

#### Key Functions

- `claimPoints(uint256 nonce, uint256 chainId, bytes memory signature)`: Processes one-time point claims for eligible users.
- `setBackendSigner(address newSigner)`: Updates the backend signer address (restricted to the owner).
- `setActivityPointsForClaim(uint256 newPoints)`: Adjusts the points awarded per claim (restricted to the owner).
- `hasClaimed(address user, uint256 nonce, uint256 chainId)`: Checks if a user has already claimed points.

---

### 3. **RetroDropWithMerkle**

#### Purpose

- Similar to RetroDrop but uses a Merkle tree for eligibility verification.
- Provides a gas-efficient and secure method for proving user participation.

#### Workflow

1. An off-chain process generates a Merkle tree from the list of eligible users and their corresponding points.
2. A user submits a claim along with a Merkle proof.
3. The contract verifies the proof against the Merkle root.
4. If the proof is valid, the user's claim is processed.

#### Key Features

- **Merkle Tree Verification**: Verifies user eligibility without relying on signatures.
- **Immutable Claims**: Each user can claim only once.
- **Owner-Controlled Merkle Root**: The owner can update the Merkle root to reflect new eligibility criteria.

#### Key Functions

- `claimPoints(uint256 points, bytes32[] calldata proof)`: Allows users to claim points by providing a valid Merkle proof.
- `setMerkleRoot(bytes32 _newMerkleRoot)`: Updates the Merkle root (restricted to the owner).
- `isParticipating(address user, uint256 points, bytes32[] calldata proof)`: Checks if a user is part of the current Merkle tree.

---

## Security Considerations

- **Backend Trust**: Both `ClaimSoftCurrency` and `RetroDrop` rely on the integrity of the backend for generating valid signatures.
- **Replay Protection**: All contracts implement nonce or Merkle proof mechanisms to prevent replay attacks.
- **Ownership**: Sensitive functions like updating the backend signer or Merkle root are restricted to the contract owner.

---

## Events

- **ClaimSoftCurrency**

  - `PointsClaimed(address indexed user, uint256 points)`
  - `BackendSignerChanged(address newBackendSigner)`

- **RetroDrop**

  - `ActivityPointsClaimed(address indexed user, uint256 points)`
  - `BackendSignerChanged(address newBackendSigner)`
  - `ActivityPointsForClaimUpdated(uint256 newPoints)`

- **RetroDropWithMerkle**
  - `PointsClaimed(address indexed user, uint256 points)`
  - `MerkleRootUpdated(bytes32 newMerkleRoot)`

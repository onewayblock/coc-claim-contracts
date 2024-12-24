# ClaimSoftCurrency and RetroDropWithMerkle Contracts

## Overview

This repository contains two smart contracts designed for managing point claims on-chain. Each contract has unique features and use cases tailored to specific scenarios:

1. **ClaimSoftCurrency**: A contract allowing users to claim points periodically, relying on backend-generated signatures for validation.
2. **RetroDropWithMerkle**: A contract enabling eligible users to make a one-time claim of points using a Merkle tree for verifying user eligibility.

---

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

### 2. **RetroDropWithMerkle**

#### Purpose

- Allows eligible users to make a one-time claim of points as a reward for meeting specific criteria, e.g., interacting with smart contracts on Base chain.
- Uses a Merkle tree for eligibility verification.
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

## Events

- **ClaimSoftCurrency**:

  - `PointsClaimed(address indexed user, uint256 points)`
  - `BackendSignerChanged(address newBackendSigner)`

- **RetroDropWithMerkle**:

  - `PointsClaimed(address indexed user, uint256 points)`
  - `MerkleRootUpdated(bytes32 newMerkleRoot)`

---

## Security Considerations

- **Backend Trust**: `ClaimSoftCurrency` relies on the integrity of the backend for generating valid signatures.
- **Replay Protection**: All contracts implement nonce or Merkle proof mechanisms to prevent replay attacks.
- **Ownership**: Sensitive functions like updating the backend signer or Merkle root are restricted to the contract owner.

---

## Dependencies and Setup

### Prerequisites

1. **Node.js**: Ensure you have Node.js installed. The **recommended version is v22 or higher** for optimal compatibility.
2. **Hardhat**: A development environment for Ethereum.
3. **TypeScript**: Install the necessary TypeScript dependencies for testing and development.

### Installation

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. If additional dependencies are needed, they will be listed in the `package.json` file.

### Environment Variables

Ensure you create a `.env` file at the root of the project if you plan to use the deployment scripts. This step is optional if you only intend to run tests. Populate the file with the following variables:

```plaintext
PRIVATE_KEY= # Your private key for deploying contracts
ALCHEMY_API_KEY= # API key for Alchemy (or other provider)
ETHERSCAN_API_KEY= # API key for contract verification on Etherscan
BASESCAN_API_KEY= # API key for contract verification on BaseScan
```

---

## Testing

Run the following commands to compile and test the contracts:

```bash
npm install
npm run compile
npm run test
```

---

## Deployment Instructions

To deploy the contracts, use Hardhat Ignition. Each contract has a separate deployment module:

1. **ClaimSoftCurrency**:

   ```bash
   npx hardhat ignition deploy ./ignition/modules/ClaimSoftCurrency.ts --network <network> --verify
   ```

2. **RetroDropWithMerkle**:

   ```bash
   npx hardhat ignition deploy ./ignition/modules/RetroDropWithMerkle.ts --network <network> --verify
   ```

Replace `<network>` with your desired network (e.g., `base-mainnet`, `ethereum-mainnet`, etc.). You can see list of networks in `hardhat.config.ts` file.
Use the `--verify` flag if the appropriate API key for contract verification is provided in the `.env` file.

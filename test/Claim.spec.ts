import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Claim } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('Claim Contract', () => {
  let claim: Claim;
  let owner: SignerWithAddress, user: SignerWithAddress, backendSigner: SignerWithAddress, newSigner: SignerWithAddress;
  const chainId = 31337;

  beforeEach(async () => {
    [owner, user, backendSigner, newSigner] = await ethers.getSigners();

    const Claim = await ethers.getContractFactory('Claim');
    claim = await Claim.deploy(backendSigner.address);
    await claim.waitForDeployment();
  });

  describe('Deployment', () => {
    it('Should set the correct backend signer', async () => {
      expect(await claim.backendSigner()).to.equal(backendSigner.address);
    });
  });

  describe('Claim Points', () => {
    it('Should allow a user to claim points with a valid signature', async () => {
      const pointsToClaim = 10;
      const nonce = 1;

      const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'uint256', 'uint256'], [user.address, pointsToClaim, nonce, chainId])
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      await expect(claim.connect(user).claimPoints(pointsToClaim, nonce, chainId, signature))
        .to.emit(claim, 'PointsClaimed')
        .withArgs(user.address, pointsToClaim);

      const claimedPoints = await claim.pointsClaimed(user.address);
      expect(claimedPoints).to.equal(pointsToClaim);
    });

    it('Should not allow a user to claim points with an invalid signature', async () => {
      const pointsToClaim = 10;
      const nonce = 1;

      const invalidSignature = await newSigner.signMessage(
        ethers.getBytes(
          ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'uint256', 'uint256'], [user.address, pointsToClaim, nonce, chainId])
          )
        )
      );

      await expect(claim.connect(user).claimPoints(pointsToClaim, nonce, chainId, invalidSignature)).to.be.revertedWith('Invalid signature');
    });

    it('Should not allow a user to reuse the same signature (replay protection)', async () => {
      const pointsToClaim = 10;
      const nonce = 1;

      const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'uint256', 'uint256'], [user.address, pointsToClaim, nonce, chainId])
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      await claim.connect(user).claimPoints(pointsToClaim, nonce, chainId, signature);

      await expect(claim.connect(user).claimPoints(pointsToClaim, nonce, chainId, signature)).to.be.revertedWith('Tx already executed');
    });
  });

  describe('Backend Signer Management', () => {
    it('Should allow the owner to set a new backend signer', async () => {
      await expect(claim.connect(owner).setBackendSigner(newSigner.address)).to.emit(claim, 'BackendSignerChanged').withArgs(newSigner.address);

      expect(await claim.backendSigner()).to.equal(newSigner.address);
    });

    it('Should not allow non-owner to set a new backend signer', async () => {
      await expect(claim.connect(user).setBackendSigner(newSigner.address))
        .to.be.revertedWithCustomError(claim, 'OwnableUnauthorizedAccount')
        .withArgs(user.address);
    });

    it('Should validate signatures from the new backend signer', async () => {
      await claim.connect(owner).setBackendSigner(newSigner.address);

      const pointsToClaim = 20;
      const nonce = 2;

      const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'uint256', 'uint256'], [user.address, pointsToClaim, nonce, chainId])
      );

      const signature = await newSigner.signMessage(ethers.getBytes(messageHash));

      await expect(claim.connect(user).claimPoints(pointsToClaim, nonce, chainId, signature))
        .to.emit(claim, 'PointsClaimed')
        .withArgs(user.address, pointsToClaim);

      const claimedPoints = await claim.pointsClaimed(user.address);
      expect(claimedPoints).to.equal(pointsToClaim);
    });
  });
});

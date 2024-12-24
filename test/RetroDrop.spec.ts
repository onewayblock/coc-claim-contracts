import { expect } from 'chai';
import { ethers } from 'hardhat';
import { RetroDrop } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('RetroDrop Contract', () => {
  let retroDrop: RetroDrop;
  let owner: SignerWithAddress, user: SignerWithAddress, backendSigner: SignerWithAddress, newSigner: SignerWithAddress;
  const chainId = 31337;

  beforeEach(async () => {
    [owner, user, backendSigner, newSigner] = await ethers.getSigners();

    const RetroDrop = await ethers.getContractFactory('RetroDrop');
    retroDrop = await RetroDrop.deploy(backendSigner.address);
    await retroDrop.waitForDeployment();
  });

  describe('Deployment', () => {
    it('Should set the correct backend signer', async () => {
      expect(await retroDrop.backendSigner()).to.equal(backendSigner.address);
    });
  });

  describe('Claim Points', () => {
    it('Should allow a user to claim points with a valid signature', async () => {
      const pointsToClaim = await retroDrop.activityPointsForClaim();
      const nonce = 1;

      const messageHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'uint256'], [user.address, nonce, chainId]));

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      await expect(retroDrop.connect(user).claimPoints(nonce, chainId, signature))
        .to.emit(retroDrop, 'ActivityPointsClaimed')
        .withArgs(user.address, pointsToClaim);

      const claimedPoints = await retroDrop.pointsClaimed(user.address);
      expect(claimedPoints).to.equal(pointsToClaim);
    });

    it('Should not allow a user to claim points with an invalid signature', async () => {
      const nonce = 1;

      const invalidSignature = await newSigner.signMessage(
        ethers.getBytes(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'uint256'], [user.address, nonce, chainId])))
      );

      await expect(retroDrop.connect(user).claimPoints(nonce, chainId, invalidSignature)).to.be.revertedWith('Invalid signature');
    });

    it('Should not allow a user to reuse the same signature (replay protection)', async () => {
      const pointsToClaim = await retroDrop.activityPointsForClaim();
      const nonce = 1;

      const messageHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'uint256'], [user.address, nonce, chainId]));

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      await retroDrop.connect(user).claimPoints(nonce, chainId, signature);

      await expect(retroDrop.connect(user).claimPoints(nonce, chainId, signature)).to.be.revertedWith('Tx already executed');
    });
  });

  describe('Backend Signer Management', () => {
    it('Should allow the owner to set a new backend signer', async () => {
      await expect(retroDrop.connect(owner).setBackendSigner(newSigner.address)).to.emit(retroDrop, 'BackendSignerChanged').withArgs(newSigner.address);

      expect(await retroDrop.backendSigner()).to.equal(newSigner.address);
    });

    it('Should not allow non-owner to set a new backend signer', async () => {
      await expect(retroDrop.connect(user).setBackendSigner(newSigner.address))
        .to.be.revertedWithCustomError(retroDrop, 'OwnableUnauthorizedAccount')
        .withArgs(user.address);
    });

    it('Should validate signatures from the new backend signer', async () => {
      await retroDrop.connect(owner).setBackendSigner(newSigner.address);

      const pointsToClaim = await retroDrop.activityPointsForClaim();
      const nonce = 2;

      const messageHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'uint256'], [user.address, nonce, chainId]));

      const signature = await newSigner.signMessage(ethers.getBytes(messageHash));

      await expect(retroDrop.connect(user).claimPoints(nonce, chainId, signature))
        .to.emit(retroDrop, 'ActivityPointsClaimed')
        .withArgs(user.address, pointsToClaim);

      const pointsClaimed = await retroDrop.pointsClaimed(user.address);
      expect(pointsClaimed).to.equal(pointsToClaim);
    });
  });
});

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ClaimSoftCurrency } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('Claim Contract', () => {
  let claim: ClaimSoftCurrency;
  let owner: SignerWithAddress, user: SignerWithAddress, backendSigner: SignerWithAddress, newSigner: SignerWithAddress;
  const chainId = 31337;

  beforeEach(async () => {
    [owner, user, backendSigner, newSigner] = await ethers.getSigners();

    const Claim = await ethers.getContractFactory('ClaimSoftCurrency');
    claim = await Claim.deploy(backendSigner.address, owner.address);
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
      const coinsToClaim = 100;
      const nonce = await claim.nonces(user.address);

      const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
          [user.address, pointsToClaim, coinsToClaim, nonce, chainId]
        )
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      await expect(claim.connect(user).claimCurrency(pointsToClaim, coinsToClaim, signature))
        .to.emit(claim, 'CurrencyClaimed')
        .withArgs(user.address, pointsToClaim, coinsToClaim);

      const claimedPoints = await claim.pointsClaimed(user.address);
      const claimedCoins = await claim.coinsClaimed(user.address);
      expect(claimedPoints).to.equal(pointsToClaim);
      expect(claimedCoins).to.equal(coinsToClaim);
    });

    it('Should not allow a user to claim 0 points', async () => {
      const pointsToClaim = 0;
      const coinsToClaim = 100;
      const nonce = await claim.nonces(user.address);

      const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
          [user.address, pointsToClaim, coinsToClaim, nonce, chainId]
        )
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      await expect(claim.connect(user).claimCurrency(pointsToClaim, coinsToClaim, signature)).to.be.revertedWithCustomError(claim, 'InvalidPoints()');
    });

    it('Should not allow a user to claim 0 coins', async () => {
      const pointsToClaim = 10;
      const coinsToClaim = 0;
      const nonce = await claim.nonces(user.address);

      const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
          [user.address, pointsToClaim, coinsToClaim, nonce, chainId]
        )
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      await expect(claim.connect(user).claimCurrency(pointsToClaim, coinsToClaim, signature)).to.be.revertedWithCustomError(claim, 'InvalidCoins()');
    });

    it('Should not allow a user to claim points with an invalid signature', async () => {
      const pointsToClaim = 10;
      const coinsToClaim = 100;

      const nonce = await claim.nonces(user.address);

      const invalidSignature = await newSigner.signMessage(
        ethers.getBytes(
          ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
              ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
              [user.address, pointsToClaim, coinsToClaim, nonce, chainId]
            )
          )
        )
      );

      await expect(claim.connect(user).claimCurrency(pointsToClaim, coinsToClaim, invalidSignature)).to.be.revertedWithCustomError(claim, 'InvalidSigner()');
    });

    it('Should not allow a user to reuse the same signature (replay protection)', async () => {
      const pointsToClaim = 10;
      const coinsToClaim = 100;

      const nonce = await claim.nonces(user.address);

      const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
          [user.address, pointsToClaim, coinsToClaim, nonce, chainId]
        )
      );

      const signature = await backendSigner.signMessage(ethers.getBytes(messageHash));

      await claim.connect(user).claimCurrency(pointsToClaim, coinsToClaim, signature);

      await expect(claim.connect(user).claimCurrency(pointsToClaim, coinsToClaim, signature)).to.be.revertedWithCustomError(claim, 'InvalidSigner()');
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
      const coinsToClaim = 200;

      const nonce = await claim.nonces(user.address);

      const messageHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
          [user.address, pointsToClaim, coinsToClaim, nonce, chainId]
        )
      );

      const signature = await newSigner.signMessage(ethers.getBytes(messageHash));

      await expect(claim.connect(user).claimCurrency(pointsToClaim, coinsToClaim, signature))
        .to.emit(claim, 'CurrencyClaimed')
        .withArgs(user.address, pointsToClaim, coinsToClaim);

      const claimedPoints = await claim.pointsClaimed(user.address);
      const claimedCoins = await claim.coinsClaimed(user.address);
      expect(claimedPoints).to.equal(pointsToClaim);
      expect(claimedCoins).to.equal(coinsToClaim);
    });
  });
});

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { RetroDropWithMerkle } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import keccak256 from 'keccak256';

describe('RetroDropWithMerkle Contract', () => {
  let retroDrop: RetroDropWithMerkle;
  let owner: SignerWithAddress, user: SignerWithAddress, user1: SignerWithAddress, nonParticipant: SignerWithAddress;
  let merkleTree: StandardMerkleTree<any[]>;
  let merkleRoot: string;

  const points = 100;
  const participants: (string | number)[][] = [];

  before(async () => {
    [owner, user, user1, nonParticipant] = await ethers.getSigners();
    participants.push([user.address, points], [user1.address, points]);

    merkleTree = StandardMerkleTree.of(participants, ['address', 'uint256']);
    merkleRoot = merkleTree.root;
  });

  beforeEach(async () => {
    const RetroDrop = await ethers.getContractFactory('RetroDropWithMerkle');
    retroDrop = await RetroDrop.deploy(merkleRoot);
    await retroDrop.waitForDeployment();
  });

  describe('Deployment', () => {
    it('Should set the correct initial Merkle root', async () => {
      expect(await retroDrop.merkleRoot()).to.equal(merkleRoot);
    });
  });

  describe('setMerkleRoot', () => {
    it('Should allow the owner to update the Merkle root', async () => {
      const newRoot = `0x${keccak256('newRoot').toString('hex')}`;
      await expect(retroDrop.connect(owner).setMerkleRoot(newRoot)).to.emit(retroDrop, 'MerkleRootUpdated').withArgs(newRoot);
      expect(await retroDrop.merkleRoot()).to.equal(newRoot);
    });

    it('Should not allow a non-owner to update the Merkle root', async () => {
      const newRoot = `0x${keccak256('newRoot').toString('hex')}`;
      await expect(retroDrop.connect(user).setMerkleRoot(newRoot))
        .to.be.revertedWithCustomError(retroDrop, 'OwnableUnauthorizedAccount')
        .withArgs(user.address);
    });
  });

  describe('claimPoints', () => {
    it('Should allow a user to claim points with a valid proof', async () => {
      const proof = merkleTree.getProof([user.address, points]);

      await expect(retroDrop.connect(user).claimPoints(points, proof)).to.emit(retroDrop, 'PointsClaimed').withArgs(user.address, points);

      expect(await retroDrop.hasClaimed(user.address)).to.be.true;
    });

    it('Should not allow a user to claim points more than once', async () => {
      const proof = merkleTree.getProof([user.address, points]);

      await retroDrop.connect(user).claimPoints(points, proof);

      await expect(retroDrop.connect(user).claimPoints(points, proof)).to.be.revertedWith('Points already claimed');
    });

    it('Should not allow a user to claim points with an invalid proof', async () => {
      const invalidProof: string[] = [];
      await expect(retroDrop.connect(user).claimPoints(points, invalidProof)).to.be.revertedWith('Invalid proof');
    });

    it('Should not allow a non-participant to claim points', async () => {
      let proof: any;
      try {
        proof = merkleTree.getProof([nonParticipant.address, points]);
      } catch (error) {
        proof = [];
      }

      await expect(retroDrop.connect(nonParticipant).claimPoints(points, proof)).to.be.revertedWith('Invalid proof');
    });
  });

  describe('isParticipating', () => {
    it('Should return true for a valid participant with a valid proof', async () => {
      const proof = merkleTree.getProof([user.address, points]);

      const isParticipating = await retroDrop.isParticipating(user.address, points, proof);
      expect(isParticipating).to.be.true;
    });

    it('Should return false for a non-participant', async () => {
      let proof: any;
      try {
        proof = merkleTree.getProof([nonParticipant.address, points]);
      } catch (error) {
        proof = [];
      }
      const isParticipating = await retroDrop.isParticipating(nonParticipant.address, points, proof);
      expect(isParticipating).to.be.false;
    });

    it('Should return false for an invalid proof', async () => {
      const invalidProof: string[] = [];
      const isParticipating = await retroDrop.isParticipating(user.address, points, invalidProof);
      expect(isParticipating).to.be.false;
    });
  });
});

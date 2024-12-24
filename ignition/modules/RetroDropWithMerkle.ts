import keccak256 from 'keccak256';
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const RetroDropWithMerkleModule = buildModule('RetroDropWithMerkle', (module) => {
  const merkleRoot = module.getParameter('merkleRoot', `0x${keccak256('root').toString('hex')}`);
  const owner = module.getParameter('owner', module.getAccount(0));

  const retroDrop = module.contract('RetroDropWithMerkle', [merkleRoot, owner]);

  return { retroDrop };
});

export default RetroDropWithMerkleModule;

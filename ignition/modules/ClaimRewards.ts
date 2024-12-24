import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const ClaimRewardsModule = buildModule('ClaimRewards', (module) => {
  const backendSigner = module.getParameter('backendSigner', module.getAccount(0));
  const owner = module.getParameter('owner', module.getAccount(0));

  const claim = module.contract('ClaimRewards', [backendSigner, owner]);

  return { claim };
});

export default ClaimRewardsModule;

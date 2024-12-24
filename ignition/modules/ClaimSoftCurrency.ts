import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const ClaimSoftCurrencyModule = buildModule('ClaimSoftCurrency', (module) => {
  const backendSigner = module.getParameter('backendSigner', module.getAccount(0));
  const owner = module.getParameter('owner', module.getAccount(0));

  const claim = module.contract('ClaimSoftCurrency', [backendSigner, owner]);

  return { claim };
});

export default ClaimSoftCurrencyModule;

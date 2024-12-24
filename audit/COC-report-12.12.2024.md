### CRITICAL

No critical issues found.

### MAJOR

No major issues found.

### WARNING

#### [NEW] Pass the address for `Ownable` separately from the deployer in `ClaimSoftCurrency`, `RetroDropWithMerkle`
##### Location
File | Location | Line
--- | --- | ---
[ClaimSoftCurrency.sol](https://github.com/FAwesomeGames/coc-onchain-claim-contracts/blob/b8c9b36c7334bf9be723f29ba772cdd75179d79b/contracts/ClaimSoftCurrency.sol#L35) | contract `ClaimSoftCurrency` >  `constructor` | 35
[RetroDropWithMerkle.sol](https://github.com/FAwesomeGames/coc-onchain-claim-contracts/blob/b8c9b36c7334bf9be723f29ba772cdd75179d79b/contracts/RetroDropWithMerkle.sol#L27) | contract `RetroDropWithMerkle` >  `constructor` | 27

##### Description
From the best practice point of view, it is a bad practice to transfer the msg.sender dispatcher address as the owner, since the deployer is for the most part a hot wallet. To make the contract look good, I would suggest specifying this as a separate parameter `owner`, checking for a non-zero address is already in the `Ownable` contract.

#### [NEW] `nonce` can be reused but with a friend `points` in `ClaimSoftCurrency`
##### Location
File | Location | Line
--- | --- | ---
[ClaimSoftCurrency.sol](https://github.com/FAwesomeGames/coc-onchain-claim-contracts/blob/b8c9b36c7334bf9be723f29ba772cdd75179d79b/contracts/ClaimSoftCurrency.sol#L47) | contract `ClaimSoftCurrency` > function `claimPoints` | 47

##### Description
But here it is possible to use the same `nonce`, but with different `points`, in this case you will have a messageHash, but the nonce will remain the same. I don't think this will have any effect on the system. But it would be better to do nonce not as a function parameter, but as part of the contract, that is, add `mapping(address=>int 256) public nonces;` and everyone after claim increments nonce by 1.
that is, it will be like `nonces[account]++` then there will be no attempt to pass the same nonce. It's like a transaction, that is, each nonce is unique and a sequence of stamps is created.

Since each time a transaction will have its own `nonce` unique for each user action, then in the design there will be no need, since the message Hash will be a different `nonce`.
```solidity
require(!executedHashes[messageHash], "Tx already executed");
executedHashes[messageHash] = true;
```


#### [NEW] Add a condition that `points` is not null in `RetroDropWithMerkle`
##### Location
File | Location | Line
--- | --- | ---
[RetroDropWithMerkle.sol](https://github.com/FAwesomeGames/coc-onchain-claim-contracts/blob/b8c9b36c7334bf9be723f29ba772cdd75179d79b/contracts/RetroDropWithMerkle.sol#L74) | contract `RetroDropWithMerkle` > function `isParticipating` | 74

##### Description
But here there is not enough verification that `points` should be non-zero in accordance with the `claimPoints` function.

### INFO

#### [NEW] The solidity version can be specified as 0.8.27 in `ClaimSoftCurrency.sol`
##### Location
File | Location | Line
--- | --- | ---
[ClaimSoftCurrency.sol](https://github.com/FAwesomeGames/coc-onchain-claim-contracts/blob/b8c9b36c7334bf9be723f29ba772cdd75179d79b/contracts/ClaimSoftCurrency.sol#L2) | - | 2
[RetroDropWithMerkle.sol](https://github.com/FAwesomeGames/coc-onchain-claim-contracts/blob/b8c9b36c7334bf9be723f29ba772cdd75179d79b/contracts/RetroDropWithMerkle.sol#L2) | - | 2

##### Description
In both files, you can use version 0.8.27 as in the hardhat settings and lock the version, that is, without ^.

#### [NEW] There is no record of how many users have branded tokens in `RetroDropWithMerkle`
##### Location
File | Location | Line
--- | --- | ---
[RetroDropWithMerkle.sol](https://github.com/FAwesomeGames/coc-onchain-claim-contracts/blob/b8c9b36c7334bf9be723f29ba772cdd75179d79b/contracts/RetroDropWithMerkle.sol#L11) | contract `RetroDropWithMerkle` > function `claimPoints` | 11

##### Description
Here it makes sense to add mapping with information about how many `points` the user has branded and make it public so that the onchain can always be checked.

#### [NEW] Specify the user instead of `msg.sender` as a separate function parameter in `RetroDropWithMerkle`, `ClaimSoftCurrency`
##### Location
File | Location | Line
--- | --- | ---
[RetroDropWithMerkle.sol](https://github.com/FAwesomeGames/coc-onchain-claim-contracts/blob/b8c9b36c7334bf9be723f29ba772cdd75179d79b/contracts/RetroDropWithMerkle.sol#L45) | contract `RetroDropWithMerkle` > function `claimPoints` | 45
[ClaimSoftCurrency.sol](https://github.com/FAwesomeGames/coc-onchain-claim-contracts/blob/b8c9b36c7334bf9be723f29ba772cdd75179d79b/contracts/ClaimSoftCurrency.sol#L52) | contract `ClaimSoftCurrency` > function `claimPoints` | 52

##### Description
Here it makes sense to specify a separate function parameter instead of `msg.sender`, for example `account`, this will allow you to make a claim from any address. This is not necessary, but optional.


#### [NEW] Incorrect error message `require` in `ClaimSoftCurrency`
##### Location
File | Location | Line
--- | --- | ---
[ClaimSoftCurrency.sol](https://github.com/FAwesomeGames/coc-onchain-claim-contracts/blob/b8c9b36c7334bf9be723f29ba772cdd75179d79b/contracts/ClaimSoftCurrency.sol#L55) | contract `ClaimSoftCurrency` > function `_verifySignature` | 55

##### Description
Here the message is not quite correct, because already inside the recover function there will be a similar message.
```solidity
require(_verifySignature(messageHash, signature), "Invalid signature");
```

So there is already a similar error in the function itself `recover`
[ECDSA.sol#L93](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v5.1/contracts/utils/cryptography/ECDSA.sol#L93)
[ECDSA.sol#L169](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v5.1/contracts/utils/cryptography/ECDSA.sol#L169).

In your case, the "invalid signer" message will be correct.
Also pay attention to the following sentence about customerrors.

#### [NEW] Replace `require` with custom errors
##### Description
Using `require` is considered an outdated method, in order to make the code more readable and catch understandable errors and make the code more understandable and better for debugging, it is worth using custom errors.
[https://soliditylang.org/blog/2021/04/21/custom-errors/](https://soliditylang.org/blog/2021/04/21/custom-errors/)

I note that the Open Zeppelin library uses custom errors specifically.

#### [NEW] Fix the description in the `README` file
##### Description
1. Currently, there is no information in the `README` on how to run tests and what dependencies there are. For example, I had to install the typescript dependency separately, and I selected the node version in accordance with the hardhat version, it is worth specifying such things in the package.json and also add the test command so that it runs the tests. That is, basic information with the environment, if the repository is public.
2. Information about **Retrodrom** is superfluous there is no such contract in the repo.
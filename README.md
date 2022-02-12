# Tokemak Rewards

Site to pull historical Tokemak rewards for a specific wallet.

## Disclaimers
1. All data is pulled from Tokemak's sources on best effort basis. Verify the results.
2. It may fail to pull some rewards payloads on the first try. If this happens the site will report an error and you can retry.
3. If the Lifetime Rewards in the `Rewards Summary` equals the total in `Rewards By Token`, it has successfully pulled the full history.

## Process for pulling data

1. Query Tokemak's [Reward Hash Contract](https://etherscan.io/address/0x5ec3EC6A8aC774c7d53665ebc5DDf89145d02fB6) for the IPFS hash for each Cycle Index
2. Pull the individual rewards payloads from IPFS for the given wallet

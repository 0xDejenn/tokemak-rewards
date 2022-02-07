import { Contract, Provider } from "ethcall";
import { ethers, BigNumber } from "ethers";
import axios from "axios";

import {
  IPFS_BASE,
  TOKEMAK_REWARDS_HASH_CONTRACT,
} from "../constants/constants";
import rewardsHashAbi from "../abis/rewards-hash.json";

const provider = new ethers.providers.AlchemyProvider(
  "homestead",
  process.env.ALCHEMY_KEY
);

const rewardHashContract = new Contract(
  TOKEMAK_REWARDS_HASH_CONTRACT,
  rewardsHashAbi
);

async function getEthcallProvider(): Promise<Provider> {
  const ethcallProvider = new Provider();
  await ethcallProvider.init(provider);
  return ethcallProvider;
}

export type CycleHash = {
  latestClaimable: string;
  cycle: string;
};

export async function fetchRewardsHashes(): Promise<CycleHash[]> {
  const ethcallProvider = await getEthcallProvider();

  const [latestCycleIndex] = (await ethcallProvider.all([
    rewardHashContract.latestCycleIndex(),
  ])) as [BigNumber];

  const hashRequests = [];

  // only get the last 50 cycles b/c ipfs can be really slow
  let currentIndex = latestCycleIndex.sub(49);
  while (currentIndex.lte(latestCycleIndex)) {
    hashRequests.push(rewardHashContract.cycleHashes(currentIndex));
    currentIndex = currentIndex.add(1);
  }

  return await ethcallProvider.all(hashRequests);
}

export type UserRewardPayload = {
  payload: {
    wallet: string;
    cycle: number;
    amount: string;
  };
  summary: {
    cycleTotal: string;
    breakdown: { description: string; amount: string }[];
  };
};

export async function fetchUserPayload(
  cycleHash: CycleHash,
  userAddress: string
): Promise<UserRewardPayload | undefined> {
  if (cycleHash.cycle === "") {
    return undefined;
  }

  const url = `${IPFS_BASE}/${
    cycleHash.cycle
  }/${userAddress.toLowerCase()}.json`;

  try {
    const resp = await axios.get(url);
    return resp.data;
  } catch (error: any) {
    console.error(error);
  }
}

export async function fetchUserPayloadsBatch(
  cycleHashes: CycleHash[],
  userAddress: string
): Promise<(UserRewardPayload | undefined)[]> {
  const requests = cycleHashes.map((x) => fetchUserPayload(x, userAddress));
  return Promise.all(requests);
}

export async function fetchUserPayloadsForAllCycles(
  userAddress: string
): Promise<UserRewardPayload[]> {
  const cycleHashes = await fetchRewardsHashes();
  const userPayloads = await fetchUserPayloadsBatch(cycleHashes, userAddress);

  let result: UserRewardPayload[] = [];

  // when trying to retrieve user payloads from IPFS, a 404 (user does not have a payload)
  // ends up as a CORS error, so it is hard to distinguish between real errors and acceptable errors.
  // once a user has a rewards payload for a cycle, they should always have a payload for subsequent cycles
  // so we're checking that there isn't a gap in their rewards payload sequence
  let sequenceStarted = false;
  for (const userPayload of userPayloads) {
    if (!userPayload && sequenceStarted) {
      // there is a gap in the data, which means we had some issue getting it from ipfs
      throw new Error("error fetching rewards data");
    }

    if (userPayload) {
      sequenceStarted = true;
      result.push(userPayload);
    }
  }

  return result;
}

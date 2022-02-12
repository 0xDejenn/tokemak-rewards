import { BigNumber, ethers } from "ethers";
import { Contract, Provider } from "ethcall";

import rewardsHashAbi from "../abis/rewards-hash.json";
import { CycleHash, RewardPayload } from "./types";
import {
  IPFS_REQUEST_CHUNK_SIZE,
  TOKEMAK_REWARDS_HASH_CONTRACT,
} from "../constants/constants";
import { fetchRewardPayload } from "./ipfs";

const provider = new ethers.providers.AlchemyProvider(
  "homestead",
  process.env.ALCHEMY_KEY
);

const rewardHashContract = new Contract(
  TOKEMAK_REWARDS_HASH_CONTRACT,
  rewardsHashAbi
);

let ethcallProvider: Provider;
async function getEthcallProvider(): Promise<Provider> {
  if (ethcallProvider) {
    return ethcallProvider;
  }
  ethcallProvider = new Provider();
  await ethcallProvider.init(provider);
  return ethcallProvider;
}

export async function getLatestRewardPayload(
  address: string
): Promise<RewardPayload> {
  const ethcallProvider = await getEthcallProvider();

  const [latestCycleIndex] = (await ethcallProvider.all([
    rewardHashContract.latestCycleIndex(),
  ])) as [BigNumber];

  const [latestCycleHash] = await getCycleHashes(
    latestCycleIndex.toNumber(),
    latestCycleIndex.toNumber()
  );

  return await fetchRewardPayload(latestCycleHash, address);
}

export async function getRewardHistory(
  address: string,
  maxCycle: number,
  minCycle: number,
  successCallback: (payload: RewardPayload) => void
): Promise<void> {
  const cycleHashes = await getCycleHashes(maxCycle, minCycle);
  const chunkSize = Math.min(cycleHashes.length, IPFS_REQUEST_CHUNK_SIZE);

  let reqs: Promise<number>[] = [];
  let successes: number[] = [];
  let failures: number[] = [];

  const maxCycleInfo = await fetchRewardPayload(cycleHashes[0], address);
  let targetRewardAmount = BigNumber.from(maxCycleInfo.payload.amount);

  const makeReq = async (
    cycleIndex: number,
    requestIndex: number
  ): Promise<number> => {
    try {
      const reqCycleIndex = cycleHashes[cycleIndex];
      const payload = await fetchRewardPayload(reqCycleIndex, address);

      if (reqCycleIndex.cycleIndex === 0) {
        payload.payload.cycle = 0;
        payload.summary = {
          cycleTotal: payload.payload.amount,
          breakdown: [
            {
              description: "DeGenesis",
              amount: payload.payload.amount,
            },
          ],
        };
      }

      successCallback(payload);
      successes.push(cycleIndex);
      targetRewardAmount = targetRewardAmount.sub(payload.summary.cycleTotal);
    } catch (e: any) {
      console.log(
        `error retrieving reward payload for cycle = ${cycleHashes[cycleIndex].cycleIndex}`
      );
      failures.push(cycleIndex);
    }

    return requestIndex;
  };

  for (let i = 0; i < chunkSize; i++) {
    reqs.push(makeReq(i, i));
  }

  for (let i = chunkSize; i < cycleHashes.length; i++) {
    const requestIndex = await Promise.race(reqs);
    reqs[requestIndex] = makeReq(i, requestIndex);

    if (targetRewardAmount.eq(0)) {
      break;
    }
  }

  await Promise.all(reqs);

  successes.sort((a, b) => a - b);
  failures.sort((a, b) => a - b);

  for (let i = 1; i < successes.length; i++) {
    if (successes[i] - successes[i - 1] !== 1) {
      const msg = "successful rewards payloads must be contiguous";
      console.error(msg);
      throw new Error(msg);
    }
  }

  for (let i = 1; i < failures.length; i++) {
    if (failures[i] - failures[i - 1] !== 1) {
      const msg = "failed rewards payloads must be contiguous";
      console.error(msg);
      throw new Error(msg);
    }
  }

  const firstFailure = failures[0];
  const lastSuccess = successes[successes.length - 1];

  if (firstFailure !== undefined && lastSuccess !== undefined) {
    if (firstFailure - lastSuccess !== 1) {
      const msg = "all rewards payloads must be contiguous";
      console.error(msg);
      throw new Error(msg);
    }
  }
}

async function getCycleHashes(
  maxCycle: number,
  minCycle: number
): Promise<CycleHash[]> {
  if (maxCycle < minCycle) {
    throw new Error("maxCycle must be >= minCycle");
  }

  const ethcallProvider = await getEthcallProvider();

  const hashRequests = [];
  const cycleIndexes: number[] = [];

  let currentIndex = maxCycle;
  while (currentIndex >= minCycle) {
    hashRequests.push(rewardHashContract.cycleHashes(currentIndex));
    cycleIndexes.push(currentIndex);
    currentIndex -= 1;
  }

  const result = (await ethcallProvider.all(hashRequests)) as Omit<
    CycleHash,
    "cycleIndex"
  >[];

  return result.map((val, idx) => ({
    cycleIndex: cycleIndexes[idx],
    ...val,
  }));
}

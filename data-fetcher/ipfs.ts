import axios from "axios";

import { IPFS_BASE } from "../constants/constants";
import { CycleHash, RewardPayload } from "./types";

const TWO_MINUTES = 2 * 60 * 1000;
const retryWaits = [0, 1000, 2000];

export async function fetchRewardPayload(
  cycleHash: CycleHash,
  userAddress: string
): Promise<RewardPayload> {
  const url = `${IPFS_BASE}/${
    cycleHash.cycle
  }/${userAddress.toLowerCase()}.json`;

  for (const wait of retryWaits) {
    await waitPromise(wait);

    try {
      const tryUrl = wait === 0 ? url : `${url}?${wait}`;
      const resp = await axios.get(tryUrl, { timeout: TWO_MINUTES });
      return resp.data;
    } catch (e: any) {}
  }

  throw new Error("failed to retrieve reward payload");
}

function waitPromise(waitMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, waitMs);
  });
}

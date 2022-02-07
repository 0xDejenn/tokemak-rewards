export type CycleHash = {
  cycleIndex: number;
  latestClaimable: string;
  cycle: string;
};

export type RewardPayload = {
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

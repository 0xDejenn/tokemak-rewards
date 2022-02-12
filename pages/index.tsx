import Layout from "../components/layout";

import React, { useState } from "react";
import { BigNumber, ethers } from "ethers";
import UserQuery from "../components/UserQuery";
import RewardsSummary from "../components/RewardsSummary";
import RewardsByToken from "../components/RewardsByToken";
import RewardsByCycleAndToken from "../components/RewardsByCycleAndToken";

import {
  getLatestRewardPayload,
  RewardPayload,
  getRewardHistory,
} from "../data-fetcher";

type RewardsProps = {};
export type RewardDetail = {
  token: string;
  liquidityProvider: BigNumber;
  liquidityDirector: BigNumber;
};
export type RewardsByTokenDetails = {
  lpTotal: BigNumber;
  ldTotal: BigNumber;
  rewardDetails: RewardDetail[];
};
export type RewardsByCycleAndToken = {
  cycle: number;
  token: string;
  liquidityProvider: BigNumber;
  liquidityDirector: BigNumber;
};

export default function Index(props: RewardsProps) {
  const [userAddress, setUserAddress] = useState("");
  const [userRewardPayloads, setUserRewardPayloads] = useState<RewardPayload[]>(
    []
  );
  const [userStartCycle, setUserStartCycle] = useState<number | undefined>();
  const [userEndCycle, setUserEndCycle] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const query = async () => {
    setIsError(false);
    setIsLoading(true);

    try {
      const latestPayload = await getLatestRewardPayload(userAddress);
      setUserRewardPayloads([latestPayload]);

      const maxCycle = latestPayload.payload.cycle - 1;
      const minCycle = 0;
      setUserStartCycle(minCycle);
      setUserEndCycle(maxCycle + 1);
      await getRewardHistory(
        userAddress,
        maxCycle,
        minCycle,
        (payload: RewardPayload) => {
          setUserRewardPayloads((prevState: RewardPayload[]) => [
            ...prevState,
            payload,
          ]);
        }
      );
    } catch (e: any) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const latestCyclePayload = userRewardPayloads[0];
  const latestCycle = latestCyclePayload?.payload.cycle.toString() || "-";
  const latestCycleRewards = ethers.utils.formatEther(
    latestCyclePayload?.summary.cycleTotal || 0
  );
  const lifetimeRewards = ethers.utils.formatEther(
    latestCyclePayload?.payload.amount || 0
  );

  const getCycleWindow = (): string => {
    if (userEndCycle === undefined) {
      return "";
    }
    return `Rewards aggregated from cycles ${userStartCycle} to ${userEndCycle}`;
  };

  const getRewardsByToken = (): RewardsByTokenDetails => {
    const detailResults: { [key: string]: RewardDetail } = {};
    let lpTotal: BigNumber = ethers.constants.Zero;
    let ldTotal: BigNumber = ethers.constants.Zero;

    userRewardPayloads.forEach((payload) => {
      payload.summary.breakdown.forEach((detail) => {
        // determines if liquidity director ("ld") or liquidity provider("lp")
        const [token, ld] = getTokenAndisLdFromDescription(detail.description);

        if (!detailResults[token]) {
          detailResults[token] = {
            token,
            liquidityProvider: ethers.constants.Zero,
            liquidityDirector: ethers.constants.Zero,
          };
        }

        const currentDetail = detailResults[token];

        if (ld) {
          currentDetail.liquidityDirector = currentDetail.liquidityDirector.add(
            detail.amount
          );
          ldTotal = ldTotal.add(detail.amount);
        } else {
          currentDetail.liquidityProvider = currentDetail.liquidityProvider.add(
            detail.amount
          );
          lpTotal = lpTotal.add(detail.amount);
        }
      });
    });

    const result = Object.values(detailResults);
    result.sort((a, b) => a.token.localeCompare(b.token));
    return {
      lpTotal,
      ldTotal,
      rewardDetails: result,
    };
  };

  const getRewardsByCycleAndToken = (): RewardsByCycleAndToken[] => {
    // check cycle for duplicate tokens -- indicates lp or ld
    const cycleTokens: Record<string, RewardsByCycleAndToken> = {};

    userRewardPayloads.forEach((payload) => {
      payload.summary.breakdown.forEach((detail) => {
        // determines if liquidity director ("ld") or liquidity provider("lp")
        const [token, ld] = getTokenAndisLdFromDescription(detail.description);
        const cycleTokenKey = `${payload.payload.cycle}-${token}`;

        if (!cycleTokens[cycleTokenKey]) {
          cycleTokens[cycleTokenKey] = {
            cycle: payload.payload.cycle,
            token,
            liquidityProvider: ethers.constants.Zero,
            liquidityDirector: ethers.constants.Zero,
          };
        }

        if (ld) {
          cycleTokens[cycleTokenKey].liquidityDirector = BigNumber.from(
            detail.amount
          );
        } else {
          cycleTokens[cycleTokenKey].liquidityProvider = BigNumber.from(
            detail.amount
          );
        }
      });
    });

    const dataResults = Object.values(cycleTokens);

    dataResults.sort((a, b) => {
      return b.cycle - a.cycle || a.token.localeCompare(b.token);
    });

    return dataResults;
  };

  const getRenderComponent = () => {
    return (
      <>
        <RewardsSummary
          latestCycle={latestCycle}
          latestCycleRewards={latestCycleRewards}
          lifetimeRewards={lifetimeRewards}
        />

        <RewardsByToken
          cycleWindows={getCycleWindow()}
          allRewardsByToken={getRewardsByToken()}
        />

        <RewardsByCycleAndToken
          allRewardsByCycleAndToken={getRewardsByCycleAndToken()}
        />
      </>
    );
  };

  return (
    <Layout>
      <UserQuery
        onChange={setUserAddress}
        handleSubmit={query}
        preventQuery={isLoading}
      />
      {isError ? <div>Something went wrong</div> : <></>}
      {getRenderComponent()}
    </Layout>
  );
}

function getTokenAndisLdFromDescription(
  description: string
): [string, boolean] {
  let [token, ld] = description.split("-");
  if (token === "WETH") {
    token = "ETH";
  }

  return [token, !!ld];
}

import BN = require("bn.js");
import * as React from "react";
import { IDAOState, IMemberState, IProposalState, IRewardState } from "@daostack/client";
import ReputationView from "components/Account/ReputationView";
import Util from "lib/util";

interface IProps {
  isRedeemPending: boolean;
  beneficiaryHasRewards: boolean;
  currentAccount: IMemberState;
  dao: IDAOState;
  executable: boolean;
  accountHasRewards: boolean;
  proposal: IProposalState;
  redeemable: boolean;
  rewards: IRewardState[];
}

export default (props: IProps) => {
  const { proposal, currentAccount, dao, executable, beneficiaryHasRewards, isRedeemPending, rewards } = props;

  const rewardComponents = [];
  for (const reward of rewards) {
    let c = null;
    if (reward.reputationForProposer.gt(new BN(0))) {
      c = <div>
          <strong>For creating the proposal you will receive:</strong>
          <ul>
            <li><ReputationView reputation={reward.reputationForProposer} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
          </ul>
        </div>;
      rewardComponents.push(c);
    } else if (reward.reputationForVoter.gt(new BN(0))) {
      c = <div>
          <strong>For voting on the proposal you will receive:</strong>
          <ul>
            <li><ReputationView reputation={reward.reputationForVoter} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
          </ul>
        </div>;
      rewardComponents.push(c);
    }  else if (reward.tokensForStaker.gt(new BN("0"))) {
      c = <div>
        <strong>For staking on the proposal you will receive:</strong>
        <ul>
          <li>{reward.tokensForStaker} GEN</li>
        </ul>
      </div>;
      rewardComponents.push(c);

    }  else if (reward.daoBountyForStaker.gt(new BN("0"))) {
      c = <div>
        <strong>For staking on the proposal you will receive:</strong>
        <ul>
          <li>{reward.daoBountyForStaker} GEN bounty {dao.tokenBalance < reward.daoBountyForStaker ? " (Insufficient funds in DAO)" : ""}</li>
        </ul>
      </div >;
      rewardComponents.push(c);
    }

  }

  const hasEthReward = proposal.ethReward.gt(new BN(0));
  const hasExternalReward = proposal.externalTokenReward.gt(new BN(0));
  const hasReputationReward = proposal.reputationReward.gt(new BN(0));
  const hasProposingRepReward = proposal.proposingRepReward.gt(new BN(0));

  return <div>
    {(props.beneficiaryHasRewards || hasEthReward || hasExternalReward) ?
      <div>
        <strong>
          {currentAccount.address === proposal.beneficiary ? "As the" : "The"} beneficiary of the proposal {currentAccount.address === proposal.beneficiary ? "you " : ""}will receive:
        </strong>
        <ul>
          {hasEthReward ?
            <li>
              {Util.fromWei(proposal.ethReward)} ETH
              {/*TODO: subscribe to ethBalance, {dao.ethBalance < proposal.ethReward ? " (Insufficient funds in DAO)" : ""}*/}
            </li> : ""
          }
          {hasExternalReward ?
            <li>
              {Util.fromWei(proposal.externalTokenReward)} {dao.externalTokenSymbol}
              {dao.externalTokenBalance && dao.externalTokenBalance.lt(proposal.externalTokenReward) ? " (Insufficient funds in DAO)" : ""}
            </li> : ""
          }
          {hasReputationReward ? <li><ReputationView reputation={proposal.reputationReward} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li> : ""}
        </ul>
      </div> : ""
    }
      <React.Fragment>
        {hasProposingRepReward ?
          <div>
            <strong>For creating the proposal you will receive:</strong>
            <ul>
              <li><ReputationView reputation={proposal.proposingRepReward} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
            </ul>
          </div> : ""
        }
        { rewardComponents }
    </React.Fragment>

    {rewards.length === 0 && !beneficiaryHasRewards && executable ?
      <span>Executing a proposal ensures that the target of the proposal receives their reward or punishment.</span>
      : ""
    }
    {isRedeemPending ? <strong><i>Warning: Redeeming for this proposal is already in progress</i></strong> : ""}
  </div>;
};
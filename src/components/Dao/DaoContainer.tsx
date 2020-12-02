import { IDAOState, Member } from "@daostack/arc.js";
import { getProfilesForAddresses } from "actions/profilesActions";
import { getArc } from "arc";
import CreateProposalPage from "components/Proposal/Create";
import ProposalDetailsPage from "components/Proposal/ProposalDetailsPage";
import SchemeContainer from "components/Scheme/SchemeContainer";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
//@ts-ignore
import { ModalRoute } from "react-router-modal";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import DetailsPageRouter from "components/Scheme/ContributionRewardExtRewarders/DetailsPageRouter";
import { combineLatest, Subscription } from "rxjs";
import DaoSchemesPage from "./DaoSchemesPage";
import DaoHistoryPage from "./DaoHistoryPage";
import DaoMembersPage from "./DaoMembersPage";
import * as css from "./Dao.scss";
import DaoLandingPage from "components/Dao/DaoLandingPage";
import { standardPolling, targetedNetwork } from "lib/util";

type IExternalProps = RouteComponentProps<any>;

interface IStateProps {
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
  daoAvatarAddress: string;
}

interface IDispatchProps {
  getProfilesForAddresses: typeof getProfilesForAddresses;
  showNotification: typeof showNotification;
}

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<[IDAOState, Member[]]>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    daoAvatarAddress: ownProps.match.params.daoAvatarAddress,
  };
};

const mapDispatchToProps = {
  getProfilesForAddresses,
  showNotification,
};

class DaoContainer extends React.Component<IProps, null> {
  public daoSubscription: any;
  public subscription: Subscription;

  public async componentDidMount() {
    // TODO: use this once 3box fixes Box.getProfiles
    //this.props.getProfilesForAddresses(this.props.data[1].map((member) => member.staticState.address));
  }

  private daoHistoryRoute = (routeProps: any) => <DaoHistoryPage {...routeProps} daoState={this.props.data[0]} currentAccountAddress={this.props.currentAccountAddress} />;
  private daoMembersRoute = (routeProps: any) => <DaoMembersPage {...routeProps} daoState={this.props.data[0]} />;
  private daoProposalRoute = (routeProps: any) =>
    <ProposalDetailsPage {...routeProps}
      currentAccountAddress={this.props.currentAccountAddress}
      daoState={this.props.data[0]}
      proposalId={routeProps.match.params.proposalId}
    />;
  private daoCrxProposalRoute = (routeProps: any) =>
    <DetailsPageRouter {...routeProps}
      currentAccountAddress={this.props.currentAccountAddress}
      daoState={this.props.data[0]}
      proposalId={routeProps.match.params.proposalId}
    />;

  private schemeRoute = (routeProps: any) => <SchemeContainer {...routeProps} daoState={this.props.data[0]} currentAccountAddress={this.props.currentAccountAddress} />;
  private daoSchemesRoute = (routeProps: any) => <DaoSchemesPage {...routeProps} daoState={this.props.data[0]} />;
  private daoLandingRoute = (_routeProps: any) => <DaoLandingPage daoState={this.props.data[0]} />;
  private modalRoute = (route: any) => `/dao/${route.params.daoAvatarAddress}/scheme/${route.params.schemeId}/`;

  public render(): RenderOutput {
    const daoState = this.props.data[0];
    const network = targetedNetwork();

    return (
      <div className={css.outer}>
        <BreadcrumbsItem to="/daos/">All DAOs</BreadcrumbsItem>
        <BreadcrumbsItem to={"/dao/" + daoState.address}>{daoState.name}</BreadcrumbsItem>
        <Helmet>
          <meta name="description" content={daoState.name + " | Managed on Alchemy by DAOstack"} />
          <meta name="og:description" content={daoState.name + " | Managed on Alchemy by DAOstack"} />
          <meta name="twitter:description" content={daoState.name + " | Managed on Alchemy by DAOstack"} />
        </Helmet>

        <div className={css.wrapper}>
          <div className={css.noticeWrapper}>
            <div className={css.noticeBuffer}></div>
            <div className={css.notice}>Alchemy 2.0 has been released! Take a look <a
              href={(network === "main") ? process.env.ALCHEMY_V2_URL_MAINNET : process.env.ALCHEMY_V2_URL_XDAI}
              target="_blank" rel="noopener noreferrer">here</a>.
            </div>
          </div>
          <Switch>
            <Route exact path="/dao/:daoAvatarAddress"
              render={this.daoLandingRoute} />
            <Route exact path="/dao/:daoAvatarAddress/history"
              render={this.daoHistoryRoute} />
            <Route exact path="/dao/:daoAvatarAddress/members"
              render={this.daoMembersRoute} />

            <Route exact path="/dao/:daoAvatarAddress/proposal/:proposalId"
              render={this.daoProposalRoute}
            />

            <Route path="/dao/:daoAvatarAddress/crx/proposal/:proposalId"
              render={this.daoCrxProposalRoute} />

            <Route path="/dao/:daoAvatarAddress/scheme/:schemeId"
              render={this.schemeRoute} />

            <Route exact path="/dao/:daoAvatarAddress/schemes"
              render={this.daoSchemesRoute} />

            <Route path="/dao/:daoAvatarAddress" render={this.daoLandingRoute} />
          </Switch>

          <ModalRoute
            path="/dao/:daoAvatarAddress/scheme/:schemeId/proposals/create"
            parentPath={this.modalRoute}
            component={CreateProposalPage}
          />

        </div>
      </div>
    );
  }
}

const SubscribedDaoContainer = withSubscription({
  wrappedComponent: DaoContainer,
  loadingComponent: <Loading />,
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const daoAddress = props.match.params.daoAvatarAddress;
    const dao = arc.dao(daoAddress);
    const observable = combineLatest(
      dao.state(standardPolling(true)), // DAO state
      dao.members()
    );
    return observable;
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedDaoContainer);

import { chai, getContractAddresses, userAddresses } from './utils'
import * as uuid from 'uuid'

describe('Sanity', () => {
    before(() => {
      chai.Should()
    });

    it('Go through the flow', async () => {
      browser.url('http://127.0.0.1:3000/')
      browser.getTitle().should.be.equal('Alchemy | DAOstack')
      browser.waitForExist('*[data-test-id="link-to-alchemy"]')
      browser.click('*[data-test-id="link-to-alchemy"]')
      browser.waitForExist('*[data-test-id="header-all-daos"]')
      // browser.getValue()
      browser.click('*[data-test-id="dao-link"]')
      if (browser.isVisible('*[data-test-id="skip-tour"]')) {
        browser.click('*[data-test-id="skip-tour"]')
      }
      // browser.waitForExist('*[data-test-id="create-proposal"]');
      browser.click('*[data-test-id="create-proposal"]')

      browser.waitForExist('*[id="titleInput"]')
      browser.setValue('*[id="titleInput"]', 'Free Edward Snowden')
      // using uuid value so that the test will pass alsko if there is already a proposal with thi description
      // (which must be unique). TODO: find a way to reset the state
      browser.setValue('*[id="descriptionInput"]', `https://this.must.be/a/valid/url${uuid()}`)
      browser.setValue('*[id="beneficiaryInput"]', '0x5fB320886aF629122736c0e1a5c94dCE841EA37B')
      // ask for 100 rep
      browser.setValue('*[id="reputationRewardInput"]', '100')
      browser.click('*[type="submit"]')
      // we shoudl now see a dialog asking us to "launch metamask"
      browser.click('*[data-test-id="launch-metamask"]')
      // since we are working with unlocked accounts (are we?) and we do not haver metamask installed
      // we do not need to confirm at all..
      // TODO: we should see the list of proposals being refreshed automatically, but subscriptions are broken for me, so we reload the page
      browser.refresh()
      browser.waitForExist('*[data-test-id="proposal-title"]')
      // we are getting the closing date from the graph-node server
      browser.getText('*[data-test-id="proposal-closes-in"]').should.be.equal('CLOSES IN 21 DAYS')
      // TODO: the title comes from alchemy-server
      // browser.getText('*[data-test-id="proposal-title"]').should.be.equal('Free Edward Snowden')
    })

});
// import ether from './helpers/ether';
const { expect } = require('chai');
const { ethers } = require('hardhat');
const _name = "atoken";
const _symbol = "ATK";

const _rate = 500;
const _wallet = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0";

var atokenContract=null;
var crowdsale = null;

var BN = web3.utils.BN;

before(async ()  =>{
    const atoken = await ethers.getContractFactory("atoken");
    atokenContract = await atoken.deploy(_name, _symbol);

    const crowdsaleT = await ethers.getContractFactory("atokenCrowdsale");
    crowdsale = await crowdsaleT.deploy(_rate, _wallet, atokenContract.address);
})

describe("crowdsale tests", function(){

    it('tracks the rate', async function() {
        // console.log(atokenContract);
        const rate = await crowdsale.rate();
        expect(rate).to.equal(_rate);
    });
  
    it('tracks the wallet', async function() {
        // console.log(atokenContract);
        const wallet = await crowdsale.wallet();
        // console.log(symbol);
        expect(wallet).to.equal(_wallet);
    });

    it('tracks the token', async function() {
        const token = await crowdsale.token();
        expect(token).to.equal(atokenContract.address);
    });

    it('transfer the token ownership', async function() {
        await atokenContract.transferOwnership(crowdsale.address);  
    });
})

describe('minted crowdsale', function() {
    it('mints tokens after purchase', async function() {
      const originalTotalSupply = await atokenContract.totalSupply();
      console.log(web3.utils.toWei("1", 'ether'));
      const signer = await ethers.provider.getSigner("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199");
      console.log(await signer.getBalance());
      await signer.sendTransaction({to:crowdsale.address, value:ethers.utils.parseEther("1")});
    //   await crowdsale.sendTransaction({ value: web3.utils.toWei("1", 'ether'), from: "0xFE9F5c37D394aDa800d6B76222C871aCbdA3d660" });
      const newTotalSupply = await atokenContract.totalSupply();
      assert.isTrue(newTotalSupply > originalTotalSupply);
    });
});

describe('accepting payments', function() {
    it('should accept payments', async function() {
        const value = ether(1);
        const purchaser = investor2;
        await crowdsale.sendTransaction({ value: value, from: "0xFE9F5c37D394aDa800d6B76222C871aCbdA3d660" }).should.be.fulfilled;
        await crowdsale.buyTokens(investor1, { value: value, from: purchaser }).should.be.fulfilled;
    });
});

describe('buyTokens()', function() {
    describe('when the contribution is less than the minimum cap', function() {
      it('rejects the transaction', async function() {
        const value = atokenCrowdsale.investorMinCap - 1;
        await atokenCrowdsale.buyTokens(investor2, { value: value, from: investor2 }).should.be.rejectedWith(EVMRevert);
      });
    });

    describe('when the investor has already met the minimum cap', function() {
      it('allows the investor to contribute below the minimum cap', async function() {
        // First contribution is valid
        const value1 = ether(1);
        await atokenCrowdsale.buyTokens(investor1, { value: value1, from: investor1 });
        // Second contribution is less than investor cap
        const value2 = 1; // wei
        await atokenCrowdsale.buyTokens(investor1, { value: value2, from: investor1 }).should.be.fulfilled;
      });
    });
  });

  describe('when the total contributions exceed the investor hard cap', function () {
    it('rejects the transaction', async function () {
      // First contribution is in valid range
      const value1 = ether(2);
      await this.crowdsale.buyTokens(investor1, { value: value1, from: investor1 });
      // Second contribution sends total contributions over investor hard cap
      const value2 = ether(49);
      await this.crowdsale.buyTokens(investor1, { value: value2, from: investor1 }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('when the contribution is within the valid range', function () {
    const value = ether(2);
    it('succeeds & updates the contribution amount', async function () {
      await this.crowdsale.buyTokens(investor2, { value: value, from: investor2 }).should.be.fulfilled;
      const contribution = await this.crowdsale.getUserContribution(investor2);
      contribution.should.be.bignumber.equal(value);
    });
  });
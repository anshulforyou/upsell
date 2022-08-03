// import ether from './helpers/ether';
// const { expect, assert } = require('chai');
// require('chai').should();
// const { ethers } = require('hardhat');
// const _name = "atoken";
// const _symbol = "ATK";

// const _rate = 500;
// const _wallet = "0xbc396Bb6B4680C4eC6146cF30AC0573409114D35";

// var atokenContract=null;
// var crowdsale = null;

// var BN = web3.utils.BN;

// var investor1 = "0x03Da047A80a8fdd571162c0c741714934CB9706a";
// var investor2 = "0xbc396Bb6B4680C4eC6146cF30AC0573409114D35";

// before(async ()  =>{
//     const atoken = await ethers.getContractFactory("atoken");
//     atokenContract = await atoken.deploy(_name, _symbol);

//     const crowdsaleT = await ethers.getContractFactory("atokenCrowdsale");
//     crowdsale = await crowdsaleT.deploy(_rate, _wallet, atokenContract.address, ethers.utils.parseEther("100"));
// })

// describe("crowdsale tests", function(){

//     it('tracks the rate', async function() {
//         // console.log(atokenContract);
//         const rate = await crowdsale.rate();
//         expect(rate).to.equal(_rate);
//     });
  
//     it('tracks the wallet', async function() {
//         // console.log(atokenContract);
//         const wallet = await crowdsale.wallet();
//         // console.log(symbol);
//         expect(wallet).to.equal(_wallet);
//     });

//     it('tracks the token', async function() {
//         const token = await crowdsale.token();
//         expect(token).to.equal(atokenContract.address);
//     });

//     it('transfer the token ownership', async function() {
//         await atokenContract.transferOwnership(crowdsale.address);  
//     });
// })

// describe('minted crowdsale', function() {
//     it('mints tokens after purchase', async function() {
//       const originalTotalSupply = await atokenContract.totalSupply();
//       console.log(web3.utils.toWei("1", 'ether'));
//       const signer = await ethers.provider.getSigner("0xb2EFFe792146201175100196Ac13F79763ca9bF1");
//       console.log(await signer.getBalance());
//       await signer.sendTransaction({to:crowdsale.address, value:ethers.utils.parseEther("1")});
//     //   await crowdsale.sendTransaction({ value: web3.utils.toWei("1", 'ether'), from: "0xFE9F5c37D394aDa800d6B76222C871aCbdA3d660" });
//       const newTotalSupply = await atokenContract.totalSupply();
//       assert.isTrue(newTotalSupply > originalTotalSupply);
//     });
// });

// describe('accepting payments', function() {
//     it('should accept payments', async function() {
//         const value = ethers.utils.parseEther("1");
//         const purchaser = "0xbc396Bb6B4680C4eC6146cF30AC0573409114D35";
//         const signer = await ethers.provider.getSigner("0xb2EFFe792146201175100196Ac13F79763ca9bF1");
//         await signer.sendTransaction({to:crowdsale.address, value:ethers.utils.parseEther("1")});
//         // await crowdsale.sendTransaction({ value: value, from: "0x03Da047A80a8fdd571162c0c741714934CB9706a" }).should.be.fulfilled;
//         await crowdsale.buyTokens(purchaser, { value: value, from: purchaser }).should.be.fulfilled;
//         // await assert.isFulfilled(crowdsale.buyTokens(purchaser, { value: value, from: purchaser }))
//     });
// });

// describe('buyTokens()', function() {
//     describe('when the contribution is less than the minimum cap', function() {
//       it('rejects the transaction', async function() {
//         const value = crowdsale.investorMinCap - 1;
//         await crowdsale.buyTokens(investor2, { value: value, from: investor2 }).should.be.revertedWith("revert");
//       });
//     });

//     describe('when the investor has already met the minimum cap', function() {
//       it('allows the investor to contribute below the minimum cap', async function() {
//         // First contribution is valid
//         const value1 = ethers.utils.parseEther("1");
//         await crowdsale.buyTokens(investor1, { value: value1, from: investor1 });
//         // Second contribution is less than investor cap
//         const value2 = 1; // wei
//         await expect(crowdsale.buyTokens(investor1, { value: value2, from: investor1 })).to.be.fulfilled;
//       });
//     });
//   });

//   describe('when the total contributions exceed the investor hard cap', function () {
//     it('rejects the transaction', async function () {
//       // First contribution is in valid range
//       const value1 = ethers.utils.parseEther("2");
//       await crowdsale.buyTokens(investor1, { value: value1, from: investor1 });
//       // Second contribution sends total contributions over investor hard cap
//       const value2 = ethers.utils.parseEther("49");
//       await crowdsale.buyTokens(investor1, { value: value2, from: investor1 }).should.be.revertedWith("revert");
//     });
//   });

//   describe('when the contribution is within the valid range', function () {
//     const value = ethers.utils.parseEther("2");
//     it('succeeds & updates the contribution amount', async function () {
//       await crowdsale.buyTokens(investor2, { value: value, from: investor2 }).should.be.fulfilled;
//       const contribution = await crowdsale.getUserContribution(investor2);
//       contribution.should.be.bignumber.equal(value);
//     });
//   });

//   describe('finalizing the crowdsale', function() {
//     describe('when the goal is not reached', function() {
//       beforeEach(async function () {
//         // Do not meet the toal
//         await this.crowdsale.buyTokens(investor2, { value: ether(1), from: investor2 });
//         // Fastforward past end time
//         await increaseTimeTo(this.closingTime + 1);
//         // Finalize the crowdsale
//         await this.crowdsale.finalize({ from: _ });
//       });

//       it('allows the investor to claim refund', async function () {
//         await this.vault.refund(investor2, { from: investor2 }).should.be.fulfilled;
//       });
//     });

//     describe('when the goal is reached', function() {
//       beforeEach(async function () {
//         // track current wallet balance
//         this.walletBalance = await web3.eth.getBalance(wallet);

//         // Meet the goal
//         await this.crowdsale.buyTokens(investor1, { value: ether(26), from: investor1 });
//         await this.crowdsale.buyTokens(investor2, { value: ether(26), from: investor2 });
//         // Fastforward past end time
//         await increaseTimeTo(this.closingTime + 1);
//         // Finalize the crowdsale
//         await this.crowdsale.finalize({ from: _ });
//       });

//       it('handles goal reached', async function () {
//         // Tracks goal reached
//         const goalReached = await this.crowdsale.goalReached();
//         goalReached.should.be.true;

//         // Finishes minting token
//         const mintingFinished = await this.token.mintingFinished();
//         mintingFinished.should.be.true;

//         // Unpauses the token
//         const paused = await this.token.paused();
//         paused.should.be.false;

//         // Prevents investor from claiming refund
//         await this.vault.refund(investor1, { from: investor1 }).should.be.rejectedWith(EVMRevert);
//       });
//     });
//   });
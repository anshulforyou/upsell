// const BigNumber = web3.BigNumber;

// const atoken = artifacts.require("atoken");

const { expect } = require('chai');

// contract('atoken', accounts => {
const _name = "atoken";
const _symbol = "ATK";

var atokenContract=null;



describe("token attributes", function(){
    before(async ()  =>{
        const atoken = await ethers.getContractFactory("atoken");
        atokenContract = await atoken.deploy("atoken", "ATK");
    })
    it('has the correct name', async function() {
        // console.log(atokenContract);
        const name = await atokenContract.name();
        console.log(name);
        expect(name).to.equal(_name);
      });
  
      it('has the correct symbol', async function() {
        // console.log(atokenContract);
        const symbol = await atokenContract.symbol();
        console.log(symbol);
        expect(symbol).to.equal(_symbol);
      });
})

// describe("atoken", ()=>{
//     it("should deploy the token", async () => {
//         const atoken = await ethers.getContractFactory("atoken");
//         const atokenContract = await atoken.deploy("atoken");

//         await atokenContract.deployed();
//         expect()
//     })
// })

// })
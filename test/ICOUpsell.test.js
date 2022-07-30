const { expect } = require("chai");
const { describe } = require("mocha");
const { ethers, waffle, network } = require("hardhat");

describe("Upsell ICO contract test", async function() {
    let deployer, wallet, founders, developers, partners, user1, user2, UPsellToken, ICOUpsell, loadFixture;

    const createFixtureLoader = waffle.createFixtureLoader;
    const fixture = async () => {
        const _UPsellToken = await ethers.getContractFactory("UPsellToken");
        UPsellToken = await _UPsellToken.deploy(ethers.utils.parseEther("10000000"));
        await UPsellToken.deployed();

        const _ICOUpsell = await ethers.getContractFactory("ICOUpsell");
        ICOUpsell = await _ICOUpsell.deploy(
            3,
            wallet.address,
            UPsellToken.address,
            founders.address,
            developers.address,
            partners.address
        );
        await ICOUpsell.deployed();

        const MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
        await UPsellToken.grantRole(MINTER_ROLE, ICOUpsell.address);
    };

    before('create fixture loader', async () => {
        [deployer, wallet, founders, developers, partners, user1, user2] = await ethers.getSigners();
        loadFixture = createFixtureLoader([deployer, wallet, founders, developers, partners, user1, user2]);
    });

    describe("Contract deployment", async function() {

        beforeEach('deploy contracts', async () => {
            await loadFixture(fixture);
        });

        it('1. Upsell ICO contract deploys successfully', async function () {
            expect(ICOUpsell.address).to.not.be.undefined;
            expect(ICOUpsell.address).to.not.equal(ethers.constants.AddressZero);
        });

        it('2. Vesting contracts are created successfully', async function () {
            expect(await ICOUpsell.foundersTimelock()).to.not.be.undefined;
            expect(await ICOUpsell.foundersTimelock()).to.not.equal(ethers.constants.AddressZero);
            expect(await ICOUpsell.developersTimelock()).to.not.be.undefined;
            expect(await ICOUpsell.developersTimelock()).to.not.equal(ethers.constants.AddressZero);
            expect(await ICOUpsell.partnersTimelock()).to.not.be.undefined;
            expect(await ICOUpsell.partnersTimelock()).to.not.equal(ethers.constants.AddressZero);
        });

        it('3. Contract params can be retrieved correctly', async function () {
            expect(await ICOUpsell.INVESTOR_MIN_CAP()).to.equal(ethers.utils.parseEther("0.002"));
            expect(await ICOUpsell.INVESTOR_HARD_CAP()).to.equal(ethers.utils.parseEther("50"));
            expect(await ICOUpsell.TOTAL_SUPPLY()).to.equal(ethers.utils.parseEther("10000000"));

            expect(await ICOUpsell.foundersWallet()).to.equal(founders.address);
            expect(await ICOUpsell.developersWallet()).to.equal(developers.address);
            expect(await ICOUpsell.partnersWallet()).to.equal(partners.address);

            expect(await ICOUpsell.token()).to.equal(UPsellToken.address);
            expect(await ICOUpsell.wallet()).to.equal(wallet.address);
            expect(await ICOUpsell.rate()).to.equal(3);
            expect(await ICOUpsell.saleLive()).to.equal(false);
        });
    });

    describe("Initiation of token sale", async function() {

        beforeEach('deploy contracts', async () => {
            await loadFixture(fixture);
        });

        it('0. Tokens cannot be bought prior to starting sale', async function () {
            const amount = 2;
            await expect(
                ICOUpsell.connect(user1).buyTokens(user1.address, {value: ethers.utils.parseEther(amount.toString())})
            ).to.be.revertedWith("Sale is not live yet or it finished!");
        });

        it('1. Owner can start token sale and vesting', async function () {
            await ICOUpsell.startSale();
            expect(await ICOUpsell.saleLive()).to.equal(true);

            const totalSupply = parseFloat(ethers.utils.formatEther(await ICOUpsell.TOTAL_SUPPLY()));

            expect(parseFloat(ethers.utils.formatEther(
                (await UPsellToken.balanceOf(await ICOUpsell.foundersTimelock()))
            ))).to.equal(
                (await ICOUpsell.FOUNDERS_PERCENTAGE()*totalSupply)/200
            );

            expect(parseFloat(ethers.utils.formatEther(
                (await UPsellToken.balanceOf(await ICOUpsell.developersTimelock()))
            ))).to.equal(
                (await ICOUpsell.DEVELOPERS_PERCENTAGE()*totalSupply)/200
            );

            expect(parseFloat(ethers.utils.formatEther(
                (await UPsellToken.balanceOf(await ICOUpsell.partnersTimelock()))
            ))).to.equal(
                (await ICOUpsell.PARTNERS_PERCENTAGE()*totalSupply)/200
            );
        });

        it('2. Only owner can initiate token sale', async function () {
            await expect(
                ICOUpsell.connect(user1).startSale()
            ).to.be.revertedWith("Ownable: caller is not the owner");    
            expect(await ICOUpsell.saleLive()).to.equal(false);  
        });

        it('3. Stakeholders receive their share of tokens', async function () {
            await ICOUpsell.startSale();
            
            const totalSupply = parseFloat(ethers.utils.formatEther(await ICOUpsell.TOTAL_SUPPLY()));

            expect(parseFloat(ethers.utils.formatEther(
                (await UPsellToken.balanceOf(await ICOUpsell.foundersWallet()))
            ))).to.equal(
                (await ICOUpsell.FOUNDERS_PERCENTAGE()*totalSupply)/200
            );

            expect(parseFloat(ethers.utils.formatEther(
                (await UPsellToken.balanceOf(await ICOUpsell.developersWallet()))
            ))).to.equal(
                (await ICOUpsell.DEVELOPERS_PERCENTAGE()*totalSupply)/200
            );

            expect(parseFloat(ethers.utils.formatEther(
                (await UPsellToken.balanceOf(await ICOUpsell.partnersWallet()))
            ))).to.equal(
                (await ICOUpsell.PARTNERS_PERCENTAGE()*totalSupply)/200
            );
        });
    });

    describe("Token sale", async function() {

        beforeEach('deploy contracts', async () => {
            await loadFixture(fixture);
            await ICOUpsell.startSale();
        });

        it('1. Investors can buy tokens', async function () {
            const amount = 0.5;

            await expect(
                ICOUpsell.connect(user1).buyTokens(user1.address, {value: ethers.utils.parseEther(amount.toString())})
            ).to.emit(ICOUpsell, 'TokensPurchased')
            .withArgs(
                user1.address, 
                user1.address,
                ethers.utils.parseEther(amount.toString()),
                ethers.utils.parseEther((await ICOUpsell.rate() * amount).toString())
            );

            expect(parseFloat(
                ethers.utils.formatEther(await UPsellToken.balanceOf(user1.address))
            )).to.equal(await ICOUpsell.rate() * amount);

            await user2.sendTransaction({ to: ICOUpsell.address, value: ethers.utils.parseEther(amount.toString())});
            expect(parseFloat(
                ethers.utils.formatEther(await UPsellToken.balanceOf(user2.address))
            )).to.equal(await ICOUpsell.rate() * amount);
        });

        it('2. Investor contribution is correctly updated', async function () {
            const amount = 2;
            await ICOUpsell.connect(user1).buyTokens(user1.address, {value: ethers.utils.parseEther(amount.toString())});
            
            expect(parseFloat(
                ethers.utils.formatEther(await ICOUpsell.getUserContribution(user1.address))
            )).to.equal(amount);
        });

        it('3. Investors can buy tokens only within the cap', async function () {
            const amount1 = 0.0019;
            await expect(
                ICOUpsell.connect(user1).buyTokens(user1.address, {value: ethers.utils.parseEther(amount1.toString())})
            ).to.be.reverted;

            const amount2 = 51;
            await expect(
                ICOUpsell.connect(user1).buyTokens(user1.address, {value: ethers.utils.parseEther(amount2.toString())})
            ).to.be.reverted;
        });

        it('4. Purchase is reverted for invalid params', async function () {
            await expect(
                ICOUpsell.connect(user1).buyTokens(ethers.constants.AddressZero, {value: ethers.utils.parseEther("1")})
            ).to.be.revertedWith("Crowdsale: beneficiary is the zero address");

            await expect(
                ICOUpsell.connect(user1).buyTokens(user1.address, {value: 0})
            ).to.be.revertedWith("Crowdsale: weiAmount is 0");
        });
    });

    describe("Closing token sale", async function() {
        beforeEach('deploy contracts', async () => {
            await loadFixture(fixture);
            await ICOUpsell.startSale();
            const amount = 40;
            await ICOUpsell.connect(user1).buyTokens(user1.address, {value: ethers.utils.parseEther(amount.toString())});
            await ICOUpsell.connect(user2).buyTokens(user2.address, {value: ethers.utils.parseEther(amount.toString())});
        });

        it('1. Owner can close token sale', async function () {
            expect(await ICOUpsell.saleLive()).to.equal(true);
            await ICOUpsell.finishSale();
            expect(await ICOUpsell.saleLive()).to.equal(false);
        });

        it('2. Only owner can close token sale', async function () {
            await expect(
                ICOUpsell.connect(user1).finishSale()
            ).to.be.revertedWith("Ownable: caller is not the owner");    
            expect(await ICOUpsell.saleLive()).to.equal(true);  
        });

        it('3. Tokens cannot be purchased once sale is closed', async function () {
            await ICOUpsell.finishSale();
            await expect(
                ICOUpsell.connect(user1).buyTokens(user1.address, {value: ethers.utils.parseEther("2")})
            ).to.be.revertedWith("Sale is not live yet or it finished!");     
        });
    });

    describe("Funds withdrawal", async function() {

        beforeEach('deploy contracts', async () => {
            await loadFixture(fixture);
            await ICOUpsell.startSale();
            const amount = 40;
            await ICOUpsell.connect(user1).buyTokens(user1.address, {value: ethers.utils.parseEther(amount.toString())});
            await ICOUpsell.connect(user2).buyTokens(user2.address, {value: ethers.utils.parseEther(amount.toString())});
        });

        it('1. Owner can withdraw funds', async function () {
            const initialBalance = ethers.utils.formatEther(await wallet.getBalance());
            await ICOUpsell.withdrawFunds();
            const finalBalance = ethers.utils.formatEther(await wallet.getBalance());
            expect(
                parseFloat(finalBalance) - parseFloat(initialBalance)
            ).to.equal(80);
        });

        it('2. Only owner can withdraw funds', async function () {
            await expect(
                ICOUpsell.connect(user1).withdrawFunds()
            ).to.be.revertedWith("Ownable: caller is not the owner");  
        });
    });

    describe("Vesting", async function() {

        beforeEach('deploy contracts', async () => {
            await loadFixture(fixture);
            await ICOUpsell.startSale();
        });

        it('1. Tokens can be released after the vesting period', async function () {
            await network.provider.send("evm_increaseTime", [60*60*24*365*3]);
            await ICOUpsell.releaseTokens();

            const totalSupply = parseFloat(ethers.utils.formatEther(await ICOUpsell.TOTAL_SUPPLY()));

            expect(parseFloat(ethers.utils.formatEther(
                (await UPsellToken.balanceOf(await ICOUpsell.foundersWallet()))
            ))).to.equal(
                (await ICOUpsell.FOUNDERS_PERCENTAGE()*totalSupply)/100
            );

            expect(parseFloat(ethers.utils.formatEther(
                (await UPsellToken.balanceOf(await ICOUpsell.developersWallet()))
            ))).to.equal(
                (await ICOUpsell.DEVELOPERS_PERCENTAGE()*totalSupply)/100
            );

            expect(parseFloat(ethers.utils.formatEther(
                (await UPsellToken.balanceOf(await ICOUpsell.partnersWallet()))
            ))).to.equal(
                (await ICOUpsell.PARTNERS_PERCENTAGE()*totalSupply)/100
            );
        });

        it('2. Tokens cannot be released during vesting period', async function () {
            await expect(
                ICOUpsell.releaseTokens()
            ).to.be.revertedWith("TokenTimelock: current time is before release time");  
        });
    });
});
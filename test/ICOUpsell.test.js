const { expect } = require("chai");
const { describe } = require("mocha");
const { ethers, waffle } = require("hardhat");

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

        it('1. Users can buy tokens', async function () {
            const amount = 1.56;
            await ICOUpsell.connect(user1).buyTokens(user1.address, {value: ethers.utils.parseEther(amount.toString())});
            expect(parseFloat(
                ethers.utils.formatEther(await UPsellToken.balanceOf(user1.address))
            )).to.equal(await ICOUpsell.rate() * amount);
        });
    });
});
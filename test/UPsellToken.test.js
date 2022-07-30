const { expect } = require("chai");
const { describe } = require("mocha");
const { ethers, waffle } = require("hardhat");

describe("UPsell Token contract test", async function() {
    let deployer, wallet, UPsellToken, loadFixture;

    const createFixtureLoader = waffle.createFixtureLoader;
    const fixture = async () => {
        const _UPsellToken = await ethers.getContractFactory("UPsellToken");
        UPsellToken = await _UPsellToken.deploy(ethers.utils.parseEther("10000000"));
        await UPsellToken.deployed();
    };

    before('create fixture loader', async () => {
        [deployer, wallet] = await ethers.getSigners();
        loadFixture = createFixtureLoader([deployer, wallet]);
    });

    beforeEach('deploy contracts', async () => {
        await loadFixture(fixture);
    });

    it('1. Upsell Token contract deploys successfully', async function () {
        expect(UPsellToken.address).to.not.be.undefined;
        expect(UPsellToken.address).to.not.equal(ethers.constants.AddressZero);
    });

    it('2. Upsell Token has the correct name, symbol and decimals', async function () {
        expect(await UPsellToken.name()).to.equal("UPsellToken");
        expect(await UPsellToken.symbol()).to.equal("UPSELL");
        expect(await UPsellToken.decimals()).to.equal(18);
        expect(await UPsellToken.cap()).to.equal(ethers.utils.parseEther("10000000"));
    });

    it('3. Tokens are pre-minted to the deployer', async function () {
        expect(
            parseFloat(ethers.utils.formatEther(await UPsellToken.balanceOf(deployer.address)))
        ).to.equal(15000);
    });

    it('4. Tokens can be minted by the owner', async function () {
        await expect(
            UPsellToken.mint(wallet.address, ethers.utils.parseEther("500000"))
        ).to.emit(UPsellToken, 'Transfer')
        .withArgs(ethers.constants.AddressZero, wallet.address, ethers.utils.parseEther("500000"));

        expect(
            parseFloat(ethers.utils.formatEther(await UPsellToken.balanceOf(wallet.address)))
        ).to.equal(500000);
    });

    it('5. Tokens cannot be minted without MINTER ROLE', async function () {
        await expect(
            UPsellToken.connect(wallet).mint(wallet.address, ethers.utils.parseEther("500000"))
        ).to.be.revertedWith("ERC20PresetMinterPauser: must have minter role to mint");
    });

    it('6. Token transfers can be paused by the owner', async function () {
        await expect(
            UPsellToken.connect(wallet).pause()
        ).to.be.revertedWith("ERC20PresetMinterPauser: must have pauser role to pause");

        expect(await UPsellToken.paused()).to.equal(false);
        await expect(UPsellToken.pause()).to.emit(UPsellToken, 'Paused')
        .withArgs(deployer.address);
        expect(await UPsellToken.paused()).to.equal(true);

        await expect(
            UPsellToken.transfer(wallet.address, ethers.utils.parseEther("1000"))
        ).to.be.revertedWith("ERC20Pausable: token transfer while paused");
    });

    it('7. Token transfers can be unpaused by the owner', async function () {
        await expect(
            UPsellToken.connect(wallet).unpause()
        ).to.be.revertedWith("ERC20PresetMinterPauser: must have pauser role to unpause");

        await expect(UPsellToken.pause()).to.emit(UPsellToken, 'Paused')
        .withArgs(deployer.address);
        await expect(UPsellToken.unpause()).to.emit(UPsellToken, 'Unpaused')
        .withArgs(deployer.address);
        
        await UPsellToken.transfer(wallet.address, ethers.utils.parseEther("1000"));
        expect(
            parseFloat(ethers.utils.formatEther(await UPsellToken.balanceOf(wallet.address)))
        ).to.equal(1000);
    });

    it('8. Tokens can be burned by approval', async function () {
        const amountToBurn = 500;
        const initialSupply = parseFloat(ethers.utils.formatEther(await UPsellToken.totalSupply()));
        await UPsellToken.transfer(wallet.address, ethers.utils.parseEther("1000"));
        await UPsellToken.connect(wallet).increaseAllowance(deployer.address, ethers.utils.parseEther("500"));
        await expect(
            UPsellToken.burnFrom(wallet.address, ethers.utils.parseEther("500"))
        ).to.emit(UPsellToken, 'Transfer')
        .withArgs(wallet.address, ethers.constants.AddressZero, ethers.utils.parseEther("500"));
        const finalSupply = parseFloat(ethers.utils.formatEther(await UPsellToken.totalSupply()));

        expect(
            parseFloat(ethers.utils.formatEther(await UPsellToken.balanceOf(wallet.address)))
        ).to.equal(1000 - amountToBurn);

        expect(
            initialSupply - finalSupply
        ).to.equal(amountToBurn);
    });

    it('9. Tokens can be burned by the user', async function () {
        const amountToBurn = 500;
        const initialSupply = parseFloat(ethers.utils.formatEther(await UPsellToken.totalSupply()));
        await UPsellToken.transfer(wallet.address, ethers.utils.parseEther("1000"));
        await expect(
            UPsellToken.connect(wallet).burn(ethers.utils.parseEther("500"))
        ).to.emit(UPsellToken, 'Transfer')
        .withArgs(wallet.address, ethers.constants.AddressZero, ethers.utils.parseEther("500"));
        const finalSupply = parseFloat(ethers.utils.formatEther(await UPsellToken.totalSupply()));

        expect(
            parseFloat(ethers.utils.formatEther(await UPsellToken.balanceOf(wallet.address)))
        ).to.equal(1000 - amountToBurn);

        expect(
            initialSupply - finalSupply
        ).to.equal(amountToBurn);
    });

    it('10. Tokens cannot be minted beyond the max supply', async function () {
        await expect(
            UPsellToken.mint(wallet.address, ethers.utils.parseEther("10000000"))
        ).to.be.revertedWith("ERC20Capped: cap exceeded");
    });
});
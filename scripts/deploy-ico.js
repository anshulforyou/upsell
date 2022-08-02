async function main() {
    const UPsellTokenAddress = "";
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account: ", deployer.address);

    console.log("Account balance:", ethers.utils.formatEther((await deployer.getBalance()).toString()));
    const icoUpsell = await ethers.getContractFactory("ICOUpsell");
    const contract = await icoUpsell.deploy(
        "RATE AT WHICH TOKEN WILL BE BOUGHT IN INTEGER", 
        "WALLET_ADDRESS IN WHICH ETHER WILL BE COLLECTED", 
        UPsellTokenAddress, 
        "FOUNDER_WALLET_ADDRESS", 
        "DEVELOPERS_WALLET_ADDRESS", 
        "PARTNERS_WALLET_ADDRESS"
    );
    await contract.deployed();

    const _UPsellToken = await ethers.getContractFactory("UPsellToken");
    const UPsellToken = await _UPsellToken.attach(UPsellTokenAddress);

    const MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
    await UPsellToken.grantRole(MINTER_ROLE, contract.address);

    console.log("Contract address:", contract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account: ",deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());
    const icoUpsell = await ethers.getContractFactory("ICOUpsell");
    const contract = await icoUpsell.deploy("RATE AT WHICH TOKEN WILL BE BOUGHT IN INTEGER", "WALLET_ADDRESS IN WHICH ETHER WILL BE COLLECTED", "UPSELL_TOKEN_ADDRESS", "FOUNDER_WALLET_ADDRESS", "DEVELOPERS_WALLET_ADDRESS", "PARTNERS_WALLET_ADDRESS");
    console.log("Contract address:", contract.address);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
async function main(){
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account: ",deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());
    const upsellToken = await ethers.getContractFactory("UPsellToken");
    const contract = await upsellToken.deploy();
    console.log("Contract address:", contract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
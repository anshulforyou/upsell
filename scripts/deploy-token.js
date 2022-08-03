async function main() {
    const tokenSupplyCap = 10000000;
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account: ",deployer.address);

    console.log("Account balance:", ethers.utils.formatEther((await deployer.getBalance()).toString()));
    const upsellToken = await ethers.getContractFactory("UPsellToken");
    const contract = await upsellToken.deploy(ethers.utils.parseEther(tokenSupplyCap.toString()));
    await contract.deployed();
    console.log("Contract address:", contract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const ethers = connection.ethers;

  const [deployer] = await ethers.getSigners();

  console.log("Deploying from:", deployer.address);

  const PropertyToken = await ethers.getContractFactory("PropertyToken");

  const contract = await PropertyToken.deploy(
    "Property A Token",
    "PROP_A",
    1,
    deployer.address
  );

  await contract.waitForDeployment();

  console.log("Contract deployed at:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
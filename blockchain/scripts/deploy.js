const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // Deploy PropertyToken
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy(deployer.address);

  await propertyToken.waitForDeployment();

  console.log("PropertyToken deployed to:", await propertyToken.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

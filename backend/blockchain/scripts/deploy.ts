import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying from:", deployer.address);

  const PropertyToken = await ethers.getContractFactory("PropertyToken");

  const contract = await PropertyToken.deploy(
    "Property A Token",
    "PROP_A",
    1,
    deployer.address, 
    {
      gasLimit: 8000000
    }
  );

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("Contract deployed at:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
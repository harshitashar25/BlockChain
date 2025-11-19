const hre = require("hardhat");

async function main() {
  // Get the ContractFactory for FraudLedger
  const FraudLedger = await hre.ethers.getContractFactory("FraudLedger");

  // Deploy the contract
  console.log("Deploying FraudLedger contract...");
  const contract = await FraudLedger.deploy();
  
  // Wait for deployment (ethers v6 compatible)
  await contract.waitForDeployment();
  
  // Get the deployed address
  const address = await contract.getAddress();
  
  // Log the deployed address for the frontend team
  console.log("FraudLedger contract deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


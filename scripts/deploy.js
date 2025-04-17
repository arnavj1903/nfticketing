// scripts/deploy.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path"); // for updating CONTRACT_ADDRESS path using Node.js fs

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const EventTicket = await ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicket.deploy(
    "ConcertTicket",
    "CTIX",
    "Annual Music Festival",
    "May 15, 2025",
    "City Stadium",
    100 // max tickets
  );

  await eventTicket.waitForDeployment();
  const contractAddress = await eventTicket.getAddress();

  console.log("EventTicket deployed to:", contractAddress);

   // Update CONTRACT_ADDRESS in app.js
   const appJsPath = path.join(__dirname, "../src/app.js");
   let appJs = fs.readFileSync(appJsPath, "utf8");
   appJs = appJs.replace(
     /const CONTRACT_ADDRESS = '0x[a-fA-F0-9]{40}';/,
     `const CONTRACT_ADDRESS = '${contractAddress}';`
   );
   fs.writeFileSync(appJsPath, appJs, "utf8");
   console.log("Updated CONTRACT_ADDRESS in src/app.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
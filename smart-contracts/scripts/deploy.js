import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Deploying CertificateVerification contract...");

  const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");
  const contract = await CertificateVerification.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("CertificateVerification deployed to:", address);

  // Save the contract address to frontend
  const configDir = __dirname + "/../../frontend/src/config";
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(
    configDir + "/contractAddress.json",
    JSON.stringify({ CertificateVerification: address }, undefined, 2)
  );
  
  console.log("Contract address saved to frontend!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

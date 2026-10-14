# CertiChain - Academic Certificate Verification Setup Guide

CertiChain is a full-stack, decentralized academic certificate issuance and verification platform powered by Ethereum smart contracts and client-side SHA-256 cryptographic hashing.

---

## Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **MetaMask** browser extension (for issuing and revoking credentials)

---

## 1. Smart Contract Setup & Local Blockchain

1. Open your terminal and navigate to `smart-contracts`:
   ```bash
   cd smart-contracts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run automated tests to verify contract functionality:
   ```bash
   npm test
   ```
   *(All 14 unit tests should pass)*

4. Start the local Hardhat blockchain node:
   ```bash
   npx hardhat node
   ```
   *Note: Keep this terminal window open. Hardhat will print 20 test accounts with 10,000 ETH each and their private keys.*

5. Open a **second terminal** and deploy the smart contract to the local node:
   ```bash
   cd smart-contracts
   npm run deploy
   ```
   *This deploys `CertificateVerification.sol` and automatically saves its deployed address to `frontend/src/config/contractAddress.json`.*

---

## 2. Frontend Web Application Setup

1. In another terminal, navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 3. Configuring MetaMask for Local Testing

To test issuing certificates in the **Issuer Portal**, configure MetaMask with Hardhat's local network and test account:

### A. Add Hardhat Local Network to MetaMask
- **Network Name:** Hardhat Localhost
- **RPC URL:** `http://127.0.0.1:8545`
- **Chain ID:** `31337`
- **Currency Symbol:** `ETH`

*(Note: The frontend also features a "Switch Network" prompt that can automatically add this network for you).*

### B. Import Test Account #0 (Contract Owner & Default Issuer)
1. In MetaMask, click your profile icon -> **Add account or hardware wallet** -> **Import account**.
2. Select **Private Key** and paste Hardhat's Account #0 private key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. This account will have ~10,000 test ETH and is authorized as the contract **Owner** and primary **Issuer**.

---

## 4. Platform Workflow

### 🎓 Issuing a Certificate:
1. Connect MetaMask using Account #0.
2. Go to the **Issuer Portal**.
3. Enter the Student Name, Degree/Course, and upload a digital certificate file (PDF, PNG, JPG).
4. Click **Register Certificate on Blockchain** and confirm the transaction in MetaMask.
5. A confirmation screen will display the transaction receipt and a verification QR code.

### 🔍 Verifying a Certificate:
- **By File:** Go to the Home page, drag and drop the exact certificate file, and click **Verify File Authenticity**.
- **By Hash:** Paste any 64-character SHA-256 hash or scan the QR code to query the blockchain ledger in real time.
- Anyone can verify certificates **without MetaMask installed**; the platform queries the blockchain via read-only RPC provider.

### 🚫 Revoking a Certificate:
1. Under **Issuer Portal** -> **Revoke**, paste the certificate hash.
2. Look up the record, confirm the candidate details, and click **Confirm Revoke on Blockchain**.
3. Any subsequent verification checks will display a clear **Certificate Revoked** warning.

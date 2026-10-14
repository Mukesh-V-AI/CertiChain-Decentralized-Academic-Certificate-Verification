# 🎓 CertiChain — Decentralized Academic Certificate Verification

> **A trustless, blockchain-powered academic credential issuance and verification platform.**  
> Eliminates credential fraud using client-side SHA-256 cryptographic hashing and immutable Ethereum smart contracts.

---

## 🌟 Highlights

- **🔒 Privacy-Preserving Client-Side Hashing:** Official diplomas (PDFs/Images) never leave the browser. SHA-256 cryptographic digests are computed locally via Web Crypto API.
- **⚡ Instant Zero-Trust Verification:** Employers and recruiters can verify credential authenticity in milliseconds with **no MetaMask or wallet needed**.
- **📜 Smart Contract Enforcement:** Only whitelisted educational institutions can mint certificates. Non-repudiation and timestamping are cryptographically guaranteed.
- **🚫 On-Chain Revocation:** Academic institutions or the contract owner can revoke diplomas in case of administrative errors or misconduct, immediately notifying verifiers.
- **📱 Dynamic QR Code Integration:** Certificates automatically generate verification QR codes linking directly to immutable on-chain proof.
- **🧪 100% Tested:** Comprehensive unit test suite covering deployment, access control, registration, duplicate checks, verification, and revocation.

---

## 🏗️ System Architecture

```
                                +-----------------------------+
                                |  Official Certificate File  |
                                |     (PDF / PNG / JPG)       |
                                +--------------+--------------+
                                               |
                                               v
                                [ Client-Side SHA-256 Hash ]
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     v                                                   v
           [ Issuer Dashboard ]                                [ Verification Portal ]
                     |                                                   |
                     | (Signed by Institution)                           | (Public eth_call)
                     v                                                   v
+-----------------------------------------------------------------------------------------+
|                              CertificateVerification.sol                                |
|                                                                                         |
|   - owner: 0x... (University Board Administrator)                                       |
|   - isIssuer: mapping(address => bool)                                                  |
|   - certificates: mapping(string => Certificate)                                        |
|       * studentName: string                                                             |
|       * courseName: string                                                              |
|       * issueDate: uint256                                                              |
|       * isValid: bool                                                                   |
|       * issuer: address                                                                 |
+-----------------------------------------------------------------------------------------+
```

---

## 🧰 Technology Stack

| Layer | Technologies |
|---|---|
| **Smart Contracts** | Solidity (`^0.8.24`), Hardhat, Ethers.js v6, Chai / Mocha |
| **Frontend Framework** | React 19, Vite, React Router v7 |
| **Blockchain Client** | Ethers.js v6 (Dual-provider: BrowserProvider + JsonRpcProvider) |
| **Styling & UI** | Pure CSS (Glassmorphism, Dark Mode, Responsive Design), Lucide Icons |
| **Utilities** | Web Cryptography API (`crypto.subtle`), `qrcode.react` |

---

## 📁 Repository Structure

```text
blockchain-project/
├── docs/
│   ├── ARCHITECTURE.md           # In-depth technical architecture & sequence diagrams
│   ├── API_CONTRACT_REFERENCE.md # Complete smart contract & JS API reference
│   ├── SETUP.md                  # Step-by-step developer setup & MetaMask guide
│   └── USER_MANUAL.md            # Comprehensive user manual for Issuers & Verifiers
├── frontend/
│   ├── src/
│   │   ├── artifacts/            # Compiled smart contract ABIs
│   │   ├── components/
│   │   │   └── Navbar.jsx        # Navigation, wallet connection, & node health indicator
│   │   ├── config/
│   │   │   ├── contract.js       # Contract definitions & RPC failover helpers
│   │   │   └── contractAddress.json # Auto-generated contract deployment address
│   │   ├── context/
│   │   │   └── Web3Context.jsx   # Wallet state, network switcher, & role management
│   │   ├── pages/
│   │   │   ├── Home.jsx          # File upload & hash verification home page
│   │   │   ├── IssuerDashboard.jsx # Minting, revocation, & owner administration
│   │   │   └── VerifyCertificate.jsx # Real-time on-chain verification screen
│   │   ├── utils/
│   │   │   └── hash.js           # Client-side SHA-256 calculation
│   │   ├── App.jsx               # Application routes & network status banners
│   │   └── index.css             # Glassmorphic design system
│   ├── package.json
│   └── vite.config.js
└── smart-contracts/
    ├── contracts/
    │   └── CertificateVerification.sol # Core verification smart contract
    ├── scripts/
    │   └── deploy.js             # Deployment script & frontend config sync
    ├── test/
    │   └── CertificateVerification.test.js # 14 automated unit tests
    ├── hardhat.config.js
    └── package.json
```

---

## ⚡ Quickstart Guide

### 1. Start the Local Blockchain Node
In a new terminal:
```bash
cd smart-contracts
npm install
npx hardhat node
```
*(Leave this terminal running. It creates a local Ethereum node at `http://127.0.0.1:8545` with 20 pre-funded test accounts).*

### 2. Deploy the Smart Contract
In a second terminal:
```bash
cd smart-contracts
npm run deploy
```
*(Deploys `CertificateVerification.sol` and syncs the address with the frontend).*

### 3. Start the Frontend
In a third terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🦊 Setting Up MetaMask for Local Testing

1. **Add Hardhat Network:**
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
2. **Import Deployer Account (Contract Owner / Issuer):**
   - In MetaMask, select **Import Account** ➔ **Private Key**.
   - Paste Hardhat Account #0's key:
     ```text
     0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
     ```
   - Connect this account on the frontend to access the **Issuer Portal**.

---

## 🧪 Running Automated Tests

Run the smart contract test suite:
```bash
cd smart-contracts
npm test
```

Expected output:
```text
  CertificateVerification Contract
    Deployment & Initialization
      ✔ should set the contract deployer as owner
      ✔ should authorize the owner as an issuer by default
    Issuer Management
      ✔ should allow owner to add a new issuer
      ✔ should prevent non-owners from adding an issuer
      ✔ should allow owner to remove an issuer
      ✔ should prevent non-owners from removing an issuer
    Certificate Registration
      ✔ should allow an authorized issuer to register a certificate
      ✔ should prevent unauthorized accounts from registering a certificate
      ✔ should prevent registering the same certificate hash twice
    Certificate Verification
      ✔ should return false for unregistered certificate hashes
    Certificate Revocation
      ✔ should allow the original issuer to revoke a certificate
      ✔ should allow the contract owner to revoke any certificate
      ✔ should prevent a different issuer from revoking someone else's certificate
      ✔ should prevent revoking an already revoked or non-existent certificate

  14 passing (2s)
```

---

## 📚 Detailed Documentation

For in-depth guides and specifications, refer to the `docs/` folder:
- 📖 **[User Manual (docs/USER_MANUAL.md)](file:///e:/projects/blockchain%20project/docs/USER_MANUAL.md):** User guide for university administrators, employers, and students.
- ⚙️ **[Setup Guide (docs/SETUP.md)](file:///e:/projects/blockchain%20project/docs/SETUP.md):** Detailed developer setup and troubleshooting.
- 🏛️ **[Technical Architecture (docs/ARCHITECTURE.md)](file:///e:/projects/blockchain%20project/docs/ARCHITECTURE.md):** Sequence diagrams, threat analysis, and design principles.
- 🔌 **[API & Contract Reference (docs/API_CONTRACT_REFERENCE.md)](file:///e:/projects/blockchain%20project/docs/API_CONTRACT_REFERENCE.md):** Method signatures, events, error codes, and frontend SDK documentation.

---

## 📄 License
This project is open-source and licensed under the [MIT License](https://opensource.org/licenses/MIT).

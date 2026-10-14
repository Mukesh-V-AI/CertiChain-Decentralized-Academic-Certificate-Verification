# CertiChain - User Manual

Welcome to the **CertiChain** Blockchain-Based Academic Certificate Verification System. This manual explains how to use the platform as an **Educational Institution (Issuer)** or an **Employer / Recruiter (Verifier)**.

---

## 1. System Overview
CertiChain uses Ethereum smart contracts to ensure the immutability, authenticity, and non-repudiation of academic credentials.

Instead of storing heavy PDF documents directly on-chain (which would be slow and expensive), CertiChain calculates a 256-bit cryptographic digest (**SHA-256 Hash**) locally in the browser. Only this unique hash, along with the student name, degree title, timestamp, and issuer address, is permanently written to the smart contract.

- **Immutability:** Once written to the blockchain, the record cannot be forged or backdated.
- **Privacy:** Document contents never leave the user's browser during verification.
- **Tamper-Evidence:** Modifying even a single comma or pixel changes the resulting SHA-256 hash completely, causing immediate verification failure.

---

## 2. Educational Institutions (Issuer Portal)

The **Issuer Portal** is accessible only to authorized institutional Ethereum addresses.

### Connecting Your Wallet:
1. Ensure your browser has the MetaMask extension installed.
2. Click **Connect Wallet** in the top navigation bar.
3. If connected to an unauthorized account, the portal will notify you. Switch to an authorized issuer wallet (e.g. Hardhat Account #0).

### Issuing a New Credential:
1. Open the **Issuer Portal** and select the **Register Certificate** tab.
2. Enter the **Student Name** (e.g., Jane Doe).
3. Enter the **Course / Degree** (e.g., Bachelor of Science in Computer Science).
4. Drag and drop or upload the official certificate file (PDF, PNG, JPG).
5. The application will instantly calculate the SHA-256 hash.
6. Click **Register Certificate on Blockchain** and confirm the transaction in your wallet.
7. Once confirmed on the blockchain, you will receive:
   - On-chain transaction receipt & block number.
   - A generated **Verification QR Code** linking directly to the verification page.
   - You may embed this QR code or certificate hash on the diploma given to the student.

### Revoking a Credential:
If a certificate was awarded by mistake, revoked due to disciplinary action, or forged:
1. Go to the **Revoke** tab in the Issuer Portal.
2. Enter the certificate's SHA-256 hash and click **Look Up**.
3. Verify the student and course details.
4. Click **Confirm Revoke on Blockchain** and sign the transaction.
5. The certificate status will immediately change to **REVOKED / INVALID** across the entire network.

### Institution Authorization (Contract Owner Only):
If connected with the deployer account:
1. Open the **Admin** tab.
2. Enter the Ethereum address of a new college, university, or examination board.
3. Click **Authorize Address** to grant them certificate minting rights.

---

## 3. Employers & Third Parties (Verifier Portal)

Verifiers and recruiters can verify credentials instantly with **zero registration or wallet requirements**.

### Option A: Verify by File Upload (Recommended)
1. Go to the **Verify** (Home) page.
2. Drag and drop the candidate's certificate document into the **Verify by File** dropzone.
3. Click **Verify File Authenticity**.
4. The system queries the smart contract:
   - **Green Badge ("Verified Authentic"):** The file is 100% genuine and unaltered. Shows student name, degree title, issue date, and issuing institution's Ethereum address.
   - **Orange/Red Badge ("Certificate Has Been REVOKED"):** The document was historically authentic but has since been revoked by the institution.
   - **Red Badge ("Verification Failed"):** The file does not match any registered hash. It may be altered or fraudulent.

### Option B: Verify by Hash or QR Code
1. If you scanned the QR code from a physical diploma or resume, you will be taken directly to `/verify/<hash>`.
2. Or paste the 64-character SHA-256 hash on the Home page and click **Query Blockchain Ledger**.

---

## 4. Troubleshooting & FAQ

- **"Node Offline" banner:** Ensure the local Hardhat node is running (`npx hardhat node`) in the background.
- **"Unauthorized Account" in Issuer Portal:** Only addresses added by the contract owner can mint credentials. Switch your wallet to Account #0.
- **"Certificate already registered":** A certificate with this exact file hash has already been registered on the blockchain. Smart contracts prevent duplicate registrations.

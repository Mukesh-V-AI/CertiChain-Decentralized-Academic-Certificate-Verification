# Smart Contract & Client API Reference

This document provides a comprehensive technical reference for the **CertificateVerification** smart contract methods, events, error codes, and frontend utility functions.

---

## 1. Smart Contract: `CertificateVerification.sol`

- **Solidity Version:** `^0.8.24`
- **License:** MIT
- **Default Local Address:** `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` (or exported dynamically in `frontend/src/config/contractAddress.json`)

---

### 1.1. Data Structures

#### `Certificate`
```solidity
struct Certificate {
    string studentName;
    string courseName;
    uint256 issueDate;
    bool isValid;
    address issuer;
}
```

---

### 1.2. State Variables

| Variable | Visibility | Type | Description |
|---|---|---|---|
| `owner` | `public` | `address` | The administrator account (deployer) that manages authorized issuers. |
| `isIssuer` | `public` | `mapping(address => bool)` | Returns `true` if an address is authorized to issue certificates. |
| `certificates` | `public` | `mapping(string => Certificate)` | Maps a certificate's 64-character SHA-256 hash to its `Certificate` struct. |

---

### 1.3. Events

#### `CertificateRegistered`
Emitted whenever a new certificate is recorded on-chain.
```solidity
event CertificateRegistered(
    string indexed certHash,
    string studentName,
    string courseName,
    uint256 issueDate,
    address indexed issuer
);
```

#### `CertificateRevoked`
Emitted when an active certificate is revoked.
```solidity
event CertificateRevoked(
    string indexed certHash,
    address indexed revoker
);
```

#### `IssuerAdded`
Emitted when an educational institution is authorized.
```solidity
event IssuerAdded(address indexed issuer);
```

#### `IssuerRemoved`
Emitted when an educational institution's authorization is removed.
```solidity
event IssuerRemoved(address indexed issuer);
```

---

### 1.4. Contract Methods

#### `registerCertificate`
Registers a new academic certificate on the blockchain ledger.
- **Access:** Authorized Issuers only (`onlyIssuer`)
- **State Mutability:** Non-payable (State Write)
- **Signature:**
  ```solidity
  function registerCertificate(
      string memory _certHash,
      string memory _studentName,
      string memory _courseName
  ) external onlyIssuer
  ```
- **Parameters:**
  - `_certHash` (`string`): The 64-character hexadecimal SHA-256 hash of the original certificate document.
  - `_studentName` (`string`): Full legal name of the recipient (e.g., `"Jane Doe"`).
  - `_courseName` (`string`): Degree title, major, or course name (e.g., `"B.S. in Computer Science"`).
- **Revert Conditions:**
  - `"Only authorized issuer can call this function"`: If caller address is not in `isIssuer`.
  - `"Certificate already registered"`: If `certificates[_certHash].isValid` is already true.

---

#### `revokeCertificate`
Permanently revokes an existing certificate on the blockchain.
- **Access:** Original Issuer or Contract Owner only
- **State Mutability:** Non-payable (State Write)
- **Signature:**
  ```solidity
  function revokeCertificate(string memory _certHash) external onlyIssuer
  ```
- **Parameters:**
  - `_certHash` (`string`): The SHA-256 hash of the certificate to revoke.
- **Revert Conditions:**
  - `"Certificate is not valid or does not exist"`: If `certificates[_certHash].isValid` is false.
  - `"Only the original issuer or owner can revoke"`: If caller is an issuer, but did not issue this specific certificate and is not the contract owner.

---

#### `verifyCertificate`
Fetches on-chain certificate data for verification without spending gas.
- **Access:** Public (`external view`)
- **State Mutability:** View (`eth_call`)
- **Signature:**
  ```solidity
  function verifyCertificate(string memory _certHash) external view returns (
      bool isValid,
      string memory studentName,
      string memory courseName,
      uint256 issueDate,
      address issuer
  )
  ```
- **Parameters:**
  - `_certHash` (`string`): The SHA-256 hash to query.
- **Returns:**
  - `isValid` (`bool`): `true` if authentic and active; `false` if revoked or nonexistent.
  - `studentName` (`string`): Name of the student.
  - `courseName` (`string`): Name of degree or course.
  - `issueDate` (`uint256`): Unix timestamp (seconds) when recorded on-chain.
  - `issuer` (`address`): Ethereum address of the issuing institution.

---

#### `addIssuer`
Authorizes an Ethereum address to issue certificates.
- **Access:** Contract Owner only (`onlyOwner`)
- **Signature:**
  ```solidity
  function addIssuer(address _issuer) external onlyOwner
  ```

---

#### `removeIssuer`
Revokes an institution's issuing privileges.
- **Access:** Contract Owner only (`onlyOwner`)
- **Signature:**
  ```solidity
  function removeIssuer(address _issuer) external onlyOwner
  ```

---

## 2. Frontend Utilities & Web3 API

### 2.1. Cryptographic Utilities (`frontend/src/utils/hash.js`)

#### `generateSHA256(file)`
Calculates the SHA-256 digest of a browser `File` object using the native Web Cryptography API.
- **Parameters:** `file` (`File` / `Blob`)
- **Returns:** `Promise<string>` - 64-character lowercase hexadecimal hash.
- **Example:**
  ```javascript
  const hash = await generateSHA256(uploadedFile);
  // "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
  ```

---

### 2.2. Web3 Context Hook (`useWeb3()`)

Imported from `frontend/src/context/Web3Context.jsx`:
```javascript
const {
  account,
  provider,
  signer,
  contract,
  readContract,
  chainId,
  isCorrectNetwork,
  isIssuer,
  isOwner,
  isConnecting,
  rpcConnected,
  connectWallet,
  disconnectWallet,
  switchToHardhatNetwork,
  refreshIssuerStatus
} = useWeb3();
```

| Property / Method | Type | Description |
|---|---|---|
| `account` | `string \| null` | Connected Ethereum wallet address (lowercase). |
| `contract` | `ethers.Contract \| null` | Signer-connected contract for executing write transactions. |
| `readContract` | `ethers.Contract \| null` | Read-only contract connected via direct RPC for zero-wallet queries. |
| `isIssuer` | `boolean` | `true` if connected account is authorized to mint certificates. |
| `isOwner` | `boolean` | `true` if connected account is the contract owner/deployer. |
| `isCorrectNetwork` | `boolean` | `true` if connected to Chain ID 31337 (Hardhat Localhost). |
| `rpcConnected` | `boolean` | `true` if local blockchain node (`127.0.0.1:8545`) is responsive. |
| `connectWallet()` | `() => Promise<void>` | Prompts user to connect MetaMask. |
| `switchToHardhatNetwork()` | `() => Promise<void>` | Requests MetaMask to switch or add the Hardhat network. |
| `refreshIssuerStatus()` | `() => Promise<void>` | Re-evaluates on-chain issuer/owner roles for current account. |

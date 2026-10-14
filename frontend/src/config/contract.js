import contractAddressData from './contractAddress.json';
import contractArtifact from '../artifacts/contracts/CertificateVerification.sol/CertificateVerification.json';
import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = contractAddressData.CertificateVerification;
export const CONTRACT_ABI = contractArtifact.abi;

export const DEFAULT_RPC_URL = 'http://127.0.0.1:8545';
export const HARDHAT_CHAIN_ID = 31337;
export const HARDHAT_CHAIN_ID_HEX = '0x7a69';

/**
 * Creates a read-only JSON-RPC provider connected to the local blockchain
 */
export function getReadOnlyProvider() {
  return new ethers.JsonRpcProvider(DEFAULT_RPC_URL, undefined, {
    staticNetwork: true
  });
}

/**
 * Creates a read-only instance of the CertificateVerification contract
 */
export function getReadOnlyContract() {
  const provider = getReadOnlyProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  HARDHAT_CHAIN_ID,
  HARDHAT_CHAIN_ID_HEX,
  DEFAULT_RPC_URL,
  getReadOnlyProvider,
  getReadOnlyContract
} from '../config/contract';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [readContract, setReadContract] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isIssuer, setIsIssuer] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [rpcConnected, setRpcConnected] = useState(true);
  const [rpcError, setRpcError] = useState(null);

  // Initialize read-only contract for anyone to verify without connecting wallet
  const initReadOnly = useCallback(async () => {
    try {
      const readOnlyProvider = getReadOnlyProvider();
      // Test connectivity
      await readOnlyProvider.getBlockNumber();
      const instance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readOnlyProvider);
      setReadContract(instance);
      setRpcConnected(true);
      setRpcError(null);
      return instance;
    } catch (err) {
      console.warn('Local RPC node not reachable:', err.message);
      setRpcConnected(false);
      setRpcError(err.message);
      return null;
    }
  }, []);

  // Check issuer and owner roles for an account
  const checkRoles = useCallback(async (currentAccount, contractInstance) => {
    if (!currentAccount) {
      setIsIssuer(false);
      setIsOwner(false);
      return;
    }

    try {
      // First try with the local read-only contract (guaranteed on local Hardhat node)
      const targetContract = getReadOnlyContract();
      const [issuerStatus, ownerAddress] = await Promise.all([
        targetContract.isIssuer(currentAccount),
        targetContract.owner()
      ]);

      setIsIssuer(Boolean(issuerStatus));
      setIsOwner(ownerAddress.toLowerCase() === currentAccount.toLowerCase());
    } catch {
      // Fallback to contractInstance if local direct RPC has issues
      if (contractInstance) {
        try {
          const [issuerStatus, ownerAddress] = await Promise.all([
            contractInstance.isIssuer(currentAccount),
            contractInstance.owner()
          ]);
          setIsIssuer(Boolean(issuerStatus));
          setIsOwner(ownerAddress.toLowerCase() === currentAccount.toLowerCase());
          return;
        } catch (err) {
          console.error('Error checking roles on contract:', err);
        }
      }
      setIsIssuer(false);
      setIsOwner(false);
    }
  }, []);

  // Connect user wallet (e.g. MetaMask)
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('MetaMask or a Web3 wallet is required. Please install MetaMask to interact as an issuer.');
      return;
    }

    setIsConnecting(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      // Request accounts
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      if (accounts && accounts.length > 0) {
        const userAccount = accounts[0];
        const userSigner = await browserProvider.getSigner();
        const writeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, userSigner);

        setAccount(userAccount);
        setProvider(browserProvider);
        setSigner(userSigner);
        setContract(writeContract);

        await checkRoles(userAccount, writeContract);
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setIsIssuer(false);
    setIsOwner(false);
  };

  // Switch or Add Hardhat Local Network to MetaMask
  const switchToHardhatNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
      });
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();
      setChainId(Number(network.chainId));
    } catch (switchError) {
      // If network is not added yet (error code 4902 or unrecognized), add it
      const isUnrecognized = switchError.code === 4902 ||
        switchError?.data?.originalError?.code === 4902 ||
        (switchError.message && switchError.message.includes('Unrecognized'));

      if (isUnrecognized) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: HARDHAT_CHAIN_ID_HEX,
                chainName: 'Hardhat Localhost',
                rpcUrls: [DEFAULT_RPC_URL],
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            ],
          });
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const network = await browserProvider.getNetwork();
          setChainId(Number(network.chainId));
        } catch (addError) {
          console.error('Failed to add Hardhat network:', addError);
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  // Initial setup: test RPC and check if user already connected wallet
  useEffect(() => {
    initReadOnly();

    if (window.ethereum) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      browserProvider.getNetwork().then((net) => {
        setChainId(Number(net.chainId));
      }).catch(() => {});

      // Check if already authorized
      browserProvider.send('eth_accounts', []).then(async (accounts) => {
        if (accounts && accounts.length > 0) {
          const userAccount = accounts[0];
          const userSigner = await browserProvider.getSigner();
          const writeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, userSigner);

          setAccount(userAccount);
          setProvider(browserProvider);
          setSigner(userSigner);
          setContract(writeContract);

          await checkRoles(userAccount, writeContract);
        }
      }).catch(console.warn);

      // Event listeners
      const handleAccountsChanged = async (accounts) => {
        if (!accounts || accounts.length === 0) {
          disconnectWallet();
        } else {
          const newAccount = accounts[0];
          const currentSigner = await browserProvider.getSigner();
          const writeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, currentSigner);
          setAccount(newAccount);
          setSigner(currentSigner);
          setContract(writeContract);
          await checkRoles(newAccount, writeContract);
        }
      };

      const handleChainChanged = (newChainId) => {
        setChainId(Number(newChainId));
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [initReadOnly, checkRoles]);

  const isCorrectNetwork = chainId === HARDHAT_CHAIN_ID || chainId === 1337;

  return (
    <Web3Context.Provider
      value={{
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
        rpcError,
        connectWallet,
        disconnectWallet,
        switchToHardhatNetwork,
        checkRoles,
        refreshIssuerStatus: () => account && contract && checkRoles(account, contract)
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

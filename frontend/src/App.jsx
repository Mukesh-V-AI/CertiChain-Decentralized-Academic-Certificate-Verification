import { Routes, Route } from 'react-router-dom';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifyCertificate from './pages/VerifyCertificate';
import { AlertCircle, WifiOff } from 'lucide-react';

function StatusBanner() {
  const { rpcConnected, account, chainId, isCorrectNetwork, switchToHardhatNetwork } = useWeb3();

  if (!rpcConnected) {
    return (
      <div style={{
        backgroundColor: '#7f1d1d',
        color: '#fecaca',
        padding: '0.75rem 1rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        borderBottom: '1px solid #b91c1c'
      }}>
        <WifiOff size={18} />
        <span>
          <strong>Local Node Offline:</strong> Could not connect to Hardhat node at <code>http://127.0.0.1:8545</code>. Run <code>npx hardhat node</code> and deploy the contract to test live on-chain operations.
        </span>
      </div>
    );
  }

  if (account && chainId && !isCorrectNetwork) {
    return (
      <div style={{
        backgroundColor: '#78350f',
        color: '#fef3c7',
        padding: '0.75rem 1rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        borderBottom: '1px solid #b45309'
      }}>
        <AlertCircle size={18} />
        <span>Connected to Chain ID {chainId}. Please switch to the local Hardhat network (Chain ID 31337).</span>
        <button
          onClick={switchToHardhatNetwork}
          style={{
            backgroundColor: '#d97706',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.8rem'
          }}
        >
          Switch Network
        </button>
      </div>
    );
  }

  return null;
}

function MainLayout() {
  return (
    <>
      <StatusBanner />
      <Navbar />
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/issuer" element={<IssuerDashboard />} />
          <Route path="/verify/:hash" element={<VerifyCertificate />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <Web3Provider>
      <MainLayout />
    </Web3Provider>
  );
}

export default App;

import { Link } from 'react-router-dom';
import { ShieldCheck, Wallet, LogOut, CheckCircle2 } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

export default function Navbar() {
  const { account, connectWallet, disconnectWallet, isConnecting, isIssuer, isOwner, rpcConnected } = useWeb3();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="header">
      <div className="container flex justify-between items-center w-full">
        <Link to="/" className="logo">
          <ShieldCheck size={32} color="var(--primary-color)" />
          <span>CertiChain</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            Verify
          </Link>
          <Link to="/issuer" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
            Issuer Portal
          </Link>

          {/* Node Status Indicator */}
          <div
            title={rpcConnected ? "Local blockchain node connected" : "Local blockchain node offline"}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              padding: '4px 8px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: rpcConnected ? '#10b981' : '#ef4444',
                boxShadow: rpcConnected ? '0 0 8px #10b981' : '0 0 8px #ef4444'
              }}
            />
            <span>{rpcConnected ? 'Node Active' : 'Node Offline'}</span>
          </div>

          {/* Wallet Connection */}
          {account ? (
            <div className="flex items-center gap-2">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--surface-color)',
                  border: '1px solid var(--border-color)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem'
                }}
              >
                {isOwner && (
                  <span className="badge" style={{ backgroundColor: '#4338ca', color: '#c7d2fe', fontSize: '0.7rem' }}>
                    Owner
                  </span>
                )}
                {isIssuer && !isOwner && (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '2px' }} /> Issuer
                  </span>
                )}
                <span style={{ fontFamily: 'monospace', color: 'var(--text-color)' }}>
                  {formatAddress(account)}
                </span>
              </div>
              <button
                className="btn btn-outline"
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                style={{ padding: '0.4rem 0.6rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-outline"
              onClick={connectWallet}
              disabled={isConnecting}
              style={{ padding: '0.5rem 1rem' }}
            >
              <Wallet size={16} />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

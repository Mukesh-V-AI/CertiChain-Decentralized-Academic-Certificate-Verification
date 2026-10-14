import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  XCircle,
  Clock,
  Hash,
  GraduationCap,
  User,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWeb3 } from '../context/Web3Context';
import { getReadOnlyContract } from '../config/contract';

export default function VerifyCertificate() {
  const { hash } = useParams();
  const { readContract, rpcConnected } = useWeb3();
  const [isValidating, setIsValidating] = useState(true);
  const [certificateData, setCertificateData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchCertificateData = useCallback(async () => {
    if (!hash) return;
    setIsValidating(true);
    setErrorMsg(null);

    try {
      // Use existing context contract or create a fresh read-only instance
      const contract = readContract || getReadOnlyContract();
      const result = await contract.verifyCertificate(hash);

      const isValid = Boolean(result[0] ?? result.isValid);
      const studentName = result[1] ?? result.studentName ?? '';
      const courseName = result[2] ?? result.courseName ?? '';
      const issueDateRaw = result[3] ?? result.issueDate ?? 0n;
      const issuer = result[4] ?? result.issuer ?? '';
      const issueDateTimestamp = Number(issueDateRaw);

      setCertificateData({
        isValid,
        studentName,
        courseName,
        issueDate: issueDateTimestamp,
        issuer,
        isRevoked: !isValid && issueDateTimestamp > 0,
        isNotFound: !isValid && issueDateTimestamp === 0
      });
    } catch (err) {
      console.error('Error verifying certificate on-chain:', err);
      setErrorMsg(
        rpcConnected
          ? `Could not query contract: ${err.message}`
          : 'Unable to reach the local blockchain node (http://127.0.0.1:8545). Please verify the node is running.'
      );
      setCertificateData(null);
    } finally {
      setIsValidating(false);
    }
  }, [hash, readContract, rpcConnected]);

  useEffect(() => {
    fetchCertificateData();
  }, [fetchCertificateData]);

  const copyHashToClipboard = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="text-center mb-4">
        <h2>Verification Result</h2>
        <p>Cryptographic proof verified against immutable smart contract records.</p>
      </div>

      <div className="glass-panel">
        {isValidating ? (
          <div className="text-center py-8">
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid rgba(99, 102, 241, 0.2)',
                borderTopColor: 'var(--primary-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1.5rem auto'
              }}
            />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <h3 style={{ marginBottom: '0.5rem' }}>Querying Blockchain Ledger...</h3>
            <p className="text-muted">Fetching cryptographic proof from smart contract</p>
          </div>
        ) : errorMsg ? (
          <div className="text-center py-6">
            <div
              style={{
                display: 'inline-flex',
                padding: '1rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                marginBottom: '1rem',
                color: 'var(--error)'
              }}
            >
              <AlertTriangle size={48} />
            </div>
            <h3>Blockchain Connection Issue</h3>
            <p style={{ color: '#fca5a5', maxWidth: '550px', margin: '0 auto 1.5rem' }}>
              {errorMsg}
            </p>
            <button className="btn btn-primary" onClick={fetchCertificateData}>
              <RotateCcw size={16} /> Retry Verification
            </button>
          </div>
        ) : certificateData?.isValid ? (
          <div>
            <div className="flex items-center justify-center gap-3 text-green-500 mb-6">
              <ShieldCheck size={52} />
              <div>
                <h2 style={{ margin: 0, color: '#10b981' }}>Verified Authentic</h2>
                <span className="badge badge-success" style={{ marginTop: '4px' }}>
                  Tamper-Proof On-Chain Record
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div
                style={{
                  backgroundColor: 'var(--bg-color)',
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <User size={16} /> Student Name
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{certificateData.studentName}</div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-color)',
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <GraduationCap size={16} /> Course / Degree
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{certificateData.courseName}</div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-color)',
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Clock size={16} /> Issue Date
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {new Date(certificateData.issueDate * 1000).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-color)',
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Hash size={16} /> Certified Issuer Address
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    wordBreak: 'break-all',
                    color: 'var(--primary-color)'
                  }}
                >
                  {certificateData.issuer}
                </div>
              </div>
            </div>

            {/* Hash & QR block */}
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1.5rem'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Certificate SHA-256 Hash
                  </span>
                  <button
                    onClick={copyHashToClipboard}
                    className="btn btn-outline"
                    style={{ padding: '2px 8px', fontSize: '0.75rem', gap: '4px' }}
                  >
                    {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy Hash'}
                  </button>
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    wordBreak: 'break-all',
                    backgroundColor: 'var(--bg-color)',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {hash}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  flexShrink: 0
                }}
              >
                <QRCodeSVG value={window.location.href} size={90} />
              </div>
            </div>
          </div>
        ) : certificateData?.isRevoked ? (
          <div className="text-center py-6">
            <div
              style={{
                display: 'inline-flex',
                padding: '1rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                marginBottom: '1rem',
                color: '#ef4444'
              }}
            >
              <XCircle size={64} />
            </div>
            <h2 style={{ color: '#ef4444' }}>Certificate Has Been REVOKED</h2>
            <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem' }}>
              This credential was previously registered on the blockchain but was subsequently
              <strong> revoked</strong> by the authorized institution or contract owner.
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                padding: '1rem',
                borderRadius: '0.5rem',
                textAlign: 'left',
                maxWidth: '500px',
                margin: '0 auto 1.5rem',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                <span className="text-muted">Student Name:</span> {certificateData.studentName}
              </p>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                <span className="text-muted">Degree / Course:</span> {certificateData.courseName}
              </p>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                <span className="text-muted">Original Issue Date:</span>{' '}
                {new Date(certificateData.issueDate * 1000).toLocaleDateString()}
              </p>
              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                <span className="text-muted">Status:</span>{' '}
                <span className="badge badge-error">INVALID / REVOKED</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div
              style={{
                display: 'inline-flex',
                padding: '1.25rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                marginBottom: '1rem',
                color: 'var(--error)'
              }}
            >
              <XCircle size={64} />
            </div>
            <h2>Verification Failed</h2>
            <p style={{ maxWidth: '500px', margin: '0 auto 1rem', color: 'var(--text-muted)' }}>
              No authentic record matches this SHA-256 cryptographic hash on the blockchain. The document may have been altered or was never registered.
            </p>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                wordBreak: 'break-all',
                backgroundColor: 'var(--bg-color)',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                maxWidth: '500px',
                margin: '0 auto 1.5rem',
                color: 'var(--text-muted)'
              }}
            >
              Hash: {hash}
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/" className="btn btn-outline">
            Verify Another Certificate
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  Plus,
  FileText,
  Wallet,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Trash2,
  UserCheck,
  UserX,
  Search,
  Key
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generateSHA256 } from '../utils/hash';
import { useWeb3 } from '../context/Web3Context';
import { Link } from 'react-router-dom';

export default function IssuerDashboard() {
  const {
    account,
    contract,
    isIssuer,
    isOwner,
    connectWallet,
    isConnecting,
    refreshIssuerStatus,
    chainId,
    isCorrectNetwork,
    switchToHardhatNetwork
  } = useWeb3();

  // Active tab: 'register', 'revoke', 'admin'
  const [activeTab, setActiveTab] = useState('register');

  // Registration states
  const [studentName, setStudentName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [fileHash, setFileHash] = useState('');
  const [fileName, setFileName] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [mintedCert, setMintedCert] = useState(null);
  const [regError, setRegError] = useState('');

  // Revocation states
  const [revokeHash, setRevokeHash] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeStatus, setRevokeStatus] = useState(null);
  const [revokeError, setRevokeError] = useState('');

  // Admin states
  const [newIssuerAddress, setNewIssuerAddress] = useState('');
  const [removeIssuerAddress, setRemoveIssuerAddress] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setRegError('');
      try {
        const hash = await generateSHA256(file);
        setFileHash(hash);
      } catch (err) {
        setRegError('Failed to calculate file hash: ' + err.message);
      }
    }
  };

  const handleRegisterCertificate = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !courseName.trim() || !fileHash) return;
    if (!contract) {
      setRegError('Please connect your authorized wallet first.');
      return;
    }

    setIsMinting(true);
    setRegError('');

    try {
      // Execute transaction on smart contract
      const tx = await contract.registerCertificate(fileHash, studentName.trim(), courseName.trim());
      const receipt = await tx.wait();

      setMintedCert({
        hash: fileHash,
        student: studentName.trim(),
        course: courseName.trim(),
        date: new Date().toLocaleDateString(),
        txHash: receipt.hash || tx.hash,
        blockNumber: receipt.blockNumber,
        url: `${window.location.origin}/verify/${fileHash}`
      });
    } catch (err) {
      console.error('Registration failed:', err);
      if (err.reason) {
        setRegError(err.reason);
      } else if (err.message && err.message.includes('Certificate already registered')) {
        setRegError('This certificate hash is already registered on the blockchain.');
      } else if (err.code === 'ACTION_REJECTED') {
        setRegError('Transaction rejected by user in wallet.');
      } else {
        setRegError(err.message || 'Transaction failed. Check console for details.');
      }
    } finally {
      setIsMinting(false);
    }
  };

  const handleCheckForRevoke = async () => {
    if (!revokeHash.trim() || !contract) return;
    setRevokeError('');
    setRevokeStatus(null);

    try {
      const result = await contract.verifyCertificate(revokeHash.trim());
      const isValid = Boolean(result[0] ?? result.isValid);
      const student = result[1] ?? result.studentName ?? '';
      const course = result[2] ?? result.courseName ?? '';
      const issueDate = Number(result[3] ?? result.issueDate ?? 0n);

      if (!isValid && issueDate === 0) {
        setRevokeError('No certificate with this hash was found on the blockchain.');
      } else if (!isValid && issueDate > 0) {
        setRevokeError('This certificate is already revoked.');
      } else {
        setRevokeStatus({
          hash: revokeHash.trim(),
          student,
          course,
          issueDate: new Date(issueDate * 1000).toLocaleDateString()
        });
      }
    } catch (err) {
      setRevokeError('Failed to query certificate: ' + err.message);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeHash.trim() || !contract) return;
    setIsRevoking(true);
    setRevokeError('');

    try {
      const tx = await contract.revokeCertificate(revokeHash.trim());
      await tx.wait();
      setRevokeStatus({
        ...revokeStatus,
        revokedSuccessfully: true
      });
    } catch (err) {
      console.error('Revocation failed:', err);
      if (err.reason) {
        setRevokeError(err.reason);
      } else if (err.code === 'ACTION_REJECTED') {
        setRevokeError('Transaction rejected by user in wallet.');
      } else {
        setRevokeError(err.message || 'Failed to revoke certificate.');
      }
    } finally {
      setIsRevoking(false);
    }
  };

  const handleAddIssuer = async (e) => {
    e.preventDefault();
    if (!newIssuerAddress.trim() || !contract) return;
    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const tx = await contract.addIssuer(newIssuerAddress.trim());
      await tx.wait();
      setAdminMessage({ type: 'success', text: `Successfully authorized issuer: ${newIssuerAddress.trim()}` });
      setNewIssuerAddress('');
      refreshIssuerStatus();
    } catch (err) {
      setAdminMessage({ type: 'error', text: err.reason || err.message || 'Failed to add issuer.' });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleRemoveIssuer = async (e) => {
    e.preventDefault();
    if (!removeIssuerAddress.trim() || !contract) return;
    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const tx = await contract.removeIssuer(removeIssuerAddress.trim());
      await tx.wait();
      setAdminMessage({ type: 'success', text: `Successfully removed issuer: ${removeIssuerAddress.trim()}` });
      setRemoveIssuerAddress('');
      refreshIssuerStatus();
    } catch (err) {
      setAdminMessage({ type: 'error', text: err.reason || err.message || 'Failed to remove issuer.' });
    } finally {
      setAdminLoading(false);
    }
  };

  // 1. Not connected state
  if (!account) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem 2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)',
              marginBottom: '1.5rem'
            }}
          >
            <Wallet size={36} />
          </div>
          <h2>Connect Your Wallet</h2>
          <p>
            The Issuer Portal requires an authorized institution wallet (such as MetaMask) to sign transactions and record certificates on the blockchain.
          </p>
          <button className="btn btn-primary" onClick={connectWallet} disabled={isConnecting} style={{ marginTop: '1rem' }}>
            <Wallet size={18} /> {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        </div>
      </div>
    );
  }

  // 2. Connected to wrong network
  if (!isCorrectNetwork) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '2rem auto' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#eab308',
              marginBottom: '1.5rem'
            }}
          >
            <AlertCircle size={36} />
          </div>
          <h2>Switch Network Required</h2>
          <p>
            Your wallet is currently connected to <strong>Chain ID {chainId || 'Unknown'}</strong>. To issue and manage credentials on your local node, please switch to the Hardhat network.
          </p>
          <button className="btn btn-primary" onClick={switchToHardhatNetwork} style={{ marginTop: '1rem' }}>
            Switch to Hardhat Localhost (Chain ID 31337)
          </button>
        </div>
      </div>
    );
  }

  // 3. Connected but unauthorized
  if (!isIssuer && !isOwner) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '2rem auto' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--error)',
              marginBottom: '1.5rem'
            }}
          >
            <AlertCircle size={36} />
          </div>
          <h2>Unauthorized Account</h2>
          <p>
            Connected wallet <code style={{ color: 'var(--text-color)', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px' }}>{account}</code> is not registered as an authorized certificate issuer.
          </p>
          <div
            style={{
              backgroundColor: 'var(--bg-color)',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              textAlign: 'left',
              margin: '1.5rem 0',
              fontSize: '0.9rem'
            }}
          >
            <strong>How to resolve:</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              <li>Switch your MetaMask account to the contract deployer (Hardhat Account #0).</li>
              <li>Or ask the contract owner to authorize your address using the Issuer Administration tab.</li>
            </ul>
          </div>
          <button className="btn btn-outline" onClick={refreshIssuerStatus}>
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2>Issuer Portal</h2>
          <p>Manage and register immutable academic credentials on the blockchain.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'register' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('register')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            <Plus size={16} /> Register Certificate
          </button>
          <button
            className={`btn ${activeTab === 'revoke' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('revoke')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            <Trash2 size={16} /> Revoke
          </button>
          {isOwner && (
            <button
              className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('admin')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              <Key size={16} /> Admin
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: REGISTER CERTIFICATE */}
      {activeTab === 'register' && (
        <>
          {!mintedCert ? (
            <div className="glass-panel">
              {regError && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--error)',
                    color: '#fca5a5',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterCertificate}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Student Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course / Degree</label>
                    <input
                      type="text"
                      className="form-control"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="e.g. Master of Science in Data Science"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Official Certificate Document</label>
                  <label className="dropzone block relative">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      required
                    />
                    <FileText size={48} className="dropzone-icon mx-auto" />
                    <div>
                      {fileName ? (
                        <span className="text-primary" style={{ fontWeight: 600 }}>
                          {fileName}
                        </span>
                      ) : (
                        <span>Upload certificate file to compute SHA-256 fingerprint</span>
                      )}
                    </div>
                  </label>
                </div>

                {fileHash && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      padding: '0.85rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      marginBottom: '1.5rem',
                      wordBreak: 'break-all'
                    }}
                  >
                    <span className="text-muted">Generated SHA-256 Hash:</span> <br />
                    <span style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>
                      {fileHash}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isMinting || !fileHash || !studentName.trim() || !courseName.trim()}
                  style={{ padding: '0.85rem' }}
                >
                  {isMinting ? (
                    <>Submitting Transaction to Blockchain...</>
                  ) : (
                    <>
                      <Plus size={18} /> Register Certificate on Blockchain
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="card text-center animate-fade-in">
              <div
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  padding: '1rem',
                  marginBottom: '1rem',
                  color: 'var(--success)'
                }}
              >
                <CheckCircle2 size={56} />
              </div>
              <h3>Certificate Registered Successfully!</h3>
              <p>The cryptographic proof is permanently confirmed and stored on the blockchain.</p>

              <div
                style={{
                  backgroundColor: 'var(--bg-color)',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  textAlign: 'left',
                  margin: '1.5rem 0',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}
              >
                <div>
                  <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                    <span className="text-muted">Student:</span> <strong>{mintedCert.student}</strong>
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                    <span className="text-muted">Course:</span> <strong>{mintedCert.course}</strong>
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    <span className="text-muted">Tx Hash:</span> {mintedCert.txHash.substring(0, 20)}...
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    <span className="text-muted">Cert Hash:</span> {mintedCert.hash.substring(0, 24)}...
                  </p>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '0.5rem', borderRadius: '0.5rem', flexShrink: 0 }}>
                  <QRCodeSVG value={mintedCert.url} size={110} />
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Link to={`/verify/${mintedCert.hash}`} className="btn btn-primary">
                  <ExternalLink size={16} /> View Verification Page
                </Link>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setMintedCert(null);
                    setFileHash('');
                    setFileName('');
                    setStudentName('');
                    setCourseName('');
                  }}
                >
                  Register Another Certificate
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: REVOKE CERTIFICATE */}
      {activeTab === 'revoke' && (
        <div className="glass-panel">
          <h3 style={{ marginBottom: '0.5rem' }}>Revoke a Certificate</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Authorized issuers or the contract owner can revoke a fraudulent or cancelled certificate. This action is permanently recorded on-chain.
          </p>

          {revokeError && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--error)',
                color: '#fca5a5',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={18} />
              <span>{revokeError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Certificate SHA-256 Hash to Revoke</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Paste the 64-character SHA-256 hash"
                value={revokeHash}
                onChange={(e) => setRevokeHash(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCheckForRevoke}
                disabled={!revokeHash.trim()}
              >
                <Search size={16} /> Look Up
              </button>
            </div>
          </div>

          {revokeStatus && (
            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                padding: '1.25rem',
                borderRadius: '0.5rem',
                marginTop: '1.5rem'
              }}
            >
              {revokeStatus.revokedSuccessfully ? (
                <div style={{ textAlign: 'center', color: 'var(--success)' }}>
                  <CheckCircle2 size={40} style={{ margin: '0 auto 0.5rem' }} />
                  <h4>Certificate Revoked Successfully!</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    The certificate status on the blockchain is now marked as REVOKED / INVALID.
                  </p>
                </div>
              ) : (
                <div>
                  <h4 style={{ marginBottom: '0.5rem' }}>Confirm Revocation</h4>
                  <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                    <span className="text-muted">Student:</span> {revokeStatus.student}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                    <span className="text-muted">Degree:</span> {revokeStatus.course}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                    <span className="text-muted">Issued on:</span> {revokeStatus.issueDate}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirmRevoke}
                    disabled={isRevoking}
                    style={{
                      backgroundColor: '#dc2626',
                      borderColor: '#dc2626',
                      marginTop: '1rem',
                      width: '100%'
                    }}
                  >
                    <Trash2 size={16} /> {isRevoking ? 'Revoking on Blockchain...' : 'Confirm Revoke on Blockchain'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADMIN (OWNER ONLY) */}
      {activeTab === 'admin' && isOwner && (
        <div className="glass-panel">
          <h3 style={{ marginBottom: '0.5rem' }}>Issuer Management</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            As the contract owner, you can authorize new educational institutions or revoke their issuing privileges.
          </p>

          {adminMessage && (
            <div
              style={{
                backgroundColor: adminMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${adminMessage.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
                color: adminMessage.type === 'success' ? '#a7f3d0' : '#fca5a5',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}
            >
              {adminMessage.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Add Issuer */}
            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                padding: '1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}
            >
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <UserCheck size={18} color="var(--success)" /> Authorize Issuer
              </h4>
              <form onSubmit={handleAddIssuer}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>
                    Institution Ethereum Address (0x...)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0x..."
                    value={newIssuerAddress}
                    onChange={(e) => setNewIssuerAddress(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={adminLoading}>
                  Authorize Address
                </button>
              </form>
            </div>

            {/* Remove Issuer */}
            <div
              style={{
                backgroundColor: 'var(--bg-color)',
                padding: '1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}
            >
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <UserX size={18} color="var(--error)" /> Revoke Authorization
              </h4>
              <form onSubmit={handleRemoveIssuer}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>
                    Issuer Ethereum Address (0x...)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0x..."
                    value={removeIssuerAddress}
                    onChange={(e) => setRemoveIssuerAddress(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-outline w-full"
                  disabled={adminLoading}
                  style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                >
                  Revoke Authorization
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

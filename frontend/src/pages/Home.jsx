import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Search,
  ShieldCheck,
  Cpu,
  Lock,
  Globe2,
  Copy,
  Check
} from 'lucide-react';
import { generateSHA256 } from '../utils/hash';

export default function Home() {
  const [hashInput, setHashInput] = useState('');
  const [fileHash, setFileHash] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const processFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setIsHashing(true);

    try {
      const hash = await generateSHA256(file);
      setFileHash(hash);
    } catch (err) {
      console.error('Error generating hash:', err);
    } finally {
      setIsHashing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleVerifyFile = () => {
    if (fileHash) navigate(`/verify/${fileHash}`);
  };

  const handleVerifyHash = (e) => {
    e.preventDefault();
    const cleanHash = hashInput.trim();
    if (cleanHash) navigate(`/verify/${cleanHash}`);
  };

  const copyHash = () => {
    if (!fileHash) return;
    navigator.clipboard.writeText(fileHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="text-center mt-4 mb-8">
        <h1>Verify Academic Credentials</h1>
        <p style={{ maxWidth: '650px', margin: '0 auto', fontSize: '1.1rem' }}>
          Instantly authenticate university degrees and certificates on the Ethereum blockchain with zero reliance on third parties.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 w-full" style={{ maxWidth: '960px' }}>
        {/* File Verification Card */}
        <div className="card flex flex-col justify-between" style={{ minHeight: '380px' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UploadCloud size={24} color="var(--primary-color)" /> Verify by File
            </h3>
            <p>
              Upload the candidate's digital certificate (PDF, JPG, PNG). The browser computes its cryptographic SHA-256 fingerprint locally.
            </p>

            <label
              className={`dropzone block mb-4 mt-2 relative ${isDragging ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                borderStyle: isDragging ? 'solid' : 'dashed',
                borderColor: isDragging ? 'var(--primary-color)' : undefined,
                backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.1)' : undefined
              }}
            >
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
              />
              <UploadCloud size={44} className="dropzone-icon mx-auto" />
              <div>
                {isHashing ? (
                  <span className="text-primary font-semibold">Calculating SHA-256 fingerprint...</span>
                ) : fileName ? (
                  <div>
                    <span className="text-primary" style={{ fontWeight: 600 }}>{fileName}</span>
                    <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block' }}>({fileSize})</span>
                  </div>
                ) : (
                  <span>Click or drag and drop certificate here</span>
                )}
              </div>
            </label>

            {fileHash && (
              <div
                style={{
                  backgroundColor: 'var(--bg-color)',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  marginBottom: '1rem'
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-muted">Generated SHA-256 Fingerprint:</span>
                  <button
                    onClick={copyHash}
                    className="btn btn-outline"
                    style={{ padding: '2px 6px', fontSize: '0.7rem', gap: '4px' }}
                  >
                    {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--primary-color)' }}>
                  {fileHash}
                </div>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleVerifyFile}
            disabled={!fileHash || isHashing}
            style={{ padding: '0.85rem' }}
          >
            <ShieldCheck size={18} /> Verify File Authenticity
          </button>
        </div>

        {/* Hash / ID Verification Card */}
        <div className="card flex flex-col justify-between" style={{ minHeight: '380px' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={24} color="var(--primary-color)" /> Verify by Hash or ID
            </h3>
            <p>
              Already have the SHA-256 cryptographic hash (from a printed QR code or credential document)? Query the smart contract directly.
            </p>

            <form onSubmit={handleVerifyHash} className="mt-4">
              <div className="form-group">
                <label className="form-label">Certificate Hash (64 Hex Characters)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
            </form>
          </div>

          <div>
            <button
              className="btn btn-primary w-full"
              onClick={handleVerifyHash}
              disabled={!hashInput.trim()}
              style={{ padding: '0.85rem' }}
            >
              <Search size={18} /> Query Blockchain Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Trust & Architecture Showcase */}
      <div
        className="w-full mt-12 grid grid-cols-3 gap-6"
        style={{ maxWidth: '960px' }}
      >
        <div
          style={{
            backgroundColor: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            textAlign: 'center'
          }}
        >
          <div style={{ color: 'var(--primary-color)', marginBottom: '0.75rem' }}>
            <Cpu size={32} style={{ margin: '0 auto' }} />
          </div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Cryptographic Hashing</h4>
          <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>
            Files are fingerprinted into unique 256-bit hashes. Even changing a single character alters the hash completely.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            textAlign: 'center'
          }}
        >
          <div style={{ color: 'var(--primary-color)', marginBottom: '0.75rem' }}>
            <Lock size={32} style={{ margin: '0 auto' }} />
          </div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Immutable Smart Contract</h4>
          <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>
            Only accredited university wallets can register credentials. Records cannot be tampered with or retroactively faked.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            textAlign: 'center'
          }}
        >
          <div style={{ color: 'var(--primary-color)', marginBottom: '0.75rem' }}>
            <Globe2 size={32} style={{ margin: '0 auto' }} />
          </div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Zero-Trust Verification</h4>
          <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>
            Employers and recruiters verify certificates in milliseconds directly against the blockchain without contacting university registrars.
          </p>
        </div>
      </div>
    </div>
  );
}

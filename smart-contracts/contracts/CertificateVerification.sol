// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CertificateVerification {
    address public owner;

    struct Certificate {
        string studentName;
        string courseName;
        uint256 issueDate;
        bool isValid;
        address issuer;
    }

    // Mapping from SHA-256 hash to Certificate
    mapping(string => Certificate) public certificates;

    // Authorized issuers
    mapping(address => bool) public isIssuer;

    event CertificateRegistered(string indexed certHash, string studentName, string courseName, uint256 issueDate, address indexed issuer);
    event CertificateRevoked(string indexed certHash, address indexed revoker);
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyIssuer() {
        require(isIssuer[msg.sender], "Only authorized issuer can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
        isIssuer[msg.sender] = true; // Owner is an issuer by default
        emit IssuerAdded(msg.sender);
    }

    // Add a new authorized issuer
    function addIssuer(address _issuer) external onlyOwner {
        isIssuer[_issuer] = true;
        emit IssuerAdded(_issuer);
    }

    // Remove an issuer
    function removeIssuer(address _issuer) external onlyOwner {
        isIssuer[_issuer] = false;
        emit IssuerRemoved(_issuer);
    }

    // Register a new certificate
    function registerCertificate(
        string memory _certHash,
        string memory _studentName,
        string memory _courseName
    ) external onlyIssuer {
        require(!certificates[_certHash].isValid, "Certificate already registered");

        certificates[_certHash] = Certificate({
            studentName: _studentName,
            courseName: _courseName,
            issueDate: block.timestamp,
            isValid: true,
            issuer: msg.sender
        });

        emit CertificateRegistered(_certHash, _studentName, _courseName, block.timestamp, msg.sender);
    }

    // Revoke a certificate
    function revokeCertificate(string memory _certHash) external onlyIssuer {
        require(certificates[_certHash].isValid, "Certificate is not valid or does not exist");
        require(certificates[_certHash].issuer == msg.sender || msg.sender == owner, "Only the original issuer or owner can revoke");

        certificates[_certHash].isValid = false;

        emit CertificateRevoked(_certHash, msg.sender);
    }

    // Verify a certificate
    function verifyCertificate(string memory _certHash) external view returns (
        bool isValid,
        string memory studentName,
        string memory courseName,
        uint256 issueDate,
        address issuer
    ) {
        Certificate memory cert = certificates[_certHash];
        return (
            cert.isValid,
            cert.studentName,
            cert.courseName,
            cert.issueDate,
            cert.issuer
        );
    }
}

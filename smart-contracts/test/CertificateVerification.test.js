import { expect } from "chai";
import hre from "hardhat";

describe("CertificateVerification Contract", function () {
  let certificateContract;
  let owner;
  let issuer1;
  let issuer2;
  let nonIssuer;

  const sampleCertHash1 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const sampleCertHash2 = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8";
  const studentName = "Alice Johnson";
  const courseName = "B.S. in Computer Science";

  beforeEach(async function () {
    [owner, issuer1, issuer2, nonIssuer] = await hre.ethers.getSigners();

    const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");
    certificateContract = await CertificateVerification.deploy();
    await certificateContract.waitForDeployment();
  });

  describe("Deployment & Initialization", function () {
    it("should set the contract deployer as owner", async function () {
      expect(await certificateContract.owner()).to.equal(owner.address);
    });

    it("should authorize the owner as an issuer by default", async function () {
      expect(await certificateContract.isIssuer(owner.address)).to.be.true;
    });
  });

  describe("Issuer Management", function () {
    it("should allow owner to add a new issuer", async function () {
      await expect(certificateContract.addIssuer(issuer1.address))
        .to.emit(certificateContract, "IssuerAdded")
        .withArgs(issuer1.address);

      expect(await certificateContract.isIssuer(issuer1.address)).to.be.true;
    });

    it("should prevent non-owners from adding an issuer", async function () {
      await expect(
        certificateContract.connect(issuer1).addIssuer(issuer2.address)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("should allow owner to remove an issuer", async function () {
      await certificateContract.addIssuer(issuer1.address);
      expect(await certificateContract.isIssuer(issuer1.address)).to.be.true;

      await expect(certificateContract.removeIssuer(issuer1.address))
        .to.emit(certificateContract, "IssuerRemoved")
        .withArgs(issuer1.address);

      expect(await certificateContract.isIssuer(issuer1.address)).to.be.false;
    });

    it("should prevent non-owners from removing an issuer", async function () {
      await certificateContract.addIssuer(issuer1.address);

      await expect(
        certificateContract.connect(issuer1).removeIssuer(issuer1.address)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Certificate Registration", function () {
    beforeEach(async function () {
      await certificateContract.addIssuer(issuer1.address);
    });

    it("should allow an authorized issuer to register a certificate", async function () {
      const tx = await certificateContract
        .connect(issuer1)
        .registerCertificate(sampleCertHash1, studentName, courseName);

      await expect(tx)
        .to.emit(certificateContract, "CertificateRegistered");

      const cert = await certificateContract.verifyCertificate(sampleCertHash1);
      expect(cert.isValid).to.be.true;
      expect(cert.studentName).to.equal(studentName);
      expect(cert.courseName).to.equal(courseName);
      expect(cert.issuer).to.equal(issuer1.address);
      expect(cert.issueDate).to.be.greaterThan(0);
    });

    it("should prevent unauthorized accounts from registering a certificate", async function () {
      await expect(
        certificateContract
          .connect(nonIssuer)
          .registerCertificate(sampleCertHash1, studentName, courseName)
      ).to.be.revertedWith("Only authorized issuer can call this function");
    });

    it("should prevent registering the same certificate hash twice", async function () {
      await certificateContract
        .connect(issuer1)
        .registerCertificate(sampleCertHash1, studentName, courseName);

      await expect(
        certificateContract
          .connect(issuer1)
          .registerCertificate(sampleCertHash1, "Duplicate Student", "Duplicate Course")
      ).to.be.revertedWith("Certificate already registered");
    });
  });

  describe("Certificate Verification", function () {
    it("should return false for unregistered certificate hashes", async function () {
      const cert = await certificateContract.verifyCertificate(sampleCertHash2);
      expect(cert.isValid).to.be.false;
      expect(cert.studentName).to.equal("");
      expect(cert.courseName).to.equal("");
      expect(cert.issueDate).to.equal(0n);
      expect(cert.issuer).to.equal(hre.ethers.ZeroAddress);
    });
  });

  describe("Certificate Revocation", function () {
    beforeEach(async function () {
      await certificateContract.addIssuer(issuer1.address);
      await certificateContract
        .connect(issuer1)
        .registerCertificate(sampleCertHash1, studentName, courseName);
    });

    it("should allow the original issuer to revoke a certificate", async function () {
      await expect(
        certificateContract.connect(issuer1).revokeCertificate(sampleCertHash1)
      )
        .to.emit(certificateContract, "CertificateRevoked")
        .withArgs(sampleCertHash1, issuer1.address);

      const cert = await certificateContract.verifyCertificate(sampleCertHash1);
      expect(cert.isValid).to.be.false;
      // Previous data should still exist
      expect(cert.studentName).to.equal(studentName);
      expect(cert.issueDate).to.be.greaterThan(0);
    });

    it("should allow the contract owner to revoke any certificate", async function () {
      await expect(
        certificateContract.connect(owner).revokeCertificate(sampleCertHash1)
      )
        .to.emit(certificateContract, "CertificateRevoked")
        .withArgs(sampleCertHash1, owner.address);

      const cert = await certificateContract.verifyCertificate(sampleCertHash1);
      expect(cert.isValid).to.be.false;
    });

    it("should prevent a different issuer from revoking someone else's certificate", async function () {
      await certificateContract.addIssuer(issuer2.address);

      await expect(
        certificateContract.connect(issuer2).revokeCertificate(sampleCertHash1)
      ).to.be.revertedWith("Only the original issuer or owner can revoke");
    });

    it("should prevent revoking an already revoked or non-existent certificate", async function () {
      await certificateContract.connect(issuer1).revokeCertificate(sampleCertHash1);

      await expect(
        certificateContract.connect(issuer1).revokeCertificate(sampleCertHash1)
      ).to.be.revertedWith("Certificate is not valid or does not exist");

      await expect(
        certificateContract.connect(issuer1).revokeCertificate("nonexistenthash")
      ).to.be.revertedWith("Certificate is not valid or does not exist");
    });
  });
});

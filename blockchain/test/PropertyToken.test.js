const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PropertyToken (Unified)", function () {
  let PropertyToken, propertyToken;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    PropertyToken = await ethers.getContractFactory("PropertyToken");
    propertyToken = await PropertyToken.deploy(owner.address);
    await propertyToken.waitForDeployment();
  });

  describe("Core ERC-1155 Logic", function () {
    it("Should create property with 1000 tokens", async function () {
      await propertyToken.createProperty(1, "ipfs://test");
      expect(await propertyToken.balanceOf(owner.address, 1)).to.equal(1000);
    });

    it("Should batch distribute tokens", async function () {
      await propertyToken.createProperty(1, "ipfs://test");
      await propertyToken.batchDistribute(
        [user1.address, user2.address],
        1,
        [100, 200] // user1 gets 10%, user2 gets 20%
      );
      expect(await propertyToken.balanceOf(user1.address, 1)).to.equal(100);
      expect(await propertyToken.balanceOf(user2.address, 1)).to.equal(200);
      expect(await propertyToken.balanceOf(owner.address, 1)).to.equal(700);
    });
  });

  describe("Rent Distribution Logic", function () {
    const TOKEN_ID = 1;

    beforeEach(async function () {
      // Setup: Create property and distribute to User 1 (100 tokens = 10%) and User 2 (400 tokens = 40%)
      // Platform keeps 500 tokens (50%)
      await propertyToken.createProperty(TOKEN_ID, "ipfs://test");
      await propertyToken.batchDistribute(
        [user1.address, user2.address],
        TOKEN_ID,
        [100, 400]
      );
    });

    it("Should allow depositing rent and updating accumulators", async function () {
      // Deposit 1 ETH rent
      const rentAmount = ethers.parseEther("1.0");
      
      await expect(
        propertyToken.depositRent(TOKEN_ID, { value: rentAmount })
      ).to.emit(propertyToken, "RentDeposited").withArgs(TOKEN_ID, rentAmount);

      // Verify claimable amounts
      // User 1 (10%) should claim 0.1 ETH
      // User 2 (40%) should claim 0.4 ETH
      const claimable1 = await propertyToken.claimableRent(user1.address, TOKEN_ID);
      const claimable2 = await propertyToken.claimableRent(user2.address, TOKEN_ID);
      
      expect(claimable1).to.equal(ethers.parseEther("0.1"));
      expect(claimable2).to.equal(ethers.parseEther("0.4"));
    });

    it("Should allow users to claim rent", async function () {
      const rentAmount = ethers.parseEther("10.0");
      await propertyToken.depositRent(TOKEN_ID, { value: rentAmount });

      // Check User 1 balance before
      const balanceBefore = await ethers.provider.getBalance(user1.address);

      // User 1 claims
      const tx = await propertyToken.connect(user1).claimRent(TOKEN_ID);
      const receipt = await tx.wait();
      
      // Calculate gas cost to be precise
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(user1.address);

      // Expected: +1.0 ETH (10% of 10) - gas
      const expectedBalance = balanceBefore + ethers.parseEther("1.0") - gasUsed;
      
      expect(balanceAfter).to.equal(expectedBalance);
      
      // Verify they cannot claim again
      expect(await propertyToken.claimableRent(user1.address, TOKEN_ID)).to.equal(0);
    });

    it("Correctly handles transfers (The Critical Test)", async function () {
      // Scenario:
      // 1. Deposit 10 ETH rent. User 1 has 10% (1 ETH pending).
      // 2. User 1 transfers ALL 100 tokens to User 3.
      // 3. Deposit another 10 ETH rent.
      // Expected:
      // - User 1 should be able to claim their ORIGINAL 1 ETH (even with 0 tokens).
      // - User 3 should receive ONLY the second rent (1 ETH), not the first.

      // Step 1: First Deposit
      await propertyToken.depositRent(TOKEN_ID, { value: ethers.parseEther("10.0") });
      
      // Verify User 1 pending
      expect(await propertyToken.claimableRent(user1.address, TOKEN_ID)).to.equal(ethers.parseEther("1.0"));

      // Step 2: Transfer
      await propertyToken.connect(user1).safeTransferFrom(
        user1.address, 
        user3.address, 
        TOKEN_ID, 
        100, 
        "0x"
      );

      // Verify User 1 STILL has 1 ETH pending (from before transfer)
      expect(await propertyToken.claimableRent(user1.address, TOKEN_ID)).to.equal(ethers.parseEther("1.0"));
      
      // Verify User 3 has 0 ETH pending (joined after distribution)
      expect(await propertyToken.claimableRent(user3.address, TOKEN_ID)).to.equal(0);

      // Step 3: Second Deposit
      await propertyToken.depositRent(TOKEN_ID, { value: ethers.parseEther("10.0") });

      // Verify User 1: Still 1 ETH (didn't earn from 2nd deposit)
      expect(await propertyToken.claimableRent(user1.address, TOKEN_ID)).to.equal(ethers.parseEther("1.0"));

      // Verify User 3: Earned 1 ETH from 2nd deposit (10% ownership now)
      expect(await propertyToken.claimableRent(user3.address, TOKEN_ID)).to.equal(ethers.parseEther("1.0"));
    });
  });
});

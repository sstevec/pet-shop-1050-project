const Adoption = artifacts.require("Adoption");

contract("Adoption", (accounts) => {
    let adoption;
    let owner = accounts[0];
    let user1 = accounts[1];
    let user2 = accounts[2];
    let petId;

    before(async () => {
        adoption = await Adoption.deployed();
    });

    describe("Pet Management", () => {
        it("allows the owner to add a new pet", async () => {
            await adoption.addNewPet("Buddy", 3, 0, "Toronto", "https://github.githubassets.com/assets/GitHub-Logo-ee398b662d42.png", {
                value: web3.utils.toWei("0.1", "ether"),
                from: owner,
            });
            petId = (await adoption.getPetCount()).toNumber() - 1;

            const pet = await adoption.getPet(petId);
            assert.equal(pet.name, "Buddy", "Pet name should be 'Buddy'.");
            assert.equal(pet.location, "Toronto", "Pet location should be 'Toronto'.");
        });

        it("does not allow adding a pet without sufficient Ether", async () => {
            try {
                await adoption.addNewPet("Milo", 4, 0, "Toronto", "https://github.githubassets.com/assets/GitHub-Logo-ee398b662d42.png", {
                    value: web3.utils.toWei("0.05", "ether"),
                    from: owner,
                });
                assert.fail("Should throw error for insufficient Ether");
            } catch (error) {
                assert(error.message.includes("Insufficient Ether sent"), "Error should mention insufficient Ether");
            }
        });
    });

    describe("Adoption Management", () => {
        it("allows a user to adopt a pet", async () => {
            await adoption.adopt(petId, { from: user1 });

            const pet = await adoption.getAdoptedPet(0); // First adopted pet
            assert.equal(pet.adopter, user1, "Adopter should be user1.");
        });

        it("allows a user to return an adopted pet", async () => {
            await adoption.returnPet(0, {
                from: user1,
                value: web3.utils.toWei("0.1", "ether"),
            });

            const returnedPet = await adoption.getPet(petId);
            assert.equal(returnedPet.adopter, "0x0000000000000000000000000000000000000000", "Adopter should be reset to 0 address.");
        });
    });

    describe("Voting", () => {
        before(async () => {
            await adoption.addNewPet("Charlie", 2, 0, "Toronto", "https://github.githubassets.com/assets/GitHub-Logo-ee398b662d42.png", {
                value: web3.utils.toWei("0.1", "ether"),
                from: owner,
            });
        });

        it("allows users to vote for a pet", async () => {
            const newPetId = (await adoption.getPetCount()).toNumber() - 1;

            await adoption.voteForPet(newPetId, { from: user1 });
            const voteCount = await adoption.getVoteCount(newPetId);

            assert.equal(voteCount, 1, "Vote count should be 1 after first vote.");
        });
    });

    describe("Donations and Withdrawal", () => {
        it("accepts donations", async () => {
            const initialBalance = await adoption.getBalance();
            await adoption.donate({ from: user1, value: web3.utils.toWei("0.5", "ether") });

            const finalBalance = await adoption.getBalance();
            assert.equal(
                finalBalance.toString(),
                (BigInt(initialBalance) + BigInt(web3.utils.toWei("0.5", "ether"))).toString(),
                "Balance should increase by the donation amount."
            );
        });

        it("allows the owner to withdraw funds", async () => {
            const initialOwnerBalance = BigInt(await web3.eth.getBalance(owner));
            const contractBalance = BigInt(await adoption.getBalance());

            const tx = await adoption.withdraw({ from: owner });
            const gasUsed = BigInt(tx.receipt.gasUsed) * BigInt(web3.utils.toWei("0.00000002", "ether"));
            const finalOwnerBalance = BigInt(await web3.eth.getBalance(owner));

            assert.equal(
                finalOwnerBalance.toString(),
                (initialOwnerBalance + contractBalance - gasUsed).toString(),
                "Owner's balance should increase by the contract balance minus gas costs."
            );
        });

        it("does not allow non-owners to withdraw funds", async () => {
            try {
                await adoption.withdraw({ from: user1 });
                assert.fail("Should throw error for non-owner withdrawal");
            } catch (error) {
                assert(error.message.includes("Only the owner can withdraw funds"), "Error should mention only the owner can withdraw funds");
            }
        });
    });
});

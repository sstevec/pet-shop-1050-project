const App = {
    web3Provider: null, adoptionContract: null, contractAddress: null,

    init: async function() {
        await App.initWeb3();
        await App.populateBreedDropdown();
        await App.checkOwnership();
    },

    initWeb3: async function() {
        // Modern dapp browsers
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.request({method: "eth_requestAccounts"});
            } catch (error) {
                console.error("User denied account access");
            }

            App.web3Provider.on("accountsChanged", (accounts) => {
                if (accounts.length > 0) {
                    console.log("Account changed to:", accounts[0]);
                    location.reload();
                } else {
                    console.warn("No account connected");
                }
            });
        }
        // Legacy dapp browsers
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // Fallback to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider("http://localhost:7545");
        }
        web3 = new Web3(App.web3Provider);

        return App.initContract();
    },

    initContract: async function() {
        // Load the contract artifact
        const response = await fetch("Adoption.json");
        const AdoptionArtifact = await response.json();

        // Initialize the contract
        App.contractAddress = AdoptionArtifact.networks[5777].address; // Update network ID if different
        App.adoptionContract = new web3.eth.Contract(AdoptionArtifact.abi, App.contractAddress);

        await App.loadAdoptedPets();

        return await App.loadPets();
    },

    generatePetCard: ({name, image, age, location, adopter, breedName, voteCount, petId}) => `
<div class="col-sm-4 col-md-3 col-lg-2">
    <div class="thumbnail">
        <img src="${image}" alt="${name}">
        <div class="caption">
            <h3>${name}</h3>
            <table class="table">
                <tr>
                    <td>Age</td>
                    <td>${age}</td>
                </tr>
                <tr>
                    <td>Breed</td>
                    <td>${breedName}</td>
                </tr>
                <tr>
                    <td>Location</td>
                    <td>${location}</td>
                </tr>
                ${"0x0000000000000000000000000000000000000000" === adopter ? "" : `<tr>
                    <td>Adopter</td>
                    <td style="word-wrap: anywhere">${adopter}</td>
                    <button class="btn btn-primary btn-return" data-id="${petId}">Return</button>
                </tr>`}
            </table>
            ${"undefined" === typeof voteCount
        ? ""
        : `<button class="btn btn-primary btn-adopt" data-id="${petId}">Adopt</button>
                         <button class="btn btn-default btn-vote" data-id="${petId}">
                            Vote <span class="badge">${voteCount}</span>
                         </button>`}
            </button>
        </div>
    </div>
</div>
`,

    loadPets: async function(event) {
        if (event) event.preventDefault();
        const adoptionInstance = await App.adoptionContract;

        const breedId = $("#filter-breed").val();
        const name = $("#filter-name").val().toLowerCase();
        const minAge = parseInt($("#filter-min-age").val()) || Number("-Infinity");
        const maxAge = parseInt($("#filter-max-age").val()) || Number("Infinity");

        const petCount = await adoptionInstance.methods.getPetCount().call();
        console.log(petCount);
        const petsContainer = $("#pets-container").empty();

        for (let i = 0; i < petCount; i++) {
            const pet = await adoptionInstance.methods.getPet(i).call();
            console.log((breedId === "" || pet.breedId === breedId),
                (name === "" || pet.name.toLowerCase().includes(name)),
                (pet.age >= minAge && pet.age <= maxAge),
            );

            if ((breedId === "" || pet.breedId === breedId) &&
                (name === "" || pet.name.toLowerCase().includes(name)) &&
                (pet.age >= minAge && pet.age <= maxAge)) {
                const breedName = await adoptionInstance.methods.getBreed(pet.breedId).call();
                const voteCount = await adoptionInstance.methods.getVoteCount(i).call();

                petsContainer.append(App.generatePetCard({
                    ...pet, breedName, voteCount, petId: i,
                }));
            }
        }
    },

    loadAdoptedPets: async function() {
        const adoptionInstance = await App.adoptionContract;
        const adoptedCount = await adoptionInstance.methods.getAdoptedCount().call();

        const adoptedContainer = $("#adopted-container").empty();

        for (let i = 0; i < adoptedCount; i++) {
            const pet = await adoptionInstance.methods.getAdoptedPet(i).call();
            const breedName = await adoptionInstance.methods.getBreed(pet.breedId).call();
            adoptedContainer.append(App.generatePetCard({...pet, breedName, petId: i}));
        }
    },

    addNewPet: async function(event) {
        event.preventDefault();

        const name = document.getElementById("new-pet-name").value;
        const age = parseInt(document.getElementById("new-pet-age").value);
        const breedId = parseInt(document.getElementById("new-pet-breed").value);
        const location = document.getElementById("new-pet-location").value;
        const imageInput = document.getElementById("new-pet-image");

        if (!imageInput.files.length) {
            alert("Please upload an image for the pet.");
            return;
        }

        const file = imageInput.files[0];
        const formData = new FormData();
        formData.append("image", file);

        // Save the file to the server
        const response = await fetch("http://localhost:3000/upload",
            {method: "POST", body: formData});
        if (!response.ok) {
            alert("Failed to upload image.");
            return;
        }

        const imagePath = await response.text();

        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        const adoptionInstance = App.adoptionContract;

        try {
            // Dynamically fetch the fee from the contract
            const addPetFee = await adoptionInstance.methods.getAddPetFee().call();

            // Send the transaction with the dynamically fetched fee
            await adoptionInstance.methods.addNewPet(name, age, breedId, location, imagePath).
                send({from: account, value: addPetFee});

            alert("New pet added successfully!");
            await App.loadPets(); // Reload the available pets list
        } catch (error) {
            console.error("Error adding new pet:", error.message);
        }
    },

    populateBreedDropdown: async function() {
        const adoptionInstance = App.adoptionContract;
        const breedCount = await adoptionInstance.methods.breedCount().call();

        const breedDropdown = document.getElementById("new-pet-breed");
        breedDropdown.innerHTML = ""; // Clear existing options

        const filterBreedDropdown = document.getElementById("filter-breed");
        filterBreedDropdown.innerHTML = "<option value=\"\">All Breeds</option>";

        for (let i = 0; i < breedCount; i++) {
            const breedName = await adoptionInstance.methods.getBreed(i).call();
            const option = document.createElement("option");
            option.value = i; // Breed ID
            option.text = breedName;

            breedDropdown.add(option.cloneNode(true)); // Add to add pet form
            filterBreedDropdown.add(option.cloneNode(true)); // Add to filter form
        }
    },

    bindEvents: function() {
        // Delegate events to dynamically created elements
        $("#pets-container").on("click", ".btn-vote", App.handleVote);
        $("#pets-container").on("click", ".btn-adopt", App.handleAdopt);

        $("#adopted-container").on("click", ".btn-return", App.handleReturn);
    },


    handleAdopt: async function(event) {
        event.preventDefault();
        const petId = parseInt($(event.target).data("id"));

        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        try {
            await App.adoptionContract.methods.adopt(petId).send({from: account});
            alert("Pet adopted successfully!");
            await App.loadPets();
            await App.loadAdoptedPets();
        } catch (error) {
            console.error(error.message);
        }
    }, handleReturn: async function(event) {
        event.preventDefault();

        const petId = parseInt(event.target.getAttribute("data-id"));
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        const adoptionInstance = await App.adoptionContract;

        try {
            // Fetch the return fee (same as add pet fee)
            const returnFee = await adoptionInstance.methods.getAddPetFee().call();

            // Call the returnPet function with the fee
            await adoptionInstance.methods.returnPet(petId).send({from: account, value: returnFee});
            alert("Pet returned successfully!");
            await App.loadPets(); // Reload available pets
            await App.loadAdoptedPets(); // Reload adopted pets
        } catch (error) {
            console.error("Error returning pet:", error.message);
        }
    },

    handleVote: async function(event) {
        event.preventDefault();

        const petId = parseInt(event.target.getAttribute("data-id"));
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        const adoptionInstance = await App.adoptionContract;

        try {
            await adoptionInstance.methods.voteForPet(petId).send({from: account});
            alert("Vote cast successfully!");
            await App.loadPets(); // Reload the pet list to update vote counts
        } catch (error) {
            console.error("Error voting for pet:", error.message);
        }
    },

    handleDonate: async function(event) {
        event.preventDefault();

        const amount = document.getElementById("donation-amount").value;
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        const adoptionInstance = await App.adoptionContract;

        try {
            // Send the donation
            await adoptionInstance.methods.donate().send({
                from: account, value: web3.utils.toWei(amount, "ether"),
            });
            alert("Thank you for your donation!");
        } catch (error) {
            console.error("Error during donation:", error.message);
        }
    },

    handleWithdrawDonations: async function() {
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        const adoptionInstance = await App.adoptionContract;

        try {
            // Call the withdrawDonations function
            await adoptionInstance.methods.withdraw().send({from: account});
            alert("Donations withdrawn successfully!");
        } catch (error) {
            console.error("Error withdrawing donations:", error.message);
        }
    },

    checkOwnership: async function() {
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        const adoptionInstance = await App.adoptionContract;
        const owner = await adoptionInstance.methods.owner().call();
        console.log(account, owner);

        $("#user-address").text(account);

        if (account.toLowerCase() === owner.toLowerCase()) {
            $("#owner-badge").show();
            $("#withdraw-section").show();
        }
    },

};

$(document).ready(function() {
    App.init().then(() => {
        App.bindEvents();
        $("#add-pet-form").on("submit", App.addNewPet);
        $("#filter-form").on("submit", App.loadPets);
        $("#donate-form").on("submit", App.handleDonate);
        $("#withdraw-donations").on("click", App.handleWithdrawDonations);
    });
});

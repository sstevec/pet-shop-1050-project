const App = {
    web3Provider: null,
    adoptionContract: null,
    contractAddress: null,

    init: async function () {
        return await App.initWeb3();
    },

    initWeb3: async function () {
        // Modern dapp browsers
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.request({ method: "eth_requestAccounts" });
            } catch (error) {
                console.error("User denied account access");
            }
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

    initContract: async function () {
        // Load the contract artifact
        const response = await fetch("Adoption.json");
        const AdoptionArtifact = await response.json();

        // Initialize the contract
        App.contractAddress = AdoptionArtifact.networks[5777].address; // Update network ID if different
        App.adoptionContract = new web3.eth.Contract(AdoptionArtifact.abi, App.contractAddress);

        await App.populateBreedDropdown();

        return App.loadPets();
    },

    loadPets: async function () {
        const adoptionInstance = await App.adoptionContract;
        const petCount = await adoptionInstance.methods.getPetCount().call();

        const petsContainer = document.getElementById("pets-container");
        petsContainer.innerHTML = "";

        for (let i = 0; i < petCount; i++) {
            const pet = await adoptionInstance.methods.getPet(i).call();

            // Skip if pet is not available
            if (pet.adopter !== "0x0000000000000000000000000000000000000000") {
                continue;
            }

            const breedName = await adoptionInstance.methods.getBreed(pet.breedId).call();

            const petCard = document.createElement("div");
            petCard.className = "pet-card";
            petCard.innerHTML = `
            <h3>${pet.name}</h3>
            <img src="${pet.image}" alt="${pet.name}">
            <p>Age: ${pet.age}</p>
            <p>Breed: ${breedName}</p>
            <p>Location: ${pet.location}</p>
            <button class="btn-adopt" data-id="${i}">Adopt</button>
        `;
            petsContainer.appendChild(petCard);
        }

        App.bindEvents();
    },

    loadAdoptedPets: async function () {
        const adoptionInstance = await App.adoptionContract;
        const adoptedCount = await adoptionInstance.methods.getAdoptedCount().call();

        const adoptedContainer = document.getElementById("adopted-container");
        adoptedContainer.innerHTML = "";

        for (let i = 0; i < adoptedCount; i++) {
            const pet = await adoptionInstance.methods.getAdoptedPet(i).call();
            const breedName = await adoptionInstance.methods.getBreed(pet.breedId).call();

            const petCard = document.createElement("div");
            petCard.className = "pet-card";
            petCard.innerHTML = `
            <h3>${pet.name}</h3>
            <img src="${pet.image}" alt="${pet.name}">
            <p>Age: ${pet.age}</p>
            <p>Breed: ${breedName}</p>
            <p>Location: ${pet.location}</p>
            <p>Adopter: ${pet.adopter}</p>
        `;
            adoptedContainer.appendChild(petCard);
        }
    },

    addNewPet: async function (event) {
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
        const response = await fetch("http://localhost:3000/upload", { method: "POST", body: formData });
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
            await adoptionInstance.methods
                .addNewPet(name, age, breedId, location, imagePath)
                .send({ from: account, value: addPetFee });

            alert("New pet added successfully!");
            App.loadPets(); // Reload the available pets list
        } catch (error) {
            console.error("Error adding new pet:", error.message);
        }
    },

    populateBreedDropdown: async function () {
        const adoptionInstance = App.adoptionContract;
        const breedCount = await adoptionInstance.methods.breedCount().call();

        const breedDropdown = document.getElementById("new-pet-breed");
        breedDropdown.innerHTML = ""; // Clear existing options

        for (let i = 0; i < breedCount; i++) {
            const breedName = await adoptionInstance.methods.getBreed(i).call();
            const option = document.createElement("option");
            option.value = i; // Breed ID
            option.text = breedName;
            breedDropdown.add(option);
        }
    },



    bindEvents: function () {
        document.querySelectorAll(".btn-adopt").forEach((button) =>
            button.addEventListener("click", App.handleAdopt)
        );
    },

    handleAdopt: async function (event) {
        event.preventDefault();
        const petId = parseInt(event.target.getAttribute("data-id"));

        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        try {
            await App.adoptionContract.methods.adopt(petId).send({ from: account });
            alert("Pet adopted successfully!");
            App.loadPets(); // Refresh the pet list
            App.loadAdoptedPets();
        } catch (error) {
            console.error(error.message);
        }
    },
};

document.addEventListener("DOMContentLoaded", function () {
    App.init();
    document.getElementById("add-pet-form").addEventListener("submit", App.addNewPet);

});

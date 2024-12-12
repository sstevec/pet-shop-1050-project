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

        return App.loadPets();
    },

    loadPets: async function () {
        const petCount = await App.adoptionContract.methods.getPetCount().call();

        const petsContainer = document.getElementById("pets-container");
        petsContainer.innerHTML = "";

        for (let i = 0; i < petCount; i++) {
            const pet = await App.adoptionContract.methods.getPet(i).call();
            const breedName = await App.adoptionContract.methods.getBreed(pet.breedId).call();

            // Create pet card
            const petCard = document.createElement("div");
            petCard.className = "pet-card";
            petCard.innerHTML = `
        <h3>${pet.name}</h3>
        <img src="${pet.image}" alt="${pet.name}"> <!-- pet.image -->
        <p>Age: ${pet.age}</p>
        <p>Breed: ${breedName}</p>
        <p>Location: ${pet.location}</p>
        <p>Adopter: ${
                pet.adopter === "0x0000000000000000000000000000000000000000"
                    ? "Available"
                    : pet.adopter
            }</p>
        ${
                pet.adopter === "0x0000000000000000000000000000000000000000"
                    ? `<button class="btn-adopt" data-id="${i}">Adopt</button>`
                    : `<button disabled>Adopted</button>`
            }
      `;
            petsContainer.appendChild(petCard);
        }

        App.bindEvents();
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
        } catch (error) {
            console.error(error.message);
        }
    },
};

document.addEventListener("DOMContentLoaded", function () {
    App.init();
});

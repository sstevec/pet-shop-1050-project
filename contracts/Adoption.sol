pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract Adoption {
    struct Pet {
        string name;
        uint age;
        uint breedId;
        string location;
        string image; // URL or IPFS hash for the pet's image
        address adopter;
        uint voteCount; // Add vote count
    }

    struct Breed {
        string name;
    }

    uint public addPetFee = 0.1 ether; // Fee for adding a new pet
    address public owner;

    constructor() public {
        owner = msg.sender; // The account deploying the contract becomes the owner
    }

    mapping(uint => Pet) public pets; // Mapping of petId to Pet details
    mapping(uint => Breed) public breeds; // Mapping of breedId to Breed details
    mapping(uint => Pet) public adoptedPets; // Store adopted pets
    uint public adoptedCount; // Keep track of the number of adopted pets
    uint public breedCount; // Number of breeds
    uint public petCount;   // Number of pets

    // Adopting a pet
    function adopt(uint petId) public returns (uint) {
        require(petId >= 0 && petId < petCount, "Invalid petId");
        require(pets[petId].adopter == address(0), "Pet already adopted");

        pets[petId].adopter = msg.sender;

        // Move pet to adoptedPets mapping
        adoptedPets[adoptedCount] = pets[petId];
        adoptedCount++;

        // Shift the remaining IDs to fill the gap
        for (uint j = petId; j < petCount - 1; j++) {
            pets[j] = pets[j + 1];
        }
        delete pets[petCount - 1];
        petCount--;

        return petId;
    }

    function returnPet(uint petId) public payable {
        require(petId >= 0 && petId < adoptedCount, "Invalid pet ID");
        require(adoptedPets[petId].adopter == msg.sender, "Only the adopter can return the pet");
        require(msg.value >= addPetFee, "Insufficient Ether sent for return");

        // Remove the adopter
        adoptedPets[petId].adopter = address(0);

        // Add the pet back to the available list
        pets[petCount] = adoptedPets[petId];
        petCount++;

        for (uint j = petId; j < adoptedCount - 1; j++) {
            adoptedPets[j] = adoptedPets[j + 1];
        }
        delete adoptedPets[adoptedCount - 1];
        adoptedCount--;

    }

    function getAdoptedPet(uint adoptedPetId) public view returns (
        string memory name,
        uint age,
        uint breedId,
        string memory location,
        string memory image,
        address adopter
    ) {
        Pet memory pet = adoptedPets[adoptedPetId];
        return (pet.name, pet.age, pet.breedId, pet.location, pet.image, pet.adopter);
    }


    function addNewPet(
        string memory name,
        uint age,
        uint breedId,
        string memory location,
        string memory image
    ) public payable {
        require(msg.value >= addPetFee, "Insufficient Ether sent for adding a new pet");
        require(breedId < breedCount, "Invalid breed ID");

        // Add new pet to the pets mapping
        pets[petCount] = Pet(name, age, breedId, location, image, address(0), 0);
        petCount++;
    }

    function withdraw() public {
        require(msg.sender == owner, "Only the owner can withdraw funds");
        msg.sender.transfer(address(this).balance);
    }

    function addBreed(string memory name) public {
        breeds[breedCount] = Breed(name);
        breedCount++;
    }

    // Get the total number of pets
    function getPetCount() public view returns (uint) {
        return petCount;
    }

    function getAdoptedCount() public view returns (uint) {
        return adoptedCount;
    }

    function getAddPetFee() public view returns (uint) {
        return addPetFee;
    }

    // Retrieve all pet details
    function getPet(uint petId) public view returns (
        string memory name,
        uint age,
        uint breedId,
        string memory location,
        string memory image,
        address adopter
    ) {
        Pet memory pet = pets[petId];
        return (pet.name, pet.age, pet.breedId, pet.location, pet.image, pet.adopter);
    }

    // Retrieve breed name
    function getBreed(uint breedId) public view returns (string memory) {
        return breeds[breedId].name;
    }

    function voteForPet(uint petId) public {
        require(petId >= 0 && petId < petCount, "Invalid pet ID");
        require(pets[petId].adopter == address(0), "Cannot vote for adopted pets");

        pets[petId].voteCount += 1;
    }

    function getVoteCount(uint petId) public view returns (uint) {
        require(petId >= 0 && petId < petCount, "Invalid pet ID");

        return pets[petId].voteCount;
    }

    // Admin function to initialize pets and breeds
    function initializeData(
        string[] memory names,
        uint[] memory ages,
        uint[] memory breedIds,
        string[] memory locations,
        string[] memory images,
        string[] memory breedNames
    ) public {
        // Initialize breeds
        for (uint i = 0; i < breedNames.length; i++) {
            breeds[i] = Breed(breedNames[i]);
        }
        breedCount = breedNames.length;

        // Initialize pets
        for (uint i = 0; i < names.length; i++) {
            pets[i] = Pet(names[i], ages[i], breedIds[i], locations[i], images[i], address(0), 0);
        }
        petCount = names.length;
    }

    function donate() public payable {
        require(msg.value > 0, "Donation must be greater than zero");
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}

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
    }

    struct Breed {
        string name;
    }

    mapping(uint => Pet) public pets; // Mapping of petId to Pet details
    mapping(uint => Breed) public breeds; // Mapping of breedId to Breed details
    uint public breedCount; // Number of breeds
    uint public petCount;   // Number of pets

    // Adopting a pet
    function adopt(uint petId) public returns (uint) {
        require(petId >= 0 && petId < petCount, "Invalid petId");
        require(pets[petId].adopter == address(0), "Pet already adopted");

        pets[petId].adopter = msg.sender;

        return petId;
    }

    function addPet(
        string memory name,
        uint age,
        uint breedId,
        string memory location,
        string memory image
    ) public {
        pets[petCount] = Pet(name, age, breedId, location, image, address(0));
        petCount++;
    }

    function addBreed(string memory name) public {
        breeds[breedCount] = Breed(name);
        breedCount++;
    }

    // Get the total number of pets
    function getPetCount() public view returns (uint) {
        return petCount;
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
            pets[i] = Pet(names[i], ages[i], breedIds[i], locations[i], images[i], address(0));
        }
        petCount = names.length;
    }
}

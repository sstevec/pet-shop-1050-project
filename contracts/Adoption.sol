pragma solidity ^0.5.0;

contract Adoption {
    address[16] public adopters; // Tracks adopters for each pet
    uint[16] public petVotes;   // Tracks votes for each pet
    mapping(uint => uint) public adoptionPrice; // Maps breed IDs to their adoption prices
    mapping(uint => uint) public petBreed;      // Maps pet IDs to their breed IDs
    mapping(uint => string) public breedNames;  // Maps breed IDs to their names
    mapping(uint => uint) public petAge;        // Maps pet IDs to their age
    mapping(uint => string) public petLocation; // Maps pet IDs to their location

    constructor() public {
        // Initialize breed names
        breedNames[0] = "Scottish Terrier";
        breedNames[1] = "French Bulldog";
        breedNames[2] = "Boxer";
        breedNames[3] = "Golden Retriever";

        // Initialize pet-to-breed mapping
        petBreed[0] = 0; // Scottish Terrier
        petBreed[1] = 0; // Scottish Terrier
        petBreed[2] = 1; // French Bulldog
        petBreed[3] = 2; // Boxer
        petBreed[4] = 1; // French Bulldog
        petBreed[5] = 1; // French Bulldog
        petBreed[6] = 3; // Golden Retriever
        petBreed[7] = 3; // Golden Retriever
        petBreed[8] = 1; // French Bulldog
        petBreed[9] = 2; // Boxer
        petBreed[10] = 2; // Boxer
        petBreed[11] = 0; // Scottish Terrier
        petBreed[12] = 1; // French Bulldog
        petBreed[13] = 3; // Golden Retriever
        petBreed[14] = 3; // Golden Retriever
        petBreed[15] = 3; // Golden Retriever

        // Initialize adoption prices for each breed
        adoptionPrice[0] = 0.01 ether; // Scottish Terrier
        adoptionPrice[1] = 0.01 ether; // French Bulldog
        adoptionPrice[2] = 0.01 ether; // Boxer
        adoptionPrice[3] = 0.01 ether; // Golden Retriever

        // Initialize pet ages
        petAge[0] = 2;
        petAge[1] = 3;
        petAge[2] = 1;
        petAge[3] = 4;
        petAge[4] = 2;
        petAge[5] = 5;
        petAge[6] = 3;
        petAge[7] = 1;
        petAge[8] = 4;
        petAge[9] = 2;
        petAge[10] = 3;
        petAge[11] = 1;
        petAge[12] = 2;
        petAge[13] = 5;
        petAge[14] = 4;
        petAge[15] = 3;

        // Initialize pet locations
        petLocation[0] = "New York";
        petLocation[1] = "Los Angeles";
        petLocation[2] = "Chicago";
        petLocation[3] = "Houston";
        petLocation[4] = "Phoenix";
        petLocation[5] = "Philadelphia";
        petLocation[6] = "San Antonio";
        petLocation[7] = "San Diego";
        petLocation[8] = "Dallas";
        petLocation[9] = "San Jose";
        petLocation[10] = "Austin";
        petLocation[11] = "Jacksonville";
        petLocation[12] = "Fort Worth";
        petLocation[13] = "Columbus";
        petLocation[14] = "Charlotte";
        petLocation[15] = "San Francisco";
    }

    // Function to vote for a pet and increase the adoption price of its breed
    function voteForPet(uint petId) public {
        require(petId >= 0 && petId < 16, "Invalid pet ID");

        petVotes[petId] += 1; // Increment vote count for the specific pet

        uint breedId = petBreed[petId]; // Get the breed ID for the pet
        adoptionPrice[breedId] += 0.01 ether; // Increment adoption price for the breed
    }

    // Function to adopt a pet
    function adopt(uint petId) public payable {
        require(petId >= 0 && petId < 16, "Invalid pet ID");
        require(adopters[petId] == address(0), "Pet already adopted");

        uint breedId = petBreed[petId]; // Get the breed ID for the pet
        uint price = adoptionPrice[breedId]; // Get the adoption price for the breed

        require(msg.value >= price, "Not enough Ether to adopt this pet");

        adopters[petId] = msg.sender; // Assign the adopter
    }

    // Function to filter pets by breed, age, and location
    function filterPets(uint breedId, uint minAge, uint maxAge, string memory location) public view returns (uint[] memory) {
        uint[] memory result = new uint[](16);
        uint counter = 0;
        
        for (uint i = 0; i < 16; i++) {
            if (
                adopters[i] == address(0) && // Pet is not adopted
                (breedId == uint(-1) || petBreed[i] == breedId) && // Matches breed if specified
                (minAge == uint(-1) || petAge[i] >= minAge) && // Matches minimum age if specified
                (maxAge == uint(-1) || petAge[i] <= maxAge) && // Matches maximum age if specified
                (bytes(location).length == 0 || keccak256(abi.encodePacked(petLocation[i])) == keccak256(abi.encodePacked(location))) // Matches location if specified
            ) {
                result[counter] = i;
                counter++;
            }
        }

        // Resize the result array to match the number of matching pets
        uint[] memory filteredPets = new uint[](counter);
        for (uint j = 0; j < counter; j++) {
            filteredPets[j] = result[j];
        }

        return filteredPets;
    }

    // Get the name of a breed by its ID
    function getBreedName(uint breedId) public view returns (string memory) {
        return breedNames[breedId];
    }

    // Get the adoption price for a breed by its ID
    function getAdoptionPrice(uint breedId) public view returns (uint) {
        return adoptionPrice[breedId];
    }

    // Get the vote count of a pet
    function getPetVotes(uint petId) public view returns (uint) {
        return petVotes[petId];
    }
}

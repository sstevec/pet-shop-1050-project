const Adoption = artifacts.require("Adoption");
const fs = require("fs");

module.exports = async function (deployer) {
    const petData = JSON.parse(fs.readFileSync("./src/pets.json", "utf8"));

    const breeds = {};
    let breedIndex = 0; // Initialize breed index
    const breedNames = [];

    const names = [];
    const ages = [];
    const breedIds = [];
    const locations = [];
    const images = [];

    for (const pet of petData) {
        const normalizedBreed = pet.breed.trim().toLowerCase();

        // Add the breed only if it doesn't already exist
        if (!Object.hasOwn(breeds, normalizedBreed)) {
            console.log(`Adding New Breed: ${pet.breed}`);
            breeds[normalizedBreed] = breedIndex;
            breedIndex++;
            breedNames.push(pet.breed.trim()); // Store original breed name
        } else {
            console.log(`Existing Breed Found: ${pet.breed}`);
        }

        // Map breedId to each pet
        names.push(pet.name);
        ages.push(pet.age);
        breedIds.push(breeds[normalizedBreed]); // Use the correct breedId
        locations.push(pet.location);
        images.push(pet.picture); // Store image URL
    }

    await deployer.deploy(Adoption);
    const adoptionInstance = await Adoption.deployed();

    await adoptionInstance.initializeData(names, ages, breedIds, locations, images, breedNames);
};


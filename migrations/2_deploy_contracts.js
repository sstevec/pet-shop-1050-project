const Adoption = artifacts.require("Adoption");
const fs = require("fs");

module.exports = async function (deployer) {
    const petData = JSON.parse(fs.readFileSync("./src/pets.json", "utf8"));

    const breeds = {};
    let breedIndex = 0;
    const breedNames = [];

    const names = [];
    const ages = [];
    const breedIds = [];
    const locations = [];
    const images = [];

    for (const pet of petData) {
        if (!breeds[pet.breed]) {
            breeds[pet.breed] = breedIndex++;
            breedNames.push(pet.breed);
        }
        names.push(pet.name);
        ages.push(pet.age);
        breedIds.push(breeds[pet.breed]);
        locations.push(pet.location);
        images.push(pet.picture); // Add image URL from JSON
    }

    await deployer.deploy(Adoption);
    const adoptionInstance = await Adoption.deployed();

    await adoptionInstance.initializeData(names, ages, breedIds, locations, images, breedNames);
};

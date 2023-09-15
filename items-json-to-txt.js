const fs = require('fs');
let itemsIds = [];

// Specify the path to your JSON file
const jsonFilePath = 'items.json';
// Read the JSON file
fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading ${jsonFilePath}: ${err}`);
        return;
    }
    try {
        // Parse the JSON data into an array
        const jsonArray = JSON.parse(data);
        for (let i = 1; i <= Object.keys(jsonArray).length; i++) {
            itemsIds.push({ id: i, en: jsonArray[i].en });
            console.log(i);
        }
        // Now you can use the jsonArray in your Node.js application
        console.log('Loaded JSON as an array:');
        // console.log(itemsIds);
        const arrayAsString = JSON.stringify(itemsIds);
        const filePath = 'items.txt';

        fs.writeFile(filePath, arrayAsString, (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('Array has been written to', filePath);
        }
        });
    }
    catch (parseError) {
        console.error(`Error parsing JSON: ${parseError}`);
    }
});

console.log(itemsIds);
const fs = require('fs');

// Load data:
const data = fs.readFileSync(`${__dirname}/data.json`, 'utf-8')

const importData = () => {


    fs.writeFile('../database/products.json', data, (err) => {
        if (err) {
            console.log('Error while seeding database: ', err);
            return;
        }
        console.log('Data imported');
    });

}


const deleteData = () => {

    fs.writeFile('../database/products.json', '', (err) => {
        if (err) {
            console.log('Error while deleting data from database: ', err)
            return;
        }
        console.log('Data deleted.');
    });

}

if (process.argv[2] === '-import') {
    importData();
} else if (process.argv[2] === '-delete') {
    deleteData();
}
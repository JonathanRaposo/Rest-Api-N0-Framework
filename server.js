require('dotenv').config()
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path')
const http = require('http');
const logger = require('./utils/logger');


//load products:
// const products = JSON.parse(fs.readFileSync(__dirname + '/database/products.json', 'utf-8'));
const products = require('./database/products.json');
const { emitWarning } = require('process');

const server = http.createServer((req, res) => {

    //custom logger:
    logger(req, res);


    //  GET - Route to get all products:

    if (req.url === '/api/products' && req.method === 'GET') {

        const productList = new Promise((resolve, reject) => {
            resolve(products);
        })

        productList
            .then((products) => {
                console.log('list of products: ', products)
                if (!products.length) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(
                        {
                            success: true,
                            count: products.length,
                            data: products
                        }
                    ));
                }
                else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(products))
                }

            })
            .catch((err) => console.log('Error getting list of products: ', err));
    }

    //   GET - Route to get a specific product:

    else if (req.url.match(/\/api\/products\/([0-9]+)/) && req.method === 'GET') {
        const id = req.url.split('/')[3]
        console.log('Product id#:', id)

        const product = new Promise((resolve, reject) => {
            let found_product;
            for (let i = 0; i < products.length; i++) {


                if (products[i].id === id) {
                    found_product = products[i];
                }
            }
            if (!found_product) {
                res.writeHead(404, { 'Content-type': 'application/json' });
                res.end(JSON.stringify({ message: 'Product not found.' }))
            }
            else {
                console.log('product found:', found_product)
                resolve(found_product);

            }
        })

        product
            .then((productFromDB) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(productFromDB));

            })
            .catch((err) => console.log('Error while getting product: ', err));

    }



    //POST -  Route to create new product:

    else if (req.url === '/api/products' && req.method === 'POST') {
        // get body from request:

        const new_product = new Promise((resolve, reject) => {


            let body = [];
            req.on('data', (chunk) => {
                body.push(chunk)
            })
            req.on('end', () => {

                body = Buffer.concat(body).toString();


                const request_body = JSON.parse(body);
                const { image_Url, name, description, price } = request_body;


                if (!name || !description || !price) {
                    res.writeHead(400, { 'Content-type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Please provide name, description and price.' }))
                    return;
                }
                const newProduct = {
                    id: uuidv4(),
                    image_Url: image_Url,
                    name: name,
                    description: description,
                    price: price
                }

                products.push(newProduct);
                fs.writeFile(`${__dirname}/database/products.json`, JSON.stringify(products), (err) => {
                    if (err) console.log('Error while writing file to db: ', err)
                })
                resolve(newProduct);

            })
        })
        new_product
            .then((newProduct) => {
                console.log('new product: ', newProduct)
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newProduct));
            })
            .catch((err) => console.log('Error while creating product: ', err))


    }

    //  UPDATE  - Route to update specific product:

    else if (req.url.match(/\/api\/products\/([0-9]+)/) && req.method === 'PUT') {

        const id = req.url.split('/')[3];
        console.log('Product id#:', id);

        const product = new Promise((resolve, reject) => {



            // Get request body:
            let body = [];
            req.on('data', (chunk) => {
                body.push(chunk);
            })
            req.on('end', () => {
                body = Buffer.concat(body).toString();
                console.log("request body: ", body);

                // Find product:
                let found_product = products.find((p) => p.id === id);
                console.log('found product:', found_product)
                const { image_Url, name, description, price } = JSON.parse(body);

                const updatedProduct = {
                    id: id,
                    image_Url: image_Url || found_product.image_Url,
                    name: name || found_product.name,
                    description: description || found_product.description,
                    price: price || found_product.price
                }

                // //  Find product index:
                const index = products.findIndex((p) => p.id === id)
                products[index] = updatedProduct;

                fs.writeFile(`${__dirname}/database/products.json`, JSON.stringify(products), (err) => {
                    if (err) console.log('Error while writing file to database: ', err);
                });
                resolve(updatedProduct);

            })
        })
        product
            .then((updatedProduct) => {
                console.log('Updated Product: ', updatedProduct);
                res.writeHead(200, { 'Content-type': 'application/json' });
                res.end(JSON.stringify(updatedProduct));
            })
            .catch((err) => console.log('Error while updating product: ', err));

    }


    //   DELETE -route to delete product:

    else if (req.url.match(/\/api\/products\/([0-9]+)/) && req.method === 'DELETE') {
        const id = req.url.split('/')[3];
        console.log('Product id#:', id)

        const product = new Promise((resolve, reject) => {
            const newProductList = products.filter((p) => p.id !== id);


            fs.writeFile(`${__dirname}/database/products.json`, JSON.stringify(newProductList), (err) => {
                if (err) console.log('Error while writing file: ', err)
            })
            resolve(newProductList);

        })
        product
            .then(() => {
                res.writeHead(200, { 'Content-type': 'application/json' });
                res.end(JSON.stringify({ message: `Product id# ${id}  removed.` }))
            })
    }


    else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'This route does not exist.' }))
    }


});


console.log(products.length + ' products in DB')

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));


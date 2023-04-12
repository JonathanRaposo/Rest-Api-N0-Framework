require('dotenv').config()
const fs = require('fs');
const path = require('path')
const http = require('http');
const logger = require('./utils/logger');
const MyUUID = require('./utils/myuuid'); // custom id generator
const { generateId: myuuid } = new MyUUID


//load products:
const products = JSON.parse(fs.readFileSync(__dirname + '/database/products.json', 'utf-8'));

const server = http.createServer((req, res) => {

    //custom logger:
    logger(req, res);

    //  GET - Route to get all products:
    if (req.url === '/api/products' && req.method === 'GET') {
        //  allow client to have access to resources:
        const responseHeaders = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }

        // get all the products asynchronously:
        const productList = new Promise((resolve, reject) => {
            if (products) {
                resolve(products);
            }
            else {
                reject('Rejected.')
            }
        })
        // once promise is fullfilled then:
        productList
            .then((products) => {
                console.log('list of products: ', products)
                // if database is empty, still show success:
                if (products.length === 0) {
                    res.writeHead(200, responseHeaders);
                    res.end(JSON.stringify(
                        {
                            success: true,
                            count: products.length,
                            data: products
                        }
                    ));
                }
                // send list of products:
                res.writeHead(200, responseHeaders);
                res.end(JSON.stringify(products));

            })
            .catch((err) => console.log('Error getting list of products: ', err));
    }

    //   GET - Route to get a specific product:

    else if (req.url.match(/\/api\/products\/([0-9]+)/) && req.method === 'GET') {
        //  allow client to have access to resources:
        const responseHeaders = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }

        // get id from url
        const id = req.url.split('/')[3]
        console.log('Product id#:', id)

        //find product asynchronously:
        const product = new Promise((resolve, reject) => {
            let found_product;
            for (let i = 0; i < products.length; i++) {


                if (products[i].id === id) {
                    found_product = products[i];
                }
            }
            if (!found_product) {
                res.writeHead(404, responseHeaders);
                res.end(JSON.stringify({ message: 'Product not found.' }));
                reject('Product not found')
            }
            else {
                console.log('product found:', found_product)
                resolve(found_product);

            }
        })
        // once resolved, send product:
        product
            .then((productFromDB) => {
                res.writeHead(200, responseHeaders);
                res.end(JSON.stringify(productFromDB));

            })
            .catch((err) => console.log('Error while getting product: ', err));

    }



    //POST -  Route to create new product:

    else if (req.url === '/api/products' && req.method === 'POST') {

        let responseHeaders = { 'Content-Type': 'application/json' }

        // create product asynchronously:
        const new_product = new Promise((resolve, reject) => {

            // get body from request:
            let body = [];
            req.on('data', (chunk) => {
                body.push(chunk);
            })
            req.on('end', () => {

                body = Buffer.concat(body).toString();


                const request_body = JSON.parse(body);
                const { image_Url, name, description, price } = request_body;

                // make fields are filled.
                if (!name || !description || !price) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Please provide name, description and price.' }));
                    reject('all fields must be filled.')
                    return;
                }
                // new product:
                const newProduct = {
                    id: myuuid(),
                    image_Url: image_Url,
                    name: name,
                    description: description,
                    price: price
                }

                // update database:
                products.push(newProduct);
                fs.writeFile(`${__dirname}/database/products.json`, JSON.stringify(products), (err) => {
                    if (err) console.log('Error while writing file to db: ', err);
                });
                resolve(newProduct);

            });
        });
        //once resolved, send new product:
        new_product
            .then((newProduct) => {
                console.log('Product created: ', newProduct);
                res.writeHead(201, responseHeaders)
                res.end(JSON.stringify(newProduct));
            })
            .catch((err) => console.log('Error while creating product: ', err))


    }

    //  UPDATE  - Route to update specific product:

    else if (req.url.match(/\/api\/products\/([0-9]+)/) && req.method === 'PUT') {


        let responseHeaders = {
            'Acess-Control-Allow-Origin': '*',
            'Acess-Control-Allow-Headers': 'Content-Type',
            'Acess-Control-Allow-Methods': 'POST,OPTIONS,GET,PUT,DELETE',

        }

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

                //updated product:
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

                //update database:
                fs.writeFile(`${__dirname}/database/products.json`, JSON.stringify(products), (err) => {
                    if (err) console.log('Error while writing file to database: ', err);
                });
                resolve(updatedProduct);

            })
        })
        // once resolved:
        product
            .then((updatedProduct) => {
                console.log('Updated Product: ', updatedProduct);
                res.writeHead(200, responseHeaders);
                res.end(JSON.stringify(updatedProduct));
            })
            .catch((err) => console.log('Error while updating product: ', err));

    }


    //   DELETE -route to delete product:

    else if (req.url.match(/\/api\/products\/([0-9]+)/) && req.method === 'DELETE') {

        let responseHeaders = {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE,PUT',

        }
        // get id from the request:
        const id = req.url.split('/')[3];
        console.log('Product id#:', id)



        // update product list asynchronously:
        const newList = new Promise((resolve, reject) => {
            // filter:
            const newProductList = products.filter((p) => p.id !== id);

            //write to database:
            fs.writeFile(`${__dirname}/database/products.json`, JSON.stringify(newProductList), (err) => {
                if (err) console.log('Error while writing file: ', err)
            })
            resolve(newProductList);

        })
        // once resolved, then:
        newList
            .then(() => {
                res.writeHead(200, responseHeaders)
                res.end(JSON.stringify({ message: `Product id# ${id}  removed.` }))
            })
            .catch((err) => console.log('Error deleting product: ', err))
    }

    // send 404 if route doesn't exist.
    else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(JSON.stringify({ message: 'This route does not exist.' }))
    }


});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));


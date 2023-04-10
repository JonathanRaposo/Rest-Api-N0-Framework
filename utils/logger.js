const logger = (req, res) => {
    console.log(`${req.method} http://localhost:5000${req.url}`);
}

module.exports = logger;
function getAllTrips(req, response) {
    response.send(['1 trip', '2 trip'])
}

module.exports = {
    getAllTrips
}
let trips = [
    {
        name: 'trip'
    },
    {
        name: 'trip'
    }
]
class TripController {
    async getAll(req, res, next) {
        try {
            return res.json(trips)
        } catch (err) {
            console.log(err);
            // when api error enabled
            // next(err)
        }
    }
}

module.exports = new TripController();
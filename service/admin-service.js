const UserModel = require('../models/user-model');

module.exports = {
    fetchUsers(q) {
        const { query, role } = q
        return UserModel.find({
            $and: [
                { roles: { $elemMatch: { $eq: role } } },
                {
                    $or: [
                        { email: { $regex: query, $options: 'i' } },
                        { fullname: { $regex: query, $options: 'i' } },
                    ]
                }
            ]
        }, { email: 1, fullname: 1, roles: 1 })
    }
}


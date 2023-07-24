const UserModel = require('../models/user-model');
const AppStateModel = require('../models/app-state-model');

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
    },
    changeUserRoles(body) {
        let { email, roles } = body

        return UserModel.findOneAndUpdate({ email }, { roles }, { new: true })
    },
    addEmail({ event, email }) {
        return AppStateModel.findOneAndUpdate({ "sendMailsTo.type": event }, { $push: { 'sendMailsTo.$.emails': email } })
    },
    getEmails(event) {
        return AppStateModel.findOne({ "sendMailsTo.type": event }, { "sendMailsTo.$": 1, _id: 0 })
    },
    deleteEmail({ event, email }) {
        return AppStateModel.findOneAndUpdate({ "sendMailsTo.type": event }, { $pull: { "sendMailsTo.$.emails": email } })
    }
}


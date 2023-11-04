const UserModel = require('../models/user-model');
const AppStateModel = require('../models/app-state-model');
const _ = require('lodash')

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
    },
    async addCabinetNotifications({ event, email }) {
        let userFromDb = await UserModel.findOne({ email })
        if (!userFromDb) {
            return
        }

        if (_.isEmpty(userFromDb.notifications)) {
            userFromDb.notifications = [
                {
                    type: 'BookingTrip',
                    send: false
                },
                {
                    type: 'CreateTrip',
                    send: false
                },
                {
                    type: 'CreateCompanion',
                    send: false
                },
                {
                    type: 'BuyTrip',
                    send: false
                },
            ]
        }
        for (let i = 0; i < userFromDb.notifications.length; i++) {
            if (userFromDb.notifications[i].type == event) {
                userFromDb.notifications[i].send = true
            }
        }

        let appStateFromDB = await AppStateModel.findOne({})

        if (!appStateFromDB.cabinetNotifications) {
            appStateFromDB.cabinetNotifications = [
                {
                    type: 'BookingTrip',
                    emails: []
                },
                {
                    type: 'CreateTrip',
                    emails: []
                },
                {
                    type: 'CreateCompanion',
                    emails: []
                },
                {
                    type: 'BuyTrip',
                    emails: []
                },
            ]
        }

        for (let t of appStateFromDB.cabinetNotifications) {
            if (t.type == event) {
                t.emails.push(email)
            }
        }

        appStateFromDB.markModified('cabinetNotifications')
        userFromDb.markModified('notifications')

        await appStateFromDB.save()
        return userFromDb.save()
    },
    async getNotifications({ event }) {
        let appStateFromDB = await AppStateModel.findOne({})
        for (let t of appStateFromDB.cabinetNotifications) {
            if (t.type == event) {
                return t.emails
            }
        }

        return []
    },
    async deleteNotifications({ event, email }) {
        let userFromDb = await UserModel.findOne({ email })

        for (let i = 0; i < userFromDb.notifications.length; i++) {
            if (userFromDb.notifications[i].type == event) {
                userFromDb.notifications[i].send = false
            }
        }

        userFromDb.markModified('notifications')
        await userFromDb.save()

        let appStateFromDB = await AppStateModel.findOne({})
        for (let t of appStateFromDB.cabinetNotifications) {
            if (t.type == event) {
                for (let i = 0; i < t.emails.length; i++) {
                    if (t.emails[i] == email) {
                        t.emails.splice(i, 1)
                    }
                }
            }
        }
        appStateFromDB.markModified('cabinetNotifications')

        return await appStateFromDB.save()
    }
}


const ExcursionService = require('../service/excursion-service.js')
const s3 = require('../yandex-cloud.js')
const logger = require('../logger.js');
const { sendMail } = require('../middleware/mailer')
const UserModel = require('../models/user-model.js')
const AppStateModel = require('../models/app-state-model.js')

module.exports = {
    async edit(req, res, next) {
        try {
            return res.json(await ExcursionService.edit(req.body))
        } catch (error) {
            next(error)
        }
    },
    async create(req, res, next) {

        try {
            let eventEmailsBook = await AppStateModel.findOne({ 'sendMailsTo.type': 'CreateExcurtion' }, { 'sendMailsTo.$': 1 })
            let emailsFromDbBook = eventEmailsBook.sendMailsTo[0].emails
            // req.body.email - это емейл пользователя
            sendMail(req.body.emailHtml, [req.body.email, ...emailsFromDbBook], 'Создана экскурсия')
            return res.json(await ExcursionService.create(req.body))
        } catch (error) {
            next(error)
        }
    },
    async uploadImages(req, res, next) {
        try {
            let _id = req.files[0]?.originalname.split('_')[0]

            let filenames = []
            let buffers = []
            for (let file of req.files) {
                buffers.push({ buffer: file.buffer, name: file.originalname, });    // Буфер загруженного файла
            }

            if (buffers.length) {
                let uploadResult = await s3.Upload(buffers, '/iwat/');

                for (let upl of uploadResult) {
                    filenames.push(upl.Location)
                }
            }
            if (filenames.length) {
                await ExcursionService.updateImagesUrls(_id, filenames)
                logger.info({ filenames, logType: 'excursion' }, 'images uploaded')
            }
            return res.json({ status: 'ok' })
        } catch (error) {
            next(error)
        }
    },
    async getById(req, res, next) {
        try {
            return res.json(await ExcursionService.getById(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async getUserExcursions(req, res, next) {
        try {
            return res.json(await ExcursionService.getByUserId(req.query.user_id))
        } catch (error) {
            next(error)
        }
    },
    /** 
     * dates are from datePlugin.excursions.concatDateAndTime
     * _id is excursion _id
    */
    async createDates(req, res, next) {
        try {
            return res.json(await ExcursionService.createDates(req.body))
        } catch (error) {
            next(error)
        }
    },
    async addTime(req, res, next) {
        try {
            return res.json(await ExcursionService.addTime(req.body))
        } catch (error) {
            next(error)
        }
    },
    async deleteTime(req, res, next) {
        try {
            return res.json(await ExcursionService.deleteTime(req.body))
        } catch (error) {
            next(error)
        }
    },
    async deleteDate(req, res, next) {
        try {
            return res.json(await ExcursionService.deleteDate(req.body))
        } catch (error) {
            next(error)
        }
    },

    async timeHasBills(req, res, next) {
        try {
            return res.json(await ExcursionService.timeHasBills(req.query.timeId))
        } catch (error) {
            next(error)
        }
    },


    async getAll(req, res, next) {
        try {
            return res.json(await ExcursionService.getAll(req.body))
        } catch (error) {
            next(error)
        }
    },
    async getExcursionById(req, res, next) {
        try {
            return res.json(await ExcursionService.getExcursionById(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async getWithBills(req, res, next) {
        try {
            return res.json(await ExcursionService.getWithBills(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async getWithBookings(req, res, next) {
        try {
            return res.json(await ExcursionService.getWithBookings(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    /**
     * req.body {
     *  excursionId
     *  timeId
     * }
     */
    async getTimeCustomers(req, res, next) {
        try {
            return res.json(await ExcursionService.getTimeCustomers(req.body))
        } catch (error) {
            next(error)
        }
    },
    async getTimeBookings(req, res, next) {
        try {
            return res.json(await ExcursionService.getTimeBookings(req.body))
        } catch (error) {
            next(error)
        }
    },
    async deleteById(req, res, next) {
        try {
            return res.json(await ExcursionService.deleteById(req.body._id));
        } catch (error) {
            next(error)
        }
    },


    async hideById(req, res, next) {
        try {
            await ExcursionService.hideById(req.body._id, req.body.isHide)
            return res.json('OK')
        } catch (error) {
            next(error)
        }
    },
    async comment(req, res, next) {
        try {
            await ExcursionService.comment(req.body._id, req.body.comment)
            return res.json('OK')
        } catch (error) {
            next(error)
        }
    },
    async buy(req, res, next) {
        try {

            let author = await UserModel.findById(req.body.fullinfo.author)
            sendMail(req.body.emailHtml, [author.email], 'Отправлена заявка')
            return res.json(await ExcursionService.buy(req.body))
        } catch (error) {
            next(error)
        }
    },
    async buyFromCabinet(req, res, next) {
        try {
            return res.json(await ExcursionService.buyFromCabinet(req.body))
        } catch (error) {
            next(error)
        }
    },
    async getExcursionsOnModeration(req, res, next) {
        try {
            return res.json(await ExcursionService.getExcursionsOnModeration())
        } catch (error) {
            next(error)
        }
    },
    async deleteExcursion(req, res, next) {
        try {
            return res.json(await ExcursionService.deleteExcursion(req.body._id))
        } catch (error) {
            next(error)
        }
    },
    async deleteBill(req, res, next) {
        try {

            return res.json(await ExcursionService.deleteBill(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async deleteBooking(req, res, next) {
        try {
            return res.json(await ExcursionService.deleteBooking(req.query._id))
        } catch (error) {
            next(error)
        }
    },

    async approvExcursion(req, res, next) {
        try {
            return res.json(await ExcursionService.approvExcursion(req.body._id))
        } catch (error) {
            next(error)
        }
    },
    /**
     * { time: timeId, excursion: excursionId, user: userStore.user._id, count }
     */
    async book(req, res, next) {
        try {
            let author = await UserModel.findById(req.body.author)
            sendMail(req.body.emailHtml, [author.email], 'Отправлена заявка')
            return res.json(await ExcursionService.book(req.body))
        } catch (error) {
            next(error)
        }
    },
    async bookFromCabinet(req, res, next) {
        try {
            return res.json(await ExcursionService.bookFromCabinet(req.body))
        } catch (error) {
            next(error)
        }
    },
    async order(req, res, next) {
        try {
            let author = await UserModel.findById(req.body.author)
            sendMail(req.body.emailHtml, [author.email], 'Отправлена заявка')
            return res.json(await ExcursionService.order(req.body))
        } catch (error) {
            next(error)
        }
    },
    async buyWithTinkoff(req, res, next) {
        try {
            let author = await UserModel.findById(req.body.bill.userInfo.author)
            sendMail(req.body.emailHtml, [author.email], 'Оплачена экскурсия через Т-банк')
            return res.json(await ExcursionService.buyWithTinkoff(req.body))
        } catch (error) {
            next(error)
        }
    }
}
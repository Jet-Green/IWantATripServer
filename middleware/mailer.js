const nodemailer = require('nodemailer')
const Handlebars = require('handlebars')

const _ = require('lodash')

const fs = require('fs')
const path = require('path')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'qbit.mailing@gmail.com',
        pass: 'tepsqmfkghmfqfyg'
    }
}, { from: 'Григорий Дзюин <qbit.mailing@gmail.com>' })

module.exports = {
    async sendMail(data, templateName, emails = [], type = 'multiple') {
        let emailTemplateSource = fs.readFileSync(path.join('templates', templateName)).toString()

        const template = Handlebars.compile(emailTemplateSource)

        const htmlToSend = template(data)

        let sendTo;
        switch (type) {
            case 'multiple':
                sendTo = _.uniq(['grishadzyin@gmail.com', 'grachevrv@yandex.ru', ...emails])
                break
            case 'single':
                sendTo = emails[0]
                break
        }


        let emailSubject;
        switch (templateName) {
            case 'reset-password.hbs':
                emailSubject = 'Восстановление пароля'
                break;
            case 'create-trip.hbs':
                emailSubject = 'Создана поездка'
                break;
        }


        let details = {
            from: 'qbit.mailing@gmail.com',
            to: sendTo,
            subject: emailSubject,
            html: htmlToSend,
        }

        let r = await transporter.sendMail(details)
    }
}
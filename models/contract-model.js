const { Schema, model } = require('mongoose')

const ContractSchema = new Schema({
    // Название магазина в СМС и на странице проверки 3DS на иностранном языке
    billingDescriptor: { $type: String },
    // Полное наименование организации
    fullName: { $type: String },
    // Сокращенное наименование организации
    name: { $type: String },

    inn: { $type: String },
    kpp: { $type: String },
    okved: { $type: String },
    ogrn: { $type: String },
    addresses: {
        $type: [
            {
                /*
                * Тип адреса организации:
                * legal - юридический
                * actual - фактический
                * post - почтовый
                */
                type: { $type: String, enum: ['legal', 'actual', 'post'] },
                // Почтовый индекс
                zip: { $type: String },
                // Трехбуквенный код страны по ISO
                country: { $type: String },
                // Город или населенный пункт
                city: { $type: String },
                // Улица, дом
                street: { $type: String },
            }
        ]
    },
    // Email, на который будет выполняться отправка реестров
    email: { $type: String },

    founders: {
        $type: Object,
        individuals: {
            $type: Array,
            firstName: { $type: String },
            // Фамилия
            lastName: { $type: String },
            // Гражданство
            citizenship: { $type: String },
            // Адрес регистрации/адрес проживания
            address: { $type: String }
        }
    },
    ceo: {
        $type: Object,
        firstName: { $type: String },
        lastName: { $type: String },
        // Отчество
        middleName: { $type: String },
        birthDate: { $type: String },
        phone: { $type: String },
        // Страна гражданства 3 символа по справочнику ISO 3166-1(Alpha-3)
        country: { $type: String },
    },

    siteUrl: { $type: String },
    /* 
    * Реквизиты партнера маркетплейса для
    * перечисления возмещения.
    * Объект обязателен, если Тинькофф
    * Банк выступает расчетным банком для
    * зарегистрированной точки
    **/
    bankAccount: {
        $type: Object,
        // Расчетный или казначейский счет
        account: { $type: String },
        bankName: { $type: String },
        bik: { $type: String },
        // Назначение платежа
        details: { $type: String },
        // Отчисления в пользу маркетплейса, % от суммы операции
        tax: { $type: String },
        /*
        * Отчисления в пользу маркетплейса 
        * фиксированной минимальной комиссии.
        * Сумма указывается в рублях, копейки
        * отделяются точкой. Прим.: 350.45
        **/
        // НЕОБЯЗАТЕЛЬНОЕ ПОЛЕ
        // taxFix: { $type: Number }
    },
    fiscalization: {
        $type: Object,
        /*
        * Название компании где нужно
        * фискализировать чеки.
        * Возможно только одно значение, на
        * данный момент доступно
        * только OrangeData
        * Не должен быть пустым, если задается
        * фискализация
        */
        company: { $type: String, default: 'OrangeData' },
    },

    userEmail: String
}, { typeKey: '$type' })

module.exports = model('Contract', ContractSchema);
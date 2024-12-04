const PartnerModel = require('../models/partner-model')

const tripFilter = {
  $and: [
    { isHidden: false, isModerated: true, rejected: false },
    { "parent": { $exists: false } },
    {
      $or: [
        {
          // всё, что относится к родителю
          $and: [
            { 'start': { $gte: Date.now() } },
          ]
        },
        // все, что относится к children
        {
          children: {
            $elemMatch: {
              start: { $gte: Date.now() },
            }
          }
        }
      ]
    }
  ]
};
module.exports = {
  async getAll(filter) {

    const limit = 20;
    const page = filter.page || 1;
    const skip = (page - 1) * limit;
    let query = filter.query

    const cursor = PartnerModel.find(query).skip(skip).limit(limit).cursor();

    const results = [];
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      results.push(doc);
    }

    return results
  },

  async create(partner) {
    return await PartnerModel.create(partner)
  },
  async delete(_id) {

    return await PartnerModel.findByIdAndDelete(_id)
  },

  async edit(partnerId, partner) {
  
    return await PartnerModel.findByIdAndUpdate(partnerId, partner)
  },

  async setpartnerImagesUrls(_id, filenames) {
    return await PartnerModel.findByIdAndUpdate(_id, { $set: { images: filenames } })
  },
  async pushpartnerImagesUrls(_id, filenames) {
    return await PartnerModel.findByIdAndUpdate(_id, { $push: { images: { $each: filenames } } })
  },

  async getById(_id) {
    return await PartnerModel.findById(_id)

  },
  async moderatepartner(_id) {
    return await PartnerModel.findByIdAndUpdate(_id, { isModerated: true, isRejected: false })
  },
  async rejectpartner(_id) {
    return await PartnerModel.findByIdAndUpdate(_id, { isRejected: true })
  },

  async hidepartner(_id) {
    const partner = await PartnerModel.findById(_id);
    if (!partner) {
      throw new Error('partner not found');
    }
    partner.isHidden = !partner.isHidden;
    // Сохраняем обновленный документ
    await partner.save();
    return partner;
  },
  async getForCreateTrip() {
    return await PartnerModel.find({}).limit(50).select({
      location: 1,
      name: 1,
    })
  },
  async updateWithTrips(partners, tripId) {
    // Удаляем tripId из всех документов
    await PartnerModel.updateMany(
      {},
      { $pull: { trips: tripId } }
    );

    // Добавляем tripId в указанные документы
    return await PartnerModel.updateMany(
      { _id: { $in: partners } },
      { $push: { trips: tripId } }
    );

  }
}
const TasksModel = require('../models/tasks-model.js')
const { ObjectId } = require('mongodb')
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

    const limit = 50;
    const page = filter.page || 1;
    const skip = (page - 1) * limit;
    let query = filter.query

    query = {
      ...query,
      // trip: {
      //   $elemMatch: {
      //     start: { $gte: Date.now() },
      //   },
      // },
    };
  
    const cursor = TasksModel.find(query).populate({
      path: 'trip',
      match: { start: { $gte: new Date() } }, // Фильтрация внутри связанной коллекции
      select: 'name',
    }).populate('partner').skip(skip).limit(limit).cursor();

    const results = [];
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      results.push(doc);
    }

    return results
  },


  async create(task) {

    return await TasksModel.create(task)
  },
  async delete(_id) {

    return await TasksModel.findByIdAndDelete(_id)
  },

  async edit(partnerId, partner) {

    return await TasksModel.findByIdAndUpdate(partnerId, partner)
  },



  async getById(_id) {
    return await TasksModel.findById(_id)

  },


}
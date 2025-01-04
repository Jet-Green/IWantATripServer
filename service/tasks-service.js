const TasksModel = require('../models/tasks-model.js')
const UserModel = require("../models/user-model.js");
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


    const cursor = TasksModel.find(query).populate('trip', { name: 1 }).populate('partner').skip(skip).limit(limit).cursor();

    const results = [];
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      results.push(doc);
    }

    return results
  },

  async getTasksAmount(query) {


    return TasksModel.find(query, { deadLine: 1 })
  },


  async create(task) {
    // Проверяем, есть ли менеджеры в задаче
    if (task.managers.length) {
      for (const managerId of task.managers) {
        // Ищем менеджера в базе данных
        const manager = await UserModel.findById(managerId);
        if (manager) {
          // Проверяем, есть ли у него роль "tasksManager"
          if (!manager.roles.includes("tasksManager")) {
            // Добавляем роль, если её нет
            manager.roles.push("tasksManager");
            await manager.save();
          }
        } else {
          console.warn(`Менеджер с ID ${managerId} не найден.`);
        }
      }
    }
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
  async createInteraction(interaction, taskId) {
    return await TasksModel.findByIdAndUpdate(taskId, { $push: { interactions: interaction } }, { new: true })
  }
}
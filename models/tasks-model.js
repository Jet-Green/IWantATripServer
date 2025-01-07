const mongoose = require('mongoose');

const tasksSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  tripInfo: {
    type: {
      end: Number,
      timezoneOffset: Number,
      name: String,
      _id: String,
    },
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  name: {
    type: String,
    required: true,
  },
  createdDate: { type: Number },
  deadLine: { type: Number },
  timezoneOffset: { type: Number },
  payAmount: { type: Number },
  payments: {
    type: [{
      date: Number,
      amount: Number,
      document: String
    }]
  },
  status: { type: String, default: 'open' },
  managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comment: { type: String },
  interactions: {
    type: [{
      date: Number, meetingType: String, result: String
    }]
  }


});

const Tasks = mongoose.model('Tasks', tasksSchema);

module.exports = Tasks;
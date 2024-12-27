const mongoose = require('mongoose');

const tasksSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  name: { 
    type: String,
    required: true,
  },
  createdDate: { type: Number },
  deadLine: { type: Number },
  timezoneOffset:{ type: Number },
  payAmount:{ type: Number },
  payments:{type: [{date:Number, payment:Number}]},
  status:{ type: String, default:'open' },
  managers:{type: [String]},
  comment:{ type: String },
  interactions:{type:[{
    date:Number, result:String
  }]}


});

const Tasks = mongoose.model('Tasks', tasksSchema);

module.exports = Tasks;
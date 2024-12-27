const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  location: {
    name: { type: String, default: '' },
    shortName: { type: String, default: '' },
    type: { type: String, default: 'Point' },
    coordinates: [Number],
  },
 
  phone: {
    type: String,
    default:'' 
  },
  // quill
  email: {
    type: String,
    default:'' 
  },
  contactPerson: {
    type: String,
    default:'' 
  },
  // quill
  category: {
    type: String,
    default:'' 
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdDate: { type: Number },
});

const Partner = mongoose.model('Partner', partnerSchema);

module.exports = Partner;
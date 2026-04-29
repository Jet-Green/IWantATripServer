const { Schema, model, models } = require('mongoose');

const PhotobankPhotoSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    objectKey: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'photobankphotos',
  }
);

PhotobankPhotoSchema.index({ createdAt: -1 });

module.exports = models.PhotobankPhoto || model('PhotobankPhoto', PhotobankPhotoSchema);

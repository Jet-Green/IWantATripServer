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
    /** как у мест: адрес из DaData + координаты [lon, lat] */
    location: {
      name: { type: String, default: '' },
      shortName: { type: String, default: '' },
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
    /** свободный текст «где снято», если без геолокации */
    placeNameText: {
      type: String,
      default: '',
      trim: true,
    },
    enterpriseName: {
      type: String,
      default: '',
      trim: true,
    },
    /** необязательное описание для поиска GET /photos/search?q= */
    caption: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['onModeration', 'published', 'rejected'],
      default: 'onModeration',
      index: true,
    },
    moderationMessage: {
      type: String,
      default: '',
      trim: true,
    },
    /** Сколько раз URL добавлен в места (фотобанк → create-place и т.п.) */
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'photobankphotos',
  }
);

PhotobankPhotoSchema.index({ createdAt: -1 });
PhotobankPhotoSchema.index({ status: 1, createdAt: -1 });

module.exports = models.PhotobankPhoto || model('PhotobankPhoto', PhotobankPhotoSchema);

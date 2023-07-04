const { Schema, model } = require('mongoose');

const TripCalcSchema = new Schema({
    name: String,
    max: Number,
    tourists: Number,
    individualCost: Array,
    groupCost: Array,
    transportCost: Array,
    tourePrice: Number,
    commissionState: Number,
    profitabilityPlan: Number,
    profitPlan: Number,
})

module.exports = model('TripCalc', TripCalcSchema);
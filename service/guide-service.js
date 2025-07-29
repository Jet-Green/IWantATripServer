const GuideElementModel = require('../models/guide-element-model')
const GuideModel = require('../models/guide-model')
const TaxiModel = require('../models/taxi-model')
const UserModel = require('../models/user-model')
const ExcursionModel = require('../models/excursion-model')

const ApiError = require("../exceptions/api-error.js");
const { get } = require('lodash');

module.exports = {
    async clear() {
        return GuideElementModel.deleteMany({ 'type': 'watch' })
    },
    async createElement(element) {
        return GuideElementModel.create(element)
    },
    async updateGuideElementImage(_id, filename) {
        const element = await GuideElementModel.findById(_id)
        element.image = filename
        return element.save()
    },

    async getAllElements(type) {
        return GuideElementModel.find({ 'type': type }).exec()
    },
      // Гиды
    async addGuide(guide) {
        try {
            const user = await UserModel.findOne({ email: guide.email }).select('_id').lean();
            const guideToCreate = {
                ...guide,
                user: user._id,
            };
            return GuideModel.create(guideToCreate)
        } catch (e) {
            throw ApiError.BadRequest("Не удалось создать гида")
        }

    },

    async deleteById(_id) {
        try {
          return  await GuideModel.deleteOne({ _id: _id })
        }
        catch {
            throw ApiError.BadRequest("Не удалось удалить гида")
        }
    },
    async getGuideByEmail(email) {
        return await GuideModel.findOne({ email: email })
    },
    async getGuideById(_id) {
        return await GuideModel.findOne({ _id: _id })
    },
    async getGuideExcursions(_id) {
        //contains guide id in guides
        return await ExcursionModel.find({ guides: _id })
    },
    async moderateGuide(_id) {
        return GuideModel.findByIdAndUpdate(_id, { isModerated: true, isRejected: false })
    },
    async hideGuide(_id, isHidden) {
        console.log(_id,isHidden)
        return GuideModel.findByIdAndUpdate(_id, {isHidden: !isHidden})
    },
    async sendGuideModerationMessage(_id, msg) {
        return GuideModel.findByIdAndUpdate(_id, { isModerated: false, moderationMessage: msg, isRejected: true })
    },
    async updateGuide(guide) {
        let id = guide._id;
        return await GuideModel.findByIdAndUpdate(id, guide)
    },
    async pushGuideImagesUrls(_id, filename) {
        return await GuideModel.findByIdAndUpdate(_id, { image: filename });
    },
    async getGuides(searchQuery, initialDbSkip) {
        const TARGET_DOC_COUNT = 20; // How many documents we want to fetch in total for this call
        const INTERNAL_BATCH_SIZE = 10; // How many docs to fetch in each *internal* DB query. Adjust for performance vs. DB load.

        let accumulatedGuides = [];
        let currentDbSkip = initialDbSkip; // Start skipping from the value provided by the client
        let isExhausted = false;

        // --- Database Query Construction --- (Same as before)
        let dbQuery = { $and: [{ isHidden: false }] };
        // Use a more robust check for non-empty string
        if (searchQuery.strQuery && searchQuery.strQuery.trim() !== "") {
            const regexQuery = { $regex: searchQuery.strQuery, $options: "i" };
            // console.log(regexQuery)
            dbQuery.$and.push(
                {
                    $or: [
                        { offer: regexQuery },
                        { location: regexQuery },
                        { name: regexQuery },
                        { surname: regexQuery }
                    ]
                }
            );
        }
        if ("isModerated" in searchQuery || "isRejected" in searchQuery) {
            dbQuery.$and.push({ isModerated: searchQuery.isModerated, isRejected: searchQuery.isRejected })
        }

        // --- Looping Fetch ---
        // Keep fetching until we have enough documents or the database runs out
        while (accumulatedGuides.length < TARGET_DOC_COUNT) {
            // Calculate how many more docs we need to reach the target
            const remainingNeeded = TARGET_DOC_COUNT - accumulatedGuides.length;
            // Determine the limit for the *next* internal DB query
            const limitForThisQuery = Math.min(INTERNAL_BATCH_SIZE, remainingNeeded);

            if (limitForThisQuery <= 0) { // Should not happen with current logic, but safe check
                break;
            }

            // console.log(`Fetching batch: skip=${currentDbSkip}, limit=${limitForThisQuery}`); // Optional: for debugging

            const fetchedBatch = await GuideModel.find(dbQuery)
                .skip(currentDbSkip)       // Skip documents based on previous internal fetches
                .limit(limitForThisQuery)  // Limit the number of results for *this specific batch*
                .lean();                   // Use lean() for performance

            // console.log(`Fetched ${fetchedBatch.length} documents in this batch.`); // Optional: for debugging

            if (fetchedBatch.length === 0) {
                // If a query returns zero results, the cursor is exhausted for this query.
                isExhausted = true;
                break; // Exit the loop, no more documents matching the query
            }

            // Add the newly fetched documents to our accumulated list
            accumulatedGuides = accumulatedGuides.concat(fetchedBatch);

            // Update the skip value for the next potential internal query or the final return value
            currentDbSkip += fetchedBatch.length;

            // If we received fewer documents than we asked for in this batch,
            // it means we've reached the end of the available documents matching the query.
            if (fetchedBatch.length < limitForThisQuery) {
                isExhausted = true;
                break; // Exit the loop, no more documents available
            }

            // If we have reached or exceeded the target count after this batch, we can stop.
            // (The check at the start of the while loop already handles this, but double-checking doesn't hurt)
            if (accumulatedGuides.length >= TARGET_DOC_COUNT) {
                break;
            }
        } // End of while loop

        // --- Return the accumulated data and pagination info ---
        return {
            data: accumulatedGuides,    // The guides retrieved in this call (up to 20)
            // The 'dbSkip' returned to the client should be the starting point for the *next* client request.
            // This is the total number of documents skipped *up to the end of this call*.
            dbSkip: currentDbSkip,
            // 'ended' is true if we stopped fetching *because* the database ran out of matching documents.
            ended: isExhausted,
        };
    },
    async getGuidesByUserId(body) {
        const limit = 20;
        const page = body.page || 1;
        const skip = (page - 1) * limit;

        return GuideModel.find(body.query).skip(skip).limit(limit)

    },
    setTaxi(taxi) {
        return TaxiModel.create(taxi)
    },
    async getGuidesAutocomplete(query) {
        //get only name and id in range of 5
        return GuideModel.find({ $and: [{ name: { $regex: query, $options: 'i' } }, { isModerated: true }] }, { name: 1, _id: 1 }).limit(5)
    },
    getLocalTaxi(location) {
        if (location == null) {
            return TaxiModel.find({})
        } else {
            return TaxiModel.find({ location: location })
        }
    },
    deleteTaxi(_id) {
        return TaxiModel.deleteOne({ _id: _id })
    },
}
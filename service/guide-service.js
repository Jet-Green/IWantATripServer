const GuideElementModel = require('../models/guide-element-model')
const GuideModel = require('../models/guide-model')
const TaxiModel = require('../models/taxi-model')

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
    async deleteOne(_id) {
        return GuideElementModel.deleteOne({ _id: _id })
    },
    async getAllElements(type) {
        return GuideElementModel.find({ 'type': type }).exec()
    },
    async addGuide(guide) {
        return await GuideModel.create(guide)
    },
    async getGuides(query) {
        if (query == null || query=='') {
            return GuideModel.find({})
        } else {
            return GuideModel.find({$or:[
                { offer: { $regex: query, $options: "i" }},
                { location: { $regex: query, $options: "i" }},
                { name: { $regex: query, $options: "i" }},
                { surname: { $regex: query, $options: "i" }}
            ]})
        }

// Assuming GuideModel is a Mongoose model

// async function getGuides(options) {
//   // --- Configuration ---
//   const { searchQuery, page = 1, limit = 20 } = options || {}; // Use an options object for clarity

//   // Ensure page and limit are valid numbers
//   const currentPage = parseInt(page, 10) || 1;
//   const effectiveLimit = parseInt(limit, 10) || 20;
//   if (currentPage < 1) {
//     console.warn("Requested page number is less than 1, defaulting to 1.");
//     currentPage = 1;
//   }
//    if (effectiveLimit < 1) {
//     console.warn("Requested limit is less than 1, defaulting to 20.");
//     effectiveLimit = 20;
//   }

//   // --- Initial Database Query Construction ---
//   let dbQuery = {};
//   if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim() !== '') {
//     // Use case-insensitive regex matching the original function's behavior
//     const regex = new RegExp(searchQuery.trim(), "i");
//     dbQuery = {
//       $or: [
//         { offer: regex },
//         { location: regex },
//         { name: regex },
//         { surname: regex },
//       ],
//     };
//   }
//   // If searchQuery is null, undefined, or empty string, dbQuery remains {} (find all guides)

//   // --- Wise Pagination Logic ---
//   let result = []; // Array to hold the final guides for the requested page
//   let dbPageToFetch = currentPage; // Start fetching from the DB page corresponding to the requested logical page
//   let dbSkip = (dbPageToFetch - 1) * effectiveLimit;
//   let keepFetching = true;

//   while (result.length < effectiveLimit && keepFetching) {
//     console.log(`Fetching DB page ${dbPageToFetch}, skip ${dbSkip}, limit ${effectiveLimit}`); // Optional: for debugging

//     // Fetch a batch from the database
//     const currentBatch = await GuideModel.find(dbQuery)
//       .skip(dbSkip)
//       .limit(effectiveLimit) // Fetch up to 'limit' potential candidates
//       .lean(); // Use .lean() for performance if you don't need Mongoose documents features

//     if (currentBatch.length === 0) {
//       // No more documents matching the query in the database
//       keepFetching = false;
//       console.log("No more matching documents found in DB."); // Optional: for debugging
//       break;
//     }

//     // --- Post-Fetch Filtering (Placeholder) ---
//     // In the original getGuides, all filtering was done via dbQuery.
//     // If you needed more complex filtering *after* fetching (like checking
//     // related data, complex conditions not easily expressible in Mongo query),
//     // you would apply it here to `currentBatch`.
//     // Example: const filteredBatch = currentBatch.filter(guide => guide.isActive && someComplexCheck(guide));
//     // For now, we assume the dbQuery is sufficient, so the filtered batch is the same as the fetched batch.
//     const filteredBatch = currentBatch;
//     // -------------------------------------------

//     // Add items from the filtered batch to our result array until we reach the desired limit
//     for (const guide of filteredBatch) {
//       if (result.length < effectiveLimit) {
//         result.push(guide);
//       } else {
//         // We have collected enough items for the requested page
//         break; // Exit the inner loop
//       }
//     }

//     console.log(`After processing batch, result size: ${result.length}`); // Optional: for debugging

//     // Prepare for the next database fetch iteration *if* we still need more items
//     dbPageToFetch += 1;
//     dbSkip = (dbPageToFetch - 1) * effectiveLimit;

//   } // End while loop

//   // Return the data for the *requested* page
//   return {
//     data: result,
//     page: currentPage, // The page number that was originally requested
//     limit: effectiveLimit,
//     // You could potentially add 'hasMore' boolean if keepFetching was true when result reached limit
//   };
// }





    },
    setTaxi(taxi) {
        return TaxiModel.create(taxi)
    },
    getLocalTaxi(location) {
        if (location == null) {
            return TaxiModel.find({})
        } else {
            return TaxiModel.find({ location: location})
        }
    },
    deleteTaxi(_id) {
        return TaxiModel.deleteOne({ _id: _id })
    },
}
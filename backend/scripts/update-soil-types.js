const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SoilType = require('../models/SoilType');

// Correct soil type values to store in DB (units: MPa for min/max)
// Values below are in kN/m²
const soilTypes = [
  { name: 'تربة رملية', nameEn: 'Sandy Soil', min: 100, max: 300 },
  { name: 'تربة طينية', nameEn: 'Clayey Soil', min: 50, max: 150 },
  { name: 'تربة طينية ناعمة', nameEn: 'Soft Clayey Soil', min: 25, max: 50 },
  { name: 'تربة طميية أو طينية مفككة', nameEn: 'Loose Silty or Clayey Soil', min: 25, max: 100 },
  { name: 'تربة طينية ممزوجة بالرمل', nameEn: 'Clayey Soil Mixed with Sand', min: 75, max: 200 },
  { name: 'تربة حصوية', nameEn: 'Gravelly Soil', min: 200, max: 400 },
  { name: 'تربة صخرية', nameEn: 'Rocky Soil', min: 350, max: 500 },
];

// Optional: synonyms to map old Arabic labels to the new ones to ensure updates
const arabicSynonyms = {
  'تربة طينية رخوة': 'تربة طينية ناعمة',
  'تربة طميية أو طينية رخوة': 'تربة طميية أو طيني�� مفككة',
};

async function upsertSoilTypes() {
  if (!process.env.MONGO_URI) {
    console.error('❌ Missing MONGO_URI in environment');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let updated = 0;
    let created = 0;

    for (const s of soilTypes) {
      // Try to find by English name first, then by Arabic name, and also by synonyms
      const synonym = Object.keys(arabicSynonyms).find(k => arabicSynonyms[k] === s.name);

      const existing = await SoilType.findOne({
        $or: [
          { nameEn: s.nameEn },
          { name: s.name },
          ...(synonym ? [{ name: synonym }] : []),
        ],
      });

      const payload = {
        name: s.name,
        nameEn: s.nameEn,
        // Store as kN/m² directly
        bearingCapacityMin: s.min,
        bearingCapacityMax: s.max,
      };

      if (existing) {
        await SoilType.updateOne({ _id: existing._id }, { $set: payload });
        console.log(`🔁 Updated soil type: ${s.name} (${s.nameEn})`);
        updated += 1;
      } else {
        await SoilType.create(payload);
        console.log(`🆕 Created soil type: ${s.name} (${s.nameEn})`);
        created += 1;
      }
    }

    // For any documents that use old Arabic synonyms, normalize their name to the new canonical name
    for (const [oldName, newName] of Object.entries(arabicSynonyms)) {
      const doc = await SoilType.findOne({ name: oldName });
      if (doc) {
        const canonical = soilTypes.find(x => x.name === newName);
        if (canonical) {
          await SoilType.updateOne(
            { _id: doc._id },
            {
              $set: {
                name: canonical.name,
                nameEn: canonical.nameEn,
                bearingCapacityMin: canonical.min,
                bearingCapacityMax: canonical.max,
              },
            }
          );
          console.log(`♻️  Normalized old label '${oldName}' -> '${newName}'`);
        }
      }
    }

    console.log(`\n✅ Done. Updated: ${updated}, Created: ${created}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating soil types:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

upsertSoilTypes();

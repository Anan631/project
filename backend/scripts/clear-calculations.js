const mongoose = require('mongoose');
require('dotenv').config();

const Project = require('../models/Project');
const ConcreteCalculation = require('../models/ConcreteCalculation');

async function main() {
  const forceYes = process.argv.includes('--yes');

  if (!process.env.MONGO_URI) {
    console.error('❌ Missing MONGO_URI in environment (.env)');
    process.exit(1);
  }

  if (!forceYes) {
    console.error('❌ Refusing to run without explicit confirmation.');
    console.error('Run: node scripts/clear-calculations.js --yes');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const projectsWithConcreteCalc = await Project.countDocuments({ concreteCalculations: { $exists: true } });
    const totalProjects = await Project.countDocuments({});
    const totalConcreteCalculations = await ConcreteCalculation.countDocuments({});

    console.log('--- Current counts ---');
    console.log('Projects total:', totalProjects);
    console.log('Projects with concreteCalculations:', projectsWithConcreteCalc);
    console.log('ConcreteCalculation documents:', totalConcreteCalculations);

    const deleteResult = await ConcreteCalculation.deleteMany({});
    const updateResult = await Project.updateMany(
      {},
      {
        $unset: {
          concreteCalculations: 1,
        },
      }
    );

    console.log('--- Delete/Update results ---');
    console.log('ConcreteCalculation deleted:', deleteResult.deletedCount);
    console.log('Projects modified:', updateResult.modifiedCount);

    const projectsWithConcreteCalcAfter = await Project.countDocuments({ concreteCalculations: { $exists: true } });
    const totalConcreteCalculationsAfter = await ConcreteCalculation.countDocuments({});

    console.log('--- After ---');
    console.log('Projects with concreteCalculations:', projectsWithConcreteCalcAfter);
    console.log('ConcreteCalculation documents:', totalConcreteCalculationsAfter);

    console.log('✅ Done.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});

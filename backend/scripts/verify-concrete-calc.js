const mongoose = require('mongoose');
const ConcreteCalculation = require('../models/ConcreteCalculation');
const Project = require('../models/Project');
require('dotenv').config();

async function verify() {
    if (!process.env.MONGO_URI) {
        console.error('❌ Missing MONGO_URI');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to DB');

        // 1. Create a Dummy Project
        console.log('Creating test project...');
        const project = await Project.create({
            name: 'Test Project - Concrete Calc',
            engineer: 'Test Engineer',
            status: 'مخطط له',
            projectStatus: 'ACTIVE',
            description: 'Temporary project for verification'
        });
        console.log('✅ Project created:', project._id);

        // 2. Create Calculation Data
        const calcData = {
            project: project._id,
            blindingSlabLength: 10,
            blindingSlabWidth: 10,
            blindingSlabHeight: 0.1,
            numberOfFloors: 2,
            slabArea: 100,
            soilType: 'sand',
            buildingType: 'residential',
            footingHeight: 0.5,
            numberOfFootings: 5,
            footingShape: 'rectangular',
            areFootingsSimilar: true,

            // Results
            blindingSlabConcreteVolume: 10, // 10*10*0.1
            deadLoad: 1.5,
            liveLoad: 2.0,
            totalLoads: 3.5,
            soilBearingCapacity: 200,
            totalLoadOnFooting: 700, // 100*2*3.5
            footingArea: 3.5, // 700/200
            calculatedFootingLength: 2, // approx
            calculatedFootingWidth: 1.7, // approx

            actualFootingLength: 9.8,
            actualFootingWidth: 9.8,
            singleFootingVolume: 48,

            totalConcreteVolume: 240
        };

        // 3. Save Calculation
        console.log('Saving calculations...');
        const calc = new ConcreteCalculation(calcData);
        await calc.save();
        console.log('✅ Calculation Saved successfully:', calc._id);

        // 4. Verify Read
        const fetched = await ConcreteCalculation.findById(calc._id);
        if (fetched && fetched.project.toString() === project._id.toString()) {
            console.log('✅ Verified Read: Data matches.');
        } else {
            console.error('❌ Verification Read Failed');
        }

        // Cleanup
        console.log('Cleaning up...');
        await ConcreteCalculation.deleteOne({ _id: calc._id });
        await Project.deleteOne({ _id: project._id });
        console.log('✅ Cleanup done');

    } catch (e) {
        console.error('❌ Verification Failed:', e);
    } finally {
        await mongoose.disconnect();
    }
}

verify();

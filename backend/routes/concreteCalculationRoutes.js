const express = require('express');
const router = express.Router();
const ConcreteCalculation = require('../models/ConcreteCalculation');
const Project = require('../models/Project');
const ConcreteCalculationService = require('../services/concreteCalculationService');

// POST /api/concrete-calculation/execute
// Execute the algorithm (without saving) and return results
router.post('/execute', async (req, res) => {
    try {
        const input = req.body || {};
        const result = await ConcreteCalculationService.executeAlgorithm({
            cleaningPourLength: input.blindingSlabLength || input.blindingLength,
            cleaningPourWidth: input.blindingSlabWidth || input.blindingWidth,
            cleaningPourHeight: input.blindingSlabHeight || input.blindingHeight,
            numberOfFloors: input.numberOfFloors || input.floors,
            slabArea: input.slabArea,
            soilType: input.soilType,
            buildingType: input.buildingType,
            foundationHeight: input.footingHeight,
            numberOfFoundations: input.numberOfFootings,
            foundationShape: input.footingShape,
            areFoundationsSimilar: input.areFootingsSimilar,
            foundationDetails: input.individualFootings?.map(f => ({ height: f.height })) || [],
        });
        return res.json(result);
    } catch (error) {
        console.error('Error executing concrete calculation:', error);
        res.status(500).json({ message: 'Server error executing calculation', error: error.message });
    }
});

// POST /api/concrete-calculation/execute-and-save
// Execute the algorithm and persist results to DB
router.post('/execute-and-save', async (req, res) => {
    try {
        const input = req.body || {};
        if (!input.project) {
            return res.status(400).json({ message: 'project field is required' });
        }
        const project = await Project.findById(input.project);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const execResult = await ConcreteCalculationService.executeAlgorithm({
            cleaningPourLength: input.blindingSlabLength || input.blindingLength,
            cleaningPourWidth: input.blindingSlabWidth || input.blindingWidth,
            cleaningPourHeight: input.blindingSlabHeight || input.blindingHeight,
            numberOfFloors: input.numberOfFloors || input.floors,
            slabArea: input.slabArea,
            soilType: input.soilType,
            buildingType: input.buildingType,
            foundationHeight: input.footingHeight,
            numberOfFoundations: input.numberOfFootings,
            foundationShape: input.footingShape,
            areFoundationsSimilar: input.areFootingsSimilar,
            foundationDetails: input.individualFootings?.map(f => ({ height: f.height })) || [],
        });

        if (!execResult.success) {
            return res.status(400).json(execResult);
        }

        // Map results to schema fields
        const calcPayload = {
            project: project._id,
            blindingSlabLength: input.blindingSlabLength || input.blindingLength,
            blindingSlabWidth: input.blindingSlabWidth || input.blindingWidth,
            blindingSlabHeight: input.blindingSlabHeight || input.blindingHeight,
            numberOfFloors: input.numberOfFloors || input.floors,
            slabArea: input.slabArea,
            soilType: input.soilType,
            buildingType: input.buildingType,
            footingHeight: input.footingHeight,
            numberOfFootings: input.numberOfFootings,
            footingShape: input.footingShape,
            areFootingsSimilar: input.areFootingsSimilar,
            
            blindingSlabConcreteVolume: execResult.calculations.cleaningPourVolume,
            deadLoad: execResult.calculations.loads.deadLoad,
            liveLoad: execResult.calculations.loads.liveLoad,
            totalLoads: execResult.calculations.loads.totalLoad,
            soilBearingCapacity: execResult.calculations.soil.bearingCapacity,
            totalLoadOnFooting: execResult.calculations.building.totalLoad,
            footingArea: execResult.calculations.building.foundationArea,
            calculatedFootingLength: execResult.calculations.building.foundationDimensions.length,
            calculatedFootingWidth: execResult.calculations.building.foundationDimensions.width,
            
            totalConcreteVolume: execResult.calculations.foundations.totalVolume,
            individualFootings: (input.areFootingsSimilar ? [] : (input.individualFootings || [])).map((f, i) => ({
                footingId: i + 1,
                height: f.height,
                volume: ( (input.blindingSlabLength || input.blindingLength) - 0.20 ) * ( (input.blindingSlabWidth || input.blindingWidth) - 0.20 ) * f.height
            }))
        };

        const newCalculation = new ConcreteCalculation(calcPayload);
        const savedCalculation = await newCalculation.save();

        project.concreteCalculations = project.concreteCalculations || {};
        project.concreteCalculations.foundation = {
            foundationLength: calcPayload.blindingSlabLength,
            foundationWidth: calcPayload.blindingSlabWidth,
            foundationHeight: calcPayload.blindingSlabHeight,
            numberOfFloors: calcPayload.numberOfFloors,
            slabArea: calcPayload.slabArea,
            soilType: calcPayload.soilType,
            buildingType: calcPayload.buildingType,
            baseHeight: calcPayload.footingHeight,

            foundationVolume: calcPayload.blindingSlabConcreteVolume,
            baseArea: calcPayload.footingArea,
            baseLength: calcPayload.calculatedFootingLength,
            baseWidth: calcPayload.calculatedFootingWidth,
            baseShape: calcPayload.footingShape,
            allBasesSimilar: calcPayload.areFootingsSimilar,
            totalNumberOfBases: calcPayload.numberOfFootings,

            foundationsVolume: calcPayload.totalConcreteVolume,

            calculatedAt: new Date()
        };
        await project.save();

        return res.status(201).json({ ok: true, calculation: savedCalculation, result: execResult });
    } catch (error) {
        console.error('Error executing & saving concrete calculation:', error);
        res.status(500).json({ message: 'Server error executing & saving calculation', error: error.message });
    }
});

// POST /api/concrete-calculation/save
// Save calculation results
router.post('/save', async (req, res) => {
    try {
        const calculationData = req.body;

        // Validate project existence
        const project = await Project.findById(calculationData.project);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const newCalculation = new ConcreteCalculation(calculationData);
        const savedCalculation = await newCalculation.save();

        project.concreteCalculations = project.concreteCalculations || {};
        project.concreteCalculations.foundation = {
            foundationLength: calculationData.blindingSlabLength,
            foundationWidth: calculationData.blindingSlabWidth,
            foundationHeight: calculationData.blindingSlabHeight,
            numberOfFloors: calculationData.numberOfFloors,
            slabArea: calculationData.slabArea,
            soilType: calculationData.soilType,
            buildingType: calculationData.buildingType,
            baseHeight: calculationData.footingHeight,

            foundationVolume: calculationData.blindingSlabConcreteVolume,
            baseArea: calculationData.footingArea,
            baseLength: calculationData.footingLength || calculationData.calculatedFootingLength, // Handle different field names
            baseWidth: calculationData.footingWidth || calculationData.calculatedFootingWidth,
            baseShape: calculationData.footingShape,
            allBasesSimilar: calculationData.areFootingsSimilar,
            totalNumberOfBases: calculationData.numberOfFootings,

            foundationsVolume: calculationData.totalConcreteVolume || calculationData.footingsConcreteVolume,

            calculatedAt: new Date()
        };

        await project.save();

        res.status(201).json(savedCalculation);
    } catch (error) {
        console.error('Error saving concrete calculation:', error);
        res.status(500).json({ message: 'Server error saving calculation', error: error.message });
    }
});

// GET /api/concrete-calculation/project/:projectId
// Get calculations for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const calculations = await ConcreteCalculation.find({ project: req.params.projectId }).sort({ createdAt: -1 });
        res.json(calculations);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching calculations', error: error.message });
    }
});

module.exports = router;

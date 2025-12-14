/**
 * Concrete Calculator Utilities
 * Implements the specific algorithm flow for calculating concrete quantities.
 */

// Phase 3: Load Determination
// Algorithm: Dependent on Building Type.
// "If common value exists -> choose it, else -> choose min."
// We will define some standard values here. 
// These should ideally be in a database, but for this task we hardcode the algorithm tables.
const BUILDING_LOADS: Record<string, { dead: number, live: number, common?: boolean }> = {
    'residential': { dead: 1.5, live: 2.0, common: true }, // Example values (kN/m2 or ton/m2 depending on unit. Assuming ton/m2 for concrete calc context effectively)
    'commercial': { dead: 2.0, live: 4.0, common: true },
    'industrial': { dead: 2.5, live: 5.0 },
    'other': { dead: 1.5, live: 1.5 } // fallback
};

// Phase 4: Soil Bearing Capacity
// Algorithm: Dependent on Soil Type.
const SOIL_CAPACITY: Record<string, number> = {
    'rock': 400, // kN/m2 or kPa
    'gravel': 300,
    'sand': 200,
    'clay': 150,
    'silt': 100,
    'other': 150
};

export interface CalculatorInputs {
    blindingLength: number;
    blindingWidth: number;
    blindingHeight: number;
    floors: number;
    slabArea: number;
    soilType: string;
    buildingType: string;
    footingHeight: number;
    footingShape: 'square' | 'rectangular';
}

export interface CalculatorResults {
    blindingVolume: number;
    deadLoad: number;
    liveLoad: number;
    totalLoads: number;
    soilCapacity: number;
    totalLoadOnFooting: number;
    footingArea: number;
    calculatedFootingLength: number;
    calculatedFootingWidth: number;
}

export const calculatePhase1To6 = (inputs: CalculatorInputs): CalculatorResults => {
    // Phase 2: Lean Concrete
    const blindingVolume = inputs.blindingLength * inputs.blindingWidth * inputs.blindingHeight;

    // Phase 3: Loads
    const loads = BUILDING_LOADS[inputs.buildingType] || BUILDING_LOADS['other'];
    // "If common value exists -> choose it" (Implicitly handled by our map having preferred values)
    // "If not -> choose min" (In a real range scenario we'd take min, here we take fixed)

    // Phase 4: Soil
    const soilCapacity = SOIL_CAPACITY[inputs.soilType] || SOIL_CAPACITY['other'];

    // Phase 5: Base Area
    const totalLoads = loads.dead + loads.live;

    // Algorithm: Total Load = SlabArea * Floors * TotalLoads
    // NOTE: This formula implies TotalLoads is per m2 (area load).
    const totalLoadOnFooting = inputs.slabArea * inputs.floors * totalLoads;

    // Base Area = Total Load / Soil Capacity
    // NOTE: Unit consistency is key here. If Loads are ton/m2 -> Result is m2. If kN/m2 -> Result m2.
    // We assume consistent units (e.g. TONS). 
    // If Result is < 0, it's an error in inputs, but math holds.
    const footingArea = totalLoadOnFooting / soilCapacity;

    // Phase 6: Shape & Dimensions
    let width = 0;
    let length = 0;

    if (inputs.footingShape === 'rectangular') {
        // W = sqrt(Area / 1.2)
        width = Math.sqrt(footingArea / 1.2);
        // L = W * 1.2
        length = width * 1.2;
    } else {
        // Square
        // L = sqrt(Area)
        length = Math.sqrt(footingArea);
        width = length;
    }

    return {
        blindingVolume,
        deadLoad: loads.dead,
        liveLoad: loads.live,
        totalLoads,
        soilCapacity,
        totalLoadOnFooting,
        footingArea,
        calculatedFootingLength: length,
        calculatedFootingWidth: width
    };
};

export interface FootingVolumeInputs {
    blindingLength: number;
    blindingWidth: number;
    numberOfFootings: number;
    areSimilar: boolean;
    // For similar:
    footingHeight?: number; // Should match initial input, but algorithm allows re-use
    // For different:
    individualHeights?: number[];
}

export const calculatePhase8 = (
    baseInputs: CalculatorInputs,
    resultsP1to6: CalculatorResults,
    footingInputs: FootingVolumeInputs
): { totalVolume: number, individualVolumes?: number[] } => {

    // Algorithm:
    // Actual Length = Blinding Length - 0.20
    // Actual Width = Blinding Width - 0.20
    // Use THESE dimensions for volume, NOT the calculated dimensions from Phase 6 (Load based).
    // This implies the blinding slab was sized for the footing, or vice versa. 
    // The prompt says: "Calculate Actual L = Blinding L - 0.20". 

    const actualLength = baseInputs.blindingLength - 0.20;
    const actualWidth = baseInputs.blindingWidth - 0.20;
    const area = actualLength * actualWidth;

    if (footingInputs.areSimilar) {
        // 30.3 Vol = Actual L * Actual W * Height
        const volOne = area * (baseInputs.footingHeight || 0); // Use the global height
        const total = volOne * footingInputs.numberOfFootings;
        return { totalVolume: total };
    } else {
        // 31. Different
        let sum = 0;
        const individualVolumes = [];
        if (footingInputs.individualHeights) {
            for (const h of footingInputs.individualHeights) {
                const vol = area * h; // Note: Dimension is constant (Blinding - 0.20), only Height varies per algorithm text?
                // Text: "Calculate Vol = Actual L * Actual W * Height OF THIS BASE"
                // And Actual L/W are derived from Blinding L/W.
                // So yes, only height varies in this specific algorithm flow.
                sum += vol;
                individualVolumes.push(vol);
            }
        }
        return { totalVolume: sum, individualVolumes };
    }
};

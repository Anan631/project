/**
 * خدمة حساب كميات الخرسانة لصبة النظاف والقواعس
 * Service for calculating concrete quantities for cleaning pour and foundations
 */

const SoilType = require('../models/SoilType');
const LiveLoad = require('../models/LiveLoad');
const DeadLoad = require('../models/DeadLoad');
const mongoose = require('mongoose');

class ConcreteCalculationService {
  /**
   * المرحلة الأولى: التحقق من البيانات المدخلة
   * Phase 1: Validate input data
   */
  static validateInputData(data) {
    const {
      cleaningPourLength,
      cleaningPourWidth,
      cleaningPourHeight,
      numberOfFloors,
      slabArea,
      soilType,
      buildingType,
      foundationHeight,
      numberOfFoundations,
      foundationShape,
      areFoundationsSimilar,
      foundationDetails,
    } = data;

    const errors = [];

    // التحقق من القيم المطلوبة
    if (!cleaningPourLength || cleaningPourLength <= 0) {
      errors.push('طول صبة النظاف يجب أن يكون أكبر من صفر');
    }
    if (!cleaningPourWidth || cleaningPourWidth <= 0) {
      errors.push('عرض صبة النظاف يجب أن يكون أكبر من صفر');
    }
    if (!cleaningPourHeight || cleaningPourHeight <= 0) {
      errors.push('ارتفاع صبة النظاف يجب أن يكون أكبر من صفر');
    }
    if (!numberOfFloors || numberOfFloors <= 0) {
      errors.push('عدد الطوابق يجب أن يكون أكبر من صفر');
    }
    if (!slabArea || slabArea <= 0) {
      errors.push('مساحة البلاطة يجب أن تكون أكبر من صفر');
    }
    if (!soilType) {
      errors.push('نوع التربة مطلوب');
    }
    if (!buildingType) {
      errors.push('نوع المبنى مطلوب');
    }

    // التحقق من ارتفاع القاعدة (0.40 - 0.80 متر)
    if (!foundationHeight || foundationHeight < 0.40 || foundationHeight > 0.80) {
      errors.push('ارتفاع القاعدة يجب أن يكون بين 0.40 و 0.80 متر');
    }

    if (!numberOfFoundations || numberOfFoundations <= 0) {
      errors.push('عدد القواعد يجب أن يكون أكبر من صفر');
    }

    if (!foundationShape || !['square', 'rectangle', 'rectangular'].includes(foundationShape)) {
      errors.push('شكل القاعدة يجب أن يكون square أو rectangular');
    }

    if (areFoundationsSimilar === undefined) {
      errors.push('يجب تحديد ما إذا كانت القواعد متشابهة أو مختلفة');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * المرحلة الثانية: حساب صبة النظاف
   * Phase 2: Calculate cleaning pour volume
   */
  static calculateCleaningPourVolume(length, width, height) {
    return length * width * height;
  }

  /**
   * المرحلة الثالثة: تحديد الأحمال
   * Phase 3: Determine loads (dead load and live load)
   */
  static async determineLioads(buildingType) {
    try {
      // الحصول على الحمل الحي
      const liveLoad = await LiveLoad.findOne({ buildingType });
      if (!liveLoad) {
        throw new Error(`لم يتم العثور على بيانات الحمل الحي للمبنى: ${buildingType}`);
      }

      // اختيار الحمل الحي (القيمة الشائعة إن وُجدت، وإلا الأدنى)
      const selectedLiveLoad = liveLoad.commonValue || liveLoad.minValue;

      // الحصول على الحمل الميت: استخدم فقط "إجمالي الحمل الميت"
      const totalDeadLoadDoc = await DeadLoad.findOne({ buildingType, elementType: 'إجمالي الحمل الميت' });
      let selectedDeadLoad;
      if (totalDeadLoadDoc) {
        selectedDeadLoad = totalDeadLoadDoc.commonValue || totalDeadLoadDoc.minValue;
      } else {
        //Fallback آمن: إذا لم تتوفر وثيقة إجمالي الحمل الميت، خذ أدنى مجموع ممكن لتفادي التضخيم
        const deadLoads = await DeadLoad.find({ buildingType });
        if (!deadLoads || deadLoads.length === 0) {
          throw new Error(`لم يتم العثور على بيانات الحمل الميت للمبنى: ${buildingType}`);
        }
        selectedDeadLoad = deadLoads.reduce((acc, d) => acc + (d.commonValue || d.minValue || 0), 0);
      }

      return {
        deadLoad: selectedDeadLoad,
        liveLoad: selectedLiveLoad,
        totalLoad: selectedDeadLoad + selectedLiveLoad,
      };
    } catch (error) {
      throw new Error(`خطأ في تحديد الأحمال: ${error.message}`);
    }
  }

  /**
   * المرحلة الرابعة: تحديد قدرة تحمل التربة
   * Phase 4: Determine soil bearing capacity
   */
  static async determineSoilBearingCapacity(soilTypeId) {
    try {
      const soil = mongoose.Types.ObjectId.isValid(String(soilTypeId))
        ? await SoilType.findById(soilTypeId)
        : await SoilType.findOne({ $or: [{ name: soilTypeId }, { nameEn: soilTypeId }] });
      if (!soil) {
        throw new Error('لم يتم العثور على نوع التربة المحدد');
      }

      // Auto-detect unit: if average looks like MPa (<= 10), convert to kN/m², else assume kN/m²
      let avg = (soil.bearingCapacityMin + soil.bearingCapacityMax) / 2;
      const looksLikeMPa = avg <= 10; // typical MPa ranges ~0.025 - 0.50
      const bearingCapacity = looksLikeMPa ? avg * 1000 : avg; // final in kN/m²

      return {
        soilName: soil.name,
        bearingCapacityMin: looksLikeMPa ? soil.bearingCapacityMin * 1000 : soil.bearingCapacityMin,
        bearingCapacityMax: looksLikeMPa ? soil.bearingCapacityMax * 1000 : soil.bearingCapacityMax,
        bearingCapacity, // kN/m²
      };
    } catch (error) {
      throw new Error(`خطأ في تحديد قدرة تحمل التربة: ${error.message}`);
    }
  }

  /**
   * المرحلة الخامسة: حساب مساحة القاعدة
   * Phase 5: Calculate foundation area
   */
  static calculateFoundationArea(slabArea, numberOfFloors, totalLoad, bearingCapacity) {
    // حساب الحمل الكلي
    const totalBuildingLoad = slabArea * numberOfFloors * totalLoad; // kN (per m² * m²)

    // حساب مساحة القاعدة مباشرة لأن bearingCapacity بوحدة kN/m²
    const foundationArea = totalBuildingLoad / bearingCapacity;

    return {
      totalBuildingLoad,
      foundationArea,
    };
  }

  /**
   * المرحلة السادسة: تحديد أبعاد القاعدة
   * Phase 6: Determine foundation dimensions
   */
  static calculateFoundationDimensions(foundationArea, shape) {
    let length, width;

    if (shape === 'rectangle' || shape === 'rectangular') {
      // للقاعدة المستطيلة
      width = Math.sqrt(foundationArea / 1.2);
      length = width * 1.2;
    } else {
      // للقاعدة المربعة
      length = Math.sqrt(foundationArea);
      width = length;
    }

    return {
      length: Math.round(length * 100) / 100, // تقريب إلى منزلتين عشريتين
      width: Math.round(width * 100) / 100,
      area: length * width,
    };
  }

  /**
   * المرحلة الثامنة: حساب كمية الخرسانة في القواعس
   * Phase 8: Calculate foundations concrete volume
   */
  static calculateFoundationsVolume(
    cleaningPourLength,
    cleaningPourWidth,
    foundationHeight,
    numberOfFoundations,
    areFoundationsSimilar,
    foundationDetails = []
  ) {
    const effectiveLength = cleaningPourLength - 0.2;
    const effectiveWidth = cleaningPourWidth - 0.2;

    if (areFoundationsSimilar) {
      // القواعس متشابهة
      const singleFoundationVolume =
        effectiveLength * effectiveWidth * foundationHeight;
      const totalVolume = singleFoundationVolume * numberOfFoundations;

      return {
        singleFoundationVolume,
        totalVolume,
        breakdown: [
          {
            index: 1,
            volume: singleFoundationVolume,
            count: numberOfFoundations,
            height: foundationHeight,
          },
        ],
      };
    } else {
      // القواعس مختلفة
      let totalVolume = 0;
      const breakdown = [];

      for (let i = 0; i < foundationDetails.length; i++) {
        const detail = foundationDetails[i];
        const volume =
          effectiveLength * effectiveWidth * (detail.height || foundationHeight);
        totalVolume += volume;

        breakdown.push({
          index: i + 1,
          length: effectiveLength,
          width: effectiveWidth,
          height: detail.height || foundationHeight,
          volume,
        });
      }

      return {
        totalVolume,
        breakdown,
      };
    }
  }

  /**
   * تنفيذ الخوارزمية الكاملة
   * Execute the complete algorithm
   */
  static async executeAlgorithm(inputData) {
    try {
      // المرحلة الأولى: التحقق من البيانات
      const validation = this.validateInputData(inputData);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      const {
        cleaningPourLength,
        cleaningPourWidth,
        cleaningPourHeight,
        numberOfFloors,
        slabArea,
        soilType,
        buildingType,
        foundationHeight,
        numberOfFoundations,
        foundationShape,
        areFoundationsSimilar,
        foundationDetails,
      } = inputData;

      // المرحلة الثانية: حساب صبة النظاف
      const cleaningPourVolume = this.calculateCleaningPourVolume(
        cleaningPourLength,
        cleaningPourWidth,
        cleaningPourHeight
      );

      // المرحلة الثالثة والرابعة: تحديد الأحمال وقدرة تحمل التربة
      const loads = await this.determineLioads(buildingType);
      const soilData = await this.determineSoilBearingCapacity(soilType);

      // المرحلة الخامسة: حساب مساحة القاعدة
      const areaData = this.calculateFoundationArea(
        slabArea,
        numberOfFloors,
        loads.totalLoad,
        soilData.bearingCapacity
      );

      // المرحلة السادسة: تحديد أبعاد القاعدة
      const dimensionsData = this.calculateFoundationDimensions(
        areaData.foundationArea,
        foundationShape
      );

      // المرحلة الثامنة: حساب كمية الخرسانة في القواعس
      const foundationsVolumeData = this.calculateFoundationsVolume(
        cleaningPourLength,
        cleaningPourWidth,
        foundationHeight,
        numberOfFoundations,
        areFoundationsSimilar,
        foundationDetails
      );

      // المرحلة التاسعة: تجميع النتائج
      const results = {
        success: true,
        inputs: {
          cleaningPourLength,
          cleaningPourWidth,
          cleaningPourHeight,
          numberOfFloors,
          slabArea,
          buildingType,
          foundationHeight,
          numberOfFoundations,
          foundationShape,
          areFoundationsSimilar,
        },
        calculations: {
          cleaningPourVolume: Math.round(cleaningPourVolume * 1000) / 1000,
          loads: {
            deadLoad: loads.deadLoad,
            liveLoad: loads.liveLoad,
            totalLoad: loads.totalLoad,
          },
          soil: {
            name: soilData.soilName,
            bearingCapacity: soilData.bearingCapacity,
            bearingCapacityMin: soilData.bearingCapacityMin,
            bearingCapacityMax: soilData.bearingCapacityMax,
          },
          building: {
            totalLoad: Math.round(areaData.totalBuildingLoad * 1000) / 1000,
            foundationArea: Math.round(areaData.foundationArea * 100) / 100,
            foundationDimensions: {
              length: dimensionsData.length,
              width: dimensionsData.width,
              actualArea: Math.round(dimensionsData.area * 100) / 100,
            },
          },
          foundations: {
            totalVolume: Math.round(foundationsVolumeData.totalVolume * 1000) / 1000,
            breakdown: foundationsVolumeData.breakdown,
          },
        },
        summary: {
          cleaningPourVolume: Math.round(cleaningPourVolume * 1000) / 1000,
          foundationArea: Math.round(areaData.foundationArea * 100) / 100,
          foundationDimensions: `${dimensionsData.length} × ${dimensionsData.width}`,
          foundationsVolume: Math.round(foundationsVolumeData.totalVolume * 1000) / 1000,
        },
      };

      return results;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = ConcreteCalculationService;

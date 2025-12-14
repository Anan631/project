'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AlgorithmResult {
  success: boolean;
  inputs?: any;
  calculations?: any;
  summary?: any;
  error?: string;
  errors?: string[];
}

interface FoundationDetail {
  index: number;
  height: number;
}

export default function ConcreteAlgorithmForm() {
  // المرحلة الأولى: إدخال البيانات
  const [cleaningPourLength, setCleaningPourLength] = useState('');
  const [cleaningPourWidth, setCleaningPourWidth] = useState('');
  const [cleaningPourHeight, setCleaningPourHeight] = useState('');
  const [numberOfFloors, setNumberOfFloors] = useState('');
  const [slabArea, setSlabArea] = useState('');
  const [soilType, setSoilType] = useState('');
  const [buildingType, setBuildingType] = useState('');
  const [foundationHeight, setFoundationHeight] = useState('');
  const [numberOfFoundations, setNumberOfFoundations] = useState('');
  const [foundationShape, setFoundationShape] = useState('');
  const [areFoundationsSimilar, setAreFoundationsSimilar] = useState<boolean | null>(null);
  const [foundationDetails, setFoundationDetails] = useState<FoundationDetail[]>([]);

  const [result, setResult] = useState<AlgorithmResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);

  // قائمة أنواع التربة (يجب جلبها من الخادم)
  const soilTypes = [
    { id: '1', name: 'رمل' },
    { id: '2', name: 'طين' },
    { id: '3', name: 'حصى' },
  ];

  // قائمة أنواع المباني
  const buildingTypes = [
    'سكني',
    'تجاري',
    'صناعي',
    'إداري',
  ];

  const handleAddFoundationDetail = () => {
    const newIndex = foundationDetails.length + 1;
    setFoundationDetails([
      ...foundationDetails,
      { index: newIndex, height: parseFloat(foundationHeight) || 0 },
    ]);
  };

  const handleRemoveFoundationDetail = (index: number) => {
    setFoundationDetails(foundationDetails.filter(detail => detail.index !== index));
  };

  const handleUpdateFoundationDetail = (index: number, height: number) => {
    setFoundationDetails(
      foundationDetails.map(detail =>
        detail.index === index ? { ...detail, height } : detail
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // تحضير البيانات
      const payload = {
        cleaningPourLength: parseFloat(cleaningPourLength),
        cleaningPourWidth: parseFloat(cleaningPourWidth),
        cleaningPourHeight: parseFloat(cleaningPourHeight),
        numberOfFloors: parseInt(numberOfFloors),
        slabArea: parseFloat(slabArea),
        soilType,
        buildingType,
        foundationHeight: parseFloat(foundationHeight),
        numberOfFoundations: parseInt(numberOfFoundations),
        foundationShape,
        areFoundationsSimilar,
        foundationDetails: !areFoundationsSimilar ? foundationDetails : [],
      };

      // إرسال الطلب إلى الخادم
      const response = await fetch('/api/calculations/concrete-algorithm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setCurrentPhase(10); // عرض النتائج
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'خطأ في الاتصال بالخادم',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPhase = () => {
    switch (currentPhase) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-app-red">المرحلة الأولى: إدخال بيانات صبة النظاف</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>طول صبة النظاف (متر)</Label>
                <Input
                  type="number"
                  value={cleaningPourLength}
                  onChange={(e) => setCleaningPourLength(e.target.value)}
                  step="0.01"
                  placeholder="مثال: 20.5"
                  required
                />
              </div>
              <div>
                <Label>عرض صبة النظاف (متر)</Label>
                <Input
                  type="number"
                  value={cleaningPourWidth}
                  onChange={(e) => setCleaningPourWidth(e.target.value)}
                  step="0.01"
                  placeholder="مثال: 15.3"
                  required
                />
              </div>
              <div>
                <Label>ارتفاع صبة النظاف (متر)</Label>
                <Input
                  type="number"
                  value={cleaningPourHeight}
                  onChange={(e) => setCleaningPourHeight(e.target.value)}
                  step="0.01"
                  placeholder="مثال: 0.10"
                  required
                />
              </div>
              <div>
                <Label>عدد الطوابق</Label>
                <Input
                  type="number"
                  value={numberOfFloors}
                  onChange={(e) => setNumberOfFloors(e.target.value)}
                  step="1"
                  placeholder="مثال: 5"
                  required
                />
              </div>
              <div>
                <Label>مساحة البلاطة (متر مربع)</Label>
                <Input
                  type="number"
                  value={slabArea}
                  onChange={(e) => setSlabArea(e.target.value)}
                  step="0.01"
                  placeholder="مثال: 300"
                  required
                />
              </div>
            </div>

            <Button
              onClick={() => setCurrentPhase(2)}
              className="w-full bg-app-red hover:bg-red-700"
            >
              التالي →
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-app-red">المرحلة الثانية: اختيار نوع التربة والمبنى</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>نوع التربة</Label>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع التربة" />
                  </SelectTrigger>
                  <SelectContent>
                    {soilTypes.map((soil) => (
                      <SelectItem key={soil.id} value={soil.id}>
                        {soil.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نوع المبنى</Label>
                <Select value={buildingType} onValueChange={setBuildingType}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المبنى" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildingTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPhase(1)}
                className="flex-1"
              >
                ← السابق
              </Button>
              <Button
                onClick={() => setCurrentPhase(3)}
                className="flex-1 bg-app-red hover:bg-red-700"
              >
                التالي →
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-app-red">المرحلة الثالثة: بيانات القواعد</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>ارتفاع القاعدة (متر) - بين 0.40 و 0.80</Label>
                <Input
                  type="number"
                  value={foundationHeight}
                  onChange={(e) => setFoundationHeight(e.target.value)}
                  step="0.01"
                  min="0.40"
                  max="0.80"
                  placeholder="مثال: 0.50"
                  required
                />
              </div>
              <div>
                <Label>عدد القواعد</Label>
                <Input
                  type="number"
                  value={numberOfFoundations}
                  onChange={(e) => setNumberOfFoundations(e.target.value)}
                  step="1"
                  placeholder="مثال: 4"
                  required
                />
              </div>
              <div>
                <Label>شكل القاعدة</Label>
                <Select value={foundationShape} onValueChange={setFoundationShape}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">مربعة</SelectItem>
                    <SelectItem value="rectangle">مستطيلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label>هل القواعد متشابهة؟</Label>
              <div className="flex gap-4 mt-2">
                <Button
                  variant={areFoundationsSimilar === true ? 'default' : 'outline'}
                  onClick={() => {
                    setAreFoundationsSimilar(true);
                    setFoundationDetails([]);
                  }}
                  className="flex-1"
                >
                  نعم - متشابهة
                </Button>
                <Button
                  variant={areFoundationsSimilar === false ? 'default' : 'outline'}
                  onClick={() => setAreFoundationsSimilar(false)}
                  className="flex-1"
                >
                  لا - مختلفة
                </Button>
              </div>
            </div>

            {areFoundationsSimilar === false && (
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-bold">بيانات القواعد الفردية</h4>
                {foundationDetails.map((detail) => (
                  <div key={detail.index} className="flex gap-2">
                    <Input
                      type="number"
                      value={detail.height}
                      onChange={(e) => handleUpdateFoundationDetail(detail.index, parseFloat(e.target.value))}
                      min="0.40"
                      max="0.80"
                      step="0.01"
                      placeholder={`ارتفاع القاعدة ${detail.index}`}
                      className="flex-1"
                    />
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveFoundationDetail(detail.index)}
                    >
                      حذف
                    </Button>
                  </div>
                ))}
                {foundationDetails.length < parseInt(numberOfFoundations || '0') && (
                  <Button
                    variant="outline"
                    onClick={handleAddFoundationDetail}
                    className="w-full"
                  >
                    إضافة قاعدة
                  </Button>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPhase(2)}
                className="flex-1"
              >
                ← السابق
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-app-red hover:bg-red-700"
              >
                {loading ? 'جاري الحساب...' : 'حساب النتائج'}
              </Button>
            </div>
          </div>
        );

      case 10:
        if (!result) return null;
        return (
          <div className="space-y-4">
            {result.success && result.summary ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-green-800">تم الحساب بنجاح</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="bg-app-red text-white">
                      <CardTitle>كمية خرسانة صبة النظاف</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="text-3xl font-bold text-app-red">
                        {result.summary.cleaningPourVolume}
                      </div>
                      <div className="text-gray-600">متر مكعب</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="bg-app-red text-white">
                      <CardTitle>كمية خرسانة القواعس</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="text-3xl font-bold text-app-red">
                        {result.summary.foundationsVolume}
                      </div>
                      <div className="text-gray-600">متر مكعب</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="bg-app-red text-white">
                      <CardTitle>مساحة القاعدة</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="text-3xl font-bold text-app-red">
                        {result.summary.foundationArea}
                      </div>
                      <div className="text-gray-600">متر مربع</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="bg-app-red text-white">
                      <CardTitle>أبعاد القاعدة</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-app-red">
                        {result.summary.foundationDimensions}
                      </div>
                      <div className="text-gray-600">متر</div>
                    </CardContent>
                  </Card>
                </div>

                {result.calculations?.loads && (
                  <Card>
                    <CardHeader className="bg-gray-100">
                      <CardTitle>تفاصيل الأحمال والتربة</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-gray-600">الحمل الميت</div>
                          <div className="font-bold">{result.calculations.loads.deadLoad} kN/m²</div>
                        </div>
                        <div>
                          <div className="text-gray-600">الحمل الحي</div>
                          <div className="font-bold">{result.calculations.loads.liveLoad} kN/m²</div>
                        </div>
                        <div>
                          <div className="text-gray-600">إجمالي الأحمال</div>
                          <div className="font-bold">{result.calculations.loads.totalLoad} kN/m²</div>
                        </div>
                        <div>
                          <div className="text-gray-600">قدرة التربة</div>
                          <div className="font-bold">{result.calculations.soil.bearingCapacity} MPa</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentPhase(1);
                      setResult(null);
                      // إعادة تعيين جميع الحقول
                      setCleaningPourLength('');
                      setCleaningPourWidth('');
                      setCleaningPourHeight('');
                      setNumberOfFloors('');
                      setSlabArea('');
                      setSoilType('');
                      setBuildingType('');
                      setFoundationHeight('');
                      setNumberOfFoundations('');
                      setFoundationShape('');
                      setAreFoundationsSimilar(null);
                      setFoundationDetails([]);
                    }}
                    className="flex-1"
                  >
                    حساب جديد
                  </Button>
                  <Button
                    className="flex-1 bg-app-red hover:bg-red-700"
                  >
                    حفظ النتائج
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-red-800">خطأ</h3>
                  {result.error && <p className="text-red-700">{result.error}</p>}
                  {result.errors && (
                    <ul className="text-red-700 list-disc list-inside">
                      {result.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentPhase(1);
                      setResult(null);
                    }}
                    className="mt-3"
                  >
                    العودة
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg">
      <CardHeader className="bg-gradient-to-r from-app-red to-red-700">
        <CardTitle className="text-white text-2xl text-center">
          خوارزمية حساب كميات الخرسانة
          <br />
          لصبة النظاف والقواعد
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {renderPhase()}
      </CardContent>
    </Card>
  );
}

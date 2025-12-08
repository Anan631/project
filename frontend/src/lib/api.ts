// API client for backend communication
// Use external backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ConcreteCalculationInput {
  projectArea: number;
  floors: number;
  foundationDepth: number;
  wallThickness: number;
  slabThickness: number;
}

export interface SteelCalculationInput {
  concreteVolume: number;
  steelRatio?: number;
}

export interface CostEstimationInput {
  concreteVolume: number;
  steelWeight: number;
  concretePricePerCubicMeter: number;
  steelPricePerKg: number;
}

export interface ConcreteCalculationResult {
  totalVolume: number;
  foundationVolume: number;
  columnsVolume: number;
  slabsVolume: number;
  beamsVolume: number;
  stairsVolume: number;
  wallsVolume: number;
}

export interface SteelCalculationResult {
  totalWeight: number;
  mainSteelWeight: number;
  secondarySteelWeight: number;
  columnsSteel: number;
  beamsSteel: number;
  slabsSteel: number;
  foundationSteel: number;
}

export interface CostEstimationResult {
  concreteCost: number;
  steelCost: number;
  totalCost: number;
  costBreakdown: {
    concrete: number;
    steel: number;
    labor: number;
    equipment: number;
    overhead: number;
  };
}

class ApiClient {
  public async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log('[API Request]', url, options.method || 'GET');

      // Default headers
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // إعداد خيارات الطلب مع تحسينات
      const fetchOptions: RequestInit = {
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        // إعدادات CORS محسنة
        mode: 'cors',
        credentials: 'include', // لإرسال الكوكيز إذا لزم الأمر
        cache: 'no-cache',
        ...options,
      };

      // إضافة body إذا كانت طريقة POST, PUT, PATCH
      if (options.body) {
        fetchOptions.body = options.body;
      }

      // إعداد timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 ثواني

      fetchOptions.signal = controller.signal;

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // معالجة الاستجابة
      if (!response.ok) {
        let errorMessage = `خطأ في الخادم: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // إذا فشل تحويل JSON، استخدم نص الاستجابة
          const text = await response.text();
          if (text) errorMessage = text;
        }

        throw new Error(errorMessage);
      }

      // محاولة تحويل الاستجابة إلى JSON
      try {
        const data = await response.json();
        return {
          success: true,
          data,
          message: data.message || 'تمت العملية بنجاح'
        };
      } catch (jsonError) {
        throw new Error('استجابة غير صالحة من الخادم');
      }

    } catch (error) {
      console.error('API request failed:', error);

      // معالجة أنواع الأخطاء المختلفة
      let errorMessage = 'حدث خطأ في الاتصال بالخادم';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'فشل الاتصال بالخادم. تأكد من: \n1. تشغيل الخادم \n2. صحة عنوان URL \n3. إعدادات CORS في الخادم';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    }
  }

  // ✅ Concrete calculations
  async calculateConcrete(input: ConcreteCalculationInput): Promise<ApiResponse<ConcreteCalculationResult>> {
    return this.request<ConcreteCalculationResult>('/calculations/concrete', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // ✅ Steel calculations
  async calculateSteel(input: SteelCalculationInput): Promise<ApiResponse<SteelCalculationResult>> {
    return this.request<SteelCalculationResult>('/calculations/steel', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // ✅ Cost estimation
  async estimateCosts(input: CostEstimationInput): Promise<ApiResponse<CostEstimationResult>> {
    return this.request<CostEstimationResult>('/calculations/cost-estimation', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // ✅ Generate cost report
  async generateCostReport(
    projectId: string,
    calculationType: 'concrete' | 'steel',
    input: any
  ): Promise<ApiResponse<any>> {
    return this.request('/calculations/generate-cost-report', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        calculationType,
        input,
      }),
    });
  }

  // ✅ Health check - تحسين فحص الحالة
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string; version: string }>> {
    return this.request('/health');
  }

  // ✅ Get user data
  async getUserData(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}`);
  }

  // ✅ Test server connection - تحسين اختبار الاتصال
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log(`🔍 Testing connection to: ${API_BASE_URL}`);

      const response = await this.healthCheck();

      if (response.success && response.data) {
        console.log('✅ Server connection successful:', response.data);
        return {
          success: true,
          message: 'الاتصال بالخادم ناجح',
          details: response.data
        };
      } else {
        console.error('❌ Server responded with error:', response.message);
        return {
          success: false,
          message: response.message || 'الخادم استجاب ولكن بحالة خطأ'
        };
      }
    } catch (error) {
      console.error('❌ Server connection failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';

      return {
        success: false,
        message: `فشل الاتصال بالخادم: ${errorMessage}\n\nتأكد من:\n1. تشغيل الخادم على ${API_BASE_URL.replace('/api', '')}\n2. إعدادات CORS في الخادم\n3. الاتصال بالشبكة`
      };
    }
  }

  // ✅ دالة مساعدة للتحقق من اتصال الخادم قبل الإجراءات الهامة
  async ensureConnection(): Promise<boolean> {
    const result = await this.testConnection();
    return result.success;
  }

  // ✅ Upload files - إضافة دالة لرفع الملفات إذا لزم الأمر
  async uploadFile(file: File, endpoint: string = '/upload'): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        message: 'تم رفع الملف بنجاح'
      };
    } catch (error) {
      console.error('File upload failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'فشل رفع الملف'
      };
    }
  }
}

// إنشاء نسخة واحدة من العميل
export const apiClient = new ApiClient();

// دالة مساعدة للاستخدام السريع
export const testBackendConnection = () => apiClient.testConnection();

// تصدير أنواع البيانات للاستخدام في المكونات
export type {
  ConcreteCalculationInput,
  SteelCalculationInput,
  CostEstimationInput,
  ConcreteCalculationResult,
  SteelCalculationResult,
  CostEstimationResult
};
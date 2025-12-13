
"use server";

import { apiClient } from '@/lib/api';

type ContactFormData = any;

export interface SendContactMessageResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  error?: string;
}

export async function sendContactMessageAction(
  formData: ContactFormData
): Promise<SendContactMessageResponse> {
  try {
    const response = await apiClient.post('/contact/send-message', formData);
    
    console.log('[actions.ts] sendContactMessageAction response:', response);
    
    // التأكد من أن الاستجابة لديها بيانات صحيحة
    if (!response || !response.data) {
      console.error('[actions.ts] sendContactMessageAction: No data in response', response);
      return {
        success: false,
        error: 'فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
      };
    }
    
    // البيانات مغلفة في response.data
    const result = response.data;
    
    return {
      success: result.success === true,
      message: result.message || '',
      error: result.message || result.error || undefined,
    };
  } catch (error) {
    console.error('[actions.ts] sendContactMessageAction error:', error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'An unknown error occurred.',
    };
  }
}

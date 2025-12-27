import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// المسارات العامة التي لا تحتاج مصادقة
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/admin-login',
  '/owner-login',
  '/signup',
  '/owner-signup',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/contact',
  '/help',
  '/guidelines',
  '/engineer/forgot-password',
  '/engineer/reset-password',
  '/owner/forgot-password',
  '/owner/reset-password',
]);

// المسارات المحمية التي تحتاج مصادقة
const PROTECTED_PATHS = [
  '/admin',
  '/engineer',
  '/owner',
  '/profile',
  '/documents',
  '/timeline',
  '/ai-report-generator',
] as const;

// المسارات الخاصة بـ API (يجب أن تكون متاحة دائماً)
const API_PATHS = ['/api'] as const;

/**
 * تحديد نوع المسار
 */
function getPathType(pathname: string): 'api' | 'public' | 'protected' | 'unknown' {
  // التحقق من مسارات API أولاً
  if (API_PATHS.some(path => pathname.startsWith(path))) {
    return 'api';
  }

  // التحقق من المسارات العامة
  if (PUBLIC_PATHS.has(pathname) || 
      Array.from(PUBLIC_PATHS).some(path => pathname.startsWith(path + '/'))) {
    return 'public';
  }

  // التحقق من المسارات المحمية
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    return 'protected';
  }

  return 'unknown';
}

/**
 * تحديد صفحة تسجيل الدخول المناسبة حسب المسار
 */
function getLoginPath(pathname: string): string {
  if (pathname.startsWith('/admin')) return '/admin-login';
  if (pathname.startsWith('/owner')) return '/owner-login';
  if (pathname.startsWith('/engineer')) return '/login';
  return '/login';
}

/**
 * التحقق من صلاحيات المستخدم للمسار
 */
function hasValidRole(pathname: string, userRole: string | undefined): boolean {
  if (pathname.startsWith('/admin')) return userRole === 'ADMIN';
  if (pathname.startsWith('/engineer')) return userRole === 'ENGINEER';
  if (pathname.startsWith('/owner')) return userRole === 'OWNER';
  return true;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathType = getPathType(pathname);

  // السماح بمسارات API والمسارات العامة
  if (pathType === 'api' || pathType === 'public') {
    return NextResponse.next();
  }

  // التعامل مع المسارات المحمية
  if (pathType === 'protected') {
    const token = request.cookies.get('authToken');
    const userId = request.cookies.get('userId');
    const userRole = request.cookies.get('userRole');

    // التحقق من وجود بيانات المصادقة
    if (!token || !userId || !userRole) {
      const loginPath = getLoginPath(pathname);
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // التحقق من الصلاحيات
    if (!hasValidRole(pathname, userRole.value)) {
      const loginPath = getLoginPath(pathname);
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

/**
 * تكوين المسارات التي يجب تطبيق proxy عليها
 * محسن للأداء ومتوافق مع Next.js 16+
 */
export const config = {
  matcher: [
    /*
     * تطبيق على جميع المسارات ما عدا:
     * - _next/static (ملفات ثابتة)
     * - _next/image (ملفات تحسين الصور)
     * - favicon.ico (أيقونة الموقع)
     * - ملفات الوسائط العامة
     * - ملفات الخطوط
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
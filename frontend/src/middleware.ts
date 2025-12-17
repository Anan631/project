import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// المسارات العامة التي لا تحتاج مصادقة
const publicPaths = [
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
  // مسارات نسيت كلمة المرور وإعادة تعيين كلمة المرور (يجب أن تكون متاحة بدون مصادقة)
  '/engineer/forgot-password',
  '/engineer/reset-password',
  '/owner/forgot-password',
  '/owner/reset-password',
];

// المسارات المحمية التي تحتاج مصادقة
const protectedPaths = [
  '/admin',
  '/engineer',
  '/owner',
  '/profile',
  '/documents',
  '/timeline',
  '/ai-report-generator',
  '/clock-test',
];

// المسارات الخاصة بـ API (يجب أن تكون متاحة دائماً)
const apiPaths = ['/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // السماح بجميع مسارات API
  if (apiPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // التحقق من المسارات العامة
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // التحقق من المسارات المحمية
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );

  if (isProtectedPath) {
    // التحقق من وجود token في cookies
    const token = request.cookies.get('authToken');
    const userId = request.cookies.get('userId');
    const userRole = request.cookies.get('userRole');

    // إذا لم يكن هناك token، إعادة التوجيه إلى صفحة تسجيل الدخول المناسبة
    if (!token && !userId && !userRole) {
      // تحديد صفحة تسجيل الدخول المناسبة حسب المسار
      let loginPath = '/login';
      
      if (pathname.startsWith('/admin')) {
        loginPath = '/admin-login';
      } else if (pathname.startsWith('/owner')) {
        loginPath = '/owner-login';
      } else if (pathname.startsWith('/engineer')) {
        loginPath = '/login';
      }

      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // التحقق من أن المستخدم لديه الصلاحيات المناسبة للمسار
    if (pathname.startsWith('/admin') && userRole?.value !== 'ADMIN') {
      const loginUrl = new URL('/admin-login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/engineer') && userRole?.value !== 'ENGINEER') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/owner') && userRole?.value !== 'OWNER') {
      const loginUrl = new URL('/owner-login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// تحديد المسارات التي يجب تطبيق middleware عليها
export const config = {
  matcher: [
    /*
     * تطبيق على جميع المسارات ما عدا:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


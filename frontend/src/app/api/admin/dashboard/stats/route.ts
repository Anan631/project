import { NextResponse } from 'next/server';

export async function GET() {
  const BASE_URL = process.env.API_URL;
  if (!BASE_URL) {
    return NextResponse.json({ success: false, message: 'API_URL environment variable is not set' }, { status: 500 });
  }

  try {
    // Fetch users, projects, and logs in parallel
    const [usersData, projectsData, logsData] = await Promise.all([
      fetch(`${BASE_URL}/users`, { next: { revalidate: 0 } })
        .then(res => res.ok ? res.json() : { users: [] })
        .catch(() => ({ users: [] })),

      fetch(`${BASE_URL}/projects`, { next: { revalidate: 0 } })
        .then(res => res.ok ? res.json() : { projects: [] })
        .catch(() => ({ projects: [] })),

      fetch(`${BASE_URL}/logs`, { next: { revalidate: 0 } })
        .then(res => res.ok ? res.json() : { logs: [] })
        .catch(() => ({ logs: [] }))
    ]);

    const users = usersData.users || [];
    const projects = projectsData.projects || [];
    const logs = logsData.logs || [];

    // حساب الإحصائيات
    const activeUsers = users.filter((u: any) => u.status === 'ACTIVE').length;
    const activeProjects = projects.filter((p: any) => p.projectStatus === 'ACTIVE').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // حساب عدد الـ logs اليوم مع فحص وجود createdAt
    const todayLogs = logs.filter((log: any) => {
      if (!log?.createdAt) return false; // تأكد أن createdAt موجود
      const d = new Date(Date.parse(log.createdAt));
      return d >= today && d < tomorrow;
    }).length;

    // حساب حمل النظام (محاكاة)
    const systemLoad = Math.min(
      95,
      Math.round((users.length * 0.5) + (projects.length * 2) + (logs.length * 0.01))
    );

    // حساب وقت التشغيل (محاكاة)
    const uptime = 99.8 - (systemLoad * 0.1);

    // حساب استخدام الذاكرة (محاكاة)
    const memoryUsage = Math.min(
      95,
      Math.round((users.length * 0.3) + (projects.length * 1.5) + (logs.length * 0.005))
    );

    return NextResponse.json({
      users: { count: users.length, active: activeUsers },
      projects: { count: projects.length, active: activeProjects },
      system: {
        load: systemLoad,
        uptime,
        memory: memoryUsage
      },
      logs: { today: todayLogs, total: logs.length }
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    return NextResponse.json({
      users: { count: 0, active: 0 },
      projects: { count: 0, active: 0 },
      system: { load: 0, uptime: 0, memory: 0 },
      logs: { today: 0, total: 0 }
    });
  }
}

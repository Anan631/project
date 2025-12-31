
'use server';

// File DB removed
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ---- TYPE DEFINITIONS (Matching JSON structure) ----

export type UserRole = 'ADMIN' | 'ENGINEER' | 'OWNER' | 'GENERAL_USER';
export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'DELETED';

// Type for user objects in the JSON file
export interface UserDocument {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  profileImage?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  resetToken?: string | null;
  resetTokenExpiry?: string | null;
}

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

// Type for log entries in the JSON file
export interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  level: LogLevel;
  message: string;
  user?: string;
  action?: string;
}

export type ProjectStatusType = "مكتمل" | "قيد التنفيذ" | "مخطط له" | "مؤرشف";
export type TaskStatus = "مكتمل" | "قيد التنفيذ" | "مخطط له";

// Type for project objects in the JSON file
export interface Project {
  id: number; // The JSON file uses numeric IDs for projects
  name: string;
  engineer?: string;
  clientName?: string;
  status: ProjectStatusType;
  startDate: string; // Date-only string (YYYY-MM-DD)
  endDate: string; // Date-only string (YYYY-MM-DD)
  description: string;
  location: string;
  budget?: number;
  overallProgress: number;
  quantitySummary: string;
  photos: ProjectPhoto[];
  timelineTasks: TimelineTask[];
  comments: ProjectComment[];
  chatMessages?: ChatMessage[];
  linkedOwnerEmail?: string;
  createdAt?: string; // ISO string
}

export interface ProjectPhoto {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  dataAiHint?: string;
  fileType?: 'image' | 'video' | 'document';
}

export interface TimelineTask {
  id: string;
  name: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  color: string;
  status: TaskStatus;
  progress?: number;
}

export interface ProjectComment {
  id: string;
  user: string;
  text: string;
  date: string; // ISO string
  avatar?: string;
  dataAiHintAvatar?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ENGINEER' | 'OWNER';
  text?: string;
  type: 'text' | 'audio';
  audioUrl?: string; // Base64 or URL
  timestamp: string;
}

export interface CostReportItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit_ILS: number;
  totalCost_ILS: number;
}

export interface CostReport {
  id: string;
  projectId: number;
  reportName: string;
  engineerId: string;
  engineerName: string;
  ownerId: string;
  ownerName: string;
  items: CostReportItem[];
  totalCost_ILS: number;
  pdfData?: string; // Base64 encoded PDF for owner download
  status?: 'SAVED' | 'SENT';
  createdAt: string; // ISO string
}

export interface SystemSettingsDocument {
  siteName: string;
  defaultLanguage: string;
  maintenanceMode: boolean;
  maxUploadSizeMB: number;
  emailNotificationsEnabled: boolean;
  loginAttemptsLimit: number;
  passwordResetExpiry: number;
  notificationEmail: string;
  notificationFrequency: string;
  allowedFileTypes: string[];
  fileScanning: boolean;
}

// ---- DATABASE I/O HELPERS ----

const API_BASE_URL = process.env.API_URL;
if (!API_BASE_URL) {
  throw new Error('API_URL environment variable is not set');
}

// Removed readDb/writeDb helpers and file-backed cache

// ---- HELPER FUNCTIONS ----

function toSafeDateString(d: any, defaultVal: string = ''): string {
  if (!d) return defaultVal;
  try {
    const date = new Date(d);
    return isNaN(date.getTime()) ? defaultVal : date.toISOString();
  } catch {
    return defaultVal;
  }
}

function toDateOnlyString(d: any): string {
  if (!d) return '';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - tzOffset);
    return localDate.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

// ---- DATABASE FUNCTIONS ----

export async function logAction(
  action: string,
  level: LogLevel,
  message: string,
  userIdentifier?: string,
): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, level, message, user: userIdentifier || 'System' }),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[db.ts] logAction: Failed to log action via API:', action, error);
  }
}

export async function getSystemSettings(): Promise<SystemSettingsDocument> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`[db.ts] getSystemSettings: API returned status ${res.status}`);
      throw new Error(`API error: ${res.statusText}`);
    }
    const json = await res.json();
    if (json?.settings) return json.settings;
  } catch (error) {
    console.error('[db.ts] getSystemSettings: Failed to fetch settings via API:', error);
    console.warn('[db.ts] getSystemSettings: Using default settings as fallback');
  }
  
  return {
    siteName: 'المحترف لحساب الكميات',
    defaultLanguage: 'ar',
    maintenanceMode: false,
    maxUploadSizeMB: 25,
    emailNotificationsEnabled: true,
    loginAttemptsLimit: 5,
    passwordResetExpiry: 24,
    notificationEmail: '',
    notificationFrequency: 'daily',
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    fileScanning: true,
  };
}

export async function updateSystemSettings(settings: SystemSettingsDocument): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      cache: 'no-store',
    });
    
    if (!res.ok) {
      console.error(`[db.ts] updateSystemSettings: API returned status ${res.status}`);
      return { success: false, message: 'فشل حفظ الإعدادات.' };
    }
    
    const json = await res.json();
    if (!json.success) {
      return { success: false, message: json.message || 'فشل حفظ الإعدادات.' };
    }
    
    await logAction('SYSTEM_SETTINGS_UPDATE_SUCCESS', 'INFO', 'System settings updated.');
    return { success: true, message: 'تم حفظ الإعدادات بنجاح.' };
  } catch (error: any) {
    console.error('[db.ts] updateSystemSettings: Failed to update settings:', error);
    await logAction('SYSTEM_SETTINGS_UPDATE_FAILURE', 'ERROR', `Error updating system settings: ${error.message}`);
    return { success: false, message: 'فشل حفظ الإعدادات.' };
  }
}

export interface RegistrationResult {
  success: boolean;
  userId?: string;
  message?: string;
  isPendingApproval?: boolean;
  errorType?: 'email_exists' | 'db_error' | 'other';
}

export async function registerUser(userData: {
  name: string;
  email: string;
  password_input: string;
  role: UserRole;
  phone?: string;
  status?: UserStatus;
}): Promise<RegistrationResult> {
  const { name, email, password_input, role, phone, status } = userData;
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password_input, role, phone, status }),
      cache: 'no-store',
    });
    const json = await response.json();

    if (!response.ok || !json.success) {
      const errType = json.errorType === 'email_exists' ? 'email_exists' : 'other';
      return { success: false, message: json.message || 'فشل إنشاء الحساب.', errorType: errType };
    }

    return { success: true, userId: json.user?.id || json.user?._id, isPendingApproval: json.user?.status === 'PENDING_APPROVAL', message: 'تم إنشاء حسابك بنجاح.' };
  } catch (error: any) {
    await logAction('USER_REGISTRATION_FAILURE', 'ERROR', `API error during registration for ${email}: ${error.message}`);
    return { success: false, message: 'حدث خطأ أثناء إنشاء الحساب.', errorType: 'db_error' };
  }
}


export interface LoginResult {
  success: boolean;
  user?: Omit<UserDocument, 'password_hash'>;
  message?: string;
  errorType?: 'email_not_found' | 'invalid_password' | 'account_suspended' | 'pending_approval' | 'account_deleted' | 'db_error' | 'other';
}

export async function loginUser(email: string, password_input: string): Promise<LoginResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password_input }),
      cache: 'no-store',
    });
    const json = await response.json();

    if (!response.ok || !json.success) {
      const map: Record<string, LoginResult['errorType']> = {
        email_not_found: 'email_not_found',
        invalid_password: 'invalid_password',
        account_suspended: 'account_suspended',
        pending_approval: 'pending_approval',
        account_deleted: 'account_deleted',
      };
      const errorType = map[json.errorType] || 'other';
      return { success: false, message: json.message || 'فشل تسجيل الدخول.', errorType };
    }

    const u = json.user;
    const user: Omit<UserDocument, 'password_hash'> = {
      id: u.id || u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      phone: u.phone,
      profileImage: u.profileImage,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
    await logAction('USER_LOGIN_SUCCESS', 'INFO', `User logged in: ${user.email}`, user.id);
    return { success: true, user };
  } catch (error: any) {
    await logAction('USER_LOGIN_FAILURE', 'ERROR', `API error on login for ${email}: ${error.message}`);
    return { success: false, message: 'حدث خطأ في الاتصال بالخادم.', errorType: 'db_error' };
  }
}

export async function findUserById(userId: string): Promise<Omit<UserDocument, 'password_hash'> | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || !json.success) return null;
    return json.user || null;
  } catch {
    return null;
  }
}

// دالة getUserById لجلب بيانات المستخدم مع رسالة نجاح/فشل
export async function getUserById(userId: string): Promise<{ success: boolean; user?: Omit<UserDocument, 'password_hash'>; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, { cache: 'no-store' });
    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: json.message || `فشل جلب بيانات المستخدم: ${res.status}`
      };
    }

    if (!json.success) {
      return {
        success: false,
        message: json.message || 'فشل جلب بيانات المستخدم'
      };
    }

    if (!json.user) {
      return {
        success: false,
        message: 'المستخدم غير موجود'
      };
    }

    return {
      success: true,
      user: json.user
    };
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      message: `حدث خطأ أثناء جلب بيانات المستخدم: ${error.message}`
    };
  }
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/by/email?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || !json.success) return null;
    const u = json.user;
    return u ? ({
      id: u.id || u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      phone: u.phone,
      profileImage: u.profileImage,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    } as any) : null;
  } catch {
    return null;
  }
}

export interface GetProjectsResult {
  success: boolean;
  projects?: Project[];
  message?: string;
}

export async function getProjects(userIdOrEmail: string, userRole?: string, userEmail?: string): Promise<GetProjectsResult> {
  try {
    const params = new URLSearchParams();

    // If user is OWNER, use email to find linked projects
    if (userRole === 'OWNER' && userEmail) {
      params.set('userRole', 'OWNER');
      params.set('userEmail', userEmail.toLowerCase());
    } else if (userIdOrEmail) {
      // For engineers and others, use userId
      params.set('userId', userIdOrEmail);
      if (userRole) {
        params.set('userRole', userRole);
      }
    }

    const res = await fetch(`${API_BASE_URL}/projects?${params.toString()}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || !json.success) return { success: false, message: 'فشل تحميل المشاريع.' };
    const projects = (json.projects || []).map((p: any) => ({
      ...p,
      id: p.id ?? p._id ?? p.projectId ?? `${p.name}-${p.createdAt || ''}`,
    })) as Project[];
    return { success: true, projects };
  } catch (error: any) {
    await logAction('PROJECT_FETCH_FAILURE', 'ERROR', `Error fetching projects: ${error.message}`);
    return { success: false, message: 'فشل تحميل المشاريع بسبب خطأ في الخادم.' };
  }
}

export async function findProjectById(projectId: string): Promise<Project | null> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, { cache: 'no-store' });
  const json = await res.json();
  if (!json?.project) return null;
  const p = json.project;
  return { ...p, id: p.id ?? p._id } as Project;
}

export async function addProject(projectData: Partial<Project>, userId?: string): Promise<Project | null> {
  const payload = { ...projectData } as any;
  // Add userId to payload so backend can set createdByUserId
  if (userId) {
    payload.userId = userId;
    payload.createdByUserId = userId;
  }
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) return null;
  const p = json.project;
  return { ...p, id: p.id ?? p._id } as Project;
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<{ success: boolean; project?: Project; message?: string; }> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message || 'المشروع غير موجود.' };
  await logAction('PROJECT_UPDATE_SUCCESS', 'INFO', `Project ID ${projectId} updated.`);
  const p = json.project;
  return { success: true, project: { ...p, id: p.id ?? p._id } as Project };
}

export async function deleteProject(projectId: string, userId?: string, adminUserId?: string): Promise<{ success: boolean; message?: string }> {
  const body: any = {};
  if (userId) body.userId = userId;
  if (adminUserId) body.adminUserId = adminUserId;

  const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message || 'المشروع غير موجود.' };
  const logMessage = adminUserId
    ? `Project ID ${projectId} deleted by admin ${adminUserId}.`
    : `Project ID ${projectId} hidden for user ${userId || ''}.`;
  await logAction('PROJECT_DELETE_SUCCESS', 'INFO', logMessage);
  return { success: true, message: json.message || 'تم حذف المشروع بنجاح.' };
}

export async function restoreProject(projectId: string, adminUserId: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUserId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message || 'فشل استعادة المشروع.' };
  await logAction('PROJECT_RESTORE_SUCCESS', 'INFO', `Project ID ${projectId} restored by admin ${adminUserId}.`);
  return { success: true, message: json.message || 'تم استعادة المشروع بنجاح.' };
}

export async function getUsers(): Promise<{ success: boolean, users?: Omit<UserDocument, 'password_hash'>[], message?: string }> {
  const res = await fetch(`${API_BASE_URL}/users`, { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message || 'فشل تحميل المستخدمين.' };
  // Normalize user IDs (handle both id and _id from MongoDB)
  const users = (json.users || []).map((u: any) => ({
    ...u,
    id: u.id || u._id || `${u.email}-${Date.now()}`
  }));
  return { success: true, users };
}

export interface AdminUserUpdateResult {
  success: boolean;
  user?: Omit<UserDocument, 'password_hash'>;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function updateUser(userId: string, updates: Partial<UserDocument>): Promise<AdminUserUpdateResult> {
  const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message || 'فشل تحديث المستخدم.' };
  await logAction('USER_UPDATE_SUCCESS_BY_ADMIN', 'INFO', `Admin updated user ID ${userId}.`);
  return { success: true, user: json.user, message: 'تم تحديث المستخدم بنجاح.' };
}

export async function deleteUser(userId: string, adminUserId?: string): Promise<{ success: boolean, message?: string }> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const body: any = {};

  // Send adminUserId in body for authentication
  if (adminUserId) {
    body.adminUserId = adminUserId;
  }

  const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers,
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message || 'المستخدم غير موجود.' };
  await logAction('USER_DELETE_SUCCESS_BY_ADMIN', 'INFO', `User ID ${userId} deleted by admin ${adminUserId || ''}.`);
  return { success: true, message: 'تم حذف المستخدم بنجاح.' };
}

// Search for owners in the database
export async function searchOwners(query: string): Promise<{ success: boolean, owners?: Array<{id: string, name: string, email: string}>, message?: string }> {
  try {
    // Get all users and filter for owners
    const result = await getUsers();
    if (!result.success || !result.users) {
      return { success: false, message: result.message || 'فشل جلب قائمة المستخدمين.' };
    }
    
    // Filter for users with OWNER role and matching the search query
    const owners = result.users
      .filter(user => user.role === 'OWNER')
      .filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) || 
        user.email.toLowerCase().includes(query.toLowerCase())
      )
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email
      }));
    
    return { success: true, owners };
  } catch (error: any) {
    console.error('Error searching for owners:', error);
    await logAction('OWNERS_SEARCH_FAILURE', 'ERROR', `Error searching for owners: ${error.message}`);
    return { success: false, message: 'فشل البحث عن المالكين.' };
  }
}

export async function deleteUserSelf(userId: string): Promise<{ success: boolean, message?: string }> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const body = { userId };

  const res = await fetch(`${API_BASE_URL}/users/${userId}/self`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message || 'فشل حذف الحساب.' };
  await logAction('USER_DELETE_SELF_SUCCESS', 'INFO', `User ID ${userId} deleted their own account.`, userId);
  return { success: true, message: 'تم حذف الحساب بنجاح.' };
}

export async function restoreUser(userId: string, adminUserId?: string): Promise<{ success: boolean, message?: string }> {
  const body: any = {};
  if (adminUserId) {
    body.adminUserId = adminUserId;
  }

  const res = await fetch(`${API_BASE_URL}/users/${userId}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message || 'فشل استعادة المستخدم.' };
  await logAction('USER_RESTORE_SUCCESS', 'INFO', `User ID ${userId} restored by admin ${adminUserId || ''}.`);
  return { success: true, message: 'تم استعادة المستخدم بنجاح.' };
}

export async function adminResetUserPassword(adminUserId: string, targetUserId: string, newPassword_input: string): Promise<{ success: boolean, message?: string }> {
  const res = await fetch(`${API_BASE_URL}/users/${targetUserId}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword_input, adminUserId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message || 'فشل إعادة تعيين كلمة المرور.' };
  await logAction('USER_PASSWORD_RESET_BY_ADMIN', 'INFO', `Admin ${adminUserId} reset password for user ${targetUserId}.`);
  return { success: true, message: 'تم إعادة تعيين كلمة مرور المستخدم بنجاح.' };
}

export async function approveEngineer(adminUserId: string, engineerUserId: string): Promise<{ success: boolean, message?: string }> {
  const res = await fetch(`${API_BASE_URL}/users/${engineerUserId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUserId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message || 'فشل الموافقة على المهندس.' };
  await logAction('ENGINEER_APPROVAL_SUCCESS', 'INFO', `Admin ${adminUserId} approved engineer ${engineerUserId}.`);
  return { success: true, message: 'تمت الموافقة على المهندس.' };
}

export async function suspendUser(adminUserId: string, targetUserId: string): Promise<{ success: boolean, message?: string }> {
  const res = await fetch(`${API_BASE_URL}/users/${targetUserId}/suspend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUserId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message || 'فشل تغيير حالة المستخدم.' };
  const actionMessage = json.message || 'تم تحديث حالة المستخدم.';
  await logAction(json.message?.includes('إلغاء') ? 'USER_UNSUSPEND_SUCCESS' : 'USER_SUSPEND_SUCCESS', 'INFO', `Admin ${adminUserId} toggled suspension for user ${targetUserId}.`);
  return { success: true, message: actionMessage };
}

export async function getLogs(): Promise<LogEntry[]> {
  const res = await fetch(`${API_BASE_URL}/logs`, { cache: 'no-store' });
  const json = await res.json();
  return (json.logs || []) as LogEntry[];
}

export interface ChangePasswordResult {
  success: boolean;
  message?: string;
  errorType?: 'user_not_found' | 'invalid_current_password' | 'db_error';
}

export async function changeUserPassword(userId: string, currentPassword_input: string, newPassword_input: string): Promise<ChangePasswordResult> {
  const res = await fetch(`${API_BASE_URL}/password/change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, currentPassword_input, newPassword_input }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) return { success: false, message: json.message, errorType: json.errorType };
  await logAction('USER_PASSWORD_CHANGE_SUCCESS', 'INFO', `User ${userId} changed their password.`, userId);
  return { success: true, message: 'تم تغيير كلمة المرور بنجاح.' };
}

export const sendProjectMessage = async (projectId: string, message: ChatMessage) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error };
  }
};

export async function addCostReport(reportData: Omit<CostReport, 'id' | 'createdAt'>): Promise<CostReport | null> {
  try {
    console.log('[db.ts] addCostReport: sending to', `${API_BASE_URL}/reports`);
    const res = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    const json = await res.json();
    console.log('[db.ts] addCostReport response:', res.status, json);
    if (!res.ok || !json.success) {
      console.error('[db.ts] addCostReport failed:', json.message || json.error);
      return null;
    }
    await logAction('COST_REPORT_ADD_SUCCESS', 'INFO', `Cost report "${reportData.reportName}" added for project ID ${reportData.projectId}.`);
    return json.report as CostReport;
  } catch (error) {
    console.error('[db.ts] addCostReport error:', error);
    return null;
  }
}

export async function getCostReportsForProject(projectId: string): Promise<CostReport[]> {
  const res = await fetch(`${API_BASE_URL}/reports/project/${projectId}`, { cache: 'no-store' });
  const json = await res.json();
  return (json.reports || []).map((r: any) => ({ ...r, id: r.id || r._id })) as CostReport[];
}

export async function getCostReportsForOwner(ownerId: string): Promise<CostReport[]> {
  const res = await fetch(`${API_BASE_URL}/reports/owner/${ownerId}`, { cache: 'no-store' });
  const json = await res.json();
  return (json.reports || []).map((r: any) => ({ ...r, id: r.id || r._id })) as CostReport[];
}

export async function deleteCostReport(reportId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok || !json.success) return { success: false, message: json.message || 'فشل حذف التقرير.' };
    await logAction('COST_REPORT_DELETE_SUCCESS', 'INFO', `Cost report ${reportId} deleted.`);
    return { success: true, message: 'تم حذف التقرير بنجاح.' };
  } catch (error: any) {
    console.error('[db.ts] deleteCostReport error:', error);
    return { success: false, message: 'فشل حذف التقرير بسبب خطأ في الخادم.' };
  }
}

export async function deleteAllLogs(adminUserId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/logs`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUserId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) return { success: false, message: json.message || 'فشل حذف السجلات.' };
    return { success: true, message: 'تم حذف جميع السجلات بنجاح.' };
  } catch (error: any) {
    console.error('[db.ts] deleteAllLogs: Failed to delete logs:', error);
    return { success: false, message: 'فشل حذف السجلات بسبب خطأ في الخادم.' };
  }
}

export async function createPasswordResetToken(email: string): Promise<{ success: boolean; token?: string; message?: string; userId?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/password/reset-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) return { success: false, message: json.message || 'Database error.' };
    await logAction('PASSWORD_RESET_TOKEN_CREATED', 'INFO', `Password reset token created for ${email}.`, json.userId);
    return { success: true, token: json.token, userId: json.userId };
  } catch (error: any) {
    await logAction('DB_ERROR', 'ERROR', `Error creating password reset token for ${email}: ${error.message}`);
    return { success: false, message: 'Database error.' };
  }
}

export async function createPasswordResetTokenWithEmail(email: string, role: string = 'ENGINEER'): Promise<{ success: boolean; token?: string; message?: string; userId?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/password/reset-token-with-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) return { success: false, message: json.message || 'حدث خطأ أثناء إرسال البريد الإلكتروني.' };
    await logAction('PASSWORD_RESET_EMAIL_SENT', 'INFO', `Password reset email sent to ${email}.`, json.userId);
    return { success: true, token: json.token, userId: json.userId, message: json.message };
  } catch (error: any) {
    await logAction('DB_ERROR', 'ERROR', `Error sending password reset email to ${email}: ${error.message}`);
    return { success: false, message: 'حدث خطأ أثناء إرسال البريد الإلكتروني.' };
  }
}

export async function resetPasswordWithToken(token: string, newPassword_input: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/password/reset-with-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword_input }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) return { success: false, message: json.message || 'حدث خطأ في الخادم.' };
    return { success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح.' };
  } catch (error: any) {
    await logAction('DB_ERROR', 'ERROR', `Error resetting password with token: ${error.message}`);
    return { success: false, message: 'حدث خطأ في الخادم.' };
  }
}

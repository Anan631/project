// app/engineer/projects/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { updateProject as dbUpdateProject, deleteProject as dbDeleteProject, type Project } from '@/lib/db';
import { updateProjectSchema, type UpdateProjectFormValues } from './schemas';

// Generic update action for inline editing
export async function updateProjectAction(data: UpdateProjectFormValues): Promise<{ 
  success: boolean; 
  message?: string; 
  project?: Project; 
  fieldErrors?: Record<string, string[]> 
}> {
  const validation = updateProjectSchema.safeParse(data);
  if (!validation.success) {
    return { 
      success: false, 
      message: "بيانات غير صالحة.", 
      fieldErrors: validation.error.flatten().fieldErrors 
    };
  }
  
  const { projectId, ...projectUpdates } = validation.data;

  try {
    const result = await dbUpdateProject(projectId, projectUpdates);

    if (result.success) {
      // Revalidate the projects page to show updated data
      revalidatePath('/engineer/projects');
      return { 
        success: true, 
        message: "تم تحديث المشروع بنجاح.", 
        project: result.project 
      };
    } else {
      return { 
        success: false, 
        message: result.message || "فشل تحديث المشروع." 
      };
    }
  } catch (error) {
    console.error('Update project error:', error);
    return { 
      success: false, 
      message: "حدث خطأ غير متوقع أثناء تحديث المشروع." 
    };
  }
}

// Archive project action
export async function archiveProjectAction(projectId: string): Promise<{ 
  success: boolean; 
  message?: string; 
}> {
  try {
    const result = await dbUpdateProject(projectId, { status: 'مؤرشف' });

    if (result.success) {
      revalidatePath('/engineer/projects');
      return { 
        success: true, 
        message: "تم أرشفة المشروع بنجاح." 
      };
    } else {
      return { 
        success: false, 
        message: result.message || "فشل أرشفة المشروع." 
      };
    }
  } catch (error) {
    console.error('Archive project error:', error);
    return { 
      success: false, 
      message: "حدث خطأ غير متوقع أثناء أرشفة المشروع." 
    };
  }
}

// Delete project action
export async function deleteProjectAction(projectId: string): Promise<{ 
  success: boolean; 
  message?: string; 
}> {
  try {
    const result = await dbDeleteProject(projectId);

    if (result.success) {
      revalidatePath('/engineer/projects');
      return { 
        success: true, 
        message: "تم حذف المشروع بنجاح." 
      };
    } else {
      return { 
        success: false, 
        message: result.message || "فشل حذف المشروع." 
      };
    }
  } catch (error) {
    console.error('Delete project error:', error);
    return { 
      success: false, 
      message: "حدث خطأ غير متوقع أثناء حذف المشروع." 
    };
  }
}
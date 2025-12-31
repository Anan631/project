import { API_BASE_URL } from '@/lib/api';

const API_URL = API_BASE_URL;

export interface Project {
  _id?: string;
  id?: string;
  name: string;
  [key: string]: any;
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Error fetching project: ${response.statusText}`);
    }

    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Error fetching projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data.projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function createProject(projectData: Partial<Project>): Promise<Project | null> {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      throw new Error(`Error creating project: ${response.statusText}`);
    }

    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

export async function updateProject(id: string, projectData: Partial<Project>): Promise<Project | null> {
  try {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      throw new Error(`Error updating project: ${response.statusText}`);
    }

    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Error deleting project: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

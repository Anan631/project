import { API_BASE_URL } from '@/lib/api';

const API_URL = API_BASE_URL;

export interface ConcreteCalculation {
  _id?: string;
  projectId: string;
  [key: string]: unknown;
}

export async function getConcreteCalculationsByProject(projectId: string): Promise<ConcreteCalculation[]> {
  try {
    const response = await fetch(`${API_URL}/concrete-calculation/by-project/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Error fetching concrete calculations: ${response.statusText}`);
    }

    const data = await response.json();
    return data.calculations || [];
  } catch (error) {
    console.error('Error fetching concrete calculations:', error);
    return [];
  }
}

export async function getConcreteCalculationById(id: string): Promise<ConcreteCalculation | null> {
  try {
    const response = await fetch(`${API_URL}/concrete-calculation/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Error fetching concrete calculation: ${response.statusText}`);
    }

    const data = await response.json();
    return data.calculation;
  } catch (error) {
    console.error('Error fetching concrete calculation:', error);
    return null;
  }
}

export async function createConcreteCalculation(calculationData: Partial<ConcreteCalculation>): Promise<ConcreteCalculation | null> {
  try {
    const response = await fetch(`${API_URL}/concrete-calculation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(calculationData),
    });

    if (!response.ok) {
      throw new Error(`Error creating concrete calculation: ${response.statusText}`);
    }

    const data = await response.json();
    return data.calculation;
  } catch (error) {
    console.error('Error creating concrete calculation:', error);
    return null;
  }
}

export async function updateConcreteCalculation(id: string, calculationData: Partial<ConcreteCalculation>): Promise<ConcreteCalculation | null> {
  try {
    const response = await fetch(`${API_URL}/concrete-calculation/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(calculationData),
    });

    if (!response.ok) {
      throw new Error(`Error updating concrete calculation: ${response.statusText}`);
    }

    const data = await response.json();
    return data.calculation;
  } catch (error) {
    console.error('Error updating concrete calculation:', error);
    return null;
  }
}

export async function deleteConcreteCalculation(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/concrete-calculation/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Error deleting concrete calculation: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting concrete calculation:', error);
    return false;
  }
}

export async function calculateConcreteAlgorithm(data: Record<string, unknown>): Promise<unknown> {
  try {
    const response = await fetch(`${API_URL}/calculations/concrete-algorithm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error calculating concrete algorithm: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calculating concrete algorithm:', error);
    return null;
  }
}

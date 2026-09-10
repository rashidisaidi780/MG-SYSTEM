import { usePersistentState } from './persistentState';

export interface DepartmentOption {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
}

export function useDepartments() {
  const [departments] = usePersistentState<DepartmentOption[]>('departments', []);
  return [departments.map((department) => department.name)] as const;
}
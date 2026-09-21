import { useEffect, useState } from 'react';
import departmentsService from '@/services/departments';

export interface DepartmentOption {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
}

export function useDepartments() {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  useEffect(() => {
    void departmentsService.getAll().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  return [departments.map((department) => department.name)] as const;
}

export function useDepartmentOptions() {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  useEffect(() => {
    void departmentsService.getAll().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  return [departments] as const;
}
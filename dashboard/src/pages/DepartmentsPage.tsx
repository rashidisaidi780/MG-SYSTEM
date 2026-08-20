import { useMemo, useState } from 'react';
import { Edit3, Plus, Trash2, Users, MoreHorizontal } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { notifySystem } from '@/utils/systemNotifications';

interface Department {
  id: string;
  name: string;
  description: string;
  head: string;
  peopleCount: number;
  status: 'Active' | 'Inactive';
}

const initialDepartments: Department[] = [
  { id: 'dept-hr', name: 'Human Resources', description: 'People operations, hiring, and employee support.', head: 'Anna Wright', peopleCount: 4, status: 'Active' },
  { id: 'dept-it', name: 'Information Technology', description: 'Technology, systems, devices, and technical support.', head: 'James Park', peopleCount: 6, status: 'Active' },
  { id: 'dept-finance', name: 'Finance', description: 'Budgeting, payments, accounting, and financial reporting.', head: 'Sarah Chen', peopleCount: 3, status: 'Active' },
  { id: 'dept-operations', name: 'Operations', description: 'Daily business operations and service delivery.', head: 'Mia Lopez', peopleCount: 8, status: 'Active' },
];

const emptyDepartment: Department = {
  id: '',
  name: '',
  description: '',
  head: '',
  peopleCount: 0,
  status: 'Active',
};

export default function DepartmentsPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formDepartment, setFormDepartment] = useState<Department>(emptyDepartment);
  const [viewDepartment, setViewDepartment] = useState<Department | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { showToast } = useToast();

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const query = searchQuery.toLowerCase();
    return departments.filter((department) =>
      [department.name, department.description, department.head, department.status]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [departments, searchQuery]);

  const openForm = (mode: 'add' | 'edit', department?: Department) => {
    setFormMode(mode);
    setFormDepartment(department ? { ...department } : { ...emptyDepartment, id: `dept-${Date.now()}` });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormDepartment(emptyDepartment);
  };

  const handleSave = () => {
    if (!formDepartment.name.trim() || !formDepartment.description.trim() || !formDepartment.head.trim()) {
      showToast('Please fill in the department name, description, and head', 'warning');
      return;
    }

    const department = { ...formDepartment, peopleCount: Math.max(0, Math.floor(Number(formDepartment.peopleCount) || 0)) };
    if (formMode === 'add') {
      setDepartments((current) => [department, ...current]);
      notifySystem('Department created', `${department.name} was added to departments.`);
      showToast(`Department "${department.name}" created successfully`, 'success');
    } else {
      setDepartments((current) => current.map((item) => item.id === department.id ? department : item));
      notifySystem('Department updated', `${department.name} details were updated.`);
      showToast(`Department "${department.name}" updated successfully`, 'success');
    }
    closeForm();
  };

  const handleDelete = (id: string) => {
    const department = departments.find((item) => item.id === id);
    setDepartments((current) => current.filter((item) => item.id !== id));
    if (department) {
      notifySystem('Department deleted', `${department.name} was removed from departments.`);
      showToast(`Department "${department.name}" deleted`, 'info');
    }
    setPendingDeleteId(null);
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-neutral-400 font-medium">{filteredDepartments.length} departments</p>
          <h2 className="text-2xl font-semibold">Department management</h2>
        </div>
        <button onClick={() => openForm('add')} className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredDepartments.map((department) => (
          <div key={department.id} className="rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Department</span>
                <h3 className="mt-1 break-words text-lg font-semibold">{department.name}</h3>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${department.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>{department.status}</span>
            </div>
            <p className="mt-3 min-h-10 whitespace-pre-wrap break-words text-sm leading-5 text-neutral-600">{department.description}</p>
            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
              <div className="flex items-center gap-2 text-sm text-neutral-600"><Users size={16} className="text-neutral-400" /><span><strong className="text-neutral-900">{department.peopleCount}</strong> people</span></div>
              <span className="text-xs text-neutral-400">Head: {department.head}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
              <button onClick={() => setViewDepartment(department)} className="text-xs font-semibold text-black hover:underline">View details</button>
              <div className="flex items-center gap-1">
                <button onClick={() => openForm('edit', department)} className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100" title="Edit department"><Edit3 size={16} /></button>
                <button onClick={() => setPendingDeleteId(department.id)} className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50" title="Delete department"><Trash2 size={16} /></button>
                <button onClick={() => setViewDepartment(department)} className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100" title="View department"><MoreHorizontal size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete department?"
        message="This department will be permanently removed. Do you want to continue?"
        confirmText="Yes"
        cancelText="No"
        destructive
        onConfirm={() => { if (pendingDeleteId) handleDelete(pendingDeleteId); }}
        onCancel={() => setPendingDeleteId(null)}
      />

      {viewDepartment ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Department details</p><h3 className="mt-1 text-xl font-semibold">{viewDepartment.name}</h3></div><button onClick={() => setViewDepartment(null)} className="rounded-2xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">Close</button></div>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2"><div><div className="text-xs text-neutral-400">Status</div><div className="mt-1 font-medium">{viewDepartment.status}</div></div><div><div className="text-xs text-neutral-400">People</div><div className="mt-1 font-medium">{viewDepartment.peopleCount}</div></div><div><div className="text-xs text-neutral-400">Department head</div><div className="mt-1 font-medium">{viewDepartment.head}</div></div><div className="sm:col-span-2"><div className="text-xs text-neutral-400">Description</div><div className="mt-1 whitespace-pre-wrap break-words font-medium">{viewDepartment.description}</div></div></div>
            <div className="mt-6 flex justify-end"><button onClick={() => { setViewDepartment(null); openForm('edit', viewDepartment); }} className="rounded-3xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Edit department</button></div>
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-[0.24em] text-neutral-400">{formMode === 'add' ? 'New department' : 'Edit department'}</p><h3 className="mt-1 text-xl font-semibold">{formMode === 'add' ? 'Add department details' : 'Update department details'}</h3></div><button onClick={closeForm} className="rounded-2xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">Cancel</button></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-neutral-700">Department name<input value={formDepartment.name} onChange={(e) => setFormDepartment((current) => ({ ...current, name: e.target.value }))} placeholder="Enter department name" className="w-full rounded-2xl border border-neutral-200 px-3 py-2" /></label><label className="space-y-2 text-sm font-medium text-neutral-700">Department head<input value={formDepartment.head} onChange={(e) => setFormDepartment((current) => ({ ...current, head: e.target.value }))} placeholder="Enter department head" className="w-full rounded-2xl border border-neutral-200 px-3 py-2" /></label><label className="space-y-2 text-sm font-medium text-neutral-700">Number of people<input type="number" min="0" value={formDepartment.peopleCount} onChange={(e) => setFormDepartment((current) => ({ ...current, peopleCount: Number(e.target.value) }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2" /></label><label className="space-y-2 text-sm font-medium text-neutral-700">Status<select value={formDepartment.status} onChange={(e) => setFormDepartment((current) => ({ ...current, status: e.target.value as Department['status'] }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2"><option>Active</option><option>Inactive</option></select></label><label className="space-y-2 text-sm font-medium text-neutral-700 sm:col-span-2">Description<textarea value={formDepartment.description} onChange={(e) => setFormDepartment((current) => ({ ...current, description: e.target.value }))} placeholder="Describe this department" className="min-h-28 w-full resize-y rounded-2xl border border-neutral-200 px-3 py-2" /></label></div>
            <div className="mt-6 flex justify-end gap-3"><button onClick={closeForm} className="rounded-3xl border border-neutral-200 px-4 py-2 text-sm">Cancel</button><button onClick={handleSave} className="rounded-3xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">{formMode === 'add' ? 'Create department' : 'Save changes'}</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

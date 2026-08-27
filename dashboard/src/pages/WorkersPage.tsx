import { useState, useMemo } from 'react';
import { Plus, MoreHorizontal, Mail, Phone, Edit3, Trash2, Building2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { notifySystem } from '@/utils/systemNotifications';

interface Worker {
  id: string;
  name: string;
  department: string;
  tinNumber: string;
  nidaNumber: string;
  email: string;
  phone: string;
  otherPhone: string;
  salary: string;
  contractStartDate: string;
  durationValue: number;
  durationUnit: 'month' | 'year';
  contractEndDate: string;
  status: 'Active' | 'On Leave' | 'Contract';
}

const initialWorkers: Worker[] = [
  {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    department: 'Finance',
    tinNumber: 'TIN-783421',
    nidaNumber: 'NIDA-210987',
    email: 'sarah@makezy.com',
    phone: '+1 555-0101',
    otherPhone: '+1 555-1101',
    salary: '$4,800',
    contractStartDate: '2026-05-01',
    durationValue: 1,
    durationUnit: 'year',
    contractEndDate: '2027-05-01',
    status: 'Active',
  },
  {
    id: 'james-park',
    name: 'James Park',
    department: 'Information Technology',
    tinNumber: 'TIN-684212',
    nidaNumber: 'NIDA-310652',
    email: 'james@makezy.com',
    phone: '+1 555-0102',
    otherPhone: '+1 555-1102',
    salary: '$5,600',
    contractStartDate: '2026-06-10',
    durationValue: 6,
    durationUnit: 'month',
    contractEndDate: '2026-12-10',
    status: 'Active',
  },
  {
    id: 'anna-wright',
    name: 'Anna Wright',
    department: 'Human Resources',
    tinNumber: 'TIN-847193',
    nidaNumber: 'NIDA-410723',
    email: 'anna@makezy.com',
    phone: '+1 555-0105',
    otherPhone: '+1 555-1105',
    salary: '$3,900',
    contractStartDate: '2025-09-01',
    durationValue: 1,
    durationUnit: 'year',
    contractEndDate: '2026-09-01',
    status: 'On Leave',
  },
];

const statusStyles: Record<Worker['status'], string> = {
  Active: 'bg-green-50 text-green-700',
  'On Leave': 'bg-amber-50 text-amber-700',
  Contract: 'bg-blue-50 text-blue-700',
};

const departments = ['Human Resources', 'Information Technology', 'Finance', 'Operations'];

const emptyWorker: Worker = {
  id: '',
  name: '',
  department: '',
  tinNumber: '',
  nidaNumber: '',
  email: '',
  phone: '',
  otherPhone: '',
  salary: '',
  contractStartDate: '',
  durationValue: 1,
  durationUnit: 'year',
  contractEndDate: '',
  status: 'Contract',
};

const calculateEndDate = (startDate: string, durationValue: number, durationUnit: Worker['durationUnit']) => {
  if (!startDate || !durationValue) return '';
  const date = new Date(startDate);
  if (durationUnit === 'year') {
    date.setFullYear(date.getFullYear() + durationValue);
  } else {
    date.setMonth(date.getMonth() + durationValue);
  }
  return date.toISOString().slice(0, 10);
};

export default function WorkersPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formWorker, setFormWorker] = useState<Worker>(emptyWorker);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [pendingDeleteWorkerId, setPendingDeleteWorkerId] = useState<string | null>(null);
  const { showToast } = useToast();

  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return workers;
    const query = searchQuery.toLowerCase();
    return workers.filter(
      (worker) =>
        worker.name.toLowerCase().includes(query) ||
        worker.tinNumber.toLowerCase().includes(query) ||
        worker.email.toLowerCase().includes(query) ||
        worker.phone.toLowerCase().includes(query),
    );
  }, [workers, searchQuery]);

  const openForm = (mode: 'add' | 'edit', worker?: Worker) => {
    setFormMode(mode);
    if (mode === 'edit' && worker) {
      setFormWorker(worker);
    } else {
      setFormWorker({ ...emptyWorker, contractEndDate: '' });
    }
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormWorker(emptyWorker);
  };

  const openDetail = (worker: Worker) => {
    setSelectedWorker(worker);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedWorker(null);
  };

  const handleFormChange = (field: keyof Worker, value: string | number) => {
    const updated = { ...formWorker, [field]: value } as Worker;
    if (field === 'contractStartDate' || field === 'durationValue' || field === 'durationUnit') {
      updated.contractEndDate = calculateEndDate(
        field === 'contractStartDate' ? String(value) : formWorker.contractStartDate,
        field === 'durationValue' ? Number(value) : formWorker.durationValue,
        field === 'durationUnit' ? String(value) as Worker['durationUnit'] : formWorker.durationUnit,
      );
    }
    setFormWorker(updated);
  };

  const saveWorker = () => {
    if (!formWorker.name.trim() || !formWorker.department.trim() || !formWorker.tinNumber.trim() || !formWorker.nidaNumber.trim() || !formWorker.email.trim() || !formWorker.phone.trim() || !formWorker.contractStartDate.trim() || !formWorker.contractEndDate.trim()) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    if (formMode === 'add') {
      const newWorker = { ...formWorker, id: `worker-${Date.now()}` };
      setWorkers((current) => [newWorker, ...current]);
      notifySystem('Worker added', `${newWorker.name} was added to the team.`);
      showToast(`Worker "${newWorker.name}" added successfully`, 'success');
    } else {
      setWorkers((current) =>
        current.map((worker) => (worker.id === formWorker.id ? { ...formWorker } : worker)),
      );
      if (selectedWorker?.id === formWorker.id) {
        setSelectedWorker(formWorker);
      }
      notifySystem('Worker updated', `${formWorker.name}'s record was updated.`);
      showToast(`Worker "${formWorker.name}" updated successfully`, 'success');
    }
    closeForm();
  };

  const deleteWorker = (workerId: string) => {
    const workerToDelete = workers.find((worker) => worker.id === workerId);
    setWorkers((current) => current.filter((worker) => worker.id !== workerId));
    if (selectedWorker?.id === workerId) {
      closeDetail();
    }
    if (workerToDelete) {
      notifySystem('Worker removed', `${workerToDelete.name} was removed from the team.`);
      showToast(`Worker "${workerToDelete.name}" deleted`, 'info');
    }
    setPendingDeleteWorkerId(null);
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm text-neutral-400 font-medium">{filteredWorkers.length} workers</p>
          <h2 className="text-2xl font-semibold">Team members</h2>
        </div>
        <button
          onClick={() => openForm('add')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white text-sm font-semibold hover:bg-neutral-900 transition-all duration-200 animate-book-button"
        >
          <Plus size={16} /> Add Worker
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => (
          <div
            key={worker.id}
            className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-sm font-semibold text-white">
                  {worker.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">{worker.name}</h3>
                  <p className="text-xs text-neutral-500">{worker.status}</p>
                </div>
              </div>
              <button
                onClick={() => openDetail(worker)}
                className="rounded-2xl border border-neutral-200 px-3 py-2 text-neutral-600 hover:bg-neutral-100 transition"
              >
                Details
              </button>
            </div>

            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-neutral-400" />
                <span className="truncate">{worker.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-neutral-400" />
                <span>{worker.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-neutral-400" />
                <span>{worker.department}</span>
              </div>
              <div className="text-sm text-neutral-500">
                <p className="font-medium text-neutral-700">Salary</p>
                <p>{worker.salary}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-neutral-50 p-4 text-sm">
              <div className="flex items-center justify-between text-neutral-500">
                <span>Start</span>
                <span>{worker.contractStartDate}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span>End</span>
                <span>{worker.contractEndDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteWorkerId !== null}
        title="Delete worker?"
        message="This worker record will be permanently removed from the team. Do you want to continue?"
        confirmText="Yes"
        cancelText="No"
        destructive
        onConfirm={() => {
          if (pendingDeleteWorkerId) deleteWorker(pendingDeleteWorkerId);
        }}
        onCancel={() => setPendingDeleteWorkerId(null)}
      />

      {detailOpen && selectedWorker ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl animate-book-modal">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Worker details</p>
                <h3 className="text-2xl font-semibold mt-2">{selectedWorker.name}</h3>
                <p className="text-sm text-neutral-500 mt-1">{selectedWorker.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    openForm('edit', selectedWorker);
                    setDetailOpen(false);
                  }}
                  className="rounded-3xl px-4 py-3 text-sm font-semibold text-neutral-700 border border-neutral-200 hover:bg-neutral-100 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setPendingDeleteWorkerId(selectedWorker.id)}
                  className="rounded-3xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-3xl bg-neutral-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">TIN number</p>
                <p className="mt-2 font-semibold text-neutral-900">{selectedWorker.tinNumber}</p>
              </div>
              <div className="rounded-3xl bg-neutral-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">NIDA number</p>
                <p className="mt-2 font-semibold text-neutral-900">{selectedWorker.nidaNumber}</p>
              </div>
              <div className="rounded-3xl bg-neutral-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Salary</p>
                <p className="mt-2 font-semibold text-neutral-900">{selectedWorker.salary}</p>
              </div>
              <div className="rounded-3xl bg-neutral-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Department</p>
                <p className="mt-2 font-semibold text-neutral-900">{selectedWorker.department}</p>
              </div>
              <div className="rounded-3xl bg-neutral-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Contact</p>
                <p className="mt-2 text-neutral-900">{selectedWorker.phone}</p>
                <p className="mt-1 text-neutral-900">{selectedWorker.otherPhone}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-3xl bg-neutral-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Contract start</p>
                <p className="mt-2 font-semibold text-neutral-900">{selectedWorker.contractStartDate}</p>
              </div>
              <div className="rounded-3xl bg-neutral-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Contract end</p>
                <p className="mt-2 font-semibold text-neutral-900">{selectedWorker.contractEndDate}</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-neutral-50 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Duration</p>
              <p className="mt-2 text-neutral-900">
                {selectedWorker.durationValue} {selectedWorker.durationUnit}
              </p>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={closeDetail}
                className="rounded-3xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl animate-book-modal">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">{formMode === 'add' ? 'New worker' : 'Edit worker'}</p>
                <h3 className="text-2xl font-semibold mt-2">{formMode === 'add' ? 'Add worker details' : 'Update worker details'}</h3>
              </div>
              <button
                onClick={closeForm}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Worker name
                <input
                  value={formWorker.name}
                  onChange={(event) => handleFormChange('name', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter worker name"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Email address
                <input
                  type="email"
                  value={formWorker.email}
                  onChange={(event) => handleFormChange('email', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter email address"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                TIN number
                <input
                  value={formWorker.tinNumber}
                  onChange={(event) => handleFormChange('tinNumber', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter TIN number"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                NIDA number
                <input
                  value={formWorker.nidaNumber}
                  onChange={(event) => handleFormChange('nidaNumber', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter NIDA number"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Department
                <select
                  value={formWorker.department}
                  onChange={(event) => handleFormChange('department', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="">Choose department</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Phone number
                <input
                  value={formWorker.phone}
                  onChange={(event) => handleFormChange('phone', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter phone number"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Other phone
                <input
                  value={formWorker.otherPhone}
                  onChange={(event) => handleFormChange('otherPhone', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Optional other phone"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Salary amount
                <input
                  value={formWorker.salary}
                  onChange={(event) => handleFormChange('salary', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="$0.00"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Contract start date
                <input
                  type="date"
                  value={formWorker.contractStartDate}
                  onChange={(event) => handleFormChange('contractStartDate', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Duration
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={formWorker.durationValue}
                    onChange={(event) => handleFormChange('durationValue', Number(event.target.value))}
                    className="w-24 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  />
                  <select
                    value={formWorker.durationUnit}
                    onChange={(event) => handleFormChange('durationUnit', event.target.value as Worker['durationUnit'])}
                    className="flex-1 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  >
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Contract end date
                <input
                  type="date"
                  value={formWorker.contractEndDate}
                  readOnly
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Status
                <select
                  value={formWorker.status}
                  onChange={(event) => handleFormChange('status', event.target.value as Worker['status'])}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="Contract">Contract</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </label>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeForm}
                className="rounded-3xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveWorker}
                className="rounded-3xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-900 transition"
              >
                {formMode === 'add' ? 'Save Worker' : 'Update Worker'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

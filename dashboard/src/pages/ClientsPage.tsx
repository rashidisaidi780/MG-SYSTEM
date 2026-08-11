import { useState } from 'react';
import { Plus, Mail, Phone, Edit3, Trash2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  otherPhone: string;
  tinNumber: string;
  status: 'Active' | 'Inactive' | 'Pending';
  date: string;
}

const initialClients: Client[] = [
  {
    id: 'acme',
    name: 'Acme Co.',
    company: 'Acme Company',
    contact: 'John Carter',
    email: 'john@acme.co',
    phone: '+1 555-0142',
    otherPhone: '+1 555-0143',
    tinNumber: 'TIN-783421',
    status: 'Active',
    date: '2026-07-10',
  },
  {
    id: 'nimbus',
    name: 'Nimbus Inc.',
    company: 'Nimbus Incorporated',
    contact: 'Emma Wilson',
    email: 'emma@nimbus.io',
    phone: '+1 555-0188',
    otherPhone: '+1 555-0189',
    tinNumber: 'TIN-684212',
    status: 'Active',
    date: '2026-06-24',
  },
  {
    id: 'lumen',
    name: 'Lumen Studio',
    company: 'Lumen Studio',
    contact: 'David Kim',
    email: 'david@lumen.studio',
    phone: '+1 555-0203',
    otherPhone: '+1 555-0204',
    tinNumber: 'TIN-521374',
    status: 'Pending',
    date: '2026-08-01',
  },
  {
    id: 'pulse',
    name: 'Pulse Media',
    company: 'Pulse Media',
    contact: 'Sophie Adams',
    email: 'sophie@pulse.media',
    phone: '+1 555-0312',
    otherPhone: '+1 555-0313',
    tinNumber: 'TIN-847193',
    status: 'Inactive',
    date: '2026-05-14',
  },
];

const emptyClient: Client = {
  id: '',
  name: '',
  company: '',
  contact: '',
  email: '',
  phone: '',
  otherPhone: '',
  tinNumber: '',
  status: 'Active',
  date: '',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formClient, setFormClient] = useState<Client>(emptyClient);

  const openForm = (mode: 'add' | 'edit', client?: Client) => {
    setFormMode(mode);
    setFormClient(client ? client : emptyClient);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormClient(emptyClient);
  };

  const handleChange = (field: keyof Client, value: string) => {
    setFormClient((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    if (
      !formClient.name.trim() ||
      !formClient.company.trim() ||
      !formClient.email.trim() ||
      !formClient.phone.trim() ||
      !formClient.tinNumber.trim() ||
      !formClient.date
    ) {
      return;
    }

    if (formMode === 'add') {
      setClients((current) => [
        { ...formClient, id: `client-${Date.now()}` },
        ...current,
      ]);
    } else {
      setClients((current) =>
        current.map((client) => (client.id === formClient.id ? { ...formClient } : client)),
      );
    }

    closeForm();
  };

  const handleDelete = (clientId: string) => {
    setClients((current) => current.filter((client) => client.id !== clientId));
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-sm text-neutral-400 font-medium">{clients.length} clients total</p>
          <h2 className="text-2xl font-semibold">Client management</h2>
        </div>
        <button
          onClick={() => openForm('add')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white text-sm font-semibold shadow-lg shadow-black/10 hover:bg-neutral-900 transition-all duration-200 animate-book-button"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-white border border-neutral-200 rounded-[28px] p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-sm font-semibold text-neutral-700">
                {client.name
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .slice(0, 2).toUpperCase()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openForm('edit', client)}
                  className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
                  title="Edit client"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete client"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-lg leading-tight mb-1">{client.name}</h3>
            <p className="text-sm text-neutral-500 mb-4">{client.company}</p>

            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-neutral-400" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-neutral-400" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-500">Alt:</span>
                <span>{client.otherPhone}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-neutral-100 text-xs text-neutral-500">
              <div className="rounded-3xl bg-neutral-50 px-3 py-2 text-center font-semibold text-neutral-700">
                {client.status}
              </div>
              <div className="rounded-3xl bg-neutral-50 px-3 py-2 text-center">
                {new Date(client.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl animate-book-modal">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">{formMode === 'add' ? 'New client' : 'Edit client'}</p>
                <h3 className="text-2xl font-semibold mt-2">{formMode === 'add' ? 'Add client details' : 'Update client details'}</h3>
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
                Client name
                <input
                  value={formClient.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter client name"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Company name
                <input
                  value={formClient.company}
                  onChange={(event) => handleChange('company', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter company name"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Email address
                <input
                  type="email"
                  value={formClient.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter email address"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Phone number
                <input
                  type="tel"
                  value={formClient.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter phone number"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Other phone
                <input
                  type="tel"
                  value={formClient.otherPhone}
                  onChange={(event) => handleChange('otherPhone', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Optional alternate phone"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                TIN number
                <input
                  value={formClient.tinNumber}
                  onChange={(event) => handleChange('tinNumber', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter TIN number"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Status
                <select
                  value={formClient.status}
                  onChange={(event) => handleChange('status', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Date
                <input
                  type="date"
                  value={formClient.date}
                  onChange={(event) => handleChange('date', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
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
                onClick={handleSave}
                className="rounded-3xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-900 transition"
              >
                {formMode === 'add' ? 'Save Client' : 'Update Client'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

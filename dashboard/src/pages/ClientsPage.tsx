import { useState, useMemo, useEffect } from 'react';
import { Plus, Mail, Phone, Download, Edit3, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { notifySystem } from '@/utils/systemNotifications';
import logoImg from '@/assets/logo.jpeg';
import darkLogoImg from '@/assets/Makezy_logo.jpeg';
import clientsService, { type Client as ServiceClient } from '@/services/clients';
import { authService } from '@/services/auth';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  otherPhone: string;
  tinNumber: string;
  address?: string;
  country?: string;
  status: 'Active' | 'Inactive' | 'Pending';
  date: string;
}

const initialClients: Client[] = [];

const emptyClient: Client = {
  id: '',
  name: '',
  company: '',
  email: '',
  phone: '',
  otherPhone: '',
  tinNumber: '',
  address: '',
  country: '',
  status: 'Active',
  date: '',
};

const toPageClient = (client: ServiceClient, otherPhone = ''): Client => ({
  ...client,
  otherPhone,
  tinNumber: client.tin,
});

const escapeHtml = (value: string | number | null | undefined) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export default function ClientsPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formClient, setFormClient] = useState<Client>(emptyClient);
  const [pendingDeleteClientId, setPendingDeleteClientId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!authService.hasPermission('Clients')) {
      setIsLoading(false);
      return;
    }

    void clientsService.getAll()
      .then((loadedClients) => setClients(loadedClients.map((client) => toPageClient(client))))
      .catch((error) => {
        if (error && typeof error === 'object' && 'status' in error && error.status === 403) return;
        showToast('Unable to load clients from the server', 'error');
      })
      .finally(() => setIsLoading(false));
  }, [showToast]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.company.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query),
    );
  }, [clients, searchQuery]);
  const openForm = (mode: 'add' | 'edit', client?: Client) => {
    setFormMode(mode);
    setFormClient(client ? client : emptyClient);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormClient(emptyClient);
  };

  const downloadClient = (client: Client) => {
    const reportWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!reportWindow) {
      showToast('Please allow pop-ups to download the client report as a PDF', 'warning');
      return;
    }

    const formattedDate = client.date
      ? new Date(client.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'Not provided';

    const reportLogo = localStorage.getItem('mg_theme') === 'dark' ? darkLogoImg : logoImg;
    reportWindow.document.write(`<!doctype html>
      <html><head><title>${escapeHtml(client.name)} - Client Details</title><style>
        @page { size: A4; margin: 14mm; }
        * { box-sizing: border-box; }
        body { position: relative; margin: 0; color: #171717; font-family: Arial, Helvetica, sans-serif; background: #fff; }
        .watermark { position: fixed; z-index: 0; width: 135mm; height: 135mm; object-fit: contain; left: 50%; top: 50%; transform: translate(-50%, -50%); opacity: .045; }
        header, .intro, .client, footer { position: relative; z-index: 1; }
        header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 8mm; border-bottom: 2px solid #171717; }
        h1 { margin: 0 0 5px; font-size: 27px; letter-spacing: .5px; }
        h2 { margin: 0; font-size: 20px; }
        p { margin: 0; line-height: 1.5; }
        .muted { color: #737373; font-size: 11px; }
        .meta { text-align: right; color: #737373; font-size: 10px; line-height: 1.6; }
        .intro { padding: 7mm 0 5mm; font-size: 12px; color: #525252; }
        .client { page-break-inside: avoid; padding: 7mm; border: 1px solid #d4d4d4; border-radius: 10px; }
        .client-heading { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; padding-bottom: 5mm; border-bottom: 1px solid #e5e5e5; }
        .status { padding: 5px 9px; border-radius: 999px; background: #f5f5f5; font-size: 10px; font-weight: bold; white-space: nowrap; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm 12mm; padding: 7mm 0; }
        .label { display: block; margin-bottom: 5px; color: #737373; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; }
        .value { font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
        footer { margin-top: 8mm; padding-top: 4mm; border-top: 1px solid #e5e5e5; color: #737373; font-size: 9px; }
        @media print { body { background: #fff; } }
      </style></head><body><img class="watermark" src="${reportLogo}" alt="" />
        <header><div><h1>Client Details</h1><p class="muted">Makezy Group client directory</p></div><div class="meta"><div>Generated ${escapeHtml(new Date().toLocaleString())}</div><div>Client record</div></div></header>
        <p class="intro">Complete contact and account information for this client.</p>
        <main class="client">
          <div class="client-heading"><div><h2>${escapeHtml(client.name)}</h2><p class="muted">${escapeHtml(client.company)}</p></div><span class="status">${escapeHtml(client.status)}</span></div>
          <section class="details">
            <div><span class="label">Email</span><div class="value">${escapeHtml(client.email)}</div></div>
            <div><span class="label">Primary phone</span><div class="value">${escapeHtml(client.phone)}</div></div>
            <div><span class="label">Alternative phone</span><div class="value">${escapeHtml(client.otherPhone || 'Not provided')}</div></div>
            <div><span class="label">TIN number</span><div class="value">${escapeHtml(client.tinNumber)}</div></div>
            <div><span class="label">Address</span><div class="value">${escapeHtml(client.address || 'Not provided')}</div></div>
            <div><span class="label">Country</span><div class="value">${escapeHtml(client.country || 'Not provided')}</div></div>
            <div><span class="label">Client since</span><div class="value">${escapeHtml(formattedDate)}</div></div>
          </section>
        </main>
        <footer>Generated from the Makezy Group client directory.</footer>
        <script>const printReport = () => { window.focus(); window.print(); }; if (document.readyState === 'complete') printReport(); else { window.addEventListener('load', printReport, { once: true }); window.setTimeout(printReport, 1000); }</script>
      </body></html>`);
    reportWindow.document.close();
    showToast('Client report opened for PDF download', 'success');
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
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    const request = {
      name: formClient.name,
      email: formClient.email,
      phone: formClient.phone,
      company: formClient.company,
      tin: formClient.tinNumber,
      address: formClient.address ?? '',
      country: formClient.country ?? '',
      otherPhone: formClient.otherPhone,
      status: formClient.status,
      date: formClient.date,
    };
    const saveRequest = formMode === 'add'
      ? clientsService.create(request)
      : clientsService.update(formClient.id, request);

    void saveRequest
      .then((savedClient) => {
        const clientForPage: Client = toPageClient(savedClient, formClient.otherPhone);
        setClients((current) => formMode === 'add'
          ? [clientForPage, ...current]
          : current.map((client) => client.id === clientForPage.id ? clientForPage : client));
        notifySystem(formMode === 'add' ? 'Client added' : 'Client updated', `${clientForPage.name} ${formMode === 'add' ? 'was added to' : 'details were updated in'} the client directory.`);
        showToast(`Client "${clientForPage.name}" ${formMode === 'add' ? 'added' : 'updated'} successfully`, 'success');
        closeForm();
      })
      .catch(() => showToast('Unable to save the client to the server', 'error'));
  };

  const handleDelete = (clientId: string) => {
    const clientToDelete = clients.find((client) => client.id === clientId);
    void clientsService.delete(clientId)
      .then(() => {
        setClients((current) => current.filter((client) => client.id !== clientId));
        if (clientToDelete) {
          notifySystem('Client deleted', `${clientToDelete.name} was removed from the client directory.`);
          showToast(`Client "${clientToDelete.name}" deleted`, 'info');
        }
        setPendingDeleteClientId(null);
      })
      .catch(() => showToast('Unable to delete the client from the server', 'error'));
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-sm text-neutral-400 font-medium">{filteredClients.length} clients total</p>
          <h2 className="text-2xl font-semibold">Client management</h2>
        </div>
        <button
          data-mutation-control
          onClick={() => openForm('add')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white text-sm font-semibold shadow-lg shadow-black/10 hover:bg-neutral-900 transition-all duration-200 animate-book-button"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      {isLoading ? <p className="text-sm text-neutral-500">Loading clients...</p> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
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
                  onClick={() => downloadClient(client)}
                  className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
                  title="Download client details"
                  aria-label={`Download ${client.name} details`}
                >
                  <Download size={16} />
                </button>
                <button
                  data-mutation-control
                  onClick={() => openForm('edit', client)}
                  className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
                  title="Edit client"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  data-mutation-control
                  onClick={() => setPendingDeleteClientId(client.id)}
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

      <ConfirmDialog
        open={pendingDeleteClientId !== null}
        title="Delete client?"
        message="This client will be removed from the system. Do you want to continue?"
        confirmText="Yes"
        cancelText="No"
        destructive
        onConfirm={() => {
          if (pendingDeleteClientId) handleDelete(pendingDeleteClientId);
        }}
        onCancel={() => setPendingDeleteClientId(null)}
      />

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
                Client name / company name
                <input
                  value={formClient.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter client name"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Company address
                <input
                  value={formClient.company}
                  onChange={(event) => handleChange('company', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter company address"
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
                Address
                <input
                  value={formClient.address ?? ''}
                  onChange={(event) => handleChange('address', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter client address"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Country
                <input
                  value={formClient.country ?? ''}
                  onChange={(event) => handleChange('country', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter country"
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
                data-mutation-control
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

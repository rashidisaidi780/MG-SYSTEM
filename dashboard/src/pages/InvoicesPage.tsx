import { useState, useMemo, useEffect, type MouseEvent } from 'react';
import { Plus, Download, MoreHorizontal, Edit3, Eye, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { notifySystem } from '@/utils/systemNotifications';
import logoImg from '@/assets/logo.jpeg';
import invoicesService, { type Invoice as ServiceInvoice } from '@/services/invoices';
import clientsService, { type Client as ServiceClient } from '@/services/clients';
import { authService } from '@/services/auth';
import { TableLoadingState } from '@/components/LoadingState';

const companyProfile = {
  name: 'MAKEZY GROUP',
  email: 'info@makezygroup.co.tz',
  location: 'Dar es Salaam, Tanzania',
  phone: '+255 758 018 277 | +255 679 763 448',
  website: 'www.makezygroup.co.tz',
  poBox: 'P.O. Box 18124, Dar es Salaam, Tanzania',
  tin: '190172554',
  bankName: 'SELCOM LIPA  | YAS LIPA',
  bankAccountNumber: '7005-9500 | 4536-3645',
  bankAccountName: 'RASHID SAID RASHIDI',
  bankBranch: 'Tanzania',
};

interface Invoice {
  id: string;
  client: string;
  company?: string;
  tin?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  items?: { desc: string; quantity: number; amount: number }[];
  amount: string;
  paidAmount?: number;
  date: string;
  due: string;
  issuedRaw?: string;
  dueRaw?: string;
  status: 'Paid' | 'Pending' | 'Overdue'| 'Canceled';
  notes?: string;
}

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
}

const toPageClient = (client: ServiceClient): Client => ({
  id: client.id,
  name: client.name,
  company: client.company,
  email: client.email,
  phone: client.phone,
  otherPhone: '',
  tinNumber: client.tin,
  address: client.address,
  country: client.country,
});

const getInvoiceSaveError = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'details' in error) {
    const details = (error as { details?: { errors?: Record<string, string[]> } }).details;
    const messages = details?.errors ? Object.values(details.errors).flat() : [];
    if (messages.length) return messages.join(' ');
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Unable to save the invoice to the server';
};

const initialInvoices: Invoice[] = [];
/*
  {
    id: 'INV-2043',
    client: 'Acme Co.',
    company: 'Acme Company',
    tin: 'TIN-783421',
    email: 'john@acme.co',
    phone: '+1 555-0142',
    address: '123 Main St, Suite 300',
    country: 'USA',
    items: [{ desc: 'Design', quantity: 1, amount: 8400 }],
    amount: 'Tsh 8,400',
    date: 'Aug 10, 2026',
    issuedRaw: '2026-08-10',
    due: 'Aug 24, 2026',
    dueRaw: '2026-08-24',
    status: 'Paid',
    notes: 'Initial design phase',
  },
  {
    id: 'INV-2042',
    client: 'Nimbus Inc.',
    company: 'Nimbus Incorporated',
    tin: 'TIN-684212',
    email: 'emma@nimbus.io',
    phone: '+1 555-0188',
    address: '456 Commerce Ave',
    country: 'USA',
    items: [{ desc: 'Development', quantity: 1, amount: 15200 }],
    amount: 'Tsh 15,200',
    date: 'Aug 08, 2026',
    issuedRaw: '2026-08-08',
    due: 'Aug 22, 2026',
    dueRaw: '2026-08-22',
    status: 'Pending',
    notes: 'Backend development milestone',
  },
]; */

const statusStyles: Record<Invoice['status'], string> = {
  Paid: 'bg-green-50 text-green-700',
  Pending: 'bg-amber-50 text-amber-700',
  Overdue: 'bg-red-50 text-red-700',
  Canceled: 'bg-gray-50 text-gray-700',
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);

const getItemsTotal = (items: Invoice['items'], fallbackAmount = 0) =>
  items?.length
    ? items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.amount) || 0), 0)
    : fallbackAmount;

  const toPageInvoice = (invoice: ServiceInvoice): Invoice => invoice;

export default function InvoicesPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDeleteInvoiceId, setPendingDeleteInvoiceId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    void invoicesService.getAll()
      .then((loadedInvoices) => setInvoices(loadedInvoices.map(toPageInvoice)))
      .catch(() => showToast('Unable to load invoices from the server', 'error'))
      .finally(() => setIsLoadingInvoices(false));
  }, [showToast]);

  useEffect(() => {
    if (!authService.hasPermission('Clients')) return;

    void clientsService.getAll()
      .then((loadedClients) => setClients(loadedClients.map(toPageClient)))
      .catch((error) => {
        if (error && typeof error === 'object' && 'status' in error && error.status === 403) return;
        showToast('Unable to load clients from the server', 'error');
      });
  }, [showToast]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const query = searchQuery.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.id.toLowerCase().includes(query) ||
        invoice.client.toLowerCase().includes(query) ||
        invoice.status.toLowerCase().includes(query),
    );
  }, [invoices, searchQuery]);

  const [createForm, setCreateForm] = useState({
    invoiceId: '',
    clientId: '',
    company: '',
    tin: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    items: [{ desc: '', quantity: 1, amount: 0 }],
    paidAmount: 0,
    notes: '',
    issued: new Date().toISOString().slice(0, 10),
    due: new Date().toISOString().slice(0, 10),
  });

  const selectedClient = clients.find((client) => client.id === createForm.clientId);

  const selectClient = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);
    setCreateForm((current) => ({
      ...current,
      clientId,
      company: client?.company ?? '',
      tin: client?.tinNumber ?? '',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      address: client?.address ?? '',
      country: client?.country ?? '',
    }));
  };

  const toggleMenu = (id: string, event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const next = openMenu === id ? null : id;

    if (!next) {
      setOpenMenu(null);
      setMenuPosition(null);
      return;
    }

    const menuWidth = 192;
    const menuHeight = 184;
    const margin = 12;
    const left = Math.min(
      rect.right - 8 + window.scrollX,
      window.scrollX + window.innerWidth - menuWidth - margin,
    );

    const enoughBelow = window.innerHeight - rect.bottom >= menuHeight + margin;
    const top = enoughBelow
      ? rect.bottom + 8 + window.scrollY
      : Math.max(window.scrollY + margin, rect.top - menuHeight - 8 + window.scrollY);

    setOpenMenu(next);
    setMenuPosition({ left, top });
  };

  const handleView = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (inv) setViewInvoice(inv);
    setOpenMenu(null);
  };

  const handleEdit = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (inv) setEditInvoice(inv);
    setOpenMenu(null);
  };

  const handleDownload = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    const items = inv.items?.length ? inv.items : [{ desc: 'Services', quantity: 1, amount: Number(inv.amount.replace(/[^0-9.-]+/g, '')) || 0 }];
    const itemsTotal = items.reduce((sum, item) => sum + item.quantity * item.amount, 0);
    const invoiceWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!invoiceWindow) {
      showToast('Please allow pop-ups to download the invoice as a PDF.', 'warning');
      return;
    }

    invoiceWindow.document.write(`<!doctype html>
      <html><head><title>${escapeHtml(inv.id)} - Invoice</title>
      <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #171717; font-family: Arial, Helvetica, sans-serif; background: #f5f5f5; }
        .page { position: relative; width: 210mm; height: 297mm; margin: 0 auto; padding: 12mm 14mm 20mm; overflow: hidden; background: #fff; }
        .watermark { position: absolute; z-index: 0; width: 135mm; height: 135mm; object-fit: contain; left: 37mm; top: 78mm; opacity: .045; }
        .content { position: relative; z-index: 1; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 7mm; border-bottom: 2px solid #171717; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand img { width: 52px; height: 52px; object-fit: contain; }
        .brand-name { margin: 0; font-size: 21px; letter-spacing: 2px; }
        .muted { color: #737373; }
        .small { font-size: 9px; line-height: 1.45; }
        .title { text-align: right; }
        .title h1 { margin: 0 0 4px; font-size: 28px; letter-spacing: 1px; }
        .title p { margin: 2px 0; font-size: 10px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 14mm; padding: 7mm 0 6mm; }
        .label { margin-bottom: 3px; color: #737373; font-size: 8px; letter-spacing: 1.2px; text-transform: uppercase; }
        .value { font-size: 11px; line-height: 1.4; }
        table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
        th { padding: 7px 10px; color: #737373; background: #f5f5f5; font-size: 8px; letter-spacing: 1px; text-align: left; text-transform: uppercase; }
        td { padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 10px; }
        th:nth-child(n+2), td:nth-child(n+2) { text-align: right; }
        .total { display: flex; justify-content: flex-end; padding: 5mm 10px 6mm; border-bottom: 1px solid #171717; }
        .total-box { width: 72mm; }
        .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10px; }
        .grand-total { margin-top: 5px; padding-top: 6px; border-top: 1px solid #d4d4d4; font-size: 14px; font-weight: bold; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; padding-top: 7mm; }
        .detail-box { padding-top: 8px; border-top: 2px solid #171717; }
        .detail-box h2 { margin: 0 0 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .detail-box p { margin: 3px 0; font-size: 9px; line-height: 1.35; }
        .approval { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; margin-top: 8mm; padding-top: 6mm; border-top: 1px solid #d4d4d4; page-break-inside: avoid; }
        .approval-box { min-height: 25mm; }
        .approval-title { margin: 0 0 15mm; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .signature-line { width: 100%; padding-top: 4px; border-top: 1px solid #171717; font-size: 8px; color: #737373; }
        .stamp-area { height: 22mm; border: 1px dashed #a3a3a3; display: flex; align-items: center; justify-content: center; color: #a3a3a3; font-size: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .footer { position: absolute; bottom: 11mm; left: 14mm; right: 14mm; display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid #e5e5e5; font-size: 8px; color: #737373; }
        @media print { body { background: #fff; } .page { margin: 0; } }
      </style></head><body><main class="page">
        <img class="watermark" src="${logoImg}" alt="" />
        <div class="content">
          <header class="header">
            <div class="brand"><img src="${logoImg}" alt="${escapeHtml(companyProfile.name)} logo" /><div><h2 class="brand-name">${escapeHtml(companyProfile.name)}</h2><p class="small muted">${escapeHtml(companyProfile.location)}</p></div></div>
            <div class="title"><h1>INVOICE</h1><p><strong>${escapeHtml(inv.id)}</strong></p><p class="muted">${escapeHtml(inv.status)}</p></div>
          </header>
          <section class="meta">
            <div><div class="label">Billed to</div><div class="value"><strong>${escapeHtml(inv.company || inv.client)}</strong><br>${escapeHtml(inv.client)}<br>${escapeHtml(inv.address || '')}<br>${escapeHtml(inv.country || '')}<br>${escapeHtml(inv.email || '')} &nbsp; ${escapeHtml(inv.phone || '')}<br>TIN: ${escapeHtml(inv.tin || 'Not provided')}</div></div>
            <div><div class="label">Invoice details</div><div class="value">Issue date: <strong>${escapeHtml(inv.date)}</strong><br>Due date: <strong>${escapeHtml(inv.due)}</strong><br>Payment status: <strong>${escapeHtml(inv.status)}</strong></div></div>
          </section>
          <table><thead><tr><th>Description</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${items.map((item) => `<tr><td>${escapeHtml(item.desc || 'Service')}</td><td>${item.quantity}</td><td>${formatCurrency(item.amount)}</td><td>${formatCurrency(item.quantity * item.amount)}</td></tr>`).join('')}</tbody></table>
          <div class="total"><div class="total-box"><div class="total-row"><span>Subtotal</span><span>${formatCurrency(itemsTotal)}</span></div><div class="total-row grand-total"><span>Total: </span><span>${formatCurrency(itemsTotal)}</span></div></div></div>
          <section class="details"><div class="detail-box"><h2>Company details</h2><p>${escapeHtml(companyProfile.email)}</p><p>${escapeHtml(companyProfile.phone)} &nbsp; | &nbsp; ${escapeHtml(companyProfile.website)}</p><p>${escapeHtml(companyProfile.location)}</p><p>${escapeHtml(companyProfile.poBox)}</p><p><strong>TIN:</strong> ${escapeHtml(companyProfile.tin)}</p></div><div class="detail-box"><h2>Bank details</h2><p><strong>Bank:</strong> ${escapeHtml(companyProfile.bankName)}</p><p><strong>Account name:</strong> ${escapeHtml(companyProfile.bankAccountName)}</p><p><strong>Account number:</strong> ${escapeHtml(companyProfile.bankAccountNumber)}</p><p><strong>Branch:</strong> ${escapeHtml(companyProfile.bankBranch)}</p></div></section>
          ${inv.notes ? `<p class="small muted" style="margin: 6mm 0 0"><strong>Notes:</strong> ${escapeHtml(inv.notes).replace(/\n/g, '<br>')}</p>` : ''}
          <section class="approval"><div class="approval-box"><p class="approval-title">Authorized signature</p><div class="signature-line">Name and signature</div></div><div class="approval-box"><p class="approval-title">Company stamp</p><div class="stamp-area">Stamp</div></div></section>
        </div><footer class="footer"><span>Thank you for your business.</span><span>${escapeHtml(companyProfile.website)}</span></footer>
      </main><script>
        const printInvoice = () => { window.focus(); window.print(); };
        if (document.readyState === 'complete') {
          printInvoice();
        } else {
          window.addEventListener('load', printInvoice, { once: true });
          window.setTimeout(printInvoice, 1000);
        }
      </script></body></html>`);
    invoiceWindow.document.close();
    setOpenMenu(null);
    showToast(`${inv.id} opened for PDF download`, 'success');
  };

  const handleDownloadQuotation = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    const items = inv.items?.length ? inv.items : [{ desc: 'Services', quantity: 1, amount: Number(inv.amount.replace(/[^0-9.-]+/g, '')) || 0 }];
    const itemsTotal = items.reduce((sum, item) => sum + item.quantity * item.amount, 0);
    const quotationWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!quotationWindow) {
      showToast('Please allow pop-ups to download the quotation.', 'warning');
      return;
    }

    quotationWindow.document.write(`<!doctype html>
      <html><head><title>${escapeHtml(inv.id)} - Quotation</title>
      <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #111827; font-family: Arial, Helvetica, sans-serif; background: #f8fafc; }
        .page { position: relative; width: 210mm; height: 297mm; margin: 0 auto; padding: 12mm 14mm 20mm; overflow: hidden; background: #fff; }
        .watermark { position: absolute; z-index: 0; width: 135mm; height: 135mm; object-fit: contain; left: 37mm; top: 78mm; opacity: .045; }
        .content { position: relative; z-index: 1; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 7mm; border-bottom: 2px solid #0f172a; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand img { width: 54px; height: 54px; object-fit: contain; border-radius: 12px; }
        .brand-name { margin: 0; font-size: 22px; letter-spacing: 2px; }
        .muted { color: #475569; }
        .small { font-size: 9px; line-height: 1.45; }
        .title { text-align: right; }
        .title h1 { margin: 0 0 4px; font-size: 28px; letter-spacing: 1px; }
        .title p { margin: 2px 0; font-size: 10px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 14mm; padding: 7mm 0 6mm; }
        .label { margin-bottom: 3px; color: #475569; font-size: 8px; letter-spacing: 1.2px; text-transform: uppercase; }
        .value { font-size: 11px; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
        th { padding: 7px 10px; color: #475569; background: #f8fafc; font-size: 8px; letter-spacing: 1px; text-align: left; text-transform: uppercase; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
        th:nth-child(n+2), td:nth-child(n+2) { text-align: right; }
        .total { display: flex; justify-content: flex-end; padding: 5mm 10px 6mm; border-bottom: 1px solid #0f172a; }
        .total-box { width: 72mm; }
        .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10px; }
        .grand-total { margin-top: 5px; padding-top: 6px; border-top: 1px solid #d4d4d4; font-size: 14px; font-weight: bold; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; padding-top: 7mm; }
        .detail-box { padding-top: 8px; border-top: 2px solid #0f172a; }
        .detail-box h2 { margin: 0 0 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .detail-box p { margin: 3px 0; font-size: 9px; line-height: 1.35; }
        .terms { margin-top: 7mm; padding-top: 5mm; border-top: 1px solid #e2e8f0; font-size: 9px; line-height: 1.6; color: #475569; }
        .footer { position: absolute; bottom: 11mm; left: 14mm; right: 14mm; display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 8px; color: #64748b; }
        @media print { body { background: #fff; } .page { margin: 0; } }
      </style></head><body><main class="page">
        <img class="watermark" src="${logoImg}" alt="" />
        <div class="content">
          <header class="header">
            <div class="brand"><img src="${logoImg}" alt="${escapeHtml(companyProfile.name)} logo" /><div><h2 class="brand-name">${escapeHtml(companyProfile.name)}</h2><p class="small muted">${escapeHtml(companyProfile.location)}</p></div></div>
            <div class="title"><h1>QUOTATION</h1><p><strong>${escapeHtml(inv.id)}</strong></p><p class="muted">Valid until ${escapeHtml(inv.due || 'Not specified')}</p></div>
          </header>
          <section class="meta">
            <div><div class="label">Quoted to</div><div class="value"><strong>${escapeHtml(inv.company || inv.client)}</strong><br>${escapeHtml(inv.client)}<br>${escapeHtml(inv.address || '')}<br>${escapeHtml(inv.country || '')}<br>${escapeHtml(inv.email || '')} &nbsp; ${escapeHtml(inv.phone || '')}<br>TIN: ${escapeHtml(inv.tin || 'Not provided')}</div></div>
            <div><div class="label">Quotation details</div><div class="value">Issue date: <strong>${escapeHtml(inv.date || 'Not provided')}</strong><br>Valid until: <strong>${escapeHtml(inv.due || 'Not provided')}</strong><br>Reference: <strong>${escapeHtml(inv.id)}</strong></div></div>
          </section>
          <table><thead><tr><th>Description</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${items.map((item) => `<tr><td>${escapeHtml(item.desc || 'Service')}</td><td>${item.quantity}</td><td>${formatCurrency(item.amount)}</td><td>${formatCurrency(item.quantity * item.amount)}</td></tr>`).join('')}</tbody></table>
          <div class="total"><div class="total-box"><div class="total-row"><span>Subtotal</span><span>${formatCurrency(itemsTotal)}</span></div><div class="total-row grand-total"><span>Total estimate: </span><span>${formatCurrency(itemsTotal)}</span></div></div></div>
          <section class="details"><div class="detail-box"><h2>Contact info</h2><p>${escapeHtml(companyProfile.email)}</p><p>${escapeHtml(companyProfile.phone)}</p><p>${escapeHtml(companyProfile.website)}</p><p>${escapeHtml(companyProfile.poBox)}</p></div><div class="detail-box"><h2>Regards</h2><p>${escapeHtml(companyProfile.name)}</p><p>We appreciate the opportunity to provide this quotation.</p><p>All pricing is subject to confirmation and project scope approval.</p></div></section>
          <div class="terms"><strong>Terms:</strong> This quotation is prepared for review and pricing discussion. Final scope, timeline, and payment conditions may be adjusted after formal acceptance by the client.</div>
        </div><footer class="footer"><span>Thank you.</span><span>${escapeHtml(companyProfile.website)}</span></footer>
      </main><script>
        const printQuotation = () => { window.focus(); window.print(); };
        if (document.readyState === 'complete') {
          printQuotation();
        } else {
          window.addEventListener('load', printQuotation, { once: true });
          window.setTimeout(printQuotation, 1000);
        }
      </script></body></html>`);
    quotationWindow.document.close();
    setOpenMenu(null);
    showToast(`${inv.id} quotation opened for download`, 'success');
  };

  const saveEdit = () => {
    if (!editInvoice) return;
    const total = getItemsTotal(editInvoice.items, Number(editInvoice.amount.replace(/[^0-9.-]+/g, '')) || 0);
    const paidAmount = editInvoice.status === 'Paid'
      ? total
      : Math.min(Math.max(0, Number(editInvoice.paidAmount) || 0), total);
    void invoicesService.update(editInvoice.id, {
      id: editInvoice.id,
      client: editInvoice.client,
      company: editInvoice.company,
      tin: editInvoice.tin,
      email: editInvoice.email,
      phone: editInvoice.phone,
      address: editInvoice.address,
      country: editInvoice.country,
      items: editInvoice.items ?? [],
      date: editInvoice.issuedRaw ?? '',
      due: editInvoice.dueRaw ?? '',
      status: editInvoice.status,
      paidAmount,
      notes: editInvoice.notes,
    })
      .then((savedInvoice) => {
        setInvoices((current) => current.map((invoice) => invoice.id === savedInvoice.id ? toPageInvoice(savedInvoice) : invoice));
        setEditInvoice(null);
        showToast(`Invoice "${savedInvoice.id}" updated successfully`, 'success');
      })
      .catch((error) => showToast(getInvoiceSaveError(error), 'error'));
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${y}-${m}-`;
    const highestSequence = invoices
      .filter((invoice) => invoice.id.startsWith(prefix))
      .map((invoice) => Number(invoice.id.slice(prefix.length)))
      .filter((sequence) => Number.isFinite(sequence))
      .reduce((highest, sequence) => Math.max(highest, sequence), 0);
    const num = String(highestSequence + 1).padStart(3, '0');
    return `${prefix}${num}`;
  };

  const openCreate = () => {
    const id = generateInvoiceNumber();
    setCreateForm((f) => ({ ...f, invoiceId: id }));
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateForm({
      invoiceId: '',
      clientId: '',
      company: '',
      tin: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      items: [{ desc: '', quantity: 1, amount: 0 }],
      paidAmount: 0,
      notes: '',
      issued: new Date().toISOString().slice(0, 10),
      due: new Date().toISOString().slice(0, 10),
    });
  };

  const addItem = () => setCreateForm((f) => ({ ...f, items: [...f.items, { desc: '', quantity: 1, amount: 0 }] }));
  const removeItem = (idx: number) => setCreateForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx: number, field: 'desc' | 'quantity' | 'amount', value: string) => {
    setCreateForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, [field]: field === 'desc' ? value : Number(value) } : it)) }));
  };

  const formatCurrency = (v: number) => `Tsh ${new Intl.NumberFormat('en-TZ', { maximumFractionDigits: 0 }).format(v)}`;

  const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

  const saveCreate = () => {
    if (!createForm.invoiceId || !selectedClient || !createForm.items.length) {
      showToast('Please enter an invoice number, client, and at least one item', 'warning');
      return;
    }
    const total = getItemsTotal(createForm.items);
    const paidAmount = Math.min(Math.max(0, Number(createForm.paidAmount) || 0), total);
    const newInv: Invoice = {
      id: createForm.invoiceId,
      client: selectedClient.name,
      company: createForm.company,
      tin: createForm.tin,
      email: createForm.email,
      phone: createForm.phone,
      address: createForm.address,
      country: createForm.country,
      items: createForm.items,
      amount: formatCurrency(total),
      paidAmount,
      date: formatDate(createForm.issued),
      issuedRaw: createForm.issued,
      due: formatDate(createForm.due),
      dueRaw: createForm.due,
      status: 'Pending',
      notes: createForm.notes.trim(),
    };
    void invoicesService.create({
      id: newInv.id,
      clientId: createForm.clientId,
      client: newInv.client,
      company: newInv.company,
      tin: newInv.tin,
      email: newInv.email,
      phone: newInv.phone,
      address: newInv.address,
      country: newInv.country,
      items: newInv.items ?? [],
      date: createForm.issued,
      due: createForm.due,
      notes: newInv.notes,
    })
      .then((savedInvoice) => {
        setInvoices((current) => [toPageInvoice(savedInvoice), ...current]);
        notifySystem('Invoice created', `${savedInvoice.id} was created for ${savedInvoice.client}.`);
        showToast(`Invoice "${savedInvoice.id}" created successfully`, 'success');
        closeCreate();
      })
      .catch((error) => showToast(getInvoiceSaveError(error), 'error'));
  };

  const handleDelete = (id: string) => {
    const deletedInvoice = invoices.find((x) => x.id === id);
    void invoicesService.delete(id)
      .then(() => {
        setInvoices((cur) => cur.filter((x) => x.id !== id));
        if (deletedInvoice) {
          notifySystem('Invoice deleted', `${deletedInvoice.id} was deleted from the invoices list.`);
          showToast(`Invoice "${deletedInvoice.id}" deleted`, 'info');
        }
        setOpenMenu(null);
        setPendingDeleteInvoiceId(null);
      })
      .catch(() => showToast('Unable to delete the invoice from the server', 'error'));
  };

  const createTotal = getItemsTotal(createForm.items);
  const editTotal = editInvoice
    ? getItemsTotal(editInvoice.items, Number(editInvoice.amount.replace(/[^0-9.-]+/g, '')) || 0)
    : 0;
  const editRemaining = editInvoice
    ? Math.max(0, editTotal - (Number(editInvoice.paidAmount) || 0))
    : 0;

  return (
    <div className="p-8 animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400 font-medium">{filteredInvoices.length} invoices</p>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition-colors">
            <Download size={15} /> Export
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors">
            <Plus size={16} /> Create Invoice
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {isLoadingInvoices && invoices.length === 0 ? (
          <TableLoadingState columns={7} label="Loading invoices" />
        ) : <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Invoice</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Client</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Issued</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Due Date</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-4 font-semibold">{inv.id}</td>
                  <td className="px-5 py-4 text-neutral-600">{inv.client}</td>
                  <td className="px-5 py-4 font-medium">{inv.amount}</td>
                  <td className="px-5 py-4 text-neutral-600">{inv.date}</td>
                  <td className="px-5 py-4 text-neutral-600">{inv.due}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right relative">
                    <button className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors" onClick={(e) => toggleMenu(inv.id, e)}>
                      <MoreHorizontal size={16} className="text-neutral-400" />
                    </button>
                    {openMenu === inv.id && menuPosition ? (
                      <div className="fixed z-50 w-48 rounded-xl bg-white border border-neutral-200 shadow-lg py-2" style={{ left: menuPosition.left, top: menuPosition.top }}>
                        <div className="px-3 py-2 text-xs text-neutral-400">Action</div>
                        <button onClick={() => handleView(inv.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">
                          <Eye size={14} /> View
                        </button>
                        <button data-mutation-control onClick={() => handleEdit(inv.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">
                          <Edit3 size={14} /> Update
                        </button>
                        <button data-mutation-control onClick={() => setPendingDeleteInvoiceId(inv.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2 text-red-600">
                          <Trash2 size={14} /> Delete
                        </button>
                        <button onClick={() => handleDownload(inv.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">
                          <Download size={14} /> Download Invoice
                        </button>
                        <button onClick={() => handleDownloadQuotation(inv.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">
                          <Download size={14} /> Download Quotation
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>

      <ConfirmDialog
        open={pendingDeleteInvoiceId !== null}
        title="Delete invoice?"
        message="This invoice will be permanently removed. Do you want to continue?"
        confirmText="Yes"
        cancelText="No"
        destructive
        onConfirm={() => {
          if (pendingDeleteInvoiceId) handleDelete(pendingDeleteInvoiceId);
        }}
        onCancel={() => setPendingDeleteInvoiceId(null)}
      />

      {viewInvoice ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">View invoice</p>
                <h3 className="text-xl font-semibold mt-1">{viewInvoice.id}</h3>
                <p className="text-sm text-neutral-500 mt-1">{viewInvoice.client} — {viewInvoice.company}</p>
              </div>
              <button onClick={() => setViewInvoice(null)} className="text-sm text-neutral-600 hover:bg-neutral-100 rounded-2xl px-3 py-2">Close</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-neutral-400">Client</div>
                  <div className="font-medium">{viewInvoice.client}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Invoice #</div>
                  <div className="font-medium">{viewInvoice.id}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Issued</div>
                  <div className="font-medium">{viewInvoice.date}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Due</div>
                  <div className="font-medium">{viewInvoice.due}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Status</div>
                  <div className="font-medium">{viewInvoice.status}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Amount</div>
                <div className="font-medium">{viewInvoice.amount}</div>
              </div>
              {viewInvoice.status === 'Paid' ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-neutral-400">Paid amount</div>
                    <div className="font-medium">{formatCurrency(viewInvoice.paidAmount ?? 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Remaining</div>
                    <div className="font-medium">{formatCurrency(Math.max(0, getItemsTotal(viewInvoice.items, Number(viewInvoice.amount.replace(/[^0-9.-]+/g, '')) || 0) - (viewInvoice.paidAmount ?? 0)))}</div>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs text-neutral-400">Company</div>
                  <div className="font-medium">{viewInvoice.company}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">TIN</div>
                  <div className="font-medium">{viewInvoice.tin}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Email</div>
                  <div className="font-medium">{viewInvoice.email}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Phone</div>
                  <div className="font-medium">{viewInvoice.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Address</div>
                  <div className="font-medium">{viewInvoice.address}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Country</div>
                  <div className="font-medium">{viewInvoice.country}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Items</div>
                <ul className="list-disc pl-5 text-sm text-neutral-700">
                  {(viewInvoice.items || []).map((it, i) => (
                    <li key={i}>{it.desc} — {it.quantity} x {formatCurrency(it.amount)} = {formatCurrency(it.quantity * it.amount)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Notes</div>
                <pre className="whitespace-pre-wrap text-sm text-neutral-600">{viewInvoice.notes ?? 'No notes'}</pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editInvoice ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Edit invoice</p>
                <h3 className="text-xl font-semibold mt-1">{editInvoice.id}</h3>
              </div>
              <button onClick={() => setEditInvoice(null)} className="text-sm text-neutral-600 hover:bg-neutral-100 rounded-2xl px-3 py-2">Cancel</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm">
                Client
                <input value={editInvoice.client} onChange={(e) => setEditInvoice({ ...editInvoice, client: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Company
                  <input value={editInvoice.company ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, company: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
                <label className="text-sm">
                  TIN
                  <input value={editInvoice.tin ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, tin: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Email
                  <input value={editInvoice.email ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, email: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
                <label className="text-sm">
                  Phone
                  <input value={editInvoice.phone ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, phone: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Address
                  <input value={editInvoice.address ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, address: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
                <label className="text-sm">
                  Country
                  <input value={editInvoice.country ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, country: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
              </div>
              <label className="text-sm">
                Items
                <div className="space-y-2 mt-1">
                  {(editInvoice.items || []).map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input value={it.desc} onChange={(e) => setEditInvoice({ ...editInvoice, items: (editInvoice.items || []).map((x, i) => i === idx ? { ...x, desc: e.target.value } : x) })} className="flex-1 rounded-2xl border border-neutral-200 px-3 py-2" />
                      <input aria-label="Quantity" type="number" min="1" value={it.quantity} onChange={(e) => setEditInvoice({ ...editInvoice, items: (editInvoice.items || []).map((x, i) => i === idx ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x) })} className="w-24 rounded-2xl border border-neutral-200 px-3 py-2" />
                      <input value={String(it.amount)} onChange={(e) => setEditInvoice({ ...editInvoice, items: (editInvoice.items || []).map((x, i) => i === idx ? { ...x, amount: Number(e.target.value) } : x) })} className="w-32 rounded-2xl border border-neutral-200 px-3 py-2" />
                    </div>
                  ))}
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Issued date
                  <input type="date" value={editInvoice.issuedRaw ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, issuedRaw: e.target.value, date: formatDate(e.target.value) })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
                <label className="text-sm">
                  Due date
                  <input type="date" value={editInvoice.dueRaw ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, dueRaw: e.target.value, due: formatDate(e.target.value) })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
              </div>
              <label className="text-sm">
                Status
                <select value={editInvoice.status} onChange={(e) => {
                  const status = e.target.value as Invoice['status'];
                  setEditInvoice({ ...editInvoice, status, paidAmount: status === 'Paid' ? editTotal : editInvoice.paidAmount });
                }} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1">
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </label>
              {editInvoice.status === 'Paid' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <div className="text-xs text-neutral-400">Total amount</div>
                    <div className="mt-1 font-semibold">{formatCurrency(editTotal)}</div>
                  </div>
                  <label className="text-sm">
                    Paid amount
                    <input type="number" min="0" max={editTotal} value={editInvoice.paidAmount ?? 0} onChange={(e) => setEditInvoice({ ...editInvoice, paidAmount: Math.min(Math.max(0, Number(e.target.value) || 0), editTotal) })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                  </label>
                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <div className="text-xs text-neutral-400">Remaining</div>
                    <div className="mt-1 font-semibold">{formatCurrency(editRemaining)}</div>
                  </div>
                </div>
              ) : null}
              <label className="text-sm">
                Notes
                <textarea value={editInvoice.notes ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, notes: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setEditInvoice(null)} className="rounded-3xl border border-neutral-200 px-4 py-2">Cancel</button>
              <button data-mutation-control onClick={saveEdit} className="rounded-3xl bg-black text-white px-4 py-2">Save</button>
            </div>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Create invoice</p>
                <h3 className="text-xl font-semibold mt-1">{createForm.invoiceId || 'New invoice'}</h3>
              </div>
              <button onClick={closeCreate} className="text-sm text-neutral-600 hover:bg-neutral-100 rounded-2xl px-3 py-2">Cancel</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                Invoice number
                <input value={createForm.invoiceId} readOnly className="w-full rounded-2xl border border-neutral-200 px-3 py-2 bg-neutral-50" />
              </label>
              <label className="space-y-2 text-sm">
                Client / company name
                <select value={createForm.clientId} onChange={(e) => selectClient(e.target.value)} className="w-full rounded-2xl border border-neutral-200 px-3 py-2">
                  <option value="" disabled>Select a client</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                Company address
                <input value={createForm.company} readOnly className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm">
                TIN number
                <input value={createForm.tin} readOnly className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm">
                Email
                <input value={createForm.email} readOnly className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm">
                Phone
                <input value={createForm.phone} readOnly className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm">
                Address
                <input value={createForm.address} readOnly className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm">
                Country
                <input value={createForm.country} readOnly className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2" />
              </label>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium mb-2">Items</p>
                <div className="space-y-3">
                  {createForm.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input placeholder="Description" value={it.desc} onChange={(e) => updateItem(idx, 'desc', e.target.value)} className="flex-1 rounded-2xl border border-neutral-200 px-3 py-2" />
                      <input aria-label="Quantity" placeholder="Qty" type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className="w-20 rounded-2xl border border-neutral-200 px-3 py-2" />
                      <input aria-label="Unit price" placeholder="Unit price" type="number" min="0" value={it.amount} onChange={(e) => updateItem(idx, 'amount', e.target.value)} className="w-32 rounded-2xl border border-neutral-200 px-3 py-2" />
                      <button onClick={() => removeItem(idx)} className="p-2 text-red-500 rounded-lg">Remove</button>
                    </div>
                  ))}
                  <div className="mt-3 flex items-center justify-between gap-4 border-t border-neutral-100 pt-3">
                    <button onClick={addItem} className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-neutral-200">+ Add item</button>
                    <div className="text-right">
                      <div className="text-xs text-neutral-400">Total amount</div>
                      <div className="text-lg font-semibold">{formatCurrency(createTotal)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <label className="space-y-2 text-sm">
                Date issued
                <input type="date" value={createForm.issued} onChange={(e) => setCreateForm((f) => ({ ...f, issued: e.target.value }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm">
                Due date
                <input type="date" value={createForm.due} onChange={(e) => setCreateForm((f) => ({ ...f, due: e.target.value }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm sm:col-span-2">
                Notes (optional)
                <textarea value={createForm.notes} onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Add a note for this invoice" className="w-full min-h-20 rounded-2xl border border-neutral-200 px-3 py-2" />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={closeCreate} className="rounded-3xl border border-neutral-200 px-4 py-2">Cancel</button>
              <button data-mutation-control onClick={saveCreate} className="rounded-3xl bg-black text-white px-4 py-2">Save invoice</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

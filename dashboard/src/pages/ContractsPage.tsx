import { useMemo, useState } from 'react';
import { BriefcaseBusiness, Building2, FileText, Printer, UserRoundCheck } from 'lucide-react';
import logoImg from '@/assets/logo.jpeg';

const contractTypes = {
  client: {
    label: 'Client Contract',
    shortTitle: 'Client Service Agreement',
    heading: 'Client Service Agreement',
    party: 'Client',
    partyLabel: 'Client Information',
    intro: 'This agreement outlines the scope, responsibilities, and commercial terms for the services to be delivered to the client.',
    items: [
      'Scope of works and deliverables',
      'Timelines, milestones, and review approvals',
      'Payment terms and protected intellectual property',
      'Confidentiality and compliance obligations',
    ],
  },
  worker: {
    label: 'Worker Contract',
    shortTitle: 'Employment Contract',
    heading: 'Worker Employment Agreement',
    party: 'Worker',
    partyLabel: 'Worker Information',
    intro: 'This employment agreement defines the work arrangement, compensation, duties, and expectations between the company and the worker.',
    items: [
      'Role responsibilities and reporting structure',
      'Working schedule, location, and attendance expectations',
      'Compensation, leave, and performance review process',
      'Termination, confidentiality, and workplace compliance',
    ],
  },
} as const;

type ContractType = keyof typeof contractTypes;

const formatDate = (value: string) => {
  if (!value) return 'Not assigned';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const escapeHtml = (value: string | number | null | undefined) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export default function ContractsPage() {
  const [contractType, setContractType] = useState<ContractType>('client');
  const contract = contractTypes[contractType];
  const signatureDate = useMemo(() => formatDate(new Date().toISOString()), []);

  const openPrintableContract = () => {
    const reportWindow = window.open('', '_blank', 'width=1100,height=1400');
    if (!reportWindow) {
      return;
    }

    const documentContent = `<!doctype html>
      <html>
        <head>
          <title>${escapeHtml(contract.heading)}</title>
          <style>
            @page { size: A4; margin: 14mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Arial, Helvetica, sans-serif;
              color: #1f2937;
              background: linear-gradient(135deg, rgba(14,116,144,0.12), rgba(22,163,74,0.1)), #f8fafc;
            }
            .page {
              position: relative;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              background: rgba(255,255,255,0.92);
              border: 1px solid rgba(148,163,184,0.45);
              box-shadow: 0 25px 50px rgba(15, 23, 42, 0.15);
              overflow: hidden;
            }
            .page::before {
              content: "";
              position: absolute;
              inset: 0;
              background-image: url('${logoImg}');
              background-repeat: no-repeat;
              background-position: center;
              background-size: 60%;
              opacity: 0.04;
            }
            .content { position: relative; z-index: 1; padding: 12mm 14mm; }
            header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 8mm;
              border-bottom: 2px solid #0f172a;
            }
            .brand { display: flex; align-items: center; gap: 14px; }
            .brand img { width: 58px; height: 58px; border-radius: 16px; object-fit: cover; border: 1px solid rgba(148,163,184,0.4); }
            .brand-text { font-weight: 700; font-size: 26px; letter-spacing: 0.08em; }
            .brand-sub { color: #475569; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
            .tag {
              padding: 10px 14px;
              border-radius: 14px;
              border: 1px solid #dbeafe;
              background: linear-gradient(135deg, rgba(239,246,255,0.95), rgba(240,249,255,0.95));
              text-align: right;
            }
            .label { color: #64748b; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; }
            .title { margin-top: 6px; font-size: 20px; font-weight: 700; color: #0f172a; }
            .heading-row {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 16px;
              margin-top: 10mm;
              margin-bottom: 8mm;
            }
            h1 {
              margin: 0;
              font-size: 28px;
              letter-spacing: -0.03em;
              color: #0f172a;
            }
            .meta {
              font-size: 12px;
              color: #475569;
              text-align: right;
              line-height: 1.7;
            }
            .summary {
              display: grid;
              grid-template-columns: 1.2fr 0.8fr;
              gap: 6mm;
              margin-bottom: 8mm;
            }
            .box {
              border: 1px solid #dfe7f0;
              border-radius: 16px;
              background: rgba(248,250,252,0.9);
              padding: 16px 18px;
            }
            .box h2 {
              margin: 0 0 8px;
              font-size: 12px;
              color: #475569;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }
            .box p {
              margin: 0;
              color: #0f172a;
              font-size: 13px;
              line-height: 1.7;
            }
            .contract-body {
              margin-top: 6mm;
              border-top: 1px solid #e2e8f0;
              padding-top: 6mm;
            }
            ul {
              margin: 0;
              padding-left: 18px;
              color: #334155;
              line-height: 1.9;
              font-size: 13px;
            }
            .signature-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10mm;
              margin-top: 10mm;
            }
            .signature {
              border-top: 2px solid #0f172a;
              padding-top: 10px;
              margin-top: 18mm;
              font-size: 12px;
              color: #475569;
            }
            .signature strong { display: block; color: #0f172a; margin-bottom: 8px; }
            @media print { body { background: white; } }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="content">
              <header>
                <div class="brand">
                  <img src="${logoImg}" alt="Makezy Group logo" />
                  <div>
                    <div class="brand-text">MAKEZY GROUP</div>
                    <div class="brand-sub">Management & professional services</div>
                  </div>
                </div>
                <div class="tag">
                  <div class="label">Template</div>
                  <div class="title">${contract.shortTitle}</div>
                </div>
              </header>
              <div class="heading-row">
                <h1>${contract.heading}</h1>
                <div class="meta">
                  <div>Document No: MG-CON-${contractType.toUpperCase()}</div>
                  <div>Effective date: ${escapeHtml(signatureDate)}</div>
                </div>
              </div>
              <div class="summary">
                <div class="box">
                  <h2>Purpose</h2>
                  <p>${contract.intro}</p>
                </div>
                <div class="box">
                  <h2>Approved by</h2>
                  <p>Company representative<br />Makezy Group Management</p>
                </div>
              </div>
              <div class="contract-body">
                <div class="box" style="margin-bottom: 6mm;">
                  <h2>${contract.partyLabel}</h2>
                  <p><strong>${contract.party}:</strong> Name / Company / Role</p>
                  <p><strong>Address:</strong> Street Address, City, Country</p>
                  <p><strong>Contact:</strong> Email / Phone</p>
                </div>
                <ul>
                  ${contract.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
              </div>
              <div class="signature-row">
                <div class="signature">
                  <strong>Authorized Company Signatory</strong>
                  Name: ___________________________<br />
                  Title: ___________________________<br />
                  Signature: ______________________
                </div>
                <div class="signature">
                  <strong>${contract.party} Signatory</strong>
                  Name: ___________________________<br />
                  Title: ___________________________<br />
                  Signature: ______________________
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>`;

    reportWindow.document.write(documentContent);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Contract center</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Professional contract templates</h1>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Contract type
                <select
                  value={contractType}
                  onChange={(event) => setContractType(event.target.value as ContractType)}
                  className="min-w-[220px] rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {Object.entries(contractTypes).map(([key, option]) => (
                    <option key={key} value={key}>{option.label}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={openPrintableContract}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Printer size={16} />
                Print / Download
              </button>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(16,185,129,0.22), rgba(14,165,233,0.16)), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.10),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.10),_transparent_32%)]" />

          <div className="relative p-5 md:p-8 lg:p-10">
            <header className="flex flex-col gap-6 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <img src={logoImg} alt="Makezy Group logo" className="h-16 w-16 rounded-2xl border border-slate-200 bg-white object-cover p-1 shadow-sm" />
                <div>
                  <p className="text-xl font-black tracking-[0.2em] text-slate-900 md:text-2xl">MAKEZY GROUP</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Management & professional services</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-left shadow-sm md:text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Template</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{contract.shortTitle}</p>
              </div>
            </header>

            <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Official document</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{contract.heading}</h2>
              </div>

              <div className="space-y-1 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
                <p><span className="font-semibold text-slate-800">Document No:</span> MG-CON-{contractType.toUpperCase()}</p>
                <p><span className="font-semibold text-slate-800">Effective Date:</span> {signatureDate}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <FileText className="h-5 w-5 text-emerald-700" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em]">Purpose</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{contract.intro}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <BriefcaseBusiness className="h-5 w-5 text-sky-700" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em]">Approved by</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">Makezy Group Management<br />Authorized company representative</p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <Building2 className="h-5 w-5 text-slate-700" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em]">Company details</p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Company:</span> Makezy Group</p>
                  <p><span className="font-semibold text-slate-900">Address:</span> 12 Strategic Avenue, Dar es Salaam, Tanzania</p>
                  <p><span className="font-semibold text-slate-900">Contact:</span> hello@makezygroup.com / +255 000 000 000</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <UserRoundCheck className="h-5 w-5 text-emerald-700" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em]">{contract.partyLabel}</p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">{contract.party}:</span> Full name / company name</p>
                  <p><span className="font-semibold text-slate-900">Role:</span> Position or title</p>
                  <p><span className="font-semibold text-slate-900">Contact:</span> Email / phone</p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Core terms</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                {contract.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Authorized company signatory</p>
                <div className="mt-8 border-t border-slate-300 pt-4">
                  <p className="text-sm font-semibold text-slate-900">Name: _________________________</p>
                  <p className="mt-4 text-sm font-semibold text-slate-900">Title: _________________________</p>
                  <p className="mt-4 text-sm font-semibold text-slate-900">Signature: ___________________</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{contract.party} signatory</p>
                <div className="mt-8 border-t border-slate-300 pt-4">
                  <p className="text-sm font-semibold text-slate-900">Name: _________________________</p>
                  <p className="mt-4 text-sm font-semibold text-slate-900">Title: _________________________</p>
                  <p className="mt-4 text-sm font-semibold text-slate-900">Signature: ___________________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

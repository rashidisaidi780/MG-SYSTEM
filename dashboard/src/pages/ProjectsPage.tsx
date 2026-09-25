import { useState, useMemo, useEffect } from 'react';
import { Plus, MoreHorizontal, Download } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { notifySystem } from '@/utils/systemNotifications';
import logoImg from '@/assets/logo.jpeg';
import darkLogoImg from '@/assets/Makezy_logo.jpeg';
import projectsService from '@/services/projects';
import clientsService from '@/services/clients';
import { adminService } from '@/services/admin';
import { authService } from '@/services/auth';

interface ClientOption {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
  budget: string;
  status: 'In Progress' | 'Planning' | 'Review' | 'Completed' | 'On Hold';
  progress: number;
  lead: string;
  leaderId?: string;
  startDate: string;
  endDate: string;
  description: string;
}

const initialClients: ClientOption[] = [];
/*
  { id: 'acme', name: 'Acme Co.' },
  { id: 'nimbus', name: 'Nimbus Inc.' },
  { id: 'lumen', name: 'Lumen Studio' },
  { id: 'vertex', name: 'Vertex Ltd.' },
  { id: 'orbit', name: 'Orbit Systems' },
  { id: 'pulse', name: 'Pulse Media' },
]; */

const initialProjects: Project[] = [];
/*
  {
    id: 'brand-redesign',
    name: 'Brand Redesign',
    clientId: 'acme',
    budget: '$24,000',
    status: 'In Progress',
    progress: 78,
    lead: 'Sarah Chen',
    startDate: '2026-06-01',
    endDate: '2026-08-24',
    description: 'Redesign of brand system, identity, and visual assets.',
  },
  {
    id: 'mobile-app',
    name: 'Mobile App Development',
    clientId: 'nimbus',
    budget: '$58,000',
    status: 'In Progress',
    progress: 45,
    lead: 'James Park',
    startDate: '2026-05-10',
    endDate: '2026-09-02',
    description: 'Build a mobile app for customer engagement and data sync.',
  },
  {
    id: 'website-revamp',
    name: 'Website Revamp',
    clientId: 'lumen',
    budget: '$12,500',
    status: 'Review',
    progress: 92,
    lead: 'Mia Lopez',
    startDate: '2026-06-28',
    endDate: '2026-08-18',
    description: 'Refresh website layout and performance for a new launch.',
  },
]; */

const statusStyles: Record<Project['status'], string> = {
  'In Progress': 'bg-neutral-100 text-neutral-700',
  Review: 'bg-amber-50 text-amber-700',
  Planning: 'bg-blue-50 text-blue-700',
  Completed: 'bg-green-50 text-green-700',
  'On Hold': 'bg-rose-50 text-rose-700',
};

const emptyProject: Project = {
  id: '',
  name: '',
  clientId: '',
  budget: '',
  status: 'Planning',
  progress: 0,
  lead: '',
  leaderId: '',
  startDate: '',
  endDate: '',
  description: '',
};

const escapeHtml = (value: string | number | null | undefined) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export default function ProjectsPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [projectList, setProjectList] = useState<Project[]>(initialProjects);
  const [clients, setClients] = useState<ClientOption[]>(initialClients);
  const [leaders, setLeaders] = useState<{ id: string; name: string }[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [formProject, setFormProject] = useState<Project>(emptyProject);
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    void projectsService.getAll().then((loaded) => setProjectList(loaded.map((project) => ({ ...project, clientId: project.client, budget: String(project.budget), lead: '' })))).catch(() => showToast('Unable to load projects from the server', 'error'));
    void adminService.getAllUsers(1, 100).then((response) => setLeaders((response.data || []).map((user: { id: number | string; user_name: string }) => ({ id: String(user.id), name: user.user_name })))).catch(() => setLeaders([]));
    if (authService.hasPermission('Clients')) {
      void clientsService.getAll().then((loaded) => setClients(loaded.map((client) => ({ id: client.id, name: client.name })))).catch((error) => {
        if (error && typeof error === 'object' && 'status' in error && error.status === 403) return;
        showToast('Unable to load clients from the server', 'error');
      });
    }
  }, [showToast]);

  useEffect(() => {
    if (!leaders.length) return;
    setProjectList((current) => current.map((project) => ({
      ...project,
      lead: project.leaderId ? leaders.find((leader) => leader.id === project.leaderId)?.name || project.lead : project.lead,
    })));
  }, [leaders]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projectList;
    const query = searchQuery.toLowerCase();
    return projectList.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.budget.toLowerCase().includes(query) ||
        project.lead.toLowerCase().includes(query),
    );
  }, [projectList, searchQuery]);

  const selectedClientName = (clientId: string) => clients.find((client) => client.id === clientId)?.name ?? '';

  const openForm = (mode: 'add' | 'edit', project?: Project) => {
    setFormMode(mode);
    setFormProject(project ? project : emptyProject);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormProject(emptyProject);
  };

  const openDetail = (project: Project) => {
    setActiveProject(project);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setActiveProject(null);
  };

  const downloadReport = (projects: Project[] = projectList) => {
    if (!projects.length) {
      showToast('There are no projects to include in the report', 'warning');
      return;
    }

    const reportWindow = window.open('', '_blank', 'width=1000,height=1100');
    if (!reportWindow) {
      showToast('Please allow pop-ups to download the project report as a PDF', 'warning');
      return;
    }

    const generatedAt = new Date().toLocaleString();
    const reportLogo = localStorage.getItem('mg_theme') === 'dark' ? darkLogoImg : logoImg;
    const projectRows = projects.map((project) => `
      <article class="project">
        <div class="project-heading">
          <div><h2>${escapeHtml(project.name)}</h2><p class="muted">${escapeHtml(selectedClientName(project.clientId) || 'No client assigned')}</p></div>
          <span class="status">${escapeHtml(project.status)}</span>
        </div>
        <div class="details">
          <div><span class="label">Budget</span><strong>${escapeHtml(project.budget)}</strong></div>
          <div><span class="label">Progress</span><strong>${escapeHtml(project.progress)}%</strong></div>
          <div><span class="label">Project lead</span><strong>${escapeHtml(project.lead)}</strong></div>
          <div><span class="label">Timeline</span><strong>${escapeHtml(project.startDate)} to ${escapeHtml(project.endDate)}</strong></div>
        </div>
        <div class="summary"><span class="label">Project summary</span><p>${escapeHtml(project.description || 'No description provided.')}</p></div>
      </article>`).join('');

    reportWindow.document.write(`<!doctype html>
      <html><head><title>Project Report</title><style>
        @page { size: A4; margin: 14mm; }
        * { box-sizing: border-box; }
        body { position: relative; margin: 0; color: #171717; font-family: Arial, Helvetica, sans-serif; background: #fff; }
        .watermark { position: fixed; z-index: 0; width: 135mm; height: 135mm; object-fit: contain; left: 50%; top: 50%; transform: translate(-50%, -50%); opacity: .045; }
        header, .intro, .project, footer { position: relative; z-index: 1; }
        header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 8mm; border-bottom: 2px solid #171717; }
        h1 { margin: 0 0 5px; font-size: 27px; letter-spacing: .5px; }
        h2 { margin: 0; font-size: 17px; }
        p { margin: 0; line-height: 1.5; }
        .muted { color: #737373; font-size: 11px; }
        .meta { text-align: right; color: #737373; font-size: 10px; line-height: 1.6; }
        .intro { padding: 7mm 0 5mm; font-size: 12px; color: #525252; }
        .project { page-break-inside: avoid; margin-bottom: 7mm; padding: 6mm; border: 1px solid #d4d4d4; border-radius: 10px; }
        .project-heading { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; padding-bottom: 4mm; border-bottom: 1px solid #e5e5e5; }
        .status { padding: 5px 9px; border-radius: 999px; background: #f5f5f5; font-size: 10px; font-weight: bold; white-space: nowrap; }
        .details { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; padding: 5mm 0; }
        .label { display: block; margin-bottom: 5px; color: #737373; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; }
        .details strong { font-size: 11px; font-weight: 600; }
        .summary { padding-top: 4mm; border-top: 1px solid #e5e5e5; font-size: 11px; }
        .summary p { color: #525252; }
        footer { margin-top: 8mm; padding-top: 4mm; border-top: 1px solid #e5e5e5; color: #737373; font-size: 9px; }
        @media print { body { background: #fff; } }
      </style></head><body><img class="watermark" src="${reportLogo}" alt="" />
        <header><div><h1>Project Report</h1><p class="muted">Makezy Group management system</p></div><div class="meta"><div><strong>${projects.length}</strong> project${projects.length === 1 ? '' : 's'}</div><div>Generated ${escapeHtml(generatedAt)}</div></div></header>
        <p class="intro">Complete project overview including budgets, ownership, progress, timelines, and summaries.</p>
        ${projectRows}
        <footer>Generated from the Makezy Group project portfolio.</footer>
        <script>const printReport = () => { window.focus(); window.print(); }; if (document.readyState === 'complete') printReport(); else { window.addEventListener('load', printReport, { once: true }); window.setTimeout(printReport, 1000); }</script>
      </body></html>`);
    reportWindow.document.close();
    showToast('Project report opened for PDF download', 'success');
  };

  const handleFormChange = (field: keyof Project, value: string | number) => {
    setFormProject((current) => ({ ...current, [field]: value }));
  };

  const saveProject = () => {
    if (!formProject.name.trim() || !formProject.budget.trim() || !formProject.lead.trim() || !formProject.startDate || !formProject.endDate) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    const request = { id: formProject.id, name: formProject.name, description: formProject.description, client: formProject.clientId, status: formProject.status, startDate: formProject.startDate, endDate: formProject.endDate, budget: Number(formProject.budget.replace(/[^0-9.-]+/g, '')) || 0, progress: formProject.progress, projectLeader: formProject.leaderId || undefined };
    const saveRequest = formMode === 'add' ? projectsService.create(request) : projectsService.update(formProject.id, request);
    void saveRequest.then((saved) => {
      const pageProject = { ...formProject, id: saved.id, clientId: saved.client, budget: String(saved.budget) };
      setProjectList((current) => formMode === 'add' ? [pageProject, ...current] : current.map((project) => project.id === pageProject.id ? pageProject : project));
      if (activeProject?.id === pageProject.id) setActiveProject(pageProject);
      notifySystem(formMode === 'add' ? 'Project added' : 'Project updated', `${saved.name} details were saved.`);
      showToast(`Project "${saved.name}" ${formMode === 'add' ? 'added' : 'updated'} successfully`, 'success');
      closeForm();
    }).catch(() => showToast('Unable to save project to the server', 'error'));
  };

  const deleteProject = (projectId: string) => {
    const projectToDelete = projectList.find((project) => project.id === projectId);
    void projectsService.delete(projectId).then(() => setProjectList((current) => current.filter((project) => project.id !== projectId))).catch(() => showToast('Unable to delete project from the server', 'error'));
    if (activeProject?.id === projectId) {
      closeDetail();
    }
    if (projectToDelete) {
      notifySystem('Project deleted', `${projectToDelete.name} was removed from the project list.`);
      showToast(`Project "${projectToDelete.name}" deleted`, 'info');
    }
    setPendingDeleteProjectId(null);
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm text-neutral-400 font-medium">{filteredProjects.length} projects total</p>
          <h2 className="text-2xl font-semibold">Project portfolio</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => downloadReport()} className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition-colors">
            <Download size={15} /> Download report
          </button>
          <button
            data-mutation-control
            onClick={() => openForm('add')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white text-sm font-semibold hover:bg-neutral-900 transition-all duration-200 animate-book-button"
          >
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                <th className="px-5 py-4 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Project</th>
                <th className="px-5 py-4 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Client</th>
                <th className="px-5 py-4 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Progress</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={() => openDetail(project)}
                >
                  <td className="px-5 py-4 font-medium">{project.name}</td>
                  <td className="px-5 py-4 text-neutral-600">{selectedClientName(project.clientId)}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[project.status]}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-24 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full bg-black" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-neutral-600">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <MoreHorizontal size={16} className="text-neutral-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDeleteProjectId !== null}
        title="Delete project?"
        message="This project will be permanently removed. Do you want to continue?"
        confirmText="Yes"
        cancelText="No"
        destructive
        onConfirm={() => {
          if (pendingDeleteProjectId) deleteProject(pendingDeleteProjectId);
        }}
        onCancel={() => setPendingDeleteProjectId(null)}
      />

      {detailOpen && activeProject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl animate-book-modal">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Project details</p>
                <h3 className="text-2xl font-semibold mt-2">{activeProject.name}</h3>
                <p className="text-sm text-neutral-500 mt-1">{selectedClientName(activeProject.clientId)} · {activeProject.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                      type="button"
                      onClick={() => downloadReport([activeProject])}
                      title="Download this project report"
                      aria-label={`Download ${activeProject.name} report`}
                      className="rounded-3xl border border-neutral-200 p-3 text-neutral-700 hover:bg-neutral-100 transition"
                    >
                      <Download size={16} />
                    </button>
                    <button
                  data-mutation-control
                  onClick={() => {
                    openForm('edit', activeProject);
                    setDetailOpen(false);
                  }}
                  className="rounded-3xl px-4 py-3 text-sm font-semibold text-neutral-700 border border-neutral-200 hover:bg-neutral-100 transition"
                >
                  Edit
                </button>
                <button
                  data-mutation-control
                  onClick={() => setPendingDeleteProjectId(activeProject.id)}
                  className="rounded-3xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-3xl bg-neutral-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Client</p>
                <p className="mt-2 font-semibold text-neutral-900">{selectedClientName(activeProject.clientId)}</p>
              </div>
              <div className="rounded-3xl bg-neutral-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Budget</p>
                <p className="mt-2 font-semibold text-neutral-900">{activeProject.budget}</p>
              </div>
              <div className="rounded-3xl bg-neutral-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Leader</p>
                <p className="mt-2 font-semibold text-neutral-900">{activeProject.lead}</p>
              </div>
              <div className="rounded-3xl bg-neutral-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Progress</p>
                <p className="mt-2 font-semibold text-neutral-900">{activeProject.progress}%</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Start date</p>
                <p className="mt-2 text-neutral-900">{new Date(activeProject.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Expected end</p>
                <p className="mt-2 text-neutral-900">{new Date(activeProject.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-neutral-50 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Project summary</p>
              <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{activeProject.description}</p>
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
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">{formMode === 'add' ? 'New project' : 'Edit project'}</p>
                <h3 className="text-2xl font-semibold mt-2">{formMode === 'add' ? 'Add project details' : 'Update project details'}</h3>
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
                Project name
                <input
                  value={formProject.name}
                  onChange={(event) => handleFormChange('name', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Enter project name"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Client
                <select
                  value={formProject.clientId}
                  onChange={(event) => handleFormChange('clientId', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="" disabled>Select client</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Project budget
                <input
                  value={formProject.budget}
                  onChange={(event) => handleFormChange('budget', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="$0.00"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Status
                <select
                  value={formProject.status}
                  onChange={(event) => handleFormChange('status', event.target.value as Project['status'])}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Progress
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formProject.progress}
                  onChange={(event) => handleFormChange('progress', Number(event.target.value))}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="0"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Project leader
                <select
                  value={formProject.leaderId || ''}
                  onChange={(event) => {
                    const leader = leaders.find((item) => item.id === event.target.value);
                    setFormProject((current) => ({ ...current, leaderId: event.target.value, lead: leader?.name || '' }));
                  }}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="">Select team lead</option>
                  {leaders.map((leader) => <option key={leader.id} value={leader.id}>{leader.name}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Start date
                <input
                  type="date"
                  value={formProject.startDate}
                  onChange={(event) => handleFormChange('startDate', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">
                Expected ending date
                <input
                  type="date"
                  value={formProject.endDate}
                  onChange={(event) => handleFormChange('endDate', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-neutral-700 sm:col-span-2">
                Project details
                <textarea
                  value={formProject.description}
                  onChange={(event) => handleFormChange('description', event.target.value)}
                  className="min-h-[120px] w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Add a short summary of the project"
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
                onClick={saveProject}
                className="rounded-3xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-900 transition"
              >
                {formMode === 'add' ? 'Save Project' : 'Update Project'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

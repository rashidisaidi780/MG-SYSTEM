import { useState, useMemo } from 'react';
import { Plus, MoreHorizontal, Filter, Edit3, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { notifySystem } from '@/utils/systemNotifications';
import { usePersistentState } from '@/utils/persistentState';

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
  startDate: string;
  endDate: string;
  description: string;
}

const clients: ClientOption[] = [];
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
  startDate: '',
  endDate: '',
  description: '',
};

export default function ProjectsPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [projectList, setProjectList] = usePersistentState<Project[]>('projects', initialProjects);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [formProject, setFormProject] = useState<Project>(emptyProject);
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null);
  const { showToast } = useToast();

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

  const handleFormChange = (field: keyof Project, value: string | number) => {
    setFormProject((current) => ({ ...current, [field]: value }));
  };

  const saveProject = () => {
    if (!formProject.name.trim() || !formProject.budget.trim() || !formProject.lead.trim() || !formProject.startDate || !formProject.endDate) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    if (formMode === 'add') {
      const newProject = { ...formProject, id: `project-${Date.now()}` };
      setProjectList((current) => [newProject, ...current]);
      notifySystem('Project added', `${newProject.name} was added to the portfolio.`);
      showToast(`Project "${newProject.name}" added successfully`, 'success');
    } else {
      setProjectList((current) =>
        current.map((project) => (project.id === formProject.id ? { ...formProject } : project)),
      );
      if (activeProject?.id === formProject.id) {
        setActiveProject(formProject);
      }
      notifySystem('Project updated', `${formProject.name} details were updated.`);
      showToast(`Project "${formProject.name}" updated successfully`, 'success');
    }

    closeForm();
  };

  const deleteProject = (projectId: string) => {
    const projectToDelete = projectList.find((project) => project.id === projectId);
    setProjectList((current) => current.filter((project) => project.id !== projectId));
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
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition-colors">
            <Filter size={15} /> Filter
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
                <input
                  value={formProject.clientId}
                  onChange={(event) => handleFormChange('clientId', event.target.value)}
                  placeholder="Enter client name"
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
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
                <input
                  value={formProject.lead}
                  onChange={(event) => handleFormChange('lead', event.target.value)}
                  className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="Team lead name"
                />
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

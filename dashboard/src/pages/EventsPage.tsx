import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { notifySystem } from '@/utils/systemNotifications';
import updatesService, { type UpdatePost } from '@/services/updates';

interface EventPost extends UpdatePost {
  expiresAt: string | null;
}

const initialPosts: EventPost[] = [
 
];

const emptyForm = {
  title: '',
  description: '',
  image: null as string | null,
  isNew: true,
  durationValue: 1,
  durationUnit: 'day' as 'day' | 'week' | 'month' | 'year',
};

export default function EventsPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [posts, setPosts] = useState<EventPost[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    void updatesService.getAll()
      .then((loadedPosts) => setPosts(loadedPosts.map((post) => ({
        ...post,
        expiresAt: new Date(new Date(post.createdAt).getTime() + post.durationDays * 86400000).toISOString(),
      }))))
      .catch(() => showToast('Unable to load events from the server', 'error'))
      .finally(() => setIsLoading(false));
  }, [showToast]);

  const visiblePosts = useMemo(
    () =>
      posts.filter((post) => {
        if (!post.expiresAt) return true;
        return new Date(post.expiresAt).getTime() > Date.now();
      }),
    [posts],
  );

  const filteredPosts = useMemo(
    () => {
      if (!searchQuery.trim()) return visiblePosts;
      const query = searchQuery.toLowerCase();
      return visiblePosts.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query),
      );
    },
    [visiblePosts, searchQuery],
  );

  const totalNewPosts = useMemo(
    () => filteredPosts.filter((post) => post.isNew).length,
    [filteredPosts],
  );

  const openCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, image: String(reader.result ?? null) }));
      showToast('Image uploaded successfully', 'success');
    };
    reader.onerror = () => {
      showToast('Failed to upload image', 'error');
    };
    reader.readAsDataURL(file);
  };

  const calculateDurationDays = (): number => {
    const unitMap: Record<string, number> = {
      day: 1,
      week: 7,
      month: 30,
      year: 365,
    };
    return (unitMap[form.durationUnit] || 1) * form.durationValue;
  };

  const publishPost = () => {
    if (!form.title.trim()) {
      showToast('Please enter an event title', 'warning');
      return;
    }
    if (!form.description.trim()) {
      showToast('Please enter an event description', 'warning');
      return;
    }
    if (form.durationValue <= 0) {
      showToast('Please set a valid duration', 'warning');
      return;
    }

    const createdAt = new Date();
    const durationDays = calculateDurationDays();
    const expiresAt = new Date(createdAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const nextPost: EventPost = {
      id: `evt-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      image: form.image,
      isNew: form.isNew,
      createdAt: createdAt.toISOString().slice(0, 10),
      expiresAt: expiresAt.toISOString(),
      durationDays,
    };

    void updatesService.create(nextPost)
      .then((savedPost) => {
        setPosts((current) => [{ ...savedPost, expiresAt: nextPost.expiresAt }, ...current]);
        notifySystem('Event & Update published', savedPost.title);
        setForm(emptyForm);
        setFormOpen(false);
        showToast(`Event "${savedPost.title}" published successfully!`, 'success');
      })
      .catch(() => showToast('Unable to save the event to the server', 'error'));
  };

  const toggleNewStatus = (postId: string) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    const newStatus = !post.isNew;
    void updatesService.update(postId, { isNew: newStatus })
      .then((savedPost) => {
        setPosts((current) => current.map((item) => item.id === postId ? { ...item, ...savedPost, expiresAt: post.expiresAt } : item));
        showToast(newStatus ? 'Marked as new' : 'Removed from new', 'info');
      })
      .catch(() => showToast('Unable to update the event on the server', 'error'));
  };

  const removePost = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    void updatesService.delete(postId)
      .then(() => {
        setPosts((current) => current.filter((item) => item.id !== postId));
        showToast(`Event "${post.title}" deleted`, 'info');
      })
      .catch(() => showToast('Unable to delete the event from the server', 'error'));
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-neutral-400 font-medium">{posts.length} events</p>
          <h2 className="text-2xl font-semibold">Event & Updates</h2>
        </div>
        <button
          data-mutation-control
          onClick={openCreate}
          className="flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-900"
        >
          <Plus size={16} /> New Post
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Total posts</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">{posts.length}</p>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">New</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">{totalNewPosts}</p>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Highlight</p>
          <p className="mt-3 text-base font-semibold text-neutral-700">Share company updates</p>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-neutral-500">Loading events...</p> : null}
      <div className="grid gap-5 xl:grid-cols-4 lg:grid-cols-2">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm"
          >
            {post.image ? (
              <button
                onClick={() => setFullscreenImage(post.image)}
                className="relative block w-full overflow-hidden group"
              >
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-52 w-full object-cover cursor-pointer transition group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-sm font-semibold">Click to view fullscreen</span>
                </div>
              </button>
            ) : (
              <div className="flex h-52 items-center justify-center bg-neutral-100 text-neutral-400">
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus size={28} />
                  <span className="text-sm">No image</span>
                </div>
              </div>
            )}

            <div className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{post.title}</h3>
                  <p className="mt-1 text-xs text-neutral-400">{post.createdAt}</p>
                </div>
                {post.isNew && (
                  <span className="animate-blink rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">
                    New
                  </span>
                )}
              </div>

              <div className="mb-3 inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
                {post.durationDays} day{post.durationDays > 1 ? 's' : ''} duration
              </div>

              <p className="text-sm leading-6 text-neutral-600">{post.description}</p>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4">
                <button
                  data-mutation-control
                  onClick={() => toggleNewStatus(post.id)}
                  className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                    post.isNew
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  {post.isNew ? 'Remove New' : 'Mark as New'}
                </button>

                <button
                  data-mutation-control
                  onClick={() => removePost(post.id)}
                  className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[30px] bg-white p-8 shadow-2xl animate-book-modal">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Create update</p>
                <h3 className="mt-2 text-2xl font-semibold">Share a new event</h3>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-2xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600"
              >
                Close
              </button>
            </div>

            <div className="space-y-5">
              <label className="block space-y-2 text-sm font-medium text-neutral-700">
                Title
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="New Year Wishes"
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-neutral-700">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={5}
                  placeholder="Write the event or update message here..."
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </label>

              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Upload event image</p>
                    <p className="text-xs text-neutral-500">PNG, JPG or WebP</p>
                  </div>
                  <label className="cursor-pointer rounded-2xl bg-black px-4 py-2 text-xs font-semibold text-white">
                    Choose file
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                {form.image ? (
                  <img src={form.image} alt="Preview" className="mt-4 h-40 w-full rounded-2xl object-cover" />
                ) : null}
              </div>

              <label className="block space-y-2 text-sm font-medium text-neutral-700">
                Event duration
                <div className="flex gap-3">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={form.durationValue}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        durationValue: Math.max(1, Number(event.target.value) || 1),
                      }))
                    }
                    placeholder="7"
                    className="w-20 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  />
                  <select
                    value={form.durationUnit}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        durationUnit: event.target.value as 'day' | 'week' | 'month' | 'year',
                      }))
                    }
                    className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-black"
                  >
                    <option value="day">Day(s)</option>
                    <option value="week">Week(s)</option>
                    <option value="month">Month(s)</option>
                    <option value="year">Year(s)</option>
                  </select>
                </div>
              </label>

              <label className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700">
                Mark post as new
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(event) => setForm((current) => ({ ...current, isNew: event.target.checked }))}
                  className="h-4 w-4 accent-black"
                />
              </label>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-3xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                data-mutation-control
                onClick={publishPost}
                className="rounded-3xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-900"
              >
                Publish Post
              </button>
            </div>
          </div>
        </div>
      )}

      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in"
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/30"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl max-h-[90vh] flex items-center justify-center"
          >
            <img
              src={fullscreenImage}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

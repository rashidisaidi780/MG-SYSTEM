import { useLayoutEffect, useRef, useState } from 'react';

type UploadProgress = {
  active: boolean;
  loaded: number;
  total: number;
  computable: boolean;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function GlobalProgressIndicator() {
  const [showRequestProgress, setShowRequestProgress] = useState(false);
  const [upload, setUpload] = useState<UploadProgress | null>(null);
  const requestTimer = useRef<number | null>(null);
  const requestHideTimer = useRef<number | null>(null);
  const requestMaxTimer = useRef<number | null>(null);
  const requestCycleStarted = useRef(false);

  useLayoutEffect(() => {
    const handleRequestProgress = (event: Event) => {
      const { activeRequests } = (event as CustomEvent<{ activeRequests: number }>).detail;

      if (activeRequests > 0) {
        if (requestHideTimer.current !== null) {
          window.clearTimeout(requestHideTimer.current);
          requestHideTimer.current = null;
        }

        if (requestCycleStarted.current) return;
        requestCycleStarted.current = true;
        requestTimer.current = window.setTimeout(() => {
          setShowRequestProgress(true);
          requestTimer.current = null;
        }, 120);
        requestMaxTimer.current = window.setTimeout(() => {
          setShowRequestProgress(false);
          requestMaxTimer.current = null;
        }, 2500);
        return;
      }

      if (requestTimer.current !== null) {
        window.clearTimeout(requestTimer.current);
        requestTimer.current = null;
      }
      if (requestMaxTimer.current !== null) {
        window.clearTimeout(requestMaxTimer.current);
        requestMaxTimer.current = null;
      }
      if (requestHideTimer.current !== null) window.clearTimeout(requestHideTimer.current);
      requestHideTimer.current = window.setTimeout(() => {
        setShowRequestProgress(false);
        requestCycleStarted.current = false;
        requestHideTimer.current = null;
      }, 180);
    };

    const handleUploadProgress = (event: Event) => {
      const progress = (event as CustomEvent<UploadProgress>).detail;
      setUpload(progress.active ? progress : null);
    };

    window.addEventListener('api-request-progress', handleRequestProgress);
    window.addEventListener('api-upload-progress', handleUploadProgress);

    return () => {
      window.removeEventListener('api-request-progress', handleRequestProgress);
      window.removeEventListener('api-upload-progress', handleUploadProgress);
      if (requestTimer.current !== null) window.clearTimeout(requestTimer.current);
      if (requestHideTimer.current !== null) window.clearTimeout(requestHideTimer.current);
      if (requestMaxTimer.current !== null) window.clearTimeout(requestMaxTimer.current);
    };
  }, []);

  const percent = upload?.computable && upload.total > 0
    ? Math.min(100, Math.round((upload.loaded / upload.total) * 100))
    : null;

  return (
    <>
      <div
        aria-hidden={!showRequestProgress}
        role="progressbar"
        aria-label="Loading page content"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext="Loading"
        className={`fixed inset-x-0 top-0 z-[10000] h-1 overflow-hidden transition-opacity duration-200 ${
          showRequestProgress ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="h-full w-1/3 animate-global-progress bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.75)]" />
      </div>
      {upload ? (
        <section
          role="status"
          aria-live="polite"
          aria-label="Upload progress"
          className="fixed right-4 top-4 z-[10001] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-neutral-800">Uploading files</span>
            <span className="text-xs font-medium tabular-nums text-neutral-500">
              {percent === null ? 'In progress' : `${percent}%`}
            </span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100"
            role="progressbar"
            aria-label="File upload"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent ?? undefined}
          >
            <div
              className={`h-full rounded-full bg-blue-600 transition-[width] duration-200 ${
                percent === null ? 'w-1/3 animate-global-progress' : ''
              }`}
              style={percent === null ? undefined : { width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {percent === null ? 'Preparing secure upload…' : `${formatBytes(upload.loaded)} of ${formatBytes(upload.total)}`}
          </p>
        </section>
      ) : null}
    </>
  );
}

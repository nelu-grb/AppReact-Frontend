export type NoticeType = 'success' | 'error' | 'info';

export interface Notice {
  type: NoticeType;
  message: string;
}

interface NoticeBannerProps {
  notice: Notice | null;
  onClose: () => void;
}

export function NoticeBanner({ notice, onClose }: NoticeBannerProps) {
  if (!notice) return null;

  const toneStyles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  };

  return (
    <div className="fixed inset-x-4 top-4 z-50 flex justify-center md:justify-end pointer-events-none">
      <div
        aria-live="polite"
        className={`pointer-events-auto w-full max-w-md rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${toneStyles[notice.type]}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-6">{notice.message}</p>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 text-sm font-semibold opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

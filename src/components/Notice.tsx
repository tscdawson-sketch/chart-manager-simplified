import { CircleAlert, CircleCheck, X } from 'lucide-react';

export interface NoticeState {
  tone: 'success' | 'error';
  message: string;
}

interface NoticeProps {
  notice: NoticeState;
  onDismiss: () => void;
}

export default function Notice({ notice, onDismiss }: NoticeProps) {
  const Icon = notice.tone === 'success' ? CircleCheck : CircleAlert;

  return (
    <div role="status" className={`notice notice-${notice.tone}`}>
      <Icon size={16} className="shrink-0" />
      <span className="flex-1">{notice.message}</span>
      <button type="button" className="notice-close" onClick={onDismiss} aria-label="Dismiss message">
        <X size={14} />
      </button>
    </div>
  );
}

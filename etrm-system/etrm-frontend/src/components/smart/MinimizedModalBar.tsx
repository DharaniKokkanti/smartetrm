import { ExpandOutlined } from '@ant-design/icons';

interface Props {
  visible: boolean;
  label: string;
  onRestore: () => void;
}

/** Floating pill shown while a useDraggableModal-backed Modal is minimized. */
export function MinimizedModalBar({ visible, label, onRestore }: Props) {
  if (!visible) return null;
  return (
    <div
      onClick={onRestore}
      role="button"
      tabIndex={0}
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1050,
        background: '#1677ff',
        color: '#fff',
        padding: '9px 16px',
        borderRadius: 20,
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0,0,0,0.28)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
      }}
    >
      <span>{label} (minimized)</span>
      <ExpandOutlined />
    </div>
  );
}

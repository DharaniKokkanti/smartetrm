import { Space, Tag, Tooltip } from 'antd';
import { PushpinOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDraftStore } from '@components/smart/formDraft';
import { DRAFT_META } from '@components/smart/draftMeta';

/** Best-effort human label for a specific minimized record, without knowing its type's shape. */
function describeEntry(editing: unknown, label: string): string {
  if (!editing || typeof editing !== 'object') return `${label} (new)`;
  const e = editing as Record<string, unknown>;
  const candidate = e.tradeReference ?? e.contractNumber ?? e.code ?? e.name ?? e.reference ?? e.title ?? null;
  return typeof candidate === 'string' && candidate ? `${label} — ${candidate}` : `${label} (editing)`;
}

/**
 * Persistent dock, mounted once in AppShell (survives route changes), that
 * surfaces any capture drawer left open mid-entry when the user navigated
 * away — e.g. editing a trade in the blotter, then jumping to Master Data.
 * Multiple drafts under the same form key coexist as separate pins (e.g. a
 * new trade and an edit of an existing trade, minimized separately).
 *
 * Restore is opt-in: minimizing a panel does NOT reopen it the moment you
 * land back on its page (that would hijack the page and block you from
 * opening a *different* existing record until you dealt with the old draft).
 * It only restores when you explicitly click its pin — that fires
 * `requestRestore(id)`, which the owning page's `useFormDraft`/
 * `useDraftState` hook is subscribed to, then navigates there.
 */
export function MinimizedDraftsDock() {
  const drafts = useDraftStore((s) => s.drafts);
  const discard = useDraftStore((s) => s.discard);
  const requestRestore = useDraftStore((s) => s.requestRestore);
  const navigate = useNavigate();

  const items = Object.values(drafts)
    .map((entry) => ({
      entry,
      meta: entry.route && entry.label ? { route: entry.route, label: entry.label } : DRAFT_META[entry.key],
    }))
    .filter((d): d is { entry: typeof drafts[string]; meta: { route: string; label: string } } => !!d.meta);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 24,
        bottom: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <Space wrap size={[8, 8]}>
        {items.map(({ entry, meta }) => (
          <Tooltip key={entry.id} title={`Resume on ${meta.route}`}>
            <Tag
              icon={<PushpinOutlined />}
              color="processing"
              style={{ cursor: 'pointer', padding: '4px 8px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => { requestRestore(entry.id); navigate(meta.route); }}
            >
              {describeEntry(entry.editing, meta.label)}
              <CloseOutlined
                style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}
                onClick={(e) => { e.stopPropagation(); discard(entry.id); }}
              />
            </Tag>
          </Tooltip>
        ))}
      </Space>
    </div>
  );
}

import type { ReactNode } from 'react';
import { color } from '@theme/tokens';

interface StickyFormFooterProps {
  children: ReactNode;
}

/**
 * Action bar for full-page (non-modal) edit forms, e.g. LegalEntityFormPage,
 * CounterpartyFormPage. Modal/Drawer forms get a fixed footer from antd for
 * free; these hand-rolled tabbed pages don't, so on a long form the Save
 * button used to scroll away with the page — this keeps it pinned to the
 * bottom of the viewport instead.
 */
export function StickyFormFooter({ children }: StickyFormFooterProps) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 5,
        marginTop: 24,
        marginLeft: -24,
        marginRight: -24,
        marginBottom: -24,
        padding: '12px 24px',
        background: color.bgElevated,
        borderTop: `1px solid ${color.border}`,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {children}
    </div>
  );
}

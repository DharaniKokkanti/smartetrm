import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';

/**
 * Move/maximize/minimize/scroll behaviour for a Modal, shared by every
 * add/edit dialog in the app (originally only present on ReferenceDataTable's
 * capture modal — the Legal Entity / Counterparty child-record modals
 * (Bank Accounts, Tax Registrations, Addresses, Contacts) were stuck fixed
 * dialogs with no way to move them off-center or scroll a tall form).
 */
export function useDraggableModal() {
  const [maximized, setMaximized] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0 });

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      if (!draggingRef.current) return;
      const { mouseX, mouseY, x, y } = dragStartRef.current;
      setDragPos({ x: x + (e.clientX - mouseX), y: y + (e.clientY - mouseY) });
    }
    function handleUp() { draggingRef.current = false; }
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  function onTitleBarMouseDown(e: ReactMouseEvent) {
    if (maximized) return;
    draggingRef.current = true;
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, x: dragPos.x, y: dragPos.y };
  }

  function resetWindowState() {
    setMaximized(false);
    setMinimized(false);
    setDragPos({ x: 0, y: 0 });
  }

  /** Spread onto <Modal> alongside title/open/onCancel/etc. Applies the
   *  drag transform, maximize sizing, and — crucially, even when not
   *  maximized — a capped body height with scroll, so a tall form never
   *  gets clipped by the viewport with no way to reach the rest of it. */
  const modalProps = {
    width: maximized ? 'calc(100vw - 48px)' : undefined,
    style: maximized ? { top: 16 } : undefined,
    styles: {
      content: maximized ? { maxHeight: 'calc(100vh - 32px)' } : undefined,
      body: {
        maxHeight: maximized ? 'calc(100vh - 180px)' : 'calc(100vh - 260px)',
        overflowY: 'auto' as const,
      },
    },
    modalRender: (node: React.ReactNode) => (
      <div style={{
        transform: `translate(${dragPos.x}px, ${dragPos.y}px)`,
        display: minimized ? 'none' : undefined,
      }}>
        {node}
      </div>
    ),
  };

  return {
    maximized, setMaximized,
    minimized, setMinimized,
    dragPos,
    onTitleBarMouseDown,
    resetWindowState,
    modalProps,
  };
}

import type { ReactNode, MouseEvent as ReactMouseEvent } from 'react';
import { Button, Space } from 'antd';
import { MinusOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  maximized: boolean;
  onMouseDown: (e: ReactMouseEvent) => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
}

/** Title bar for a useDraggableModal-backed Modal — drag handle plus
 *  minimize/maximize controls, same look everywhere they're used. */
export function DraggableModalTitle({ children, maximized, onMouseDown, onMinimize, onToggleMaximize }: Props) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        cursor: maximized ? 'default' : 'move',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 44,
        userSelect: 'none',
      }}
    >
      <span>{children}</span>
      <Space size={2} onMouseDown={(e) => e.stopPropagation()}>
        <Button type="text" size="small" icon={<MinusOutlined />} onClick={onMinimize} aria-label="Minimize" />
        <Button
          type="text"
          size="small"
          icon={maximized ? <CompressOutlined /> : <ExpandOutlined />}
          onClick={onToggleMaximize}
          aria-label={maximized ? 'Restore' : 'Maximize'}
        />
      </Space>
    </div>
  );
}

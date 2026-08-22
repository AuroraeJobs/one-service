import type { CSSProperties, Key, ReactNode } from 'react';
import { Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface RecordListPaginationText {
  first: string;
  previous: string;
  next: string;
  last: string;
  summary: (current: number, total: number) => string;
}

interface RecordCardListProps<T> {
  records: T[];
  getRecordKey: (record: T) => Key;
  renderRecord: (record: T) => ReactNode;
  onRecordClick: (record: T) => void;
  filters: ReactNode;
  onAdd: () => void;
  addLabel: string;
  emptyText: string;
  emptyIcon?: ReactNode;
  accent: string;
  addButtonBackground: string;
  addButtonShadow: string;
  recordClassName?: string;
  recordBodyStyle?: CSSProperties;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  paginationText?: RecordListPaginationText;
}

const RecordCardList = <T,>({
  records,
  getRecordKey,
  renderRecord,
  onRecordClick,
  filters,
  onAdd,
  addLabel,
  emptyText,
  emptyIcon,
  accent,
  addButtonBackground,
  addButtonShadow,
  recordClassName = '',
  recordBodyStyle,
  currentPage = 1,
  pageSize,
  onPageChange,
  paginationText
}: RecordCardListProps<T>) => {
  const totalPages = pageSize ? Math.max(1, Math.ceil(records.length / pageSize)) : 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleRecords = pageSize
    ? records.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)
    : records;
  const showPagination = Boolean(pageSize && paginationText && onPageChange && records.length > pageSize);

  return (
    <Card
      className="record-list-panel"
      style={{ '--record-list-accent': accent } as CSSProperties}
      headStyle={{ border: 'none', padding: '0 0 16px' }}
      title={(
        <div className="record-list-toolbar">
          <div className="record-list-toolbar-spacer" />
          <div className="record-list-filters">{filters}</div>
          <Button
            type="primary"
            className="record-list-add-button"
            icon={<PlusOutlined />}
            onClick={onAdd}
            size="small"
            aria-label={addLabel}
            title={addLabel}
            style={{
              width: 32,
              height: 32,
              padding: 0,
              border: 0,
              borderRadius: '50%',
              background: addButtonBackground,
              boxShadow: addButtonShadow
            }}
          />
        </div>
      )}
    >
      {records.length === 0 ? (
        <div className="record-list-empty">
          {emptyIcon && <div className="record-list-empty-icon">{emptyIcon}</div>}
          <div>{emptyText}</div>
        </div>
      ) : (
        <>
          <div className="record-grid">
            {visibleRecords.map(record => (
              <Card
                key={getRecordKey(record)}
                className={`record-tile ${recordClassName}`.trim()}
                hoverable
                onClick={() => onRecordClick(record)}
                styles={{ body: recordBodyStyle }}
              >
                {renderRecord(record)}
              </Card>
            ))}
          </div>

          {showPagination && paginationText && onPageChange && (
            <div className="record-list-pagination">
              <Button size="small" disabled={safeCurrentPage === 1} onClick={() => onPageChange(1)}>
                {paginationText.first}
              </Button>
              <Button size="small" disabled={safeCurrentPage === 1} onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}>
                {paginationText.previous}
              </Button>
              <span>{paginationText.summary(safeCurrentPage, totalPages)}</span>
              <Button size="small" disabled={safeCurrentPage >= totalPages} onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}>
                {paginationText.next}
              </Button>
              <Button size="small" disabled={safeCurrentPage >= totalPages} onClick={() => onPageChange(totalPages)}>
                {paginationText.last}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default RecordCardList;

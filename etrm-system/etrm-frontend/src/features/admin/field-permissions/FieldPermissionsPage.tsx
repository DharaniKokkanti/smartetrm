import { useState, useEffect } from 'react';
import {
  Select, Table, Button, Space, Tag, Alert, Typography, Card,
  message, Tooltip,
} from 'antd';
import { LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@components/layout/PageHeader';
import { fetchProfiles, fetchProfileDetail, updateProfileRules } from '@permissions/api';
import type { FieldRuleDto, AccessLevel } from '@permissions/types';

const { Text } = Typography;

const ACCESS_COLOR: Record<AccessLevel, string> = {
  EDIT:   'success',
  VIEW:   'warning',
  HIDDEN: 'default',
};

const ACCESS_OPTIONS: { value: AccessLevel; label: string }[] = [
  { value: 'EDIT',   label: 'Edit' },
  { value: 'VIEW',   label: 'View Only' },
  { value: 'HIDDEN', label: 'Hidden' },
];

const SCREENS = [
  { value: 'TRADE_BLOTTER', label: 'Trade Blotter' },
];

export function FieldPermissionsPage() {
  const [screenCode, setScreenCode] = useState<string>('TRADE_BLOTTER');
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [localRules, setLocalRules] = useState<Record<number, AccessLevel>>({});
  const [isDirty, setIsDirty] = useState(false);
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['field-permission-profiles', screenCode],
    queryFn: () => fetchProfiles(screenCode),
  });

  const { data: profileDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['field-permission-profile-detail', selectedProfileId, screenCode],
    queryFn: () => fetchProfileDetail(selectedProfileId!, screenCode),
    enabled: selectedProfileId != null,
  });

  // Populate localRules whenever the fetched profile detail changes — a genuine
  // sync-with-external-query-data effect, not derivable during render.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!profileDetail) return;
    const map: Record<number, AccessLevel> = {};
    profileDetail.rules.forEach((r) => { map[r.fieldId] = r.fieldPermission; });
    setLocalRules(map);
    setIsDirty(false);
  }, [profileDetail]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveMutation = useMutation({
    mutationFn: () => updateProfileRules(
      selectedProfileId!,
      Object.entries(localRules).map(([fieldId, perm]) => ({
        fieldId: Number(fieldId),
        fieldPermission: perm,
      })),
    ),
    onSuccess: () => {
      void message.success('Permissions saved');
      void queryClient.invalidateQueries({ queryKey: ['field-permission-profile-detail'] });
      setIsDirty(false);
    },
    onError: () => { void message.error('Save failed — please try again'); },
  });

  function handlePermissionChange(fieldId: number, value: AccessLevel, isRequired: boolean) {
    if (isRequired && value === 'HIDDEN') {
      void message.warning('Required fields cannot be hidden — they will be clamped to View Only by the system.');
    }
    setLocalRules((prev) => ({ ...prev, [fieldId]: value }));
    setIsDirty(true);
  }

  const grouped = (profileDetail?.rules ?? []).reduce<Record<string, FieldRuleDto[]>>(
    (acc, rule) => {
      const group = rule.fieldGroup ?? 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(rule);
      return acc;
    },
    {},
  );

  return (
    <>
      <PageHeader
        title="Field-Level Permissions"
        description="Configure which fields each user role can edit, view, or access on each screen. Layer 1 application locks always override these settings."
        moduleGroup="admin"
      />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Layer 1 Application Locks override all settings here"
        description="When a trade is Confirmed, Matured, Closed, or Cancelled — or when an invoice is issued — the system automatically locks affected fields regardless of what is configured below. The lock icon shown in the form indicates a Layer 1 lock with the reason."
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space size="large">
          <Space>
            <Text strong>Screen:</Text>
            <Select
              value={screenCode}
              onChange={(v) => { setScreenCode(v); setSelectedProfileId(null); }}
              options={SCREENS}
              style={{ width: 200 }}
            />
          </Space>
          <Space>
            <Text strong>Role Profile:</Text>
            <Select
              value={selectedProfileId}
              onChange={setSelectedProfileId}
              placeholder="Select a role profile to configure"
              options={profiles.map((p) => ({ value: p.profileId, label: p.profileName }))}
              style={{ width: 280 }}
              allowClear
            />
          </Space>
          {isDirty && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              Save Changes
            </Button>
          )}
        </Space>
      </Card>

      {selectedProfileId == null && (
        <Alert type="warning" showIcon message="Select a role profile above to configure its field permissions." />
      )}

      {selectedProfileId != null && (
        <Table<FieldRuleDto>
          loading={detailLoading}
          dataSource={profileDetail?.rules ?? []}
          rowKey="fieldId"
          size="small"
          pagination={false}
          columns={[
            {
              title: 'Field',
              dataIndex: 'fieldLabel',
              width: 220,
              render: (label: string, row) => (
                <Space size={4}>
                  <Text>{label}</Text>
                  {row.isRequiredField && (
                    <Tooltip title="Required field — cannot be hidden">
                      <Tag color="red" style={{ fontSize: 10, padding: '0 4px' }}>Required</Tag>
                    </Tooltip>
                  )}
                </Space>
              ),
            },
            {
              title: 'Field Key',
              dataIndex: 'fieldKey',
              width: 240,
              render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
            },
            {
              title: 'Group',
              dataIndex: 'fieldGroup',
              width: 160,
              render: (v: string | null) => v ?? '—',
              filters: Object.keys(grouped).map((g) => ({ text: g, value: g })),
              onFilter: (value, record) => record.fieldGroup === value,
            },
            {
              title: 'Permission',
              width: 160,
              render: (_: unknown, row: FieldRuleDto) => {
                const current = localRules[row.fieldId] ?? row.fieldPermission;
                return (
                  <Space>
                    <Select<AccessLevel>
                      value={current}
                      onChange={(v) => handlePermissionChange(row.fieldId, v, row.isRequiredField)}
                      options={ACCESS_OPTIONS}
                      style={{ width: 130 }}
                      size="small"
                    />
                    {row.isRequiredField && current === 'HIDDEN' && (
                      <Tooltip title="Will be clamped to View Only — required fields cannot be hidden">
                        <LockOutlined style={{ color: '#faad14' }} />
                      </Tooltip>
                    )}
                  </Space>
                );
              },
            },
            {
              title: 'Effective',
              width: 100,
              render: (_: unknown, row: FieldRuleDto) => {
                const current = localRules[row.fieldId] ?? row.fieldPermission;
                const effective: AccessLevel = (row.isRequiredField && current === 'HIDDEN') ? 'VIEW' : current;
                return <Tag color={ACCESS_COLOR[effective]}>{effective}</Tag>;
              },
            },
          ]}
        />
      )}
    </>
  );
}

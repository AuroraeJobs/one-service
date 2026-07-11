import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Drawer, Empty, Form, Input, Pagination, Popconfirm, Select, Space, Spin, Tag, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import LifePageShell from './LifePageShell';
import { useAppPreferences } from '../contexts/AppPreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarInitial } from '../utils/avatar';
import {
  adminUserApi,
  type AdminCreateUserRequest,
  type AdminResetUserCredentialsRequest,
  type AdminUpdateUserRequest,
  type AdminUserSummary
} from '../services/api';

const passwordPattern = /^[a-zA-Z][\w-]{7,29}$/;
const usernamePattern = /^[a-zA-Z]\w{2,15}$/;

const UserManagementPage = () => {
  const { user } = useAuth();
  const { isEnglish } = useAppPreferences();
  const [items, setItems] = useState<AdminUserSummary[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserSummary | null>(null);
  const [editError, setEditError] = useState('');
  const [resetTarget, setResetTarget] = useState<AdminUserSummary | null>(null);
  const [createForm] = Form.useForm<AdminCreateUserRequest>();
  const [editForm] = Form.useForm<AdminUpdateUserRequest>();
  const [resetForm] = Form.useForm<AdminResetUserCredentialsRequest>();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const text = useMemo(() => ({
    eyebrow: isEnglish ? 'Admin Console' : '管理员控制台',
    title: isEnglish ? 'User Management' : '用户管理',
    addUser: isEnglish ? 'Add User' : '新增用户',
    refresh: isEnglish ? 'Refresh' : '刷新',
    username: isEnglish ? 'Username' : '用户名',
    password: isEnglish ? 'Password' : '密码',
    email: isEnglish ? 'Email' : '邮箱',
    phone: isEnglish ? 'Phone' : '手机号',
    avatar: isEnglish ? 'Avatar' : '头像',
    role: isEnglish ? 'Role' : '角色',
    status: isEnglish ? 'Status' : '状态',
    ok: isEnglish ? 'OK' : '确定',
    cancel: isEnglish ? 'Cancel' : '取消',
    enabled: isEnglish ? 'Enabled' : '启用',
    disabled: isEnglish ? 'Disabled' : '禁用',
    actions: isEnglish ? 'Actions' : '操作',
    disable: isEnglish ? 'Disable' : '禁用',
    enable: isEnglish ? 'Enable' : '启用',
    delete: isEnglish ? 'Delete' : '删除',
    reset: isEnglish ? 'Reset Password' : '重置密码',
    edit: isEnglish ? 'Edit' : '修改',
    noAccess: isEnglish ? 'Only ADMIN users can access user management.' : '仅 ADMIN 角色用户可以访问用户管理。',
    createTitle: isEnglish ? 'Add User' : '新增用户',
    editTitle: isEnglish ? 'Edit User' : '修改用户',
    resetTitle: isEnglish ? 'Reset Password' : '重置密码',
    confirmDisable: isEnglish ? 'Disable this user?' : '确认禁用该用户？',
    confirmDelete: isEnglish ? 'Delete this disabled user?' : '确认删除该禁用用户？',
    createSuccess: isEnglish ? 'User created' : '用户已创建',
    disableSuccess: isEnglish ? 'User disabled' : '用户已禁用',
    enableSuccess: isEnglish ? 'User enabled' : '用户已启用',
    deleteSuccess: isEnglish ? 'User deleted' : '用户已删除',
    editSuccess: isEnglish ? 'User updated' : '用户资料已更新',
    resetSuccess: isEnglish ? 'Password reset' : '密码已重置',
    selfHint: isEnglish ? 'Current user' : '当前用户',
    usernameRule: isEnglish ? '3-16 chars, start with a letter, letters/numbers/underscore only' : '3-16位，必须以字母开头，仅支持字母、数字、下划线',
    passwordRule: isEnglish ? '8-30 chars, start with a letter, letters/numbers/underscore/hyphen only' : '8-30位，必须以字母开头，仅支持字母、数字、下划线和短横线'
  }), [isEnglish]);

  const loadUsers = async (nextPage = page, nextSize = size) => {
    if (!isAdmin) return;
    setLoading(true);
    setLoadError('');
    try {
      const data = await adminUserApi.listUsers({ page: nextPage, size: nextSize });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || nextPage);
      setSize(data.size || nextSize);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (isEnglish ? 'Failed to load users' : '用户列表加载失败');
      setItems([]);
      setTotal(0);
      setLoadError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1, size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleCreate = async () => {
    const values = await createForm.validateFields();
    setActionLoading('create');
    try {
      await adminUserApi.createUser(values);
      message.success(text.createSuccess);
      setCreateOpen(false);
      createForm.resetFields();
      await loadUsers(1, size);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : (isEnglish ? 'Failed to create user' : '用户创建失败'));
    } finally {
      setActionLoading('');
    }
  };

  const handleDisable = async (target: AdminUserSummary) => {
    setActionLoading(`disable-${target.id}`);
    try {
      await adminUserApi.disableUser(target.id);
      message.success(text.disableSuccess);
      await loadUsers(page, size);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : (isEnglish ? 'Failed to disable user' : '用户禁用失败'));
    } finally {
      setActionLoading('');
    }
  };

  const handleEnable = async (target: AdminUserSummary) => {
    setActionLoading(`enable-${target.id}`);
    try {
      await adminUserApi.enableUser(target.id);
      message.success(text.enableSuccess);
      await loadUsers(page, size);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : (isEnglish ? 'Failed to enable user' : '用户启用失败'));
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async (target: AdminUserSummary) => {
    setActionLoading(`delete-${target.id}`);
    try {
      await adminUserApi.deleteDisabledUser(target.id);
      message.success(text.deleteSuccess);
      await loadUsers(page, size);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : (isEnglish ? 'Failed to delete user' : '用户删除失败'));
    } finally {
      setActionLoading('');
    }
  };

  const openReset = (target: AdminUserSummary) => {
    setResetTarget(target);
    resetForm.setFieldsValue({ password: '' });
  };

  const openEdit = (target: AdminUserSummary) => {
    setEditTarget(target);
    setEditError('');
    editForm.setFieldsValue({
      username: target.username,
      avatar: target.avatar || '',
      email: target.email || '',
      phone: target.phone || '',
      role: target.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
      enabled: target.enabled !== false
    });
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    try {
      setEditError('');
      const values = await editForm.validateFields();
      setActionLoading(`edit-${editTarget.id}`);
      await adminUserApi.updateUser(editTarget.id, {
        ...values,
        username: values.username.trim(),
        avatar: values.avatar?.trim() || undefined,
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined
      });
      message.success(text.editSuccess);
      setEditTarget(null);
      editForm.resetFields();
      await loadUsers(page, size);
    } catch (error: unknown) {
      const validationErrors = (error as { errorFields?: unknown[] })?.errorFields;
      if (Array.isArray(validationErrors)) {
        const errorMessage = isEnglish ? 'Please check the highlighted fields' : '请检查表单中标红的字段';
        setEditError(errorMessage);
        message.warning(errorMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : (isEnglish ? 'Failed to update user' : '用户资料更新失败');
        setEditError(errorMessage);
        message.error(errorMessage);
      }
    } finally {
      setActionLoading('');
    }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    const values = await resetForm.validateFields();
    setActionLoading(`reset-${resetTarget.id}`);
    try {
      await adminUserApi.resetCredentials(resetTarget.id, values);
      message.success(text.resetSuccess);
      setResetTarget(null);
      resetForm.resetFields();
      await loadUsers(page, size);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : (isEnglish ? 'Failed to reset password' : '密码重置失败'));
    } finally {
      setActionLoading('');
    }
  };

  const renderUserCard = (record: AdminUserSummary) => {
    const isSelf = record.id === user?.id;
    const isDisabled = record.enabled === false;
    const avatarSrc = record.avatar?.trim();
    const avatarInitial = getAvatarInitial(record.username || '');

    return (
      <Card
        key={record.id}
        className="life-panel-card user-management-card"
        title={(
          <div className="user-management-card-title">
            <div
              className="user-management-card-avatar"
              style={avatarSrc ? undefined : { backgroundColor: '#7c3aed' }}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt={isEnglish ? `${record.username} avatar` : `${record.username}头像`} />
              ) : (
                <span>{avatarInitial}</span>
              )}
            </div>
            <Space size={8} wrap>
              <strong>{record.username}</strong>
              {isSelf && <Tag color="blue">{text.selfHint}</Tag>}
            </Space>
          </div>
        )}
        extra={(
          <Space size={6} wrap>
            <Tag color={record.role?.toUpperCase() === 'ADMIN' ? 'gold' : 'default'}>{record.role || 'USER'}</Tag>
            <Tag color={isDisabled ? 'red' : 'green'}>{isDisabled ? text.disabled : text.enabled}</Tag>
          </Space>
        )}
      >
        <div className="user-management-card-fields">
          <div className="user-management-card-field">
            <span>{text.email}</span>
            <strong>{record.email || '-'}</strong>
          </div>
          <div className="user-management-card-field">
            <span>{text.phone}</span>
            <strong>{record.phone || '-'}</strong>
          </div>
        </div>
        <div className="user-management-card-actions">
          <Space wrap>
            <Button
              size="small"
              icon={<LockOutlined />}
              disabled={isSelf}
              loading={actionLoading === `${isDisabled ? 'enable' : 'disable'}-${record.id}`}
              onClick={() => isDisabled ? handleEnable(record) : handleDisable(record)}
            >
              {isDisabled ? text.enable : text.disable}
            </Button>
            <Popconfirm
              title={text.confirmDelete}
              disabled={isSelf || !isDisabled}
              onConfirm={() => handleDelete(record)}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={isSelf || !isDisabled}
                loading={actionLoading === `delete-${record.id}`}
              >
                {text.delete}
              </Button>
            </Popconfirm>
          </Space>
          <Space wrap>
            <Button
              size="small"
              icon={<EditOutlined />}
              loading={actionLoading === `edit-${record.id}`}
              onClick={() => openEdit(record)}
            >
              {text.edit}
            </Button>
            <Button
              size="small"
              icon={<SafetyCertificateOutlined />}
              loading={actionLoading === `reset-${record.id}`}
              onClick={() => openReset(record)}
            >
              {text.reset}
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  const handlePageChange = (nextPage: number, nextSize: number) => {
    loadUsers(nextPage, nextSize);
  };

  return (
    <LifePageShell
      className="user-management-page"
      eyebrow={text.eyebrow}
      title={text.title}
      actions={
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => loadUsers(page, size)} loading={loading}>
            {text.refresh}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)} disabled={!isAdmin}>
            {text.addUser}
          </Button>
        </Space>
      }
    >
      {!isAdmin ? (
        <Alert type="warning" showIcon message={text.noAccess} />
      ) : (
        <Space
          className="user-management-list-shell"
          direction="vertical"
          size={16}
          style={{ width: '100%' }}
        >
          {loadError && (
            <Alert
              type="error"
              showIcon
              message={isEnglish ? 'Failed to load users' : '用户列表加载失败'}
              description={loadError}
            />
          )}
          <Spin spinning={loading}>
            {items.length > 0 ? (
              <div className="user-management-card-grid">
                {items.map(renderUserCard)}
              </div>
            ) : (
              <Empty />
            )}
          </Spin>
          <Pagination
            className="user-management-pagination"
            current={page}
            pageSize={size}
            total={total}
            showSizeChanger
            showTotal={value => isEnglish ? `${value} users` : `共 ${value} 个用户`}
            onChange={handlePageChange}
          />
        </Space>
      )}

      <Drawer
        title={text.createTitle}
        open={createOpen}
        placement="right"
        width="min(480px, 100vw)"
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        footer={(
          <Space className="user-management-drawer-footer">
            <Button onClick={() => setCreateOpen(false)}>{text.cancel}</Button>
            <Button type="primary" loading={actionLoading === 'create'} onClick={handleCreate}>
              {text.ok}
            </Button>
          </Space>
        )}
      >
        <Form form={createForm} layout="vertical" initialValues={{ role: 'USER' }}>
          <Form.Item name="username" label={text.username} rules={[
            { required: true, message: text.usernameRule },
            { pattern: usernamePattern, message: text.usernameRule }
          ]}>
            <Input prefix={<UserSwitchOutlined />} />
          </Form.Item>
          <Form.Item name="password" label={text.password} rules={[
            { required: true, message: text.passwordRule },
            { pattern: passwordPattern, message: text.passwordRule }
          ]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label={text.role}>
            <Select options={[{ value: 'USER', label: 'USER' }, { value: 'ADMIN', label: 'ADMIN' }]} />
          </Form.Item>
          <Form.Item name="email" label={text.email} rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={text.phone}>
            <Input />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={text.editTitle}
        open={Boolean(editTarget)}
        placement="right"
        width="min(480px, 100vw)"
        onClose={() => {
          setEditTarget(null);
          setEditError('');
        }}
        destroyOnHidden
        footer={(
          <Space className="user-management-drawer-footer">
            <Button
              onClick={() => {
                setEditTarget(null);
                setEditError('');
              }}
            >
              {text.cancel}
            </Button>
            <Button
              type="primary"
              loading={Boolean(editTarget && actionLoading === `edit-${editTarget.id}`)}
              onClick={handleEdit}
            >
              {text.ok}
            </Button>
          </Space>
        )}
      >
        {editError && (
          <Alert
            className="user-management-modal-alert"
            type="error"
            showIcon
            message={editError}
          />
        )}
        <Form form={editForm} layout="vertical" onValuesChange={() => editError && setEditError('')}>
          <Form.Item name="username" label={text.username} rules={[
            { required: true, message: text.usernameRule },
            { pattern: usernamePattern, message: text.usernameRule }
          ]}>
            <Input prefix={<UserSwitchOutlined />} disabled={editTarget?.id === user?.id} />
          </Form.Item>
          <Form.Item name="role" label={text.role}>
            <Select options={[{ value: 'USER', label: 'USER' }, { value: 'ADMIN', label: 'ADMIN' }]} />
          </Form.Item>
          <Form.Item name="enabled" label={text.status}>
            <Select options={[
              { value: true, label: text.enabled },
              { value: false, label: text.disabled }
            ]} />
          </Form.Item>
          <Form.Item name="email" label={text.email} rules={[{ type: 'email' }]}>
            <Input allowClear />
          </Form.Item>
          <Form.Item name="phone" label={text.phone}>
            <Input allowClear />
          </Form.Item>
          <Form.Item name="avatar" label={text.avatar}>
            <Input allowClear />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={text.resetTitle}
        open={Boolean(resetTarget)}
        placement="right"
        width="min(480px, 100vw)"
        onClose={() => setResetTarget(null)}
        destroyOnHidden
        footer={(
          <Space className="user-management-drawer-footer">
            <Button onClick={() => setResetTarget(null)}>{text.cancel}</Button>
            <Button
              type="primary"
              loading={Boolean(resetTarget && actionLoading === `reset-${resetTarget.id}`)}
              onClick={handleReset}
            >
              {text.ok}
            </Button>
          </Space>
        )}
      >
        <Form form={resetForm} layout="vertical">
          <Form.Item name="password" label={text.password} rules={[
            { required: true, message: text.passwordRule },
            { pattern: passwordPattern, message: text.passwordRule }
          ]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Drawer>
    </LifePageShell>
  );
};

export default UserManagementPage;

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Alert, Typography, Checkbox } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@store/authStore';
import { authApi } from './api';
import { color, font } from '@theme/tokens';
import type { ProblemDetail } from '@services/api';

interface LoginForm {
  username: string;
  password: string;
  rememberSession: boolean;
}

export function LoginPage() {
  const [form] = Form.useForm<LoginForm>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  // After login, send the user back to wherever they were trying to go
  const from = (location.state as { from?: string })?.from ?? '/';

  async function handleSubmit() {
    const values = await form.validateFields();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({
        username: values.username.trim(),
        password: values.password,
      });
      setAuth(res.token, {
        userId: res.userId,
        username: res.username,
        fullName: res.fullName,
      });
      navigate(from, { replace: true });
    } catch (err) {
      const pd = err as ProblemDetail;
      setError(pd?.detail ?? pd?.title ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: color.bg,
      }}
    >
      {/* Left brand panel */}
      <div
        style={{
          width: 420,
          flexShrink: 0,
          background: color.primary,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 48px',
        }}
      >
        {/* Module colour rail — the one design signature present throughout the app */}
        <div
          style={{
            width: 3,
            height: 40,
            background: color.secondary,
            borderRadius: 2,
            marginBottom: 24,
          }}
        />
        <Typography.Title
          level={1}
          style={{
            color: '#fff',
            fontFamily: font.body,
            fontSize: 36,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          ETRM
        </Typography.Title>
        <Typography.Text
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 15,
            marginTop: 10,
            display: 'block',
          }}
        >
          Enterprise Trading &amp; Risk Management
        </Typography.Text>

        <div style={{ marginTop: 'auto', paddingTop: 48 }}>
          {[
            'Multi-commodity — Oil · Power · Gas',
            'Full trade lifecycle',
            'Position &amp; P&amp;L in real time',
          ].map((line) => (
            <div
              key={line}
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 12,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: color.secondary,
                  flexShrink: 0,
                }}
              />
              <span dangerouslySetInnerHTML={{ __html: line }} />
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>
          <Typography.Title
            level={2}
            style={{ marginBottom: 4, fontFamily: font.body }}
          >
            Sign in
          </Typography.Title>
          <Typography.Text
            type="secondary"
            style={{ display: 'block', marginBottom: 32 }}
          >
            Use your ETRM credentials to continue.
          </Typography.Text>

          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 24 }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
            initialValues={{ rememberSession: true }}
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Username is required' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: color.textDisabled }} />}
                placeholder="your.username"
                size="large"
                autoComplete="username"
                autoFocus
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: color.textDisabled }} />}
                placeholder="••••••••"
                size="large"
                autoComplete="current-password"
                onPressEnter={handleSubmit}
              />
            </Form.Item>

            <Form.Item name="rememberSession" valuePropName="checked" style={{ marginBottom: 24 }}>
              <Checkbox>Keep me signed in for this session</Checkbox>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ height: 44 }}
              >
                Sign in
              </Button>
            </Form.Item>
          </Form>

          {import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true' && (
            <div
              style={{
                marginTop: 24,
                padding: '12px 16px',
                background: '#FAFAF7',
                border: `1px solid ${color.border}`,
                borderRadius: 6,
              }}
            >
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                Running in mock mode
              </Typography.Text>
              <Button
                size="small"
                onClick={() => {
                  form.setFieldsValue({ username: 'dev.admin', password: 'DevPassword123!' });
                  handleSubmit();
                }}
                style={{ fontSize: 12 }}
              >
                Sign in as dev.admin
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

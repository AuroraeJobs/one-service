import { useState } from 'react';
import { Form, Input, Button, Card, message, Space, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const { Title, Text } = Typography;

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  email?: string;
}

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleRegister = async (values: RegisterFormData) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    if (values.password.length < 8 || values.password.length > 16) {
      message.error('密码长度必须在8-16位之间');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/auth/register', {
        username: values.username,
        password: values.password,
        phone: values.phone,
        email: values.email
      }, {
        withCredentials: true
      });

      if (response.data.code === 200) {
        message.success('注册成功！请登录');
        navigate('/login');
      } else {
        message.error(response.data.message || '注册失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('注册错误:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }} />
          ))}
        </div>
      </div>
      
      <Card className="login-card" bordered={false}>
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="url(#gradient)" strokeWidth="4" />
                <circle cx="24" cy="24" r="8" fill="url(#gradient)" />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
                    <stop stopColor="#1890ff" />
                    <stop offset="1" stopColor="#722ed1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <Title level={2} className="login-title">注册账号</Title>
          </div>
          <Text type="secondary" className="login-subtitle">
            创建新账号，开始探索之旅
          </Text>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={handleRegister}
          autoComplete="off"
          size="large"
          className="login-form"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { pattern: /^[a-zA-Z]\w{2,15}$/, message: '用户名必须以字母开头，长度3-16位' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { pattern: /^[a-zA-Z]\w{7,15}$/, message: '密码必须以字母开头，长度8-16位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { pattern: /^[1]([3-9])[0-9]{9}$/, message: '请输入有效的手机号' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="手机号"
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱"
              className="login-input"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              className="login-button"
            >
              注 册
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Register;

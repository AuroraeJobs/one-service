import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useI18n } from '../contexts/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';
import './Login.css';

const { Title, Text } = Typography;
const passwordPattern = /^[a-zA-Z][\w-]{7,29}$/;

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
  const { t, translateText } = useI18n();
  const passwordRuleMessage = t('密码必须以字母开头，长度8-30位，仅支持字母、数字、下划线和短横线');

  const handleRegister = async (values: RegisterFormData) => {
    if (values.password !== values.confirmPassword) {
      message.error(t('两次输入的密码不一致'));
      return;
    }

    if (values.password.length < 8 || values.password.length > 30) {
      message.error(t('密码长度必须在8-30位之间'));
      return;
    }

    if (!passwordPattern.test(values.password)) {
      message.error(passwordRuleMessage);
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
        message.success(t('注册成功！请登录'));
        navigate('/login');
      } else {
        message.error(response.data.message ? translateText(response.data.message) : t('注册失败，请稍后重试'));
      }
    } catch (error: unknown) {
      console.error('注册错误:', error);
      if (axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
        message.error(translateText(error.response.data.message));
      } else {
        message.error(t('注册失败，请稍后重试'));
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
        <LanguageSwitcher className="login-language-switcher" />
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
            <Title level={2} className="login-title">{t('注册账号')}</Title>
          </div>
          <Text type="secondary" className="login-subtitle">
            {t('创建新账号，开始探索之旅')}
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
              { required: true, message: t('请输入用户名') },
              { pattern: /^[a-zA-Z]\w{2,15}$/, message: t('用户名必须以字母开头，长度3-16位') }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('用户名')}
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: t('请输入密码') },
              { pattern: passwordPattern, message: passwordRuleMessage }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('密码')}
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: t('请确认密码') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('两次输入的密码不一致')));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('确认密码')}
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { pattern: /^[1]([3-9])[0-9]{9}$/, message: t('请输入有效的手机号') }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder={t('手机号')}
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { type: 'email', message: t('请输入有效的邮箱地址') }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder={t('邮箱')}
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
              {t('注 册')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Register;

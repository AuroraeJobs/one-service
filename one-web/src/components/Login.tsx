import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { GithubOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';
import './Login.css';

const { Title, Text } = Typography;

interface LoginFormData {
  username: string;
  password: string;
}

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const { login } = useAuth();
  const { t, translateText } = useI18n();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauth = params.get('oauth');
    const oauthBind = params.get('oauthBind');
    if (oauth === 'success') {
      setGithubLoading(true);
      axios.get('/auth/me', { withCredentials: true })
        .then(response => {
          if (response.data.code === 200) {
            login(response.data.data);
            navigate('/', { replace: true });
          } else {
            message.error(response.data.message ? translateText(response.data.message) : t('GitHub 登录状态获取失败'));
            navigate('/login', { replace: true });
          }
        })
        .catch(error => {
          if (axios.isAxiosError(error) && error.response?.data?.message) {
            message.error(translateText(error.response.data.message));
          } else {
            message.error(t('GitHub 登录状态获取失败'));
          }
          navigate('/login', { replace: true });
        })
        .finally(() => setGithubLoading(false));
    } else if (oauth === 'error') {
      message.error(t('GitHub 登录失败'));
      navigate('/login', { replace: true });
    } else if (oauthBind === 'github') {
      message.info(t('请登录本系统账号，登录成功后将自动绑定 GitHub'));
      navigate('/login', { replace: true });
    }
  }, [location.search, login, navigate, t, translateText]);

  const submitWhenUsernameReady = () => {
    const username = form.getFieldValue('username');

    if (!loading && typeof username === 'string' && username.trim()) {
      form.submit();
    }
  };

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    const account = values.username.trim();
    try {
      const response = await axios.post('/auth/login', {
        username: account,
        password: values.password
      }, {
        withCredentials: true
      });

      if (response.data.code === 200) {
        login(response.data.data);
        message.success(response.data.message ? translateText(response.data.message) : t('登录成功'));
        navigate('/');
      } else {
        message.error(response.data.message ? translateText(response.data.message) : t('登录失败，请检查账号和密码'));
      }
    } catch (error: unknown) {
      console.error('登录错误:', error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message.error(translateText(error.response.data.message));
      } else if (error instanceof Error) {
        message.error(translateText(error.message));
      } else {
        message.error(t('登录失败，请稍后重试'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    setGithubLoading(true);
    window.location.assign('/oauth2/authorization/github');
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
            <Title level={2} className="login-title">OneAI</Title>
          </div>
          <Text type="secondary" className="login-subtitle">
            {t('你的未来搭子')}
          </Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
          className="login-form"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('请输入用户名、邮箱或电话') }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('用户名 / 邮箱 / 电话')}
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('请输入密码') }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('密码')}
              className="login-input"
              onPressEnter={submitWhenUsernameReady}
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
              {t('登 录')}
            </Button>
          </Form.Item>
        </Form>

        <Button
          icon={<GithubOutlined />}
          loading={githubLoading}
          block
          className="github-login-button"
          onClick={handleGitHubLogin}
        >
          {t('GitHub 认证登录')}
        </Button>
      </Card>
    </div>
  );
};

export default Login;

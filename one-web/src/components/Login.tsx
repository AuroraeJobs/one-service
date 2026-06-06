import { useState } from 'react';
import { Form, Input, Button, Card, message, Space, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const { Title, Text } = Typography;

interface LoginFormData {
  username: string;
  password: string;
}

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { login } = useAuth();

  const submitWhenUsernameReady = () => {
    const username = form.getFieldValue('username');

    if (!loading && typeof username === 'string' && username.trim()) {
      form.submit();
    }
  };

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const response = await axios.post('/auth/login', {
        username: values.username,
        password: values.password
      }, {
        withCredentials: true
      });

      if (response.data.code === 200) {
        login(response.data.data);
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(response.data.message || '登录失败，请检查用户名和密码');
      }
    } catch (error: any) {
      console.error('登录错误:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error.message) {
        message.error(error.message);
      } else {
        message.error('登录失败，请稍后重试');
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
            <Title level={2} className="login-title">OneAI</Title>
          </div>
          <Text type="secondary" className="login-subtitle">
            你的未来搭子
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
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
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
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;

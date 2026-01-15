import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HealthDashboard: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 重定向到健康主页面
    navigate('/health');
  }, [navigate]);

  return null;
};

export default HealthDashboard;
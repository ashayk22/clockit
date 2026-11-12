import React from 'react';
import { Eye, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import '../../styles/demo.css';

export const DemoBanner: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user?.isDemo) return null;

  const handleExitDemo = async () => {
    await signOut();
    navigate('/signup');
  };

  return (
    <div className="clockit-demo-banner" role="status" aria-label="Demo mode active">
      <div className="clockit-demo-banner-content">
        <span className="clockit-demo-badge">
          <Eye size={13} className="clockit-demo-badge-icon" />
          <span>DEMO MODE</span>
        </span>
        <span className="clockit-demo-banner-text">
          You are exploring ClockIt with sample data. No account required, and no changes are saved to the cloud.
        </span>
      </div>

      <div className="clockit-demo-banner-actions">
        <button
          type="button"
          className="clockit-demo-cta-btn"
          onClick={handleExitDemo}
        >
          <span>Create Real Account</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;

import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="That page doesn't exist."
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Back to dashboard
        </Button>
      }
    />
  );
}

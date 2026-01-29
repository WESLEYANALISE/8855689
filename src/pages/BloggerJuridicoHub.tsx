import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BloggerJuridicoHub = () => {
  const navigate = useNavigate();

  // Redireciona direto para os artigos (intro removido)
  useEffect(() => {
    navigate('/blogger-juridico/artigos', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default BloggerJuridicoHub;

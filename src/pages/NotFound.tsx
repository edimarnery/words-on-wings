import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-12">
        <div className="flex justify-center mb-6">
          <img 
            src="/lovable-uploads/fcc990f6-15a8-4800-9cbc-15bd387871b8.png" 
            alt="Brazil Translations Logo" 
            className="h-16 w-16"
          />
        </div>
        <h1 className="mb-4 text-6xl font-bold text-blue-600">404</h1>
        <p className="mb-4 text-xl text-gray-600">Oops! Página não encontrada</p>
        <p className="mb-8 text-gray-500">A página que você procura não existe ou foi movida.</p>
        <a 
          href="/" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105"
        >
          Voltar ao Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;

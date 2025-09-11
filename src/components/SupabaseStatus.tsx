import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Settings, RefreshCw } from "lucide-react";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export const SupabaseStatus = () => {
  const isConfigured = isSupabaseConfigured();
  
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Status da Configuração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {isConfigured ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-500 font-medium">Supabase Conectado</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                Ativo
              </Badge>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="text-orange-500 font-medium">Supabase Desconectado</span>
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-700">
                Configurar
              </Badge>
            </>
          )}
        </div>
        
        {!isConfigured && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm text-orange-700 mb-2">
              Para usar a funcionalidade de tradução de documentos, você precisa:
            </p>
            <ol className="text-sm text-orange-700 list-decimal list-inside space-y-1">
              <li>Clicar no botão verde "Supabase" no canto superior direito</li>
              <li>Conectar ao seu projeto Supabase</li>
              <li>Configurar o bucket "documents" no Storage</li>
            </ol>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Verificar Novamente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
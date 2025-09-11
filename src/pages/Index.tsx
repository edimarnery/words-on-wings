import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Sparkles, Languages, FileText, Zap, Shield } from "lucide-react";
import { useTranslate } from "@/hooks/useTranslate";
import { LanguageSelector } from "@/components/LanguageSelector";
import { TranslateBox } from "@/components/TranslateBox";
import { TranslationHistory, Translation } from "@/components/TranslationHistory";
import { DocumentTranslator } from "@/components/DocumentTranslator";
import heroImage from "@/assets/hero-translation.jpg";

const Index = () => {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");

  const { translateText, isLoading, translations, clearHistory } = useTranslate();

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    
    const finalSourceLang = sourceLang === 'auto' ? 'pt' : sourceLang;
    const result = await translateText(sourceText, finalSourceLang, targetLang);
    setTranslatedText(result);
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return;
    
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleSelectTranslation = (translation: Translation) => {
    setSourceText(translation.sourceText);
    setTranslatedText(translation.translatedText);
    setSourceLang(translation.sourceLang);
    setTargetLang(translation.targetLang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section 
        className="relative py-20 px-4 text-center bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8)), url(${heroImage})` 
        }}
      >
        <div className="container mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
              <Languages className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Tradutor Universal
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Traduza textos e documentos com precisão usando inteligência artificial avançada
          </p>
          
          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90">
              <Sparkles className="h-5 w-5" />
              <span>IA Avançada</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90">
              <Languages className="h-5 w-5" />
              <span>+100 Idiomas</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90">
              <FileText className="h-5 w-5" />
              <span>Documentos</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90">
              <Zap className="h-5 w-5" />
              <span>Instantâneo</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90">
              <Shield className="h-5 w-5" />
              <span>Seguro</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto">
                <TabsTrigger value="text">Tradução de Texto</TabsTrigger>
                <TabsTrigger value="document">Tradução de Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  {/* Language Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Idioma de origem</label>
                      <LanguageSelector
                        value={sourceLang}
                        onChange={setSourceLang}
                        showAutoDetect={true}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSwapLanguages}
                        disabled={sourceLang === 'auto'}
                        className="rounded-full"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Idioma de destino</label>
                      <LanguageSelector
                        value={targetLang}
                        onChange={setTargetLang}
                      />
                    </div>
                  </div>

                  {/* Translation Boxes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Texto original</label>
                      <TranslateBox
                        value={sourceText}
                        onChange={setSourceText}
                        placeholder="Digite o texto que deseja traduzir..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Texto traduzido</label>
                      <TranslateBox
                        value={translatedText}
                        onChange={() => {}}
                        placeholder="A tradução aparecerá aqui..."
                        isReadOnly={true}
                      />
                    </div>
                  </div>

                  {/* Translate Button */}
                  <div className="flex justify-center mb-8">
                    <Button
                      onClick={handleTranslate}
                      disabled={!sourceText.trim() || isLoading}
                      size="lg"
                      className="px-8 shadow-lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Traduzindo...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4" />
                          Traduzir
                        </div>
                      )}
                    </Button>
                  </div>

                  {/* Translation History */}
                  {translations.length > 0 && (
                    <TranslationHistory
                      translations={translations}
                      onSelectTranslation={handleSelectTranslation}
                      onClearHistory={clearHistory}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="document">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <DocumentTranslator />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Languages className="h-5 w-5" />
            <span className="font-semibold">Tradutor Universal</span>
          </div>
          <p className="text-gray-400 mb-6">
            Quebre barreiras linguísticas com nossa tecnologia avançada de tradução
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <span>Powered by AI</span>
            <span>•</span>
            <span>Seguro e Privado</span>
            <span>•</span>
            <span>Traduções Precisas</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
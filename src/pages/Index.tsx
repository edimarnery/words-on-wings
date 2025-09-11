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
        className="relative py-20 px-4 text-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 overflow-hidden"
      >
        {/* Geometric Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-400/20 rounded-full transform translate-x-1/2 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-300/15 rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-300/10 transform rotate-45 rounded-3xl"></div>
          <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-white/5 rounded-full"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-white/10 rounded-full backdrop-blur-sm">
              <img 
                src="/lovable-uploads/87544ea1-fb63-45c9-9dd4-8c9aea846985.png" 
                alt="Brazil Translations Logo" 
                className="h-24 w-24"
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Brazil Translations
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
      <section className="py-16 bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <TabsTrigger value="text" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-300">Tradução de Texto</TabsTrigger>
                <TabsTrigger value="document" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-300">Tradução de Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 animate-fade-in">
                  {/* Language Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Idioma de origem</label>
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
                        className="rounded-full hover:scale-110 transition-all duration-200 border-blue-200 hover:bg-blue-50"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Idioma de destino</label>
                      <LanguageSelector
                        value={targetLang}
                        onChange={setTargetLang}
                      />
                    </div>
                  </div>

                  {/* Translation Boxes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Texto original</label>
                      <TranslateBox
                        value={sourceText}
                        onChange={setSourceText}
                        placeholder="Digite o texto que deseja traduzir..."
                      />
                    </div>
                    <div className="animate-fade-in" style={{animationDelay: '0.2s'}}>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Texto traduzido</label>
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
                      className="px-8 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105 transition-all duration-300"
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
                    <div className="animate-fade-in" style={{animationDelay: '0.3s'}}>
                      <TranslationHistory
                        translations={translations}
                        onSelectTranslation={handleSelectTranslation}
                        onClearHistory={clearHistory}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="document">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 animate-fade-in">
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="/lovable-uploads/87544ea1-fb63-45c9-9dd4-8c9aea846985.png" 
              alt="Brazil Translations Logo" 
              className="h-8 w-8"
            />
            <span className="font-semibold text-lg">Brazil Translations</span>
          </div>
          <p className="text-gray-400 mb-6">
            Quebre barreiras linguísticas com nossa tecnologia avançada de tradução
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <span>Powered by Advanced AI</span>
            <span>•</span>
            <span>Seguro e Privado</span>
            <span>•</span>
            <span>Traduções Precisas</span>
            <span>•</span>
            <span>Brazil Translations © 2024</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
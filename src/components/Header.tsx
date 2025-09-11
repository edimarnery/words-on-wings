import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Top Contact Bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <a href="tel:+551132952888" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Phone size={14} />
              +55 (11) 3295-2888
            </a>
            <a href="mailto:sales@brazilts.com.br" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Mail size={14} />
              sales@brazilts.com.br
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent font-medium">(11) 99981-9076</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-primary/95 backdrop-blur-sm text-primary-foreground shadow-brand sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/7f972b2f-537e-4f19-b7ab-6593e849de29.png" 
                alt="Brazil Translations" 
                className="h-10 w-auto"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#home" className="hover:text-accent transition-colors font-medium">
                Home
              </a>
              <a href="#services" className="hover:text-accent transition-colors font-medium">
                Serviços
              </a>
              <a href="#about" className="hover:text-accent transition-colors font-medium">
                Sobre
              </a>
              <a href="#contact" className="hover:text-accent transition-colors font-medium">
                Contato
              </a>
              <Button 
                variant="secondary" 
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
              >
                Solicitar Orçamento
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-primary-foreground hover:text-accent"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pt-4 border-t border-primary-foreground/20">
              <div className="flex flex-col gap-4">
                <a href="#home" className="hover:text-accent transition-colors font-medium">
                  Home
                </a>
                <a href="#services" className="hover:text-accent transition-colors font-medium">
                  Serviços
                </a>
                <a href="#about" className="hover:text-accent transition-colors font-medium">
                  Sobre
                </a>
                <a href="#contact" className="hover:text-accent transition-colors font-medium">
                  Contato
                </a>
                <Button 
                  variant="secondary" 
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-medium w-fit"
                >
                  Solicitar Orçamento
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
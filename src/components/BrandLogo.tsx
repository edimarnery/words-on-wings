import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  className = '',
  showText = false 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-24 w-24'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/lovable-uploads/87544ea1-fb63-45c9-9dd4-8c9aea846985.png" 
        alt="Brazil Translations Logo" 
        className={sizeClasses[size]}
      />
      {showText && (
        <span className={`font-semibold ${textSizeClasses[size]}`}>
          Brazil Translations
        </span>
      )}
    </div>
  );
};
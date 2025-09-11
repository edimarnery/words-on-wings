# -*- coding: utf-8 -*-
"""
Core de tradução simplificado - Versão 2.0
"""

import logging
from typing import List, Dict, Optional
from config import get_openai_client, DEFAULT_MODEL

logger = logging.getLogger(__name__)

def translate_text_batch(texts: List[str], source_lang: str, target_lang: str, model: str = None) -> Dict[str, str]:
    """Traduz lista de textos"""
    if not texts:
        return {}
    
    client = get_openai_client()
    if not client:
        raise Exception("Cliente OpenAI não disponível")
    
    model = model or DEFAULT_MODEL
    result = {}
    
    for i, text in enumerate(texts):
        if not text.strip():
            result[f"text_{i}"] = text
            continue
            
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": f"Traduza o texto de {source_lang} para {target_lang}. Mantenha a formatação original."},
                    {"role": "user", "content": text}
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            result[f"text_{i}"] = response.choices[0].message.content
            logger.info(f"Texto {i+1}/{len(texts)} traduzido")
            
        except Exception as e:
            logger.error(f"Erro traduzindo texto {i}: {e}")
            result[f"text_{i}"] = text  # Retorna original em caso de erro
    
    return result

def get_supported_languages():
    """Retorna idiomas suportados"""
    return {
        "Português": "pt",
        "Inglês": "en", 
        "Espanhol": "es",
        "Francês": "fr",
        "Alemão": "de",
        "Italiano": "it",
        "Japonês": "ja",
        "Chinês": "zh",
        "Russo": "ru",
        "Árabe": "ar"
    }
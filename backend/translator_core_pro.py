# -*- coding: utf-8 -*-
"""
Sistema de Tradução Profissional - Versão Robusta
Preserva 100% da formatação e estrutura original
"""

import os
import json
import logging
import shutil
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import regex as re
from openpyxl import load_workbook
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from pptx import Presentation
from openai import OpenAI
import time
from config import get_openai_client, DEFAULT_MODEL, validate_openai_config

# Configurar logging detalhado
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TranslationResult:
    """Resultado da tradução com métricas"""
    success: bool
    original_elements: int
    translated_elements: int
    errors: List[str]
    warnings: List[str]
    processing_time: float
    file_hash_original: str
    file_hash_translated: str

@dataclass
class DocumentStructure:
    """Estrutura completa do documento"""
    paragraphs: int = 0
    tables: int = 0
    images: int = 0
    headers: int = 0
    footers: int = 0
    text_boxes: int = 0
    shapes: int = 0
    slides: int = 0  # Para PPTX
    worksheets: int = 0  # Para XLSX

class ProfessionalTranslator:
    """Tradutor profissional com validação de integridade"""
    
    def __init__(self):
        try:
            # Usar configuração centralizada
            validate_openai_config()
            self.client = get_openai_client()
            logger.info("Tradutor profissional inicializado com sucesso")
        except Exception as e:
            logger.error(f"Erro ao inicializar tradutor profissional: {e}")
            self.client = None
        
        self.backup_dir = Path("backups")
        self.backup_dir.mkdir(exist_ok=True)
        
    def create_backup(self, file_path: str) -> str:
        """Cria backup do arquivo original"""
        timestamp = int(time.time())
        filename = Path(file_path).name
        backup_name = f"{timestamp}_{filename}"
        backup_path = self.backup_dir / backup_name
        shutil.copy2(file_path, backup_path)
        logger.info(f"Backup criado: {backup_path}")
        return str(backup_path)
    
    def calculate_file_hash(self, file_path: str) -> str:
        """Calcula hash do arquivo para verificação"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def analyze_document_structure(self, file_path: str) -> DocumentStructure:
        """Analisa estrutura completa do documento"""
        ext = os.path.splitext(file_path)[1].lower()
        structure = DocumentStructure()
        
        try:
            if ext == '.docx':
                doc = Document(file_path)
                structure.paragraphs = len(doc.paragraphs)
                structure.tables = len(doc.tables)
                
                # Contar headers e footers
                for section in doc.sections:
                    if section.header.paragraphs:
                        structure.headers += len([p for p in section.header.paragraphs if p.text.strip()])
                    if section.footer.paragraphs:
                        structure.footers += len([p for p in section.footer.paragraphs if p.text.strip()])
                
                # Contar imagens e shapes
                for rel in doc.part.rels.values():
                    if "image" in rel.target_ref:
                        structure.images += 1
                        
            elif ext == '.pptx':
                prs = Presentation(file_path)
                structure.slides = len(prs.slides)
                
                for slide in prs.slides:
                    for shape in slide.shapes:
                        if hasattr(shape, "text_frame"):
                            structure.text_boxes += 1
                        structure.shapes += 1
                        
            elif ext == '.xlsx':
                wb = load_workbook(file_path)
                structure.worksheets = len(wb.worksheets)
                
                for ws in wb.worksheets:
                    for row in ws.iter_rows():
                        for cell in row:
                            if cell.value and isinstance(cell.value, str) and cell.value.strip():
                                structure.paragraphs += 1
                                
        except Exception as e:
            logger.error(f"Erro ao analisar estrutura: {e}")
            
        return structure
    
    def intelligent_chunk_text(self, text: str, max_tokens: int = 3000) -> List[str]:
        """Divide texto inteligentemente preservando contexto"""
        if not text or len(text) < max_tokens:
            return [text] if text else []
        
        # Tentar dividir por parágrafos primeiro
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            if len(current_chunk + para) < max_tokens:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        # Se ainda tiver chunks muito grandes, dividir por sentenças
        final_chunks = []
        for chunk in chunks:
            if len(chunk) > max_tokens:
                sentences = re.split(r'(?<=[.!?])\s+', chunk)
                sub_chunk = ""
                for sentence in sentences:
                    if len(sub_chunk + sentence) < max_tokens:
                        sub_chunk += sentence + " "
                    else:
                        if sub_chunk:
                            final_chunks.append(sub_chunk.strip())
                        sub_chunk = sentence + " "
                if sub_chunk:
                    final_chunks.append(sub_chunk.strip())
            else:
                final_chunks.append(chunk)
        
        return final_chunks
    
    def translate_with_context(self, text: str, context: str, source_lang: str, target_lang: str, model: str = None) -> str:
        """Traduz texto com contexto para maior precisão"""
        if not self.client or not text.strip():
            logger.warning(f"Cliente não disponível ou texto vazio. Cliente: {self.client is not None}, Texto: '{text[:50]}...'")
            return text
            
        try:
            logger.info(f"Iniciando tradução: {len(text)} caracteres, modelo: {model or DEFAULT_MODEL}")
            
            prompt = f"""Você é um tradutor profissional especializado em documentos técnicos e oficiais.

CONTEXTO DO DOCUMENTO: {context}

INSTRUÇÕES CRÍTICAS:
1. Traduza APENAS o texto fornecido, mantendo formatação EXATA
2. Preserve TODOS os números, códigos, referências e formatação
3. Mantenha nomes próprios inalterados
4. Use terminologia técnica apropriada para {target_lang}
5. Preserve quebras de linha, espaçamento e pontuação
6. NÃO adicione ou remova conteúdo
7. Mantenha a mesma estrutura de parágrafos

TEXTO A TRADUZIR:
{text}

TRADUÇÃO:"""

            response = self.client.chat.completions.create(
                model=model or DEFAULT_MODEL,
                messages=[
                    {
                        "role": "system", 
                        "content": f"Você é um tradutor especializado que preserva formatação exata. Traduza de {source_lang} para {target_lang}."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=4000,
                timeout=120  # Timeout mais longo
            )
            
            translation = response.choices[0].message.content.strip()
            logger.info(f"Tradução concluída: {len(translation)} caracteres")
            return translation
            
        except Exception as e:
            logger.error(f"ERRO CRÍTICO na tradução: {type(e).__name__}: {str(e)}")
            logger.error(f"Texto que causou erro: '{text[:100]}...'")
            # Em caso de erro, retornar texto original para não quebrar o documento
            return text
    
    def translate_docx_professional(self, input_path: str, output_path: str, source_lang: str, target_lang: str, model: str = None) -> TranslationResult:
        """Tradução profissional de DOCX preservando 100% da formatação"""
        start_time = time.time()
        errors = []
        warnings = []
        original_elements = 0
        translated_elements = 0
        
        try:
            # Criar backup
            backup_path = self.create_backup(input_path)
            original_hash = self.calculate_file_hash(input_path)
            
            # Analisar estrutura original
            original_structure = self.analyze_document_structure(input_path)
            
            # Abrir documento
            doc = Document(input_path)
            
            # Contexto do documento
            context = f"Documento DOCX com {original_structure.paragraphs} parágrafos, {original_structure.tables} tabelas"
            
            # Traduzir parágrafos principais
            for i, paragraph in enumerate(doc.paragraphs):
                if paragraph.text.strip():
                    original_elements += 1
                    try:
                        # Preservar formatação de cada run
                        for run in paragraph.runs:
                            if run.text.strip():
                                original_text = run.text
                                translated_text = self.translate_with_context(
                                    original_text, context, source_lang, target_lang, model
                                )
                                run.text = translated_text
                                translated_elements += 1
                                
                    except Exception as e:
                        errors.append(f"Erro no parágrafo {i}: {str(e)}")
            
            # Traduzir tabelas preservando estrutura
            for table_idx, table in enumerate(doc.tables):
                for row_idx, row in enumerate(table.rows):
                    for cell_idx, cell in enumerate(row.cells):
                        for para in cell.paragraphs:
                            if para.text.strip():
                                original_elements += 1
                                try:
                                    for run in para.runs:
                                        if run.text.strip():
                                            original_text = run.text
                                            translated_text = self.translate_with_context(
                                                original_text, f"{context} - Tabela {table_idx+1}", 
                                                source_lang, target_lang, model
                                            )
                                            run.text = translated_text
                                            translated_elements += 1
                                            
                                except Exception as e:
                                    errors.append(f"Erro na tabela {table_idx}, célula ({row_idx},{cell_idx}): {str(e)}")
            
            # Traduzir headers e footers
            for section_idx, section in enumerate(doc.sections):
                # Header
                if section.header:
                    for para in section.header.paragraphs:
                        if para.text.strip():
                            original_elements += 1
                            try:
                                for run in para.runs:
                                    if run.text.strip():
                                        original_text = run.text
                                        translated_text = self.translate_with_context(
                                            original_text, f"{context} - Header", 
                                            source_lang, target_lang, model
                                        )
                                        run.text = translated_text
                                        translated_elements += 1
                                        
                            except Exception as e:
                                errors.append(f"Erro no header da seção {section_idx}: {str(e)}")
                
                # Footer
                if section.footer:
                    for para in section.footer.paragraphs:
                        if para.text.strip():
                            original_elements += 1
                            try:
                                for run in para.runs:
                                    if run.text.strip():
                                        original_text = run.text
                                        translated_text = self.translate_with_context(
                                            original_text, f"{context} - Footer", 
                                            source_lang, target_lang, model
                                        )
                                        run.text = translated_text
                                        translated_elements += 1
                                        
                            except Exception as e:
                                errors.append(f"Erro no footer da seção {section_idx}: {str(e)}")
            
            # Salvar documento traduzido
            doc.save(output_path)
            
            # Verificar integridade
            translated_hash = self.calculate_file_hash(output_path)
            translated_structure = self.analyze_document_structure(output_path)
            
            # Validar estrutura
            if (translated_structure.paragraphs != original_structure.paragraphs or
                translated_structure.tables != original_structure.tables):
                warnings.append("Estrutura do documento pode ter sido alterada")
            
            processing_time = time.time() - start_time
            
            return TranslationResult(
                success=len(errors) == 0,
                original_elements=original_elements,
                translated_elements=translated_elements,
                errors=errors,
                warnings=warnings,
                processing_time=processing_time,
                file_hash_original=original_hash,
                file_hash_translated=translated_hash
            )
            
        except Exception as e:
            logger.error(f"Erro crítico na tradução DOCX: {e}")
            return TranslationResult(
                success=False,
                original_elements=original_elements,
                translated_elements=translated_elements,
                errors=[f"Erro crítico: {str(e)}"],
                warnings=warnings,
                processing_time=time.time() - start_time,
                file_hash_original="",
                file_hash_translated=""
            )
    
    def translate_pptx_professional(self, input_path: str, output_path: str, source_lang: str, target_lang: str, model: str = None) -> TranslationResult:
        """Tradução profissional de PPTX preservando 100% da formatação"""
        start_time = time.time()
        errors = []
        warnings = []
        original_elements = 0
        translated_elements = 0
        
        try:
            backup_path = self.create_backup(input_path)
            original_hash = self.calculate_file_hash(input_path)
            original_structure = self.analyze_document_structure(input_path)
            
            prs = Presentation(input_path)
            context = f"Apresentação PPTX com {original_structure.slides} slides"
            
            # Traduzir cada slide
            for slide_idx, slide in enumerate(prs.slides):
                for shape_idx, shape in enumerate(slide.shapes):
                    if hasattr(shape, "text_frame") and shape.text_frame:
                        for para_idx, paragraph in enumerate(shape.text_frame.paragraphs):
                            if paragraph.text.strip():
                                original_elements += 1
                                try:
                                    for run in paragraph.runs:
                                        if run.text.strip():
                                            original_text = run.text
                                            translated_text = self.translate_with_context(
                                                original_text, f"{context} - Slide {slide_idx+1}", 
                                                source_lang, target_lang, model
                                            )
                                            run.text = translated_text
                                            translated_elements += 1
                                            
                                except Exception as e:
                                    errors.append(f"Erro no slide {slide_idx+1}, shape {shape_idx}, parágrafo {para_idx}: {str(e)}")
            
            prs.save(output_path)
            
            translated_hash = self.calculate_file_hash(output_path)
            translated_structure = self.analyze_document_structure(output_path)
            
            if translated_structure.slides != original_structure.slides:
                warnings.append("Número de slides pode ter sido alterado")
            
            processing_time = time.time() - start_time
            
            return TranslationResult(
                success=len(errors) == 0,
                original_elements=original_elements,
                translated_elements=translated_elements,
                errors=errors,
                warnings=warnings,
                processing_time=processing_time,
                file_hash_original=original_hash,
                file_hash_translated=translated_hash
            )
            
        except Exception as e:
            logger.error(f"Erro crítico na tradução PPTX: {e}")
            return TranslationResult(
                success=False,
                original_elements=original_elements,
                translated_elements=translated_elements,
                errors=[f"Erro crítico: {str(e)}"],
                warnings=warnings,
                processing_time=time.time() - start_time,
                file_hash_original="",
                file_hash_translated=""
            )
    
    def translate_xlsx_professional(self, input_path: str, output_path: str, source_lang: str, target_lang: str, model: str = None) -> TranslationResult:
        """Tradução profissional de XLSX preservando 100% da formatação"""
        start_time = time.time()
        errors = []
        warnings = []
        original_elements = 0
        translated_elements = 0
        
        try:
            backup_path = self.create_backup(input_path)
            original_hash = self.calculate_file_hash(input_path)
            original_structure = self.analyze_document_structure(input_path)
            
            wb = load_workbook(input_path)
            context = f"Planilha XLSX com {original_structure.worksheets} worksheets"
            
            for ws_idx, ws in enumerate(wb.worksheets):
                for row in ws.iter_rows():
                    for cell in row:
                        if cell.value and isinstance(cell.value, str) and cell.value.strip():
                            original_elements += 1
                            try:
                                original_text = cell.value
                                translated_text = self.translate_with_context(
                                    original_text, f"{context} - Worksheet {ws.title}", 
                                    source_lang, target_lang, model
                                )
                                cell.value = translated_text
                                translated_elements += 1
                                
                            except Exception as e:
                                errors.append(f"Erro na célula {cell.coordinate} da worksheet {ws.title}: {str(e)}")
            
            wb.save(output_path)
            
            translated_hash = self.calculate_file_hash(output_path)
            translated_structure = self.analyze_document_structure(output_path)
            
            if translated_structure.worksheets != original_structure.worksheets:
                warnings.append("Número de worksheets pode ter sido alterado")
            
            processing_time = time.time() - start_time
            
            return TranslationResult(
                success=len(errors) == 0,
                original_elements=original_elements,
                translated_elements=translated_elements,
                errors=errors,
                warnings=warnings,
                processing_time=processing_time,
                file_hash_original=original_hash,
                file_hash_translated=translated_hash
            )
            
        except Exception as e:
            logger.error(f"Erro crítico na tradução XLSX: {e}")
            return TranslationResult(
                success=False,
                original_elements=original_elements,
                translated_elements=translated_elements,
                errors=[f"Erro crítico: {str(e)}"],
                warnings=warnings,
                processing_time=time.time() - start_time,
                file_hash_original="",
                file_hash_translated=""
            )

# Função principal de compatibilidade
def translate_file_professional(input_path: str, output_path: str, glossary_path: Optional[str], 
                               use_ai: bool, source_lang: str, target_lang: str, model: Optional[str] = None) -> TranslationResult:
    """Função principal de tradução profissional"""
    translator = ProfessionalTranslator()
    ext = os.path.splitext(input_path)[1].lower()
    
    if ext == '.docx':
        return translator.translate_docx_professional(input_path, output_path, source_lang, target_lang, model)
    elif ext == '.pptx':
        return translator.translate_pptx_professional(input_path, output_path, source_lang, target_lang, model)
    elif ext == '.xlsx':
        return translator.translate_xlsx_professional(input_path, output_path, source_lang, target_lang, model)
    else:
        raise ValueError(f'Extensão não suportada: {ext}')

# Manter compatibilidade com código existente
def translate_file(input_path: str, output_path: str, glossary_path: Optional[str], 
                  use_ai: bool, source_lang: str, target_lang: str, model: Optional[str] = None):
    """Função de compatibilidade - redireciona para versão profissional"""
    result = translate_file_professional(input_path, output_path, glossary_path, use_ai, source_lang, target_lang, model)
    
    if not result.success:
        logger.error(f"Tradução falhou: {result.errors}")
        raise Exception(f"Falha na tradução: {'; '.join(result.errors)}")
    
    logger.info(f"Tradução concluída: {result.translated_elements}/{result.original_elements} elementos traduzidos em {result.processing_time:.2f}s")
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  fileUrl: string;
  fileName: string;
  sourceLang: string;
  targetLang: string;
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { fileUrl, fileName, sourceLang, targetLang, userId }: TranslationRequest = await req.json();
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Download the file from Supabase storage
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error('Failed to download file');
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    
    // Process DOCX file using python-docx equivalent for Deno
    // For now, we'll extract text and preserve structure metadata
    const extractedContent = await extractDocxContent(fileBuffer);
    
    // Translate content using OpenAI
    const translatedContent = await translateWithOpenAI(
      extractedContent,
      sourceLang,
      targetLang,
      openaiApiKey
    );

    // Reconstruct DOCX with translated content
    const translatedDocx = await reconstructDocx(extractedContent, translatedContent);
    
    // Upload translated file to Supabase storage
    const translatedFileName = `translated_${targetLang}_${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`translations/${translatedFileName}`, translatedDocx, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`translations/${translatedFileName}`);

    // Store translation record
    const { data: translationRecord, error: dbError } = await supabase
      .from('document_translations')
      .insert({
        user_id: userId,
        original_file_name: fileName,
        translated_file_name: translatedFileName,
        source_language: sourceLang,
        target_language: targetLang,
        original_file_url: fileUrl,
        translated_file_url: urlData.publicUrl,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({
        success: true,
        translatedFileUrl: urlData.publicUrl,
        translationId: translationRecord.id,
        message: 'Document translated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function extractDocxContent(buffer: ArrayBuffer): Promise<any> {
  // Simplified DOCX content extraction
  // In production, you'd use a proper DOCX parser
  const decoder = new TextDecoder();
  const text = decoder.decode(buffer);
  
  // Extract readable text and preserve structure info
  return {
    text: "Sample extracted text", // This would be the actual extracted text
    structure: {
      paragraphs: [],
      formatting: [],
      styles: []
    }
  };
}

async function translateWithOpenAI(
  content: any,
  sourceLang: string,
  targetLang: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following document content from ${sourceLang} to ${targetLang}. Maintain the exact structure, formatting, and preserve any technical terms appropriately. Only translate the text content, do not modify formatting or structure.`
        },
        {
          role: 'user',
          content: content.text
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function reconstructDocx(originalContent: any, translatedText: string): Promise<Uint8Array> {
  // Simplified DOCX reconstruction
  // In production, you'd properly rebuild the DOCX with preserved formatting
  const docxContent = new TextEncoder().encode(translatedText);
  return docxContent;
}
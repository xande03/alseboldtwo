// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface RequestPayload {
  content: string;
  type: 'text' | 'url' | 'file';
  fileData?: string; // base64 encoded file
  fileName?: string;
  expirationOption?: 'immediate' | '1hour' | 'permanent'; // Nova opção
  userSession?: string; // Para rastreamento
}

console.info('generate-qrcode function started');

// Inicializar cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://zfstmsgevfhdkhesatzm.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Função para gerar QR code usando uma API externa
async function generateQRCode(content: string): Promise<string> {
  try {
    // Usar API gratuita do QR Server
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(content)}&format=png&margin=10`;
    
    // Fazer download da imagem QR
    const response = await fetch(qrUrl);
    if (!response.ok) {
      throw new Error(`QR API error: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    return `data:image/png;base64,${base64Image}`;
    
  } catch (error) {
    console.error('QR generation error:', error);
    throw error;
  }
}

// Função para calcular data de expiração
function getExpirationDate(option: string): Date {
  const now = new Date();
  switch (option) {
    case 'immediate':
      // Expira em 5 minutos (tempo para gerar e baixar o QR)
      return new Date(now.getTime() + 5 * 60 * 1000);
    case '1hour':
      // Expira em 1 hora
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'permanent':
      // Expira em 1 ano (praticamente permanente)
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    default:
      // Padrão: 1 hora
      return new Date(now.getTime() + 60 * 60 * 1000);
  }
}

Deno.serve(async (req: Request) => {
  try {
    console.log('QR Code generation request received');
    
    const { 
      content, 
      type, 
      fileData, 
      fileName, 
      expirationOption = '1hour',
      userSession = 'anonymous'
    }: RequestPayload = await req.json();

    if (!content && !fileData) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo ou arquivo são necessários' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating QR code for:', { 
      type, 
      hasFileData: !!fileData, 
      fileName, 
      expirationOption 
    });

    let qrContent = content;
    let uploadedFileUrl = null;
    let fileId = null;

    // Se é um arquivo, fazer upload primeiro
    if (type === 'file' && fileData && fileName) {
      try {
        console.log('Processing file upload for QR code');
        
        if (supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Converter base64 para buffer
          const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          
          // Gerar path único
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 15);
          const filePath = `temp/${timestamp}-${randomId}-${fileName}`;
          
          // Upload do arquivo
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('qr-files')
            .upload(filePath, bytes, {
              contentType: fileData.split(';')[0].split(':')[1] || 'application/octet-stream',
              upsert: true
            });

          if (!uploadError && uploadData) {
            // Obter URL pública
            const { data: publicUrlData } = supabase.storage
              .from('qr-files')
              .getPublicUrl(filePath);
            
            uploadedFileUrl = publicUrlData.publicUrl;
            qrContent = uploadedFileUrl;
            
            // Registrar arquivo temporário na tabela
            const expiresAt = getExpirationDate(expirationOption);
            const autoDelete = expirationOption !== 'permanent';
            
            const { data: tempFileData, error: tempFileError } = await supabase
              .from('temp_files')
              .insert({
                file_path: filePath,
                bucket_name: 'qr-files',
                original_name: fileName,
                content_type: fileData.split(';')[0].split(':')[1],
                file_size: bytes.length,
                expires_at: expiresAt.toISOString(),
                auto_delete: autoDelete,
                user_session: userSession,
                qr_code_generated: true
              })
              .select('id')
              .single();
            
            if (!tempFileError && tempFileData) {
              fileId = tempFileData.id;
            }
            
            console.log('File uploaded successfully:', {
              url: uploadedFileUrl,
              expiresAt: expiresAt.toISOString(),
              autoDelete,
              fileId
            });
          } else {
            console.log('File upload failed:', uploadError);
            throw new Error('Falha no upload do arquivo');
          }
        }
      } catch (fileError) {
        console.error('File upload error:', fileError);
        throw new Error(`Erro no upload: ${fileError.message}`);
      }
    }

    // Gerar QR code
    const qrCodeDataUrl = await generateQRCode(qrContent);
    
    console.log('QR code generated successfully');

    // Preparar resposta com informações de expiração
    const expirationInfo = {
      option: expirationOption,
      expiresAt: type === 'file' ? getExpirationDate(expirationOption).toISOString() : null,
      autoDelete: expirationOption !== 'permanent',
      fileId: fileId
    };

    return new Response(
      JSON.stringify({ 
        qrCodeUrl: qrCodeDataUrl,
        content: qrContent,
        fileUrl: uploadedFileUrl,
        type: type,
        expiration: expirationInfo,
        success: true,
        message: type === 'file' ? 
          `Arquivo será ${expirationOption === 'permanent' ? 'mantido permanentemente' : 
            expirationOption === 'immediate' ? 'excluído em 5 minutos' : 
            'excluído em 1 hora'}` : 
          'QR Code gerado com sucesso'
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      }
    );

  } catch (error) {
    console.error('Error generating QR code:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao gerar QR code',
        success: false
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
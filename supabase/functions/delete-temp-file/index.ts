// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface RequestPayload {
  fileId: string;
  userSession?: string;
}

console.info('delete-temp-file function started');

Deno.serve(async (req: Request) => {
  try {
    console.log('Delete temp file request received');
    
    const { fileId, userSession = 'anonymous' }: RequestPayload = await req.json();

    if (!fileId) {
      return new Response(
        JSON.stringify({ error: 'ID do arquivo é necessário' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://zfstmsgevfhdkhesatzm.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseKey) {
      throw new Error('Configuração do Supabase não encontrada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Deleting file:', { fileId, userSession });

    // Buscar informações do arquivo
    const { data: fileInfo, error: fetchError } = await supabase
      .from('temp_files')
      .select('file_path, bucket_name, original_name, user_session')
      .eq('id', fileId)
      .single();

    if (fetchError || !fileInfo) {
      return new Response(
        JSON.stringify({ 
          error: 'Arquivo não encontrado',
          success: false 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário tem permissão (opcional, pode ser removido para permitir deleção pública)
    // if (fileInfo.user_session !== userSession && userSession !== 'admin') {
    //   return new Response(
    //     JSON.stringify({ 
    //       error: 'Sem permissão para deletar este arquivo',
    //       success: false 
    //     }),
    //     { status: 403, headers: { 'Content-Type': 'application/json' } }
    //   );
    // }

    let storageDeleted = false;
    let dbDeleted = false;

    // Tentar deletar do storage
    try {
      const { error: storageError } = await supabase.storage
        .from(fileInfo.bucket_name)
        .remove([fileInfo.file_path]);

      if (!storageError) {
        storageDeleted = true;
        console.log('File deleted from storage:', fileInfo.file_path);
      } else {
        console.error('Storage deletion error:', storageError);
      }
    } catch (storageError) {
      console.error('Storage deletion failed:', storageError);
    }

    // Deletar registro da tabela
    try {
      const { error: dbError } = await supabase
        .from('temp_files')
        .delete()
        .eq('id', fileId);

      if (!dbError) {
        dbDeleted = true;
        console.log('File record deleted from database');
      } else {
        console.error('Database deletion error:', dbError);
      }
    } catch (dbError) {
      console.error('Database deletion failed:', dbError);
    }

    const success = storageDeleted || dbDeleted;
    const message = success ? 
      `Arquivo "${fileInfo.original_name}" deletado com sucesso` :
      'Erro ao deletar arquivo';

    return new Response(
      JSON.stringify({ 
        success,
        message,
        details: {
          storageDeleted,
          dbDeleted,
          fileName: fileInfo.original_name
        }
      }),
      { 
        status: success ? 200 : 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      }
    );

  } catch (error) {
    console.error('Error deleting temp file:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao deletar arquivo',
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
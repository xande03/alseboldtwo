// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

console.info('cleanup-expired-files function started');

Deno.serve(async (req: Request) => {
  try {
    console.log('Cleanup expired files request received');
    
    // Verificar se é uma chamada autorizada (opcional)
    const authHeader = req.headers.get('Authorization');
    const apiKey = req.headers.get('apikey');
    
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://zfstmsgevfhdkhesatzm.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseKey) {
      throw new Error('Configuração do Supabase não encontrada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting cleanup process...');

    // Buscar arquivos expirados
    const { data: expiredFiles, error: fetchError } = await supabase
      .from('temp_files')
      .select('id, file_path, bucket_name, original_name, expires_at')
      .lt('expires_at', new Date().toISOString())
      .eq('auto_delete', true);

    if (fetchError) {
      throw new Error(`Erro ao buscar arquivos expirados: ${fetchError.message}`);
    }

    if (!expiredFiles || expiredFiles.length === 0) {
      console.log('No expired files found');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Nenhum arquivo expirado encontrado',
          deletedCount: 0,
          details: []
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log(`Found ${expiredFiles.length} expired files`);

    const deletionResults = [];
    let successCount = 0;
    let errorCount = 0;

    // Processar cada arquivo expirado
    for (const file of expiredFiles) {
      const result = {
        id: file.id,
        fileName: file.original_name,
        filePath: file.file_path,
        storageDeleted: false,
        dbDeleted: false,
        error: null
      };

      try {
        // Tentar deletar do storage
        const { error: storageError } = await supabase.storage
          .from(file.bucket_name)
          .remove([file.file_path]);

        if (!storageError) {
          result.storageDeleted = true;
          console.log(`Storage deleted: ${file.file_path}`);
        } else {
          console.error(`Storage deletion failed for ${file.file_path}:`, storageError);
          result.error = `Storage: ${storageError.message}`;
        }

        // Deletar registro da tabela (sempre tentar, mesmo se storage falhou)
        const { error: dbError } = await supabase
          .from('temp_files')
          .delete()
          .eq('id', file.id);

        if (!dbError) {
          result.dbDeleted = true;
          console.log(`Database record deleted: ${file.id}`);
        } else {
          console.error(`Database deletion failed for ${file.id}:`, dbError);
          result.error = result.error ? 
            `${result.error}, DB: ${dbError.message}` : 
            `DB: ${dbError.message}`;
        }

        if (result.storageDeleted || result.dbDeleted) {
          successCount++;
        } else {
          errorCount++;
        }

      } catch (error) {
        console.error(`Error processing file ${file.id}:`, error);
        result.error = error.message;
        errorCount++;
      }

      deletionResults.push(result);
    }

    const message = `Limpeza concluída: ${successCount} sucessos, ${errorCount} erros`;
    console.log(message);

    return new Response(
      JSON.stringify({ 
        success: true,
        message,
        totalFound: expiredFiles.length,
        successCount,
        errorCount,
        details: deletionResults
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      }
    );

  } catch (error) {
    console.error('Error in cleanup process:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro no processo de limpeza',
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
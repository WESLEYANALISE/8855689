import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Versão 2.4 - Deletar por ID + múltiplas tentativas + delays maiores
const VERSION = "2.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função fetch com timeout para evitar travamentos
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 25000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout: A Evolution API demorou mais de ${timeoutMs/1000}s para responder. Verifique se ela está online.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Função auxiliar para delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para buscar instância por nome e retornar seu ID
async function findInstanceByName(evolutionUrl: string, evolutionKey: string, instanceName: string): Promise<{ id: string; name: string } | null> {
  try {
    const response = await fetchWithTimeout(`${evolutionUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: { 'apikey': evolutionKey },
    });
    
    if (!response.ok) return null;
    
    const instances = await response.json();
    console.log(`[findInstanceByName] Instâncias encontradas: ${JSON.stringify(instances)}`);
    
    const found = instances.find((inst: any) => 
      inst.name === instanceName || inst.instanceName === instanceName
    );
    
    if (found) {
      return { 
        id: found.id || found.instanceId, 
        name: found.name || found.instanceName 
      };
    }
    return null;
  } catch (e) {
    console.log(`[findInstanceByName] Erro ao buscar instâncias:`, e);
    return null;
  }
}

// Função para buscar QR Code via múltiplos métodos com retries
async function fetchQRCode(evolutionUrl: string, evolutionKey: string, instanceName: string, maxAttempts: number = 4): Promise<string | null> {
  console.log(`[fetchQRCode] Iniciando busca de QR Code para: ${instanceName}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[fetchQRCode] Tentativa ${attempt}/${maxAttempts}`);
    
    // Método 1: Endpoint direto de connect (mais confiável na v2.3+)
    try {
      console.log(`[fetchQRCode] Método 1: GET /instance/connect/${instanceName}`);
      const connectResponse = await fetchWithTimeout(
        `${evolutionUrl}/instance/connect/${instanceName}`,
        {
          method: 'GET',
          headers: { 'apikey': evolutionKey },
        },
        15000
      );
      
      const connectText = await connectResponse.text();
      console.log(`[fetchQRCode] connect status: ${connectResponse.status}, response: ${connectText.substring(0, 500)}`);
      
      if (connectResponse.ok && connectText) {
        try {
          const connectData = JSON.parse(connectText);
          // Na Evolution API v2.3+, o QR vem em 'base64' ou 'code' diretamente
          const qr = connectData.base64 || connectData.code || connectData.qrcode?.base64 || connectData.qrcode?.code;
          if (qr && qr.length > 50) {
            console.log(`[fetchQRCode] QR Code encontrado via connect! Tamanho: ${qr.length}`);
            return qr;
          }
          // Se tem pairingCode, pode ser usado também
          if (connectData.pairingCode) {
            console.log(`[fetchQRCode] PairingCode encontrado: ${connectData.pairingCode}`);
          }
        } catch (parseErr) {
          console.log(`[fetchQRCode] Erro ao parsear resposta do connect:`, parseErr);
        }
      }
    } catch (e) {
      console.log(`[fetchQRCode] Erro método 1:`, e);
    }
    
    // Método 2: fetchInstances com qrcode=true
    try {
      console.log(`[fetchQRCode] Método 2: GET /instance/fetchInstances`);
      const response = await fetchWithTimeout(
        `${evolutionUrl}/instance/fetchInstances`,
        {
          method: 'GET',
          headers: { 'apikey': evolutionKey },
        },
        15000
      );
      
      if (response.ok) {
        const instances = await response.json();
        console.log(`[fetchQRCode] fetchInstances encontrou ${Array.isArray(instances) ? instances.length : 0} instâncias`);
        
        // Buscar instância por nome (case insensitive)
        const instance = Array.isArray(instances) 
          ? instances.find((i: any) => 
              i.name?.toLowerCase() === instanceName.toLowerCase() || 
              i.instanceName?.toLowerCase() === instanceName.toLowerCase()
            )
          : null;
          
        if (instance) {
          console.log(`[fetchQRCode] Instância encontrada: ${instance.name}, connectionStatus: ${instance.connectionStatus}`);
          
          if (instance.qrcode?.base64) {
            console.log(`[fetchQRCode] QR Code encontrado via fetchInstances (base64)!`);
            return instance.qrcode.base64;
          }
          if (instance.qrcode?.code) {
            console.log(`[fetchQRCode] QR Code encontrado via fetchInstances (code)!`);
            return instance.qrcode.code;
          }
        }
      }
    } catch (e) {
      console.log(`[fetchQRCode] Erro método 2:`, e);
    }
    
    // Método 3: Endpoint específico de QR Code (algumas versões da Evolution API)
    try {
      console.log(`[fetchQRCode] Método 3: GET /instance/qrcode/${instanceName}`);
      const qrResponse = await fetchWithTimeout(
        `${evolutionUrl}/instance/qrcode/${instanceName}`,
        {
          method: 'GET',
          headers: { 'apikey': evolutionKey },
        },
        10000
      );
      
      const qrText = await qrResponse.text();
      console.log(`[fetchQRCode] qrcode status: ${qrResponse.status}, response: ${qrText.substring(0, 300)}`);
      
      if (qrResponse.ok && qrText) {
        try {
          const qrData = JSON.parse(qrText);
          const qr = qrData.base64 || qrData.code || qrData.qrcode;
          if (qr && qr.length > 50) {
            console.log(`[fetchQRCode] QR Code encontrado via /qrcode endpoint!`);
            return qr;
          }
        } catch (parseErr) {
          console.log(`[fetchQRCode] Erro ao parsear resposta do qrcode:`, parseErr);
        }
      }
    } catch (e) {
      console.log(`[fetchQRCode] Erro método 3:`, e);
    }
    
    // Aguardar antes da próxima tentativa
    if (attempt < maxAttempts) {
      console.log(`[fetchQRCode] Aguardando 3s antes da próxima tentativa...`);
      await delay(3000);
    }
  }
  
  console.log(`[fetchQRCode] Não foi possível obter QR Code após ${maxAttempts} tentativas`);
  return null;
}

// Função para deletar instância de forma robusta (por ID e por nome)
async function deleteInstanceRobust(evolutionUrl: string, evolutionKey: string, instanceName: string): Promise<boolean> {
  console.log(`[deleteInstanceRobust] Iniciando deleção robusta para: ${instanceName}`);
  
  // 1. Primeiro, buscar a instância para obter o ID
  const instance = await findInstanceByName(evolutionUrl, evolutionKey, instanceName);
  
  if (instance && instance.id) {
    console.log(`[deleteInstanceRobust] Instância encontrada com ID: ${instance.id}`);
    
    // Tentar logout primeiro
    try {
      console.log(`[deleteInstanceRobust] Fazendo logout...`);
      await fetchWithTimeout(`${evolutionUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': evolutionKey },
      });
      await delay(2000);
    } catch (e) {
      console.log(`[deleteInstanceRobust] Logout falhou (ok):`, e);
    }
    
    // Tentar deletar por ID primeiro (mais confiável)
    try {
      console.log(`[deleteInstanceRobust] Deletando por ID: ${instance.id}`);
      const deleteByIdResponse = await fetchWithTimeout(`${evolutionUrl}/instance/delete/${instance.id}`, {
        method: 'DELETE',
        headers: { 'apikey': evolutionKey },
      });
      const deleteByIdText = await deleteByIdResponse.text();
      console.log(`[deleteInstanceRobust] Delete por ID response:`, deleteByIdText);
      await delay(3000);
    } catch (e) {
      console.log(`[deleteInstanceRobust] Delete por ID falhou:`, e);
    }
  }
  
  // 2. Tentar deletar por nome também (redundância)
  try {
    console.log(`[deleteInstanceRobust] Deletando por nome: ${instanceName}`);
    const deleteByNameResponse = await fetchWithTimeout(`${evolutionUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: { 'apikey': evolutionKey },
    });
    const deleteByNameText = await deleteByNameResponse.text();
    console.log(`[deleteInstanceRobust] Delete por nome response:`, deleteByNameText);
    await delay(3000);
  } catch (e) {
    console.log(`[deleteInstanceRobust] Delete por nome falhou:`, e);
  }
  
  // 3. Verificar se foi realmente deletada
  const stillExists = await findInstanceByName(evolutionUrl, evolutionKey, instanceName);
  
  if (stillExists) {
    console.log(`[deleteInstanceRobust] Instância AINDA existe após tentativas de delete!`);
    
    // Última tentativa: deletar pelo ID encontrado agora
    if (stillExists.id) {
      console.log(`[deleteInstanceRobust] Última tentativa com ID: ${stillExists.id}`);
      try {
        await fetchWithTimeout(`${evolutionUrl}/instance/delete/${stillExists.id}`, {
          method: 'DELETE',
          headers: { 'apikey': evolutionKey },
        });
        await delay(5000);
        
        // Verificar novamente
        const finalCheck = await findInstanceByName(evolutionUrl, evolutionKey, instanceName);
        if (!finalCheck) {
          console.log(`[deleteInstanceRobust] Instância deletada com sucesso na última tentativa!`);
          return true;
        }
      } catch (e) {
        console.log(`[deleteInstanceRobust] Última tentativa falhou:`, e);
      }
    }
    return false;
  }
  
  console.log(`[deleteInstanceRobust] Instância deletada com sucesso!`);
  return true;
}

serve(async (req) => {
  console.log(`[gerenciar-instancia-evelyn v${VERSION}] Requisição recebida: ${req.method}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, instanceName } = await req.json();
    
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    
    if (!evolutionUrl || !evolutionKey) {
      throw new Error('EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados');
    }

    console.log(`[gerenciar-instancia-evelyn] Ação: ${action}, Instância: ${instanceName}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result: any = {};

    switch (action) {
      case 'criar': {
        // Primeiro verificar se a instância já existe
        console.log('[gerenciar-instancia-evelyn] Verificando se instância já existe...');
        const existingInstance = await findInstanceByName(evolutionUrl, evolutionKey, instanceName);
        
        if (existingInstance) {
          console.log('[gerenciar-instancia-evelyn] Instância já existe, obtendo QR Code...');
          
          // Instância já existe, apenas obter QR Code
          const connectResponse = await fetchWithTimeout(`${evolutionUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: { 'apikey': evolutionKey },
          });
          
          let connectResult: any = {};
          if (connectResponse.ok) {
            connectResult = await connectResponse.json();
            console.log('[gerenciar-instancia-evelyn] Connect response:', JSON.stringify(connectResult));
          }
          
          const qrCode = connectResult.code || connectResult.base64 || connectResult.qrcode?.base64 || null;
          
          // Atualizar banco
          await supabase.from('evelyn_config').upsert({
            instance_name: instanceName,
            evolution_url: evolutionUrl,
            status: 'conectando',
            qr_code: qrCode,
          }, { onConflict: 'instance_name' });
          
          result = { 
            ...connectResult, 
            qr_code: qrCode,
            message: 'Instância já existia, QR Code obtido' 
          };
          break;
        }
        
        // Criar nova instância
        const response = await fetchWithTimeout(`${evolutionUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({
            instanceName: instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[gerenciar-instancia-evelyn] Erro ao criar instância:', errorText);
          throw new Error(`Erro ao criar instância: ${errorText}`);
        }

        result = await response.json();
        console.log('[gerenciar-instancia-evelyn] Instância criada:', result);

        // Salvar no banco
        await supabase.from('evelyn_config').upsert({
          instance_name: instanceName,
          evolution_url: evolutionUrl,
          status: 'conectando',
          qr_code: result.qrcode?.base64 || null,
        }, { onConflict: 'instance_name' });

        break;
      }

      case 'conectar': {
        console.log('[gerenciar-instancia-evelyn] Ação conectar iniciada...');
        
        // 1. Verificar se instância existe
        const existsForConnect = await findInstanceByName(evolutionUrl, evolutionKey, instanceName);
        
        if (!existsForConnect) {
          console.log('[gerenciar-instancia-evelyn] Instância não existe, criando...');
          await fetchWithTimeout(`${evolutionUrl}/instance/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey,
            },
            body: JSON.stringify({
              instanceName: instanceName,
              qrcode: true,
              integration: 'WHATSAPP-BAILEYS',
            }),
          });
          await delay(2000);
        }
        
        // 2. Chamar connect para iniciar processo de conexão
        console.log('[gerenciar-instancia-evelyn] Chamando connect...');
        try {
          await fetchWithTimeout(`${evolutionUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: { 'apikey': evolutionKey },
          });
        } catch (e) {
          console.log('[gerenciar-instancia-evelyn] Connect inicial falhou (ok, tentaremos obter QR):', e);
        }
        
        // 3. Aguardar QR Code ser gerado
        await delay(2000);
        
        // 4. Buscar QR Code com retries
        const qrCode = await fetchQRCode(evolutionUrl, evolutionKey, instanceName, 3);
        
        if (!qrCode) {
          // Atualizar banco com status mas sem QR
          await supabase.from('evelyn_config').upsert({
            instance_name: instanceName,
            evolution_url: evolutionUrl,
            status: 'erro',
            qr_code: null,
          }, { onConflict: 'instance_name' });
          
          throw new Error('Não foi possível obter o QR Code. Tente "Forçar Reconexão".');
        }
        
        // 5. Salvar no banco
        await supabase.from('evelyn_config').upsert({
          instance_name: instanceName,
          evolution_url: evolutionUrl,
          status: 'conectando',
          qr_code: qrCode,
        }, { onConflict: 'instance_name' });
        
        result = { 
          qr_code: qrCode,
          message: 'QR Code obtido com sucesso'
        };
        
        break;
      }

      case 'forcar-reconexao': {
        // Forçar reconexão: deletar instância de forma robusta e criar nova
        console.log('[gerenciar-instancia-evelyn] Forçando reconexão com método robusto...');
        
        // 1. Deletar de forma robusta (por ID + nome + verificação)
        const deleted = await deleteInstanceRobust(evolutionUrl, evolutionKey, instanceName);
        
        if (!deleted) {
          // Instância não pôde ser deletada automaticamente
          console.error('[gerenciar-instancia-evelyn] Não foi possível deletar instância automaticamente');
          throw new Error('Não foi possível deletar a instância automaticamente. Por favor, acesse o painel do Railway Evolution API Manager, delete a instância "evelyn-principal" manualmente, e tente novamente.');
        }

        // Aguardar um pouco mais antes de criar
        await delay(2000);

        // 2. Criar nova instância com payload correto para Evolution API v2.3+
        console.log('[gerenciar-instancia-evelyn] Criando nova instância...');
        const createPayload = {
          instanceName: instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          rejectCall: false,
          groupsIgnore: false,
          alwaysOnline: false,
          readMessages: false,
          readStatus: false,
          syncFullHistory: false,
        };
        console.log('[gerenciar-instancia-evelyn] Payload de criação:', JSON.stringify(createPayload));
        
        const createResponse = await fetchWithTimeout(`${evolutionUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify(createPayload),
        });

        const createText = await createResponse.text();
        console.log('[gerenciar-instancia-evelyn] Create response:', createText);

        let createResult;
        try {
          createResult = JSON.parse(createText);
        } catch {
          console.error('[gerenciar-instancia-evelyn] Create não retornou JSON válido');
          throw new Error(`Erro ao criar instância: ${createText}`);
        }

        // Se ainda der erro de nome em uso, retornar erro claro
        if (createResult.status === 403 || createResult.error === 'Forbidden') {
          console.error('[gerenciar-instancia-evelyn] Instância ainda existe na Evolution API');
          throw new Error('A instância ainda existe na Evolution API mesmo após múltiplas tentativas de deleção. Por favor, delete manualmente no painel do Railway e tente novamente.');
        }

        // Se der erro 400, tentar payload mínimo
        if (createResult.status === 400 || createResult.error === 'Bad Request') {
          console.log('[gerenciar-instancia-evelyn] Tentando payload mínimo...');
          const minimalPayload = { instanceName: instanceName };
          
          const retryCreate = await fetchWithTimeout(`${evolutionUrl}/instance/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey,
            },
            body: JSON.stringify(minimalPayload),
          });
          
          const retryText = await retryCreate.text();
          console.log('[gerenciar-instancia-evelyn] Retry create response:', retryText);
          
          if (retryCreate.ok) {
            createResult = JSON.parse(retryText);
          } else {
            throw new Error(`Erro ao criar instância: ${retryText}`);
          }
        }

        if (!createResponse.ok && !createResult.instance) {
          throw new Error(`Erro ao criar instância: ${createText}`);
        }

        console.log('[gerenciar-instancia-evelyn] Nova instância criada:', JSON.stringify(createResult));

        // Aguardar antes de obter QR
        await delay(1500);

        // 3. Obter QR Code da nova instância
        console.log('[gerenciar-instancia-evelyn] Obtendo QR Code da nova instância...');
        const connectResponse = await fetchWithTimeout(`${evolutionUrl}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': evolutionKey },
        });

        let qrResult = createResult;
        if (connectResponse.ok) {
          const connectData = await connectResponse.json();
          console.log('[gerenciar-instancia-evelyn] Connect response:', JSON.stringify(connectData));
          qrResult = { ...createResult, ...connectData };
        }

        const qrCode = qrResult.code || qrResult.base64 || qrResult.qrcode?.base64 || createResult.qrcode?.base64 || null;
        const pCode = qrResult.pairingCode || null;

        console.log('[gerenciar-instancia-evelyn] QR Code obtido:', qrCode ? `sim (${qrCode.length} chars)` : 'não');
        console.log('[gerenciar-instancia-evelyn] Pairing Code:', pCode);

        // 4. Atualizar banco de dados
        await supabase
          .from('evelyn_config')
          .update({ 
            qr_code: qrCode,
            pairing_code: pCode,
            status: 'conectando',
            telefone_conectado: null
          })
          .eq('instance_name', instanceName);

        result = { 
          success: true,
          qr_code: qrCode, 
          pairing_code: pCode,
          message: qrCode ? 'Nova instância criada e QR Code obtido!' : 'Instância criada, tente gerar QR Code novamente'
        };

        break;
      }

      case 'status': {
        // Verificar status da conexão
        const response = await fetchWithTimeout(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionKey,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log('[gerenciar-instancia-evelyn] Instância não existe ou erro:', errorText);
          
          // Se a instância não existe, retornar status desconectado em vez de erro
          result = { 
            state: 'close', 
            instance: instanceName,
            message: 'Instância não existe. Use Forçar Reconexão para criar.'
          };
          
          // Atualizar banco para refletir que não está conectada
          await supabase
            .from('evelyn_config')
            .update({ status: 'desconectado', qr_code: null })
            .eq('instance_name', instanceName);
          
          break;
        }

        result = await response.json();
        console.log('[gerenciar-instancia-evelyn] Status:', result);

        const status = result.instance?.state === 'open' ? 'conectado' : 'desconectado';
        
        // Atualizar status no banco
        await supabase
          .from('evelyn_config')
          .update({ 
            status,
            telefone_conectado: result.instance?.phoneConnected || null
          })
          .eq('instance_name', instanceName);

        break;
      }

      case 'desconectar': {
        // Primeiro verificar se a instância existe
        const checkResponse = await fetchWithTimeout(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionKey,
          },
        });

        if (!checkResponse.ok) {
          // Instância não existe, apenas atualizar o banco
          console.log('[gerenciar-instancia-evelyn] Instância não existe na API, atualizando apenas o banco');
          await supabase
            .from('evelyn_config')
            .update({ 
              status: 'desconectado',
              qr_code: null,
              telefone_conectado: null
            })
            .eq('instance_name', instanceName);
          
          result = { message: 'Instância já estava desconectada' };
          break;
        }

        // Desconectar instância
        const response = await fetchWithTimeout(`${evolutionUrl}/instance/logout/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': evolutionKey,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Se for 404, a instância não existe mais - não é erro
          if (response.status === 404) {
            console.log('[gerenciar-instancia-evelyn] Instância não existe (404), tratando como sucesso');
            result = { message: 'Instância já estava desconectada' };
          } else {
            console.error('[gerenciar-instancia-evelyn] Erro ao desconectar:', errorText);
            throw new Error(`Erro ao desconectar: ${errorText}`);
          }
        } else {
          result = await response.json();
          console.log('[gerenciar-instancia-evelyn] Desconectado:', result);
        }

        await supabase
          .from('evelyn_config')
          .update({ 
            status: 'desconectado',
            qr_code: null,
            telefone_conectado: null
          })
          .eq('instance_name', instanceName);

        break;
      }

      case 'deletar': {
        // Deletar instância
        const response = await fetchWithTimeout(`${evolutionUrl}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': evolutionKey,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[gerenciar-instancia-evelyn] Erro ao deletar:', errorText);
          throw new Error(`Erro ao deletar: ${errorText}`);
        }

        result = await response.json();
        console.log('[gerenciar-instancia-evelyn] Deletado:', result);

        await supabase
          .from('evelyn_config')
          .delete()
          .eq('instance_name', instanceName);

        break;
      }

      case 'listar': {
        // Listar todas as instâncias
        const response = await fetchWithTimeout(`${evolutionUrl}/instance/fetchInstances`, {
          method: 'GET',
          headers: {
            'apikey': evolutionKey,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[gerenciar-instancia-evelyn] Erro ao listar:', errorText);
          throw new Error(`Erro ao listar: ${errorText}`);
        }

        result = await response.json();
        console.log('[gerenciar-instancia-evelyn] Instâncias:', result);
        break;
      }

      case 'enviar-teste': {
        // Enviar mensagem de teste
        const { numero, mensagem } = await req.json();
        
        const response = await fetchWithTimeout(`${evolutionUrl}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({
            number: numero,
            text: mensagem || 'Olá! Esta é uma mensagem de teste da Evelyn.',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[gerenciar-instancia-evelyn] Erro ao enviar teste:', errorText);
          throw new Error(`Erro ao enviar: ${errorText}`);
        }

        result = await response.json();
        console.log('[gerenciar-instancia-evelyn] Mensagem enviada:', result);
        break;
      }

      case 'configurar-webhook': {
        // Configurar webhook para receber mensagens
        const webhookUrl = `${supabaseUrl}/functions/v1/webhook-evelyn`;
        console.log(`[gerenciar-instancia-evelyn] Configurando webhook: ${webhookUrl}`);
        
        const response = await fetchWithTimeout(`${evolutionUrl}/webhook/set/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: webhookUrl,
              events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
              webhookByEvents: false,
              webhookBase64: false,
            }
          }),
        }, 15000); // Timeout menor para webhook (15s)

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[gerenciar-instancia-evelyn] Erro ao configurar webhook:', errorText);
          throw new Error(`Erro ao configurar webhook: ${errorText}`);
        }

        result = await response.json();
        console.log('[gerenciar-instancia-evelyn] Webhook configurado:', result);
        break;
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[gerenciar-instancia-evelyn] Erro:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

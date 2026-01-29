/**
 * =============================================================================
 * SINCRONIZAÇÃO COMPLETA: SUPABASE → GOOGLE SHEETS
 * Exporta TODAS as tabelas de leis para abas individuais
 * =============================================================================
 * 
 * INSTRUÇÕES:
 * 1. Abra sua planilha Google Sheets
 * 2. Vá em Extensões > Apps Script
 * 3. Apague todo o código existente
 * 4. Cole este código completo
 * 5. Substitua 'SUA_API_KEY_AQUI' pela sua DIREITO_PREMIUM_API_KEY
 * 6. Salve (Ctrl+S)
 * 7. Recarregue a planilha (F5)
 * 8. Use o menu "📚 Leis Supabase" > "Exportar TODAS as Tabelas"
 * 
 * =============================================================================
 */

// ======================== CONFIGURAÇÕES ========================
const CONFIG = {
  SUPABASE_URL: 'https://izspjvegxdfgkgibpyst.supabase.co',
  EDGE_FUNCTION_URL: 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/exportar-leis-sheets',
  API_KEY: 'SUA_API_KEY_AQUI', // ⚠️ SUBSTITUA PELA SUA DIREITO_PREMIUM_API_KEY
};

// ======================== MENU ========================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📚 Leis Supabase')
    .addItem('🔄 Exportar TODAS as Tabelas', 'exportarTodasTabelas')
    .addSeparator()
    .addItem('📊 Atualizar Dashboard', 'criarDashboard')
    .addItem('📋 Listar Tabelas Disponíveis', 'listarTabelasDisponiveis')
    .addSeparator()
    .addItem('🔧 Testar Conexão', 'testarConexao')
    .addToUi();
}

// ======================== FUNÇÕES PRINCIPAIS ========================

/**
 * Testa a conexão com o Supabase
 */
function testarConexao() {
  const ss = SpreadsheetApp.getActive();
  ss.toast('🔄 Testando conexão...', 'Aguarde', 30);
  
  try {
    const response = UrlFetchApp.fetch(CONFIG.EDGE_FUNCTION_URL, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify({
        apiKey: CONFIG.API_KEY,
        acao: 'listar_tabelas'
      }),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.success) {
      ss.toast(`✅ Conexão OK!\n${result.total} tabelas encontradas`, 'Sucesso', 5);
      SpreadsheetApp.getUi().alert(
        '✅ Conexão Estabelecida',
        `Encontradas ${result.total} tabelas de leis no Supabase.\n\nClique em "Exportar TODAS as Tabelas" para iniciar.`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      ss.toast('❌ Erro: ' + result.error, 'Falha', 5);
      SpreadsheetApp.getUi().alert('❌ Erro', 'Erro: ' + result.error + '\n\nVerifique se a API_KEY está correta.', SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (error) {
    ss.toast('❌ Erro: ' + error.message, 'Falha', 5);
    SpreadsheetApp.getUi().alert('❌ Erro de Conexão', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Lista todas as tabelas disponíveis no Supabase
 */
function listarTabelasDisponiveis() {
  const ss = SpreadsheetApp.getActive();
  ss.toast('🔄 Buscando tabelas...', 'Aguarde', 30);
  
  try {
    const tabelas = obterListaTabelas();
    
    if (!tabelas || tabelas.length === 0) {
      ss.toast('❌ Nenhuma tabela encontrada', 'Erro', 5);
      return;
    }
    
    // Criar ou atualizar aba de listagem
    let sheet = ss.getSheetByName('_TABELAS_DISPONIVEIS');
    if (!sheet) {
      sheet = ss.insertSheet('_TABELAS_DISPONIVEIS');
    }
    sheet.clear();
    
    // Cabeçalho
    sheet.getRange('A1:C1').setValues([['#', 'Nome da Tabela', 'Status']]);
    sheet.getRange('A1:C1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    
    // Dados
    const dados = tabelas.map((tabela, index) => [index + 1, tabela, '⏳ Pendente']);
    sheet.getRange(2, 1, dados.length, 3).setValues(dados);
    
    // Ajustar colunas
    sheet.autoResizeColumns(1, 3);
    
    ss.toast(`✅ ${tabelas.length} tabelas listadas!`, 'Concluído', 5);
    ss.setActiveSheet(sheet);
    
  } catch (error) {
    ss.toast('❌ Erro: ' + error.message, 'Falha', 5);
  }
}

/**
 * Exporta TODAS as tabelas de leis para abas individuais
 */
function exportarTodasTabelas() {
  const ss = SpreadsheetApp.getActive();
  const startTime = new Date();
  
  ss.toast('🚀 Iniciando exportação completa...', 'Aguarde', 60);
  
  try {
    // 1. Obter lista de todas as tabelas
    const tabelas = obterListaTabelas();
    
    if (!tabelas || tabelas.length === 0) {
      ss.toast('❌ Nenhuma tabela encontrada', 'Erro', 5);
      return;
    }
    
    const totalTabelas = tabelas.length;
    let sucessos = 0;
    let erros = 0;
    const resultados = [];
    
    ss.toast(`📚 ${totalTabelas} tabelas encontradas\n🔄 Iniciando exportação...`, 'Processando', 60);
    
    // 2. Exportar cada tabela
    for (let i = 0; i < tabelas.length; i++) {
      const tabela = tabelas[i];
      const progresso = Math.round(((i + 1) / totalTabelas) * 100);
      
      // Mostrar progresso em tempo real
      ss.toast(
        `📦 ${i + 1}/${totalTabelas} (${progresso}%)\n➡️ ${tabela}`,
        'Exportando...',
        60
      );
      
      try {
        const resultado = exportarTabela(tabela, ss);
        
        if (resultado.success) {
          sucessos++;
          resultados.push({
            tabela: tabela,
            status: '✅',
            registros: resultado.total,
            mensagem: 'Exportado com sucesso'
          });
          
          // Atualizar toast com quantidade de registros
          ss.toast(
            `📦 ${i + 1}/${totalTabelas} (${progresso}%)\n✅ ${tabela}\n📊 ${resultado.total} registros`,
            'Exportando...',
            60
          );
        } else {
          erros++;
          resultados.push({
            tabela: tabela,
            status: '❌',
            registros: 0,
            mensagem: resultado.error || 'Erro desconhecido'
          });
        }
      } catch (error) {
        erros++;
        resultados.push({
          tabela: tabela,
          status: '❌',
          registros: 0,
          mensagem: error.message
        });
      }
      
      // Pequena pausa para não sobrecarregar a API
      Utilities.sleep(300);
    }
    
    // 3. Criar relatório de resultados
    criarRelatorioExportacao(ss, resultados, startTime);
    
    // 4. Criar dashboard
    criarDashboard();
    
    // 5. Mensagem final
    const tempoTotal = Math.round((new Date() - startTime) / 1000);
    
    ss.toast(
      `🎉 Exportação Concluída!\n✅ ${sucessos} sucessos\n❌ ${erros} erros\n⏱️ ${tempoTotal}s`,
      'Finalizado',
      10
    );
    
    SpreadsheetApp.getUi().alert(
      '🎉 Exportação Concluída!',
      `✅ ${sucessos} tabelas exportadas com sucesso\n❌ ${erros} erros\n⏱️ Tempo total: ${tempoTotal} segundos\n\nVeja a aba "_RELATORIO" para detalhes.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    ss.toast('❌ Erro crítico: ' + error.message, 'Falha', 10);
    Logger.log('Erro na exportação: ' + error.message);
  }
}

// ======================== FUNÇÕES AUXILIARES ========================

/**
 * Obtém lista de todas as tabelas de leis do Supabase
 */
function obterListaTabelas() {
  const response = UrlFetchApp.fetch(CONFIG.EDGE_FUNCTION_URL, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify({
      apiKey: CONFIG.API_KEY,
      acao: 'listar_tabelas'
    }),
    muteHttpExceptions: true
  });
  
  const result = JSON.parse(response.getContentText());
  
  if (!result.success) {
    throw new Error(result.error || 'Erro ao listar tabelas');
  }
  
  return result.tabelas || [];
}

/**
 * Exporta uma única tabela para uma aba
 */
function exportarTabela(nomeTabela, ss) {
  try {
    // Buscar dados da tabela
    const response = UrlFetchApp.fetch(CONFIG.EDGE_FUNCTION_URL, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify({
        apiKey: CONFIG.API_KEY,
        acao: 'exportar',
        tabela: nomeTabela,
        limite: 10000
      }),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (!result.success) {
      return { success: false, error: result.error, total: 0 };
    }
    
    const dados = result.dados || [];
    
    if (dados.length === 0) {
      return { success: true, total: 0, mensagem: 'Tabela vazia' };
    }
    
    // Criar nome da aba (máximo 100 caracteres, sem caracteres especiais)
    const nomeAba = sanitizarNomeAba(nomeTabela);
    
    // Criar ou limpar aba
    let sheet = ss.getSheetByName(nomeAba);
    if (sheet) {
      sheet.clear();
    } else {
      sheet = ss.insertSheet(nomeAba);
    }
    
    // Obter colunas do primeiro registro
    const colunas = Object.keys(dados[0]);
    
    // Escrever cabeçalho
    sheet.getRange(1, 1, 1, colunas.length).setValues([colunas]);
    sheet.getRange(1, 1, 1, colunas.length)
      .setFontWeight('bold')
      .setBackground('#1a73e8')
      .setFontColor('white')
      .setHorizontalAlignment('center');
    
    // Escrever dados
    const linhas = dados.map(row => colunas.map(col => {
      const valor = row[col];
      // Converter objetos/arrays para string JSON
      if (valor !== null && typeof valor === 'object') {
        return JSON.stringify(valor);
      }
      return valor;
    }));
    
    if (linhas.length > 0) {
      sheet.getRange(2, 1, linhas.length, colunas.length).setValues(linhas);
    }
    
    // Ajustar colunas automaticamente (limitar a 10 primeiras para performance)
    try {
      sheet.autoResizeColumns(1, Math.min(colunas.length, 10));
    } catch (e) {
      // Ignorar erro de auto resize
    }
    
    // Congelar primeira linha
    sheet.setFrozenRows(1);
    
    return { success: true, total: dados.length };
    
  } catch (error) {
    Logger.log('Erro ao exportar ' + nomeTabela + ': ' + error.message);
    return { success: false, error: error.message, total: 0 };
  }
}

/**
 * Sanitiza o nome da aba para evitar caracteres inválidos
 */
function sanitizarNomeAba(nome) {
  // Remover caracteres inválidos para nomes de abas do Google Sheets
  let nomeAba = nome
    .replace(/[\/\\?*\[\]]/g, '-')  // Caracteres proibidos
    .replace(/:/g, ' -')            // Dois pontos
    .replace(/\s+/g, ' ')           // Múltiplos espaços
    .trim();
  
  // Limitar a 100 caracteres
  if (nomeAba.length > 100) {
    nomeAba = nomeAba.substring(0, 97) + '...';
  }
  
  return nomeAba;
}

/**
 * Cria relatório de exportação
 */
function criarRelatorioExportacao(ss, resultados, startTime) {
  let sheet = ss.getSheetByName('_RELATORIO');
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet('_RELATORIO');
  }
  
  const tempoTotal = Math.round((new Date() - startTime) / 1000);
  const sucessos = resultados.filter(r => r.status === '✅').length;
  const erros = resultados.filter(r => r.status === '❌').length;
  const totalRegistros = resultados.reduce((sum, r) => sum + (r.registros || 0), 0);
  
  // Título
  sheet.getRange('A1').setValue('📊 RELATÓRIO DE EXPORTAÇÃO');
  sheet.getRange('A1').setFontSize(16).setFontWeight('bold');
  
  // Resumo
  sheet.getRange('A3:B7').setValues([
    ['📅 Data/Hora:', new Date().toLocaleString('pt-BR')],
    ['⏱️ Tempo Total:', tempoTotal + ' segundos'],
    ['✅ Sucessos:', sucessos],
    ['❌ Erros:', erros],
    ['📚 Total Registros:', totalRegistros]
  ]);
  sheet.getRange('A3:A7').setFontWeight('bold');
  
  // Cabeçalho da tabela de resultados
  sheet.getRange('A9:D9').setValues([['Status', 'Tabela', 'Registros', 'Mensagem']]);
  sheet.getRange('A9:D9')
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('white');
  
  // Dados
  const dados = resultados.map(r => [r.status, r.tabela, r.registros, r.mensagem]);
  if (dados.length > 0) {
    sheet.getRange(10, 1, dados.length, 4).setValues(dados);
  }
  
  // Colorir linhas de erro/sucesso
  for (let i = 0; i < resultados.length; i++) {
    if (resultados[i].status === '❌') {
      sheet.getRange(10 + i, 1, 1, 4).setBackground('#ffcdd2');
    } else {
      sheet.getRange(10 + i, 1, 1, 4).setBackground('#c8e6c9');
    }
  }
  
  // Ajustar colunas
  sheet.autoResizeColumns(1, 4);
  sheet.setColumnWidth(2, 300);
  sheet.setColumnWidth(4, 250);
  
  // Mover para o início
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);
}

/**
 * Cria dashboard com estatísticas
 */
function criarDashboard() {
  const ss = SpreadsheetApp.getActive();
  ss.toast('📊 Criando dashboard...', 'Aguarde', 30);
  
  let sheet = ss.getSheetByName('_DASHBOARD');
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet('_DASHBOARD');
  }
  
  // Contar abas e registros
  const sheets = ss.getSheets();
  let totalAbas = 0;
  let totalRegistros = 0;
  const estatisticas = [];
  
  for (const s of sheets) {
    const nome = s.getName();
    // Ignorar abas de sistema
    if (nome.startsWith('_')) continue;
    
    totalAbas++;
    const lastRow = s.getLastRow();
    const registros = Math.max(0, lastRow - 1); // Descontar cabeçalho
    totalRegistros += registros;
    
    estatisticas.push([nome, registros]);
  }
  
  // Ordenar por quantidade de registros (maior para menor)
  estatisticas.sort((a, b) => b[1] - a[1]);
  
  // Título
  sheet.getRange('A1').setValue('📊 DASHBOARD - LEIS EXPORTADAS');
  sheet.getRange('A1').setFontSize(18).setFontWeight('bold');
  
  // Resumo
  sheet.getRange('A3:B5').setValues([
    ['📚 Total de Tabelas:', totalAbas],
    ['📝 Total de Registros:', totalRegistros],
    ['📅 Última Atualização:', new Date().toLocaleString('pt-BR')]
  ]);
  sheet.getRange('A3:A5').setFontWeight('bold');
  sheet.getRange('B3:B5').setFontSize(14);
  
  // Cabeçalho da tabela
  sheet.getRange('A7:B7').setValues([['Tabela', 'Registros']]);
  sheet.getRange('A7:B7')
    .setFontWeight('bold')
    .setBackground('#1a73e8')
    .setFontColor('white');
  
  // Dados
  if (estatisticas.length > 0) {
    sheet.getRange(8, 1, estatisticas.length, 2).setValues(estatisticas);
  }
  
  // Ajustar colunas
  sheet.setColumnWidth(1, 400);
  sheet.setColumnWidth(2, 100);
  
  // Mover para o início
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);
  
  ss.toast(`✅ Dashboard criado!\n${totalAbas} tabelas, ${totalRegistros} registros`, 'Concluído', 5);
}

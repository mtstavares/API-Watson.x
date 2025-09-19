
function mapFieldPath(name) {
  const n = normalize(name).replace(/\s+/g, '');
  const dict = {
    'nome': 'nomeCompleto',
    'nomecompleto': 'nomeCompleto',
    'qra': 'qra',
    're': 're',
    'cpf': 'cpf',
    'rg': 'documentos.rg',
    'email': 'contatos.emailFuncional',
    'telefone': 'contatos.telefone',
    'codigoopm': 'codigoOpm',
    'posto': 'posto',
    'situacao': 'situacao',
    'cnhnumero': 'documentos.cnh.numero',
    'cnhcategoria': 'documentos.cnh.categoria',
    'cnhvencimento': 'documentos.cnh.vencimento',
  };
  return dict[n] || null;
}

// extrai instrução de atualização: "atualize o <campo> ... para <valor>"
function extractUpdateTarget(text) {
  const t = normalize(text);
  // exemplos: "atualize o re ... para 111111-1", "alterar a cnh numero ... para 123"
  const m = t.match(
    /\b(?:atualiz\w+|alter\w+|mud\w+|edit\w+)\s+(?:o|a)?\s*([a-z\s]+?)\s+(?:do|da)?\s*(?:funcionario|item|registro)?[\s,]*.*?\bpara\b\s+([^\r\n]+)$/
  );
  if (!m) return null;

  const fieldName = m[1].trim().replace(/\s+/g, ' ');
  const valueRaw = m[2].trim();


  const fieldKey = fieldName.replace(/\s+/g, '');
  const path = mapFieldPath(fieldKey);
  if (!path) return null;

  return { path, value: valueRaw };
}

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos
}

function extractId(text) {
  const m = normalize(text).match(/\bid[:\s]*([0-9]+)\b/);
  if (!m) return null;
  const val = Number(m[1]);
  return Number.isFinite(val) ? val : null;
}

function capitalizeWords(s) {
  return s.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
}

function extractFields(text) {
  const t = normalize(text);
  let nomeCompleto = null;
  let qra = null;
  let re = null;

  let m = t.match(/nome(?:\s+completo)?\s*["“”']([^"“”']+)["“”']/);
  if (m) nomeCompleto = m[1].trim();

  if (!nomeCompleto) {
    m = t.match(/nome(?:\s+completo)?[:\-]\s*([a-z][a-z\s'.-]+)/);
    if (m) nomeCompleto = m[1].trim();
  }

  m = t.match(/\bqra\s*["“”']?([a-z0-9\-_.]+)["“”']?\b/);
  if (m) qra = m[1].toUpperCase();

  m = t.match(/\bre[:\s"]+([0-9\-]+)\b/);
  if (m) re = m[1];

  if (!nomeCompleto) {
    m = t.match(/(?:criar|cadastrar|adicionar|novo)\s+(?:funcionario|item|registro)\s+([a-z][a-z\s'.-]+)/);
    if (m) nomeCompleto = m[1].trim();
  }

  const payload = {};
  if (nomeCompleto) payload.nomeCompleto = capitalizeWords(nomeCompleto);
  if (qra) payload.qra = qra;
  if (re) payload.re = re;
  return payload;
}

/**
 * Extrai consulta campo:valor (re, qra, nome/nomeCompleto, cpf, rg, email, telefone, codigoOpm, posto, situacao)
 */
function extractQuery(text) {
  const raw = text || '';
  const t = normalize(raw);

  // 1º tenta com "com <campo> ..." (ex.: "com qra TESTE")
  let m = t.match(/\bcom\s+(re|qra|nome|nomecompleto|cpf|rg|email|telefone|codigoopm|posto|situacao)\s*:\s*([^\r\n\?\.;]*?)(?=\s+\bpara\b|[?.;]|$)/);
  if (m) return mapQuery(m[1], m[2].trim());
  m = t.match(/\bcom\s+(re|qra|nome|nomecompleto|cpf|rg|email|telefone|codigoopm|posto|situacao)\s+([^\r\n\?\.;]*?)(?=\s+\bpara\b|[?.;]|$)/);
  if (m) return mapQuery(m[1], m[2].trim());

  // 2º sem "com", ainda parando antes de "para" e pontuação
  m = t.match(/\b(re|qra|nome|nomecompleto|cpf|rg|email|telefone|codigoopm|posto|situacao)\s*:\s*([^\r\n\?\.;]*?)(?=\s+\bpara\b|[?.;]|$)/);
  if (m) return mapQuery(m[1], m[2].trim());
  m = t.match(/\b(re|qra|nome|nomecompleto|cpf|rg|email|telefone|codigoopm|posto|situacao)\s+([^\r\n\?\.;]*?)(?=\s+\bpara\b|[?.;]|$)/);
  if (m) return mapQuery(m[1], m[2].trim());

  return null;
}

function mapQuery(field, value) {
  const f = field.replace(/\s+/g, '');
  const v = (value || '').trim();
  switch (f) {
    case 'nome':
    case 'nomecompleto': return { field: 'nomeCompleto', value: v };
    case 'qra': return { field: 'qra', value: v };
    case 're': return { field: 're', value: v };
    case 'cpf': return { field: 'cpf', value: v };
    case 'rg': return { field: 'documentos.rg', value: v };
    case 'email': return { field: 'contatos.emailFuncional', value: v };
    case 'telefone': return { field: 'contatos.telefone', value: v };
    case 'codigoopm': return { field: 'codigoOpm', value: v };
    case 'posto': return { field: 'posto', value: v };
    case 'situacao': return { field: 'situacao', value: v };
    default: return null;
  }
}

// get(obj, 'a.b.c')
function getDeep(obj, path) {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

/**
 * Extrai a "seção" solicitada (ex.: documentos, contatos, caracteristicasFisicas, cnh, rg, email, telefone)
 * Retorna o path dentro do objeto (ex.: "documentos", "documentos.cnh", "contatos", "caracteristicasFisicas")
 */
function extractSection(text) {
  const t = normalize(text);

  // aliases comuns
  if (/\b(documento|documentos)\b/.test(t)) return 'documentos';
  if (/\b(cnh)\b/.test(t)) return 'documentos.cnh';
  if (/\brg\b/.test(t)) return 'documentos.rg';
  if (/\bcontato|contatos\b/.test(t)) return 'contatos';
  if (/\bemail\b/.test(t)) return 'contatos.emailFuncional';
  if (/\btelefone|celular\b/.test(t)) return 'contatos.telefone';
  if (/\bcaracteristica|caracteristicas|caracteristicas fisicas\b/.test(t)) return 'caracteristicasFisicas';

  // outras chaves diretas
  if (/\b(opm)\b/.test(t)) return 'opm';
  if (/\b(codigo ?opm)\b/.test(t)) return 'codigoOpm';
  if (/\b(posto)\b/.test(t)) return 'posto';
  if (/\b(situacao)\b/.test(t)) return 'situacao';

  return null;
}

function isQuestion(text) {
  const t = normalize(text);
  return /\b(qual|quais|que|qual e|qual é|qual sao|quais sao|quais são)\b/.test(t);
}


// Detecta intenção
function detectIntent(text) {
  const t = normalize(text);

  // DELETE
  if (/\b(excluir|apagar|remover|deletar)\b/.test(t)) {
    return { intent: 'delete', id: extractId(text) };
  }

  // UPDATE
  if (/\b(atualizar|editar|alterar|mudar|atualiz\w+|alter\w+|mud\w+|edit\w+)\b/.test(t)) {
    return {
      intent: 'update',
      id: extractId(text),
      fields: extractFields(text),
      updateTarget: extractUpdateTarget(text),
      query: extractQuery(text)
    };
  }

  // Perguntas tipo "qual o posto ... com qra TESTE?"
  if (isQuestion(text)) {
    const section = extractSection(text);
    const query = extractQuery(text);
    if (section && query) {
      return { intent: 'select', section, query };
    }
  }

  // READ ONE explícito por id
  if (/\b(buscar|mostrar|ver|consultar|detalhe|detalhar)\b/.test(t) && /\bid\b/.test(t)) {
    return { intent: 'get', id: extractId(text) };
  }

  // SELECT: pedir uma seção + um filtro (ex.: "documentos do funcionário com qra TESTE")
  if (/\b(buscar|procurar|encontrar|retorne|retornar|me retorne|mostrar|exibir)\b/.test(t)) {
    const section = extractSection(text);
    const query = extractQuery(text);
    if (section && query) return { intent: 'select', section, query };
  }

  // SEARCH por campo/valor
  if (/\b(buscar|procurar|encontrar|retorne|retornar|me retorne|filtrar)\b/.test(t)) {
    const q = extractQuery(text);
    if (q) return { intent: 'search', query: q };
  }

  // LIST
  if (/\b(listar|todos|tudo|listar todos|mostrar todos|listar itens?)\b/.test(t)) {
    return { intent: 'list' };
  }

  // CREATE
  if (/\b(criar|cadastrar|adicionar|inserir|novo)\b/.test(t)) {
    return { intent: 'create', fields: extractFields(text) };
  }   


  return { intent: 'unknown' };
}

module.exports = {
  detectIntent,
  extractSection,
  extractFields,
  extractId,
  extractQuery,
  getDeep,
  extractSection,
  mapFieldPath,
  extractUpdateTarget
};

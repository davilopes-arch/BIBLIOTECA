import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Lazy initialize Gemini AI SDK
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in the environment.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Assistant Chat Route: Questions & Answers based on Sou Energy internal knowledge base
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { question, context } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Pergunta obrigatória.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada.',
          answer: 'A chave de API do Gemini não está disponível no momento. Utilize a busca manual de tutoriais.'
        });
      }

      const ai = getGeminiClient();

      const prompt = `Você é o Assistente Oficial da Biblioteca Interna de Processos da empresa Sou Energy.
Sua missão é responder com clareza, empatia e objetividade a dúvidas de colaboradores com base EXCLUSIVAMENTE nos processos, POPs e tutoriais da base interna da empresa.

--- ACERVO DE CATEGORIAS E TUTORIAIS DA BIBLIOTECA (SOU ENERGY) ---
${JSON.stringify(context || [], null, 2)}
------------------------------------------------------------------

PERGUNTA DO COLABORADOR:
"${question}"

DIRETRIZES DE RESPOSTA:
1. Responda em Português do Brasil com tom profissional, claro e acolhedor.
2. Baseie sua resposta estritamente nos procedimentos cadastrados no acervo da Sou Energy fornecido acima.
3. Se houver tutoriais correspondentes, sintetize o passo a passo de forma organizada e clara.
4. Se o procedimento ou dúvida não constar na base interna de processos, informe cordialmente que o assunto não foi encontrado no acervo da empresa e oriente o colaborador a entrar em contato com o responsável pelo departamento correspondente.
5. Se houver dicas, notas de atenção ou regras específicas, utilize blocos de alerta Markdown (ex: > [!NOTE], > [!WARNING], > [!TIP]).
6. Retorne sua resposta em formato JSON estrito com os campos:
   - "answer": string (a resposta completa e bem formatada em Markdown)
   - "matchedTutorialIds": string[] (array com os IDs dos tutoriais da base interna utilizados)

Exemplo de formato JSON:
{
  "answer": "Para solicitar suas férias na Sou Energy, siga os seguintes passos:\\n\\n1. Acesse o portal RH...",
  "matchedTutorialIds": ["tut_ferias_01"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '{}';
      let cleanText = responseText.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      try {
        const parsed = JSON.parse(cleanText);
        return res.json({
          answer: parsed.answer || cleanText,
          matchedTutorialIds: parsed.matchedTutorialIds || []
        });
      } catch (parseErr) {
        return res.json({
          answer: responseText,
          matchedTutorialIds: []
        });
      }
    } catch (err: any) {
      console.error('Error in /api/ai/ask:', err);
      res.status(500).json({
        error: err?.message || 'Erro ao processar consulta de IA.',
        answer: 'Desculpe, ocorreu uma instabilidade temporária ao consultar o modelo de inteligência artificial. Por favor, tente novamente.'
      });
    }
  });

  // AI Step Generator Route: Generates structured procedure steps for new tutorials
  app.post('/api/ai/suggest-steps', async (req, res) => {
    try {
      const { title, description, category } = req.body;

      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Título do tutorial obrigatório.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada.',
          steps: []
        });
      }

      const ai = getGeminiClient();

      const prompt = `Você é um especialista em documentação de processos e procedimentos operacionais padrão (POP) corporativos na empresa Sou Energy.

Crie um passo a passo detalhado, prático e bem estruturado para o seguinte tutorial:
- Título: "${title}"
- Categoria: "${category || 'Geral'}"
- Descrição informada: "${description || 'Não informada'}"

INSTRUÇÕES:
- Forneça entre 4 e 7 passos sequenciais, claros e objetivos.
- Utilize formatação Markdown rica com **negritos** para botões/menus, \`código\` para comandos/links, e alertas (> [!NOTE], > [!TIP], > [!WARNING]) onde for prudente.
- Forneça também uma estimativa de duração (ex: "5 min", "10 min"), uma descrição aprimorada e 3 a 5 tags relevantes.

Retorne estritamente um objeto JSON com a seguinte estrutura:
{
  "description": "Breve resumo do procedimento...",
  "duration": "5 min",
  "tags": ["tag1", "tag2", "tag3"],
  "steps": [
    "Acesse o sistema...",
    "No menu lateral, selecione **Configurações**...",
    "> [!NOTE]\\n> Certifique-se de salvar antes de avançar."
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      return res.json({
        success: true,
        ...parsed
      });
    } catch (err: any) {
      console.error('Error in /api/ai/suggest-steps:', err);
      res.status(500).json({
        error: err?.message || 'Erro ao gerar passos com IA.'
      });
    }
  });

  // Vite Middleware or Static Production Serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sou Energy Biblioteca Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

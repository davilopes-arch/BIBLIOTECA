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

  // AI Assistant Chat Route: Questions & Answers based on knowledge base + optional Web Search
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { question, context, enableWebSearch } = req.body;

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
Sua missão é responder com clareza, empatia e objetividade a dúvidas de colaboradores com base nos processos e tutoriais da empresa.

--- ACERVO DE CATEGORIAS E TUTORIAIS DA BIBLIOTECA (SOU ENERGY) ---
${JSON.stringify(context || [], null, 2)}
------------------------------------------------------------------

PERGUNTA DO COLABORADOR:
"${question}"

${enableWebSearch ? `PESQUISA NA WEB ATIVADA (Google Search Grounding):
- O colaborador autorizou consulta externa na Web para enriquecer a resposta.
- Priorize sempre os processos internos da Sou Energy caso existam no acervo.
- Se a dúvida envolver regulamentações do setor elétrico/solar (ex: ANEEL, ABNT, concessionárias), manuais de fabricantes de inversores/módulos, legislação/tributação (ICMS/DIFAL) ou ferramentas externas (Google Workspace, ERPs, etc.), consulte a Web em tempo real com fontes atualizadas e confiáveis.
- Deixe claro na resposta o que é procedimento oficial interno da Sou Energy e o que são referências/normas técnicas externas.` : `PESQUISA ESTREITAMENTE INTERNA:
- Responda priorizando estritamente os tutoriais e procedimentos internos da Sou Energy.
- Se a dúvida não estiver coberta no acervo interno da empresa, indique cordialmente que o procedimento não foi localizado na base interna e informe que ele pode ativar o toggle de pesquisa na Web para consultar informações externas.`}

INSTRUÇÕES DE RESPOSTA:
1. Responda em Português do Brasil com tom profissional, claro e acolhedor.
2. Se houver tutoriais internos correspondentes, liste o passo a passo de forma organizada.
3. Se houver dicas, notas de atenção ou regras específicas, utilize blocos de alerta Markdown (ex: > [!NOTE], > [!WARNING], > [!TIP]).
4. Retorne sua resposta em formato JSON estrito com os campos:
   - "answer": string (a resposta completa e bem formatada em Markdown)
   - "matchedTutorialIds": string[] (array com os IDs dos tutoriais da base interna utilizados)

Exemplo de formato JSON:
{
  "answer": "Para solicitar suas férias, siga os seguintes passos:\\n\\n1. Acesse o portal RH...",
  "matchedTutorialIds": ["tut_ferias_01"]
}`;

      const generateOptions: any = {
        model: 'gemini-3.7-flash',
        contents: prompt,
      };

      if (enableWebSearch) {
        generateOptions.tools = [{ googleSearch: {} }];
      } else {
        generateOptions.config = {
          responseMimeType: 'application/json'
        };
      }

      const response = await ai.models.generateContent(generateOptions);

      // Extract Web Grounding Metadata if present
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      const webSources: Array<{ title: string; url: string }> = [];

      if (groundingMetadata?.groundingChunks) {
        const seenUrls = new Set<string>();
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web?.uri) {
            if (!seenUrls.has(chunk.web.uri)) {
              seenUrls.add(chunk.web.uri);
              webSources.push({
                title: chunk.web.title || chunk.web.uri,
                url: chunk.web.uri
              });
            }
          }
        }
      }

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
          matchedTutorialIds: parsed.matchedTutorialIds || [],
          webSources,
          searchQueries: groundingMetadata?.webSearchQueries || [],
          usedWebSearch: Boolean(enableWebSearch)
        });
      } catch (parseErr) {
        return res.json({
          answer: responseText,
          matchedTutorialIds: [],
          webSources,
          searchQueries: groundingMetadata?.webSearchQueries || [],
          usedWebSearch: Boolean(enableWebSearch)
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

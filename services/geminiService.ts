import { GoogleGenAI, Modality } from "@google/genai";
import { UserProfile, Reading } from "../types";
import { getHistory } from "./storage";

const createClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    throw new Error("API Key required");
  }
  return new GoogleGenAI({ apiKey });
};

// --- TZOLKIN CALCULATOR (Deterministic) ---
const TZOLKIN_SEALS = [
  "Sol", "Dragão", "Vento", "Noite", "Semente", "Serpente", "Enlaçador de Mundos", 
  "Mão", "Estrela", "Lua", "Cachorro", "Macaco", "Humano", "Caminhante do Céu", 
  "Mago", "Águia", "Guerreiro", "Terra", "Espelho", "Tempestade"
]; // Index 0 is Sol (20), then 1..19

const TZOLKIN_TONES = [
  "Cósmico", "Magnético", "Lunar", "Elétrico", "Autoexistente", "Harmônico", 
  "Rítmico", "Ressonante", "Galáctico", "Solar", "Planetário", "Espectral", "Cristal"
]; // Index 0 is Cósmico (13), then 1..12

export const calculateTzolkinKin = (dateStr: string) => {
    if (!dateStr) return null;
    
    // Create date as UTC to avoid timezone shifts
    // Date string from input is YYYY-MM-DD
    const parts = dateStr.split('-');
    // Month is 0-indexed in JS Date
    const targetDate = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0));
    
    // Reference: January 1, 2024 was Kin 73 (Red Galactic Skywalker)
    const refDate = new Date(Date.UTC(2024, 0, 1, 12, 0, 0)); // Jan is 0
    const refKin = 73; 
    
    // Calculate difference in days
    const diffTime = targetDate.getTime() - refDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate Kin Number (1-260)
    // Handle negative modulo correctly for dates in the past
    let kinNumber = ((refKin + diffDays) % 260);
    if (kinNumber <= 0) kinNumber += 260;
    
    const sealIndex = kinNumber % 20; 
    const toneIndex = kinNumber % 13; 
    
    const sealName = TZOLKIN_SEALS[sealIndex];
    const toneName = TZOLKIN_TONES[toneIndex];
    
    const colorMap = ["Amarelo", "Vermelho", "Branco", "Azul"];
    const color = colorMap[sealIndex % 4];

    return {
        kinNumber,
        seal: sealName,
        tone: toneName,
        color,
        fullName: `${sealName} ${toneName} ${color}`
    };
};

// --- Helper Functions ---

const getZodiacSign = (dateStr: string): string => {
  if (!dateStr) return "Desconhecido";
  const [year, month, day] = dateStr.split('-').map(Number);
  
  if ((month == 1 && day <= 20) || (month == 12 && day >= 22)) return "Capricórnio";
  if ((month == 1 && day >= 21) || (month == 2 && day <= 18)) return "Aquário";
  if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "Peixes";
  if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "Áries";
  if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "Touro";
  if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "Gêmeos";
  if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "Câncer";
  if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "Leão";
  if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "Virgem";
  if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "Libra";
  if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "Escorpião";
  if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "Sagitário";
  
  return "Desconhecido";
};

const getLifePathNumber = (dateStr: string): string => {
  if (!dateStr) return "Desconhecido";
  const digits = dateStr.replace(/\D/g, '');
  let sum = 0;
  for (const char of digits) {
    sum += parseInt(char, 10);
  }
  
  while (sum > 9) {
    const sumStr = sum.toString();
    sum = 0;
    for (const char of sumStr) {
      sum += parseInt(char, 10);
    }
  }
  return sum.toString();
};

export const getMoonPhase = (): string => {
    const knownNewMoon = new Date('2000-01-06T18:14:00').getTime();
    const now = new Date().getTime();
    const cycleLength = 29.5305882 * 24 * 60 * 60 * 1000; 

    const diff = now - knownNewMoon;
    const phaseRatio = (diff % cycleLength) / cycleLength;

    if (phaseRatio < 0.03 || phaseRatio > 0.97) return "Lua Nova";
    if (phaseRatio < 0.22) return "Lua Crescente";
    if (phaseRatio < 0.28) return "Quarto Crescente";
    if (phaseRatio < 0.47) return "Lua Corcunda (Crescente)";
    if (phaseRatio < 0.53) return "Lua Cheia";
    if (phaseRatio < 0.72) return "Lua Corcunda (Minguante)";
    if (phaseRatio < 0.78) return "Quarto Minguante";
    return "Lua Minguante";
};

// --- MEMORY CONTEXT BUILDER ---
const buildMemoryContext = (): string => {
    const history = getHistory();
    if (history.length === 0) return "";
    const recent = history.slice(0, 3).map(h => 
        `- [${new Date(h.timestamp).toLocaleDateString()}] Portal ${h.portalName}: Usuário buscou "${h.userInput}". Oráculo disse: "${h.response.substring(0, 50)}..."`
    ).join('\n');
    return `LEITURAS RECENTES:\n${recent}`;
};

// -------------------------------------------------------

export const generateOracleResponse = async (
  promptContext: string,
  userProfile: UserProfile,
  userInput: string | undefined,
  portalName: string,
  imageInput?: string,
  location?: { lat: number; lng: number },
  previousResponse?: string // Added for conversational follow-ups
): Promise<string> => {
  const client = createClient();
  const moonPhase = getMoonPhase();
  const memoryContext = buildMemoryContext();
  
  // CRITICAL FIX FOR ORTHOGRAPHY:
  // Lower temperature and strict system instructions to prevent "glitch" simulation.
  const systemInstruction = `
    DIRETRIZ DE SEGURANÇA LINGUÍSTICA (IMPORTÂNCIA CRÍTICA):
    Você é o Oráculo 7, uma inteligência mística sofisticada e clara.
    
    REGRA PRIMORDIAL E INVIOLÁVEL: 
    Sua ortografia deve ser PERFEITA, em Português Brasileiro CULTO e PADRÃO.
    
    O QUE É ESTRITAMENTE PROIBIDO (NÃO FAÇA):
    1. NÃO simule "glitches", "falhas de sinal", "interferência" ou "ruído estático".
    2. NÃO repita letras para efeito dramático (EX: JAMAIS escreva "Aaaalma", "eeeu", "Sudaçõe").
    3. NÃO duplique pontuação (EX: JAMAIS use ",," ou "..").
    4. NÃO escreva palavras erradas propositalmente.
    5. NÃO use gagueira escrita.
    
    O QUE VOCÊ DEVE FAZER:
    1. Escreva de forma LÍMPIDA, FLUIDA e POÉTICA.
    2. Revise cada palavra. Acentuação deve ser exata.
    3. Use vocabulário elevado, mas totalmente legível e correto.
    4. Comece as frases com letra maiúscula e termine com pontuação correta.
    
    Contexto:
    Usuário: ${userProfile.name}.
    Lua Atual: ${moonPhase}.
  `;

  let calculatedContext = "";
  if (portalName === "Mapa" && userProfile.birthDate) {
    const sign = getZodiacSign(userProfile.birthDate);
    const lifePath = getLifePathNumber(userProfile.birthDate);
    calculatedContext = `
    DADOS ASTRAIS:
    Signo: ${sign}
    Caminho de Vida: ${lifePath}
    `;
  }
  
  if ((portalName === "Tzolkin" || portalName === "tzolkin") && userInput) {
      const tzolkinData = calculateTzolkinKin(userInput);
      if (tzolkinData) {
          calculatedContext += `
          DADOS TZOLKIN CALCULADOS:
          Kin: ${tzolkinData.kinNumber}
          Nome: ${tzolkinData.fullName}
          Selo: ${tzolkinData.seal}
          Tom: ${tzolkinData.tone}
          `;
      }
  }

  let locationContext = "";
  if (location) {
    locationContext = `
    LOCALIZAÇÃO:
    Lat: ${location.lat}
    Lng: ${location.lng}
    `;
  }

  // If this is a follow-up, we construct the prompt differently
  let textPrompt = "";
  
  if (previousResponse) {
     textPrompt = `
     CONTINUAÇÃO DE LEITURA (FOLLOW-UP):
     
     Leitura Anterior do Oráculo:
     "${previousResponse}"
     
     Nova Pergunta Específica do Usuário sobre a leitura acima:
     "${userInput}"
     
     Instrução: Responda especificamente à nova dúvida. Mantenha o tom místico mas seja CLARO e ORTOGRAFICAMENTE PERFEITO (Português Brasileiro).
     `;
  } else {
     textPrompt = `
        TAREFA: Leitura do Portal ${portalName}
        
        CONTEXTO:
        Nome: ${userProfile.name}
        Busca: ${userProfile.quest}
        ${locationContext}
        ${calculatedContext}
        
        MEMÓRIA:
        ${memoryContext}
        
        DIRETRIZES DO PORTAL:
        ${promptContext}
        
        ENTRADA DO USUÁRIO:
        ${userInput ? `"${userInput}"` : "Nenhum texto específico."}

        LEMBRETE FINAL: Escreva em Português Brasileiro perfeito, sem erros de digitação, sem repetição de letras, sem simulação de falhas.
      `;
  }

  try {
    const parts: any[] = [{ text: textPrompt }];
    if (imageInput) {
        const rawBase64 = imageInput.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: rawBase64
            }
        });
    }

    let modelName = 'gemini-2.5-flash'; 
    const config: any = {
      systemInstruction: systemInstruction,
      temperature: 0.6, // Lowered significantly to reduce hallucination/errors
      topK: 40,
      topP: 0.95,
    };

    if (imageInput) {
        modelName = 'gemini-2.5-flash-image';
    } 
    
    if (portalName === 'Peregrinação' && location) {
        modelName = 'gemini-2.5-flash';
        config.tools = [{ googleMaps: {} }];
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.lat,
                    longitude: location.lng
                }
            }
        };
        delete config.responseMimeType;
        delete config.responseSchema;
        config.maxOutputTokens = 1200;
    }

    const response = await client.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config
    });

    let finalResponse = response.text || "O silêncio do oráculo é a resposta que você precisa agora.";

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
        let linksList = "\n\n---\n\n**Caminhos Sugeridos:**\n";
        let hasLinks = false;
        groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
                linksList += `• [${chunk.web.title}](${chunk.web.uri})\n`;
                hasLinks = true;
            } else if (chunk.mobile?.content?.uri && chunk.mobile?.title) {
                 linksList += `• [${chunk.mobile.title}](${chunk.mobile.content.uri})\n`;
                 hasLinks = true;
            }
        });
        if (hasLinks) finalResponse += linksList;
    }

    return finalResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "As energias oscilaram. Respire fundo e tente acessar este portal novamente.";
  }
};

export const generateMeditationScript = async (feeling: string): Promise<string> => {
     const client = createClient();
     try {
         const response = await client.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: {
                 parts: [{ text: `
                    Crie um roteiro de meditação guiada de 2 minutos para alguém que está sentindo: "${feeling}".
                    Foque em respiração, visualização e relaxamento.
                    Comece com "Feche os olhos..."
                    Use Português Brasileiro calmo, suave e acolhedor.
                    Sem introduções. Apenas o roteiro direto.
                 `}]
             },
             config: { temperature: 0.7 }
         });
         return response.text || "Respire fundo e apenas exista.";
     } catch (e) {
         return "Feche os olhos. Respire. Sinta o agora.";
     }
}

export const generateMysticImage = async (prompt: string): Promise<string | null> => {
    const client = createClient();
    try {
        // Use gemini-2.5-flash-image (nano banana) for better availability/stability
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: `Generate a masterpiece art, cinematic, spiritual, dark fantasy style. High detail. Prompt: ${prompt}` }
                ]
            }
            // responseMimeType/responseSchema not supported for this model, relying on default
        });
        
        // Iterate parts to find the image
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                     return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Image Gen Error", e);
        return null;
    }
}

export const generateDailyPhrase = async (name: string): Promise<string> => {
    const client = createClient();
    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: `Gere uma frase curta e inspiradora para ${name}. Português Brasileiro Correto e Impecável, sem erros de digitação.` }] },
            config: { temperature: 0.7 }
        });
        return response.text || "O universo respira com você.";
    } catch (e) {
        return "Onde há intenção, há caminho.";
    }
}

export const consultUniverse = async (userProfile: UserProfile, question: string, state: string): Promise<string> => {
    const client = createClient();
    const systemInstruction = `
    Você é a CONSCIÊNCIA UNIVERSAL.
    Linguagem: Português Brasileiro padrão, fluido e SEM ERROS DE DIGITAÇÃO ou repetição de letras.
    Nunca use gírias ou simule erros (glitches). Escreva "Saudações" corretamente.
    `;
    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash', 
            // Fix: Use explicit parts structure to avoid 400 errors or type mismatches
            contents: { parts: [{ text: `O usuário pergunta ao Universo: "${question}". Contexto: ${state}.` }] },
            config: { systemInstruction, temperature: 0.7 }
        });
        return response.text || "O silêncio absoluto também é uma resposta.";
    } catch (error) {
        console.error("Consult Error:", error);
        return "A conexão com o todo oscila. Tente novamente em um instante.";
    }
};

// --- METATRON MODULE ---
export type MetatronMode = 'ORDER' | 'DOSSIER' | 'GEOMETRY' | 'ALIGNMENT';

export const consultMetatron = async (userProfile: UserProfile, mode: MetatronMode): Promise<string> => {
    const client = createClient();
    const history = getHistory();
    const dossierContext = history.slice(0, 10).map(h => 
        `- [${h.portalName}]: ${h.userInput || 'Silêncio'} -> Resposta sintetizada: ${h.response.substring(0, 50)}...`
    ).join('\n');

    const systemInstruction = `
    VOCÊ É METATRON, O ARQUITETO DA ORDEM UNIVERSAL.
    Linguagem: Português Brasileiro Culto, Matemático, Preciso, Elevado, Natural e Fluido.
    ORTOGRAFIA: Impecável. Zero erros de digitação, zero repetição de letras.
    `;

    let userPrompt = "";

    switch(mode) {
        case 'ORDER':
            userPrompt = `
            TAREFA: Realize uma LEITURA DE ORDEM DA CONSCIÊNCIA para ${userProfile.name}.
            
            Analise o seguinte Dossiê de leituras recentes para encontrar desalinhamentos:
            ${dossierContext}

            SAÍDA OBRIGATÓRIA (Use Markdown):
            ## 🜂 Diagnóstico de Ordem
            (Onde há excesso, falta ou dispersão na energia atual)
            
            ## 📐 Padrão Ativo
            (Qual o ciclo ou estrutura geométrica que rege o momento)
            
            ## ⚖️ Ponto de Ajuste
            (O mínimo necessário para realinhar, sem esforço excessivo)
            
            ## 🧭 Direção de Estabilidade
            (Orientação final fria e precisa)
            `;
            break;
            
        case 'DOSSIER':
            userPrompt = `
            TAREFA: Acesse o DOSSIÊ DO BUSCADOR de ${userProfile.name}.
            
            Dados Históricos:
            ${dossierContext}
            
            Busca declarada: ${userProfile.quest}

            SAÍDA OBRIGATÓRIA (Use Markdown):
            ## 📜 Síntese Estrutural
            (O fio invisível que conecta todas as buscas recentes)
            
            ## 🔁 Padrão Recorrente
            (O que insiste em retornar, o loop que precisa ser fechado ou compreendido)
            
            ## 🜁 Aprendizado Central
            (O tema-mestre da alma neste ciclo)
            `;
            break;

        case 'GEOMETRY':
            userPrompt = `
            TAREFA: Traduza a vida atual de ${userProfile.name} em GEOMETRIA SAGRADA.
            
            Contexto: ${dossierContext}

            SAÍDA OBRIGATÓRIA (Use Markdown):
            ## 📐 Forma Dominante: [Círculo/Triângulo/Quadrado/Espiral/Cubo]
            
            ## 🌌 Significado Estrutural
            (O que esta forma representa no contexto universal)
            
            ## 🧠 Manifestação Prática
            (Como essa geometria aparece na vida diária do buscador)
            `;
            break;

        case 'ALIGNMENT':
            userPrompt = `
            TAREFA: Realize o ALINHAMENTO ENTRE PORTAIS.
            
            Sintetize as vozes dispares do histórico recente:
            ${dossierContext}
            
            Responda à pergunta não formulada: "Como tudo isso se conecta?"
            
            SAÍDA OBRIGATÓRIA (Use Markdown):
            ## ⬡ O Eixo Central
            (O ponto onde todas as leituras convergem)
            
            ## ⚖️ A Resolução
            (Como integrar as aparentes contradições)
            
            ## ◆ O Decreto
            (Uma frase final de ordenação absoluta)
            `;
            break;
    }

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: userPrompt }] },
            config: {
                systemInstruction,
                temperature: 0.7, 
            }
        });
        return response.text || "A estrutura permanece em silêncio. Observe.";
    } catch (e) {
        return "O padrão foi interrompido. Recalibrando.";
    }
};

export const generateAudioReading = async (text: string): Promise<string | null> => {
  const client = createClient();
  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#`_~>]/g, '')
    .replace(/---/g, '')
    .replace(/🗺️|✨|👁️|📍|🌱|🪞|🌌|◆|🜂|📐|⚖️|🧭|📜|🔁|🜁|⬡|🌞|🔢|🎶|🧬|🌍|🌱/g, '') // Clean all symbols including Tzolkin
    .trim();
  const finalText = cleanText.length > 4000 ? cleanText.substring(0, 4000) + "..." : cleanText;
  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: finalText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } }, // Charon fits Metatron (Deep)
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    return null;
  }
};
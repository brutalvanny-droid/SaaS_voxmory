import { GoogleGenAI } from '@google/genai';

/**
 * Assistant IA du studio (transcription, résumé, paroles, prompts Suno…).
 *
 * Règle importante : lorsqu'aucune clé n'est configurée, le service
 * n'invente **jamais** de contenu. La version précédente renvoyait des
 * réponses simulées indiscernables des vraies — au risque de livrer à un
 * client des paroles fabriquées de toutes pièces. On renvoie désormais un
 * signal explicite `degraded: true` que l'interface affiche.
 */

let aiClient: GoogleGenAI | null = null;

export function isAiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key !== 'MY_GEMINI_API_KEY');
}

function getClient(): GoogleGenAI | null {
  if (!isAiConfigured()) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY as string,
      httpOptions: { headers: { 'User-Agent': 'voxmory-studio' } },
    });
  }
  return aiClient;
}

export interface AiResult {
  text: string;
  degraded: boolean;
  error?: string;
}

const SYSTEM_INSTRUCTIONS: Record<string, string> = {
  transcribe:
    "Tu es un assistant expert de VOXMORY. Tu retranscris fidèlement la note vocale d'un client en français clair et structuré, en préservant l'émotion, les expressions locales et le contexte africain (RDC).",
  summarize:
    "Tu es directeur de création artistique pour VOXMORY. Tu extrais l'essence émotionnelle, les faits clés, les anecdotes et le ton d'une histoire racontée par un client.",
  brief:
    "Tu es arrangeur et directeur de production musicale pour VOXMORY, studio de composition haut de gamme en Afrique.",
  lyrics:
    "Tu es l'auteur-compositeur vedette de VOXMORY. Tu écris des paroles extrêmement touchantes, poétiques et mémorables en français, avec des touches de lingala, swahili, tshiluba ou kikongo si le contexte s'y prête. Jamais de langage générique.",
  suno: "Tu es un ingénieur du son expert en outils d'IA musicale (Suno, Udio).",
  cover: 'Tu es directeur artistique visuel pour VOXMORY. Tu conçois des pochettes somptueuses.',
  video: 'Tu es réalisateur vidéo pour VOXMORY. Tu crées des clips cinématiques de luxe.',
  whatsapp:
    "Tu es le responsable relation client de VOXMORY. Tu t'exprimes avec chaleur, politesse et enthousiasme.",
  testimonial: 'Tu es responsable de la satisfaction client de VOXMORY.',
  followup: "Tu es l'assistant de relance relationnelle de VOXMORY.",
};

type AiKind = keyof typeof SYSTEM_INSTRUCTIONS;

export interface AiParams {
  kind: AiKind;
  storyText?: string;
  mood?: string;
  musicStyle?: string;
  recipientName?: string;
  customerName?: string;
  importantWords?: string;
  avoidWords?: string;
  occasion?: string;
  audioFilename?: string;
  orderId?: string;
  memoryPageUrl?: string;
  eventName?: string;
  relationship?: string;
  eventDate?: string;
}

function buildPrompt(p: AiParams): string {
  switch (p.kind) {
    case 'transcribe':
      return `Transcris le fichier audio '${p.audioFilename ?? 'note_vocale.ogg'}' de la commande ${p.orderId ?? 'inconnue'}. Convertis la note vocale du client — qui raconte son histoire personnelle, ses souvenirs et ses émotions — en un texte français clair et structuré, fidèle à la formulation d'origine.`;
    case 'summarize':
      return `Analyse cette histoire et produis un résumé émotionnel structuré : personnages et relations, événement célébré, moments clés et anecdotes, ton émotionnel idéal pour la chanson.\n\nHistoire :\n"""\n${p.storyText ?? 'Aucune histoire fournie.'}\n"""`;
    case 'brief':
      return `Rédige un brief technique et artistique pour le compositeur. Style : "${p.musicStyle ?? 'Rumba congolaise'}", ambiance : "${p.mood ?? 'Romantique'}". Précise la structure (intro, couplets, refrain, pont, outro), le tempo en BPM, la direction vocale et les instruments phares.\n\nHistoire source :\n"""\n${p.storyText ?? "Histoire en cours d'élaboration"}\n"""`;
    case 'lyrics':
      return `Écris les paroles complètes d'une chanson personnalisée pour ${p.recipientName ?? 'le destinataire'}, commandée par ${p.customerName ?? 'le client'}.\nAmbiance : ${p.mood ?? 'Émotionnelle'} — Style : ${p.musicStyle ?? 'Rumba congolaise'}.\nMots à inclure absolument : ${p.importantWords || 'aucun'}.\nSujets ou mots à éviter : ${p.avoidWords || 'aucun'}.\n\nStructure attendue : intro dédicacée, couplet 1, refrain, couplet 2, pont/solo, refrain final, outro.\n\nHistoire :\n"""\n${p.storyText ?? "Histoire d'amour et de respect familial."}\n"""`;
    case 'suno':
      return `Génère le prompt de style musical parfait (en anglais, moins de 120 caractères) pour un morceau "${p.musicStyle ?? 'Rumba congolaise'}" d'ambiance "${p.mood ?? 'Émotionnelle'}". Propose aussi un prompt de paroles optimisé.`;
    case 'cover':
      return `Génère un prompt de génération d'image ultra-détaillé et premium pour la pochette de cette chanson. Occasion : "${p.occasion ?? 'Anniversaire'}", ambiance : "${p.mood ?? 'Luxe / Émotionnel'}". Style visuel : luxe africain cinématique, tons or et noir profond, lumière dorée, sans texte.`;
    case 'video':
      return `Crée un prompt vidéo haut de gamme (Veo) pour illustrer cette chanson. Thème : "${p.occasion ?? 'Célébration'}", ambiance : "${p.mood ?? 'Inspirant'}". Décris les mouvements de caméra lents, les transitions et l'esthétique lumineuse.`;
    case 'whatsapp':
      return `Rédige un message WhatsApp de livraison chaleureux en français pour ${p.customerName ?? 'le client'}, qui vient de recevoir la chanson pour ${p.recipientName ?? 'le destinataire'}. Commande ${p.orderId ?? ''}. Page souvenir : ${p.memoryPageUrl ?? 'lien à renseigner'}. Utilise des émojis avec parcimonie.`;
    case 'testimonial':
      return `Rédige un message WhatsApp amical demandant à ${p.customerName ?? 'le client'} comment s'est passée la surprise pour ${p.recipientName ?? 'le destinataire'}, et l'invitant à laisser un avis en une minute.`;
    case 'followup':
      return `Rédige une relance chaleureuse pour ${p.customerName ?? 'le client'} : l'événement "${p.eventName ?? 'Anniversaire'}" de son/sa ${p.relationship ?? 'proche'} approche (${p.eventDate ?? 'bientôt'}). Propose-lui d'immortaliser ce moment en chanson, avec une offre de fidélité.`;
    default:
      return p.storyText ?? '';
  }
}

export async function runAi(p: AiParams): Promise<AiResult> {
  const client = getClient();

  if (!client) {
    return {
      text:
        "L'assistance IA n'est pas configurée. Renseignez GEMINI_API_KEY dans les variables d'environnement pour activer ces suggestions.",
      degraded: true,
      error: 'missing_api_key',
    };
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: buildPrompt(p),
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS[p.kind],
        temperature: 0.8,
      },
    });

    return { text: response.text ?? 'Aucune réponse générée.', degraded: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[IA] Erreur Gemini :', message);
    return {
      text: `L'assistance IA est momentanément indisponible : ${message}`,
      degraded: true,
      error: 'api_error',
    };
  }
}

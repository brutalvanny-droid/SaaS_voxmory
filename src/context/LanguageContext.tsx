import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'fr' | 'sw' | 'en';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, section?: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Core translation dictionary for VOXMORY
const dict: Record<Language, Record<string, Record<string, string>>> = {
  fr: {
    nav: {
      home: 'Accueil',
      order: 'Créer ma chanson',
      gallery: 'Écouter les exemples',
      reviews: 'Avis clients',
      pricing: 'Tarifs',
      tracking: 'Suivre ma commande',
      whatsapp_cta: 'Commander sur WhatsApp'
    },
    hero: {
      tagline: 'Studio de création musicale sur-mesure',
      title_part1: 'Offrez une chanson personnalisée qui fait',
      title_grad: 'pleurer, sourire et danser',
      title_part2: '— créée à partir de votre histoire',
      desc: 'Vous racontez votre histoire par texte, audio ou WhatsApp. Nous la transformons en une chanson unique, écrite avec soin, produite avec une qualité studio, puis livrée prête à offrir.',
      badge_speed: '⚡ Livraison en 24h à 5 jours',
      badge_human: '✍️ Paroles retravaillées par un humain',
      badge_momo: '💵 Paiement simple WhatsApp / Mobile Money',
      btn_order: 'Commander ma chanson',
      btn_examples: 'Écouter des exemples',
      microcopy: 'Commande en moins de 2 minutes. Même si vous ne savez pas quoi écrire.',
      or_whatsapp: 'Ou commandez directement via :'
    },
    benefits: {
      title: 'Pourquoi les familles nous choisissent',
      b1: 'Vous n’avez pas besoin de savoir écrire.',
      b2: 'Nous transformons vos souvenirs en paroles fortes.',
      b3: 'Chaque chanson est pensée pour une personne réelle et un moment vrai.',
      b4: 'Vous recevez un souvenir unique, intime et impossible à remplacer.'
    },
    occasions: {
      sub: 'Pour quel moment de vie souhaitez-vous créer une chanson ?',
      title: 'Sélectionnez votre occasion et commencez',
      btn_choose: 'Je choisis mon occasion'
    },
    process: {
      sub: 'Processus Ultra Simple',
      title: 'Comment ça marche ?',
      desc: 'Aucune compétence technique nécessaire. Nous gérons absolument tout de A à Z.',
      s1_title: '1. Vous nous racontez votre histoire',
      s1_desc: 'Par texte, audio ou WhatsApp. Même quelques phrases simples ou une note vocale rapide suffisent largement pour nous donner le contexte.',
      s2_title: '2. Nous écrivons et composons',
      s2_desc: 'Nos auteurs et créatifs transforment vos mots et anecdotes en paroles soignées, rimes émouvantes et mélodies de haute qualité studio.',
      s3_title: '3. Vous validez, puis nous livrons',
      s3_desc: 'Vous recevez votre chanson dans le format prévu, prête à offrir, à partager ou à faire jouer lors de votre événement ou célébration familiale.',
      badge: 'Simple • Rapide • Humain • Sans compétence technique'
    },
    value: {
      sub: 'Ce que vous offrez vraiment',
      title: 'Vous n’offrez pas juste une musique.',
      gradient: 'Vous offrez un souvenir vivant, une preuve d’amour, un hommage qu’on n’oublie pas.',
      p1: 'Un moment magique qui bouleverse toute une salle d\'invités.',
      p2: 'Une trace intemporelle que la personne pourra réécouter toute sa vie.',
      p3: 'Un niveau d\'attention émotionnelle mille fois supérieur à un cadeau classique.',
      p4: 'Une création artisanale valorisant la culture et la sincérité.'
    },
    different: {
      title: 'Pourquoi VOXMORY est différent',
      sub: 'Une exigence artistique, un coeur humain',
      f1_t: 'Nous partons de votre vraie histoire',
      f1_d: 'Pas d’émotion générique ou de phrases pré-écrites industrielles. Chaque couplet, chaque rime est lié directement aux prénoms, anecdotes et mémoires confiés par vos soins.',
      f2_t: 'Il y a une validation et une relecture humaine',
      f2_d: 'Les mots comptent. Nos paroliers relisent, ajustent, corrigent la prosodie et s\'assurent que la diction artistique respecte parfaitement les conventions d\'expression.',
      f3_t: 'Vous pouvez commander sans savoir écrire',
      f3_d: 'Pas besoin d\'avoir fait de grandes études littéraires ou musicales. Une simple note vocale ou quelques lignes spontanées nous suffisent pour en faire un bijou d\'émotions.',
      f4_t: 'Le rendu est 100% prêt à offrir',
      f4_d: 'L\'audio est produit en qualité studio, et selon votre pack, nous fournissons la vidéo personnalisée et une page souvenir privée interactive accessible via un QR code imprimable.'
    },
    testimonials: {
      sub: 'Ils ont vu leur proche pleurer, rire ou danser dès les premières notes',
      title: 'Des retours authentiques qui réchauffent le cœur',
      btn_more: 'Voir plus de réactions'
    },
    tranquility: {
      title: 'Vous pouvez commander l\'esprit tranquille',
      desc: 'Accompagnement WhatsApp réactif • Paiement simple, transparent et sécurisé • Délais annoncés à l\'avance et strictement respectés • Confidentialité absolue garantie pour vos histoires intimes.',
      guarantee: 'Garantie absolue : Si les paroles ne reflètent pas fidèlement votre histoire, nous les retravaillons sans frais avant la production finale !'
    },
    faq: {
      sub: 'FAQ de Vente — Réponses claires',
      title: 'Des réponses à vos objections',
      objection_price_q: 'Pourquoi les prix sont-ils à ce niveau ? Qu’est-ce qui est inclus ?',
      objection_price_a: 'Chaque chanson VOXMORY est une création sur-mesure nécessitant des heures de travail artistique. Nos tarifs incluent l’écriture personnalisée de vos paroles par un parolier professionnel, l’enregistrement vocal studio de haute qualité, le mixage audio professionnel et, selon la formule, la création d’une vidéo souvenir et d’une page interactive privée.',
      objection_delivery_q: 'Quels sont les délais de livraison ? Que se passe-t-il si j’ai une urgence ?',
      objection_delivery_a: 'Nos délais de livraison standard sont de 3 à 5 jours selon la formule. Pour les cadeaux de dernière minute, nous proposons une option de livraison express en 24h ou 48h. Nous respectons scrupuleusement nos délais pour que votre chanson soit prête pour le grand jour.',
      objection_momo_q: 'Comment s’effectue le paiement ? Acceptez-vous le paiement par Mobile Money (M-Pesa, Orange Money, Airtel Money) ?',
      objection_momo_a: 'Oui, tout à fait ! Pour faciliter l’accès à nos clients en Afrique (particulièrement en RDC), nous acceptons pleinement tous les réseaux Mobile Money (M-Pesa, Orange Money, Airtel Money) ainsi que les virements et cartes de crédit. Tout est sécurisé et géré en direct avec nos conseillers sur WhatsApp.',
      objection_audio_q: 'Puis-je commander en envoyant simplement un enregistrement ou mémo vocal ?',
      objection_audio_a: 'Absolument ! Notre formulaire de commande et notre canal WhatsApp vous permettent d’enregistrer un mémo vocal à la volée. Racontez-nous simplement les anecdotes, les souvenirs et les prénoms de la personne avec votre propre voix, et nos paroliers s’occupent de tout transcrire et poétiser.',
      objection_edit_q: 'Puis-je demander des retouches ou modifications si les paroles ne me plaisent pas ?',
      objection_edit_q_short: 'Que faire si je veux modifier ou retoucher la chanson ?',
      objection_edit_a: 'Oui, votre satisfaction est notre priorité absolue. Nous avons une garantie de retouche : nous vous présentons les paroles pour validation et nous apportons les corrections nécessaires pour qu’elles correspondent parfaitement à vos attentes avant de procéder à la production finale.',
      objection_whatsapp_q: 'Comment recevrai-je ma chanson finale ? Est-elle envoyée directement par WhatsApp ?',
      objection_whatsapp_a: 'Oui, la livraison se fait de manière moderne et ultra-pratique. Nous vous envoyons le fichier audio haute définition et le lien de votre page souvenir personnalisée directement sur WhatsApp. Vous pouvez ainsi l’écouter, la télécharger et la partager instantanément avec vos proches.'
    },
    closing: {
      title_part1: 'Ne laissez pas vos souvenirs rester dans votre tête.',
      title_grad: 'Transformez-les en chanson.',
      desc: 'Racontez votre histoire aujourd’hui, et offrez à quelqu’un un moment d’émotion pure qu’il n’oubliera jamais.',
      btn_order_now: 'Commander ma chanson maintenant',
      btn_talk: 'Parler à VOXMORY sur WhatsApp',
      footer_micro: 'Réponse rapide • Paiement simple • Accompagnement humain'
    }
  },
  sw: {
    nav: {
      home: 'Mwanzo',
      order: 'Tengeneza wimbo wangu',
      gallery: 'Sikiliza mifano',
      reviews: 'Maoni ya wateja',
      pricing: 'Bei',
      tracking: 'Fuatilia agizo',
      whatsapp_cta: 'Agiza kwenye WhatsApp'
    },
    hero: {
      tagline: 'Studio ya kutengeneza muziki maalum wa kipekee',
      title_part1: 'Toa zawadi ya wimbo maalum unaofanya mtu',
      title_grad: 'ulie, utabasamu na ucheze',
      title_part2: '— uliotengenezwa kutokana na historia yako',
      desc: 'Simulia hadithi yako kwa maandishi, sauti au WhatsApp. Sisi tunaigeuza kuwa wimbo wa kipekee, ulioandikwa kwa uangalifu, uliorekodiwa kwa ubora wa studio, kisha kukabidhiwa ukiwa tayari kutolewa zawadi.',
      badge_speed: '⚡ Uwasilishaji ndani ya masaa 24 hadi siku 5',
      badge_human: '✍️ Mashairi yaliyoandikwa na mwanadamu kwa hisia',
      badge_momo: '💵 Malipo rahisi ya WhatsApp / Mobile Money',
      btn_order: 'Agiza wimbo wangu',
      btn_examples: 'Sikiliza mifano',
      microcopy: 'Agiza kwa chini ya dakika 2. Hata kama hujui la kuandika.',
      or_whatsapp: 'Au agiza moja kwa moja kupitia:'
    },
    benefits: {
      title: 'Kwa nini familia zinatuchagua sisi',
      b1: 'Huna haja ya kujua jinsi ya kuandika mashairi.',
      b2: 'Tunabadilisha kumbukumbu zako kuwa maneno yenye nguvu.',
      b3: 'Kila wimbo umeundwa kwa ajili ya mtu halisi na wakati halisi.',
      b4: 'Unapokea kumbukumbu ya kipekee, ya siri na isiyoweza kubadilishwa na chochote.'
    },
    occasions: {
      sub: 'Ni kwa ajili ya tukio gani la maisha ungependa kutengeneza wimbo?',
      title: 'Chagua tukio lako kisha uanze',
      btn_choose: 'Chagua tukio langu'
    },
    process: {
      sub: 'Njia Rahisi Sana',
      title: 'Inafanyaje kazi?',
      desc: 'Hakuna ujuzi wa kitaalamu unaohitajika. Sisi tunashughulikia kila kitu kuanzia mwanzo hadi mwisho.',
      s1_title: '1. Unatusimulia hadithi yako',
      s1_desc: 'Kwa maandishi, sauti au WhatsApp. Hata sentensi chache rahisi au ujumbe mfupi wa sauti unatosha kutupa maelezo.',
      s2_title: '2. Tunaandika na kutunga',
      s2_desc: 'Waandishi na wasanii wetu wanabadilisha maneno na hadithi zako kuwa mashairi mazuri na sauti ya kiwango cha juu cha studio.',
      s3_title: '3. Unathibitisha, kisha tunatuma',
      s3_desc: 'Unapokea wimbo wako katika muundo uliochaguliwa, ukiwa tayari kutolewa kama zawadi, kushirikiwa au kuchezwa kwenye sherehe yako ya kifamilia.',
      badge: 'Rahisi • Haraka • Kiubinadamu • Bila ujuzi wa kiufundi'
    },
    value: {
      sub: 'Kile unachotoa hasa kama zawadi',
      title: 'Hutoi tu wimbo wa muziki.',
      gradient: 'Unatoa kumbukumbu hai, ushahidi wa upendo, na heshima ambayo haitasahaulika kamwe.',
      p1: 'Wakati wa kichawi unaogusa mioyo ya wageni wote kwenye ukumbi.',
      p2: 'Kumbukumbu ya milele ambayo mtu huyo anaweza kuisikiliza maisha yake yote.',
      p3: 'Kiwango cha upendo na hisia ambacho ni kikubwa mara elfu kuliko zawadi ya kawaida.',
      p4: 'Kazi ya mikono ya kisanii inayothamini utamaduni na ukweli.'
    },
    different: {
      title: 'Kwa nini VOXMORY ni tofauti',
      sub: 'Sanaa ya hali ya juu, moyo wa kiubinadamu',
      f1_t: 'Tunaanzia kwenye historia yako halisi',
      f1_d: 'Hakuna hisia za jumla au sentensi zilizotengenezwa kiwandani. Kila ubeti, kila shairi limeunganishwa moja kwa moja na majina, kumbukumbu na matukio uliyotushirikisha.',
      f2_t: 'Kuna uhakiki na usomaji unaofanywa na wanadamu',
      f2_d: 'Maneno yana umuhimu. Waandishi wetu wanasoma upya, kurekebisha, na kuhakikisha kuwa uimbaji wa kisanii unaheshimu kikamilifu misingi ya lugha na hisia.',
      f3_t: 'Unaweza kuagiza bila kujua kuandika mashairi',
      f3_d: 'Huna haja ya kuwa umesoma fasihi au muziki kwa kiwango cha juu. Ujumbe rahisi wa sauti au mistari michache inatosha kwetu kutengeneza vito vya thamani vya hisia.',
      f4_t: 'Kazi inapokabidhiwa ipo 100% tayari kutolewa zawadi',
      f4_d: 'Sauti inatayarishwa kwa ubora wa studio, na kulingana na kifurushi chako, tunatoa video maalum na ukurasa wa kumbukumbu wa kibinafsi unaopatikana kwa QR code.'
    },
    testimonials: {
      sub: 'Waliona wapendwa wao wakilia, wakitabasamu au wakicheza tangu dakika ya kwanza',
      title: 'Shuhuda halisi zinazochangamsha na kugusa moyo',
      btn_more: 'Angalia maoni zaidi'
    },
    tranquility: {
      title: 'Unaweza kuagiza kwa amani kamili ya akili',
      desc: 'Usaidizi wa haraka wa WhatsApp • Malipo rahisi, wazi na salama • Muda wa uwasilishaji unazingatiwa kikamilifu • Siri ya hadithi zako za kibinafsi inalindwa kwa 100%.',
      guarantee: 'Dhamana kamili: Kama mashairi hayataonyesha kwa usahihi historia yako, tutayarekebisha bila malipo yoyote kabla ya kurekodi wimbo wa mwisho!'
    },
    faq: {
      sub: 'Maswali Yanayoulizwa Sana — Majibu ya Wazi',
      title: 'Majibu ya maswali yako',
      objection_price_q: 'Kwa nini bei zipo hivi? Ni nini kilichojumuishwa?',
      objection_price_a: 'Kila wimbo wa VOXMORY ni kazi maalum inayohitaji masaa mengi ya kazi ya kisanii. Bei zetu zinajumuisha uandishi wa kipekee wa maneno yako na mwandishi wa kitaalamu, kurekodi sauti kwenye studio ya hali ya juu, kuchanganya sauti (mixage) kitaalamu na, kulingana na kifurushi, kutengeneza video ya kumbukumbu na ukurasa wa kibinafsi wa mtandao.',
      objection_delivery_q: 'Muda wa uwasilishaji ni gani? Je! Kuna dharura?',
      objection_delivery_a: 'Muda wa kawaida wa uwasilishaji ni siku 3 hadi 5 kulingana na kifurushi. Kwa zawadi za dharura, tunatoa huduma ya haraka ndani ya masaa 24 au 48. Tunazingatia sana muda ili wimbo wako uwe tayari kwa siku kuu.',
      objection_momo_q: 'Malipo yanafanywaje? Je, mnakubali Mobile Money (M-Pesa, Orange Money, Airtel Money)?',
      objection_momo_a: 'Ndiyo, kabisa! Ili kurahisisha huduma kwa wateja wetu barani Afrika (hasa RDC), tunakubali kikamilifu mitandao yote ya Mobile Money (M-Pesa, Orange Money, Airtel Money) pamoja na kadi za benki. Kila kitu kinasimamiwa kwa usalama na washauri wetu kupitia WhatsApp.',
      objection_audio_q: 'Je, ninaweza kuagiza kwa kutuma tu ujumbe wa sauti (memo ya sauti)?',
      objection_audio_a: 'Ndiyo kabisa! Fomu yetu ya agizo na njia yetu ya WhatsApp zinakuruhusu kurekodi ujumbe wa sauti papo hapo. Tusimulie tu kumbukumbu, majina na matukio ya mtu huyo kwa sauti yako mwenyewe, na waandishi wetu watafanya kazi ya kuandika na kuifanya iwe mashairi mazuri.',
      objection_edit_q: 'Je, ninaweza kuomba marekebisho ikiwa mashairi hayajanivutia?',
      objection_edit_q_short: 'Nifanye nini nikitaka kurekebisha wimbo?',
      objection_edit_a: 'Ndiyo, kuridhika kwako ndio kipaumbele chetu kikuu. Tuna dhamana ya kurekebisha: tunakuonyesha maneno kwanza ili uyasome, na tunafanya marekebisho yote yanayohitajika ili yalingane kikamilifu na matarajio yako kabla ya kurekodi wimbo mzima studio.',
      objection_whatsapp_q: 'Nitapokeaje wimbo wangu wa mwisho? Je, unatunwa moja kwa moja kwenye WhatsApp?',
      objection_whatsapp_a: 'Ndiyo, uwasilishaji unafanyika kwa njia ya kisasa na rahisi sana. Tunakutumia faili ya sauti ya ubora wa juu (HD) na kiungo cha ukurasa wako wa kumbukumbu moja kwa moja kwenye WhatsApp. Unaweza kuusikiliza, kuupakua, na kuushiriki mara moja na familia yako.'
    },
    closing: {
      title_part1: 'Usiache kumbukumbu zako zibaki kichwani tu.',
      title_grad: 'Zigeuze kuwa wimbo mzuri.',
      desc: 'Simulia hadithi yako leo, na umpe mtu mpendwa wakati wa hisia safi ambao hatausahau kamwe.',
      btn_order_now: 'Agiza wimbo wangu sasa hivi',
      btn_talk: 'Zungumza na VOXMORY kwenye WhatsApp',
      footer_micro: 'Majibu ya haraka • Malipo rahisi • Msaada wa kibinadamu'
    }
  },
  en: {
    nav: {
      home: 'Home',
      order: 'Create My Song',
      gallery: 'Listen to Examples',
      reviews: 'Client Reviews',
      pricing: 'Pricing',
      tracking: 'Track My Order',
      whatsapp_cta: 'Order on WhatsApp'
    },
    hero: {
      tagline: 'Bespoke custom music creation studio',
      title_part1: 'Gift a custom personalized song that makes them',
      title_grad: 'cry, smile and dance',
      title_part2: '— crafted from your unique story',
      desc: 'Tell us your story via text, audio, or WhatsApp. We transform it into a unique song, written with care, produced with professional studio quality, and delivered ready to gift.',
      badge_speed: '⚡ Delivery in 24 hours to 5 days',
      badge_human: '✍️ Lyrics refined by a professional writer',
      badge_momo: '💵 Easy payment via WhatsApp / Mobile Money',
      btn_order: 'Order My Song',
      btn_examples: 'Listen to Examples',
      microcopy: 'Order in under 2 minutes. Even if you don’t know what to write.',
      or_whatsapp: 'Or order directly via:'
    },
    benefits: {
      title: 'Why families choose us',
      b1: 'You don’t need to know how to write poetry.',
      b2: 'We turn your memories into powerful lyrics.',
      b3: 'Each song is crafted for a real person and a true moment.',
      b4: 'You receive a unique, intimate memory that is impossible to replace.'
    },
    occasions: {
      sub: 'For which life milestone would you like to create a song?',
      title: 'Select your occasion and get started',
      btn_choose: 'I choose my occasion'
    },
    process: {
      sub: 'Super Simple Process',
      title: 'How does it work?',
      desc: 'No technical skills required. We manage absolutely everything from A to Z.',
      s1_title: '1. Tell us your story',
      s1_desc: 'Via text, audio, or WhatsApp. A few simple sentences or a quick voice note is more than enough to give us the context.',
      s2_title: '2. We write and compose',
      s2_desc: 'Our writers and creative artists turn your words and anecdotes into polished lyrics, touching rhymes, and high-quality studio melodies.',
      s3_title: '3. You approve, then we deliver',
      s3_desc: 'You receive your custom song in the chosen format, ready to gift, share, or play during your family celebration or event.',
      badge: 'Simple • Fast • Human-touch • No tech skills required'
    },
    value: {
      sub: 'What you are truly gifting',
      title: 'You are not just gifting a song.',
      gradient: 'You are gifting a living memory, a proof of love, and a tribute that will never be forgotten.',
      p1: 'A magical moment that touches everyone in the room.',
      p2: 'A timeless gift that they can listen to for the rest of their life.',
      p3: 'An emotional connection a thousand times deeper than a typical gift.',
      p4: 'A handcrafted piece of art celebrating culture and sincerity.'
    },
    different: {
      title: 'Why VOXMORY is different',
      sub: 'Artistic high standards, a human heart',
      f1_t: 'We start from your real story',
      f1_d: 'No generic emotions or factory-written lines. Every verse, every rhyme is directly tied to the names, memories, and anecdotes you share.',
      f2_t: 'Human check and verification',
      f2_d: 'Words matter. Our lyricists proofread, adjust, correct prosody, and ensure that the artistic delivery respects language conventions.',
      f3_t: 'You can order without knowing how to write',
      f3_d: 'No need to have advanced literary or musical studies. A simple voice note or a few spontaneous lines are enough for us to make an emotional masterpiece.',
      f4_t: 'The output is 100% ready to gift',
      f4_d: 'The audio is produced in high-definition studio quality, and depending on your package, we provide a personalized video and a private interactive memory page.'
    },
    testimonials: {
      sub: 'They saw their loved ones cry, smile, or dance from the very first notes',
      title: 'Authentic feedback that warms the heart',
      btn_more: 'See more reactions'
    },
    tranquility: {
      title: 'You can order with peace of mind',
      desc: 'Responsive WhatsApp guidance • Simple, transparent and secure payments • Deadlines strictly respected • Absolute confidentiality guaranteed for your private stories.',
      guarantee: 'Absolute Guarantee: If the lyrics do not faithfully represent your story, we will edit them free of charge before the final studio production!'
    },
    faq: {
      sub: 'Sales FAQ — Clear Answers',
      title: 'Answers to your objections',
      objection_price_q: 'Why are the prices at this level? What is included?',
      objection_price_a: 'Each VOXMORY song is a bespoke custom creation that takes hours of dedicated artistic work. Our prices include the personalized writing of your lyrics by a professional writer, high-quality vocal recording in a studio, professional mixing, and depending on the selected package, a custom keepsake video and a private interactive website.',
      objection_delivery_q: 'What is the delivery time? What if I have an emergency?',
      objection_delivery_a: 'Our standard delivery times are 3 to 5 days depending on the package. For last-minute gifts, we offer an express delivery option in 24 or 48 hours. We strictly respect our deadlines so your song is ready for the big day.',
      objection_momo_q: 'How does payment work? Do you accept Mobile Money (M-Pesa, Orange Money, Airtel Money)?',
      objection_momo_a: 'Yes, absolutely! To make it easy for our clients in Africa (especially DRC), we fully accept all major Mobile Money networks (M-Pesa, Orange Money, Airtel Money) as well as bank transfers and credit cards. Everything is secured and handled directly with our team on WhatsApp.',
      objection_audio_q: 'Can I order by simply sending a voice memo or audio recording?',
      objection_audio_a: 'Absolutely! Our order form and our WhatsApp chat allow you to record a voice note on the go. Just tell us the memories, stories, and names of the person in your own voice, and our lyricists will take care of writing and refining everything.',
      objection_edit_q: 'Can I request edits if the lyrics do not fully please me?',
      objection_edit_q_short: 'What if I want to edit or tweak the song?',
      objection_edit_a: 'Yes, your satisfaction is our absolute priority. We have a revision guarantee: we present you with the lyrics for approval, and we make all necessary corrections to fit your expectations perfectly before the final recording.',
      objection_whatsapp_q: 'How will I receive my final song? Is it sent directly on WhatsApp?',
      objection_whatsapp_a: 'Yes, delivery is modern and ultra-convenient. We send you the high-definition audio file and the link to your custom memory page directly on WhatsApp. You can listen, download, and share it instantly with your family.'
    },
    closing: {
      title_part1: 'Don’t let your memories stay only in your head.',
      title_grad: 'Turn them into a song.',
      desc: 'Share your story today, and give someone an emotional experience they will never forget.',
      btn_order_now: 'Order My Song Now',
      btn_talk: 'Talk with VOXMORY on WhatsApp',
      footer_micro: 'Fast response • Easy payment • Personal guidance'
    }
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('voxmory_lang');
    return (saved === 'sw' || saved === 'en' || saved === 'fr') ? (saved as Language) : 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('voxmory_lang', lang);
  };

  const t = (key: string, section: string = 'common'): string => {
    const sectionDict = dict[language]?.[section];
    if (sectionDict && sectionDict[key]) {
      return sectionDict[key];
    }
    // Fallback to french
    const fallbackSection = dict['fr']?.[section];
    if (fallbackSection && fallbackSection[key]) {
      return fallbackSection[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

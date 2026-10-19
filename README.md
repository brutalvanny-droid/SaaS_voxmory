<div align="center">

# VOXMORY

**Votre histoire. Votre chanson.**

VOXMORY transforme les plus beaux moments de vos clients en chansons personnalisées —
rumba congolaise, afrobeat, gospel, zouk — livrées avec une page souvenir privée.

React 19 · Vite · Express · Neon (Postgres) · Vercel · SasPay

</div>

---

## Sommaire

1. [Ce qui a changé](#ce-qui-a-changé)
2. [Architecture](#architecture)
3. [Démarrage rapide](#démarrage-rapide)
4. [Déploiement sur Vercel](#déploiement-sur-vercel)
5. [Base de données Neon](#base-de-données-neon)
6. [Paiements SasPay](#paiements-saspay)
7. [Stockage des fichiers](#stockage-des-fichiers)
8. [Notifications WhatsApp](#notifications-whatsapp)
9. [Assistant IA](#assistant-ia)
10. [Sécurité](#sécurité)
11. [Commandes utiles](#commandes-utiles)
12. [Dépannage](#dépannage)

---

## Ce qui a changé

Cette version est une refonte complète de la sécurité et de l'infrastructure.
Le tableau ci-dessous reprend les points critiques qui ont été corrigés et
vérifiés par des tests d'exploitation réels.

| Avant | Maintenant |
|---|---|
| Aucune authentification : `/api/orders` exposait toute la base client | Session JWT dans un cookie httpOnly, vérifiée côté serveur sur chaque requête |
| Règles Firestore ouvertes en lecture/écriture à tous | Postgres accessible uniquement depuis le serveur |
| Mot de passe `VOXMORY_STUDIO_****` en clair dans le JavaScript public | Aucun secret côté client — hash bcrypt + vérification serveur |
| Mot de passe stocké en clair dans la base | Hash bcrypt (12 tours) |
| Synchronisation Firestore qui échouait en silence → perte des commandes | Écritures Postgres fiables, erreurs remontées |
| Sauvegarde des MP3 vers une collection non autorisée → 100 % d'échec | Vercel Blob, téléversement direct depuis le navigateur |
| Identifiants `VOX-2026-####` devinables (9 000 combinaisons) | Référence aléatoire + jeton de suivi (4,3 milliards de combinaisons) |
| Aucune validation serveur | Validation stricte (Zod) avec rejet des champs non prévus |
| Aucune limitation de débit | Quotas sur la connexion, les commandes, les paiements, les envois WhatsApp |
| 24 vulnérabilités de dépendances | Dépendances réduites, Firebase entièrement retiré |

**Résultat : le code compile sans erreur, le build passe, et chacune des
failles critiques a été refermée puis vérifiée par un test d'intrusion.**

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Navigateur                            │
│   React 19 + Vite + Tailwind 4                               │
│   Studio d'admin chargé à la demande (chunk séparé)          │
└───────────────┬──────────────────────────────────────────────┘
                │  /api/*  (cookie de session httpOnly)
                ▼
┌──────────────────────────────────────────────────────────────┐
│              Vercel — Fonction serverless                    │
│              api/index.ts  →  api/app.ts (Express)           │
│                                                              │
│   auth.ts       sessions JWT (jose) + bcrypt                 │
│   validation.ts schémas Zod, rejet des champs inconnus       │
│   ratelimit.ts  quotas adossés à Postgres                    │
│   saspay.ts     encaissement + vérification HMAC             │
│   storage.ts    jetons de téléversement Vercel Blob          │
│   whatsapp.ts   passerelle OpenWA                            │
│   ai.ts         Google Gemini                                │
└───────┬──────────────────┬───────────────────┬───────────────┘
        │                  │                   │
        ▼                  ▼                   ▼
┌──────────────┐  ┌────────────────┐  ┌─────────────────┐
│  Neon        │  │  Vercel Blob   │  │  Services       │
│  Postgres    │  │  MP3, images   │  │  SasPay,        │
│              │  │                │  │  OpenWA, Gemini │
└──────────────┘  └────────────────┘  └─────────────────┘
```

### Pourquoi ce choix

- **Neon** plutôt que Firestore : schéma relationnel, vraies transactions,
  et surtout des lectures/écritures cohérentes. Une commande payée ne peut
  plus disparaître.
- **Vercel Blob** pour les fichiers : le système de fichiers de Vercel est
  éphémère, tout ce qui y est écrit est perdu au redémarrage du conteneur.
- **Driver Postgres adaptatif** : Neon (WebSocket) en production,
  node-postgres (TCP) en développement, ce qui permet de faire tourner une
  base locale ordinaire.

---

## Démarrage rapide

### Prérequis

- Node.js 20 ou plus
- Une base Postgres (locale ou Neon)

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
#    compléter au minimum DATABASE_URL, ADMIN_JWT_SECRET,
#    ADMIN_EMAIL et ADMIN_PASSWORD

# 3. Créer le schéma de base de données
npm run db:push

# 4. Créer le compte administrateur et les formules
npm run db:seed

# 5. Lancer (API sur :3001 + site sur :5173)
npm run dev
```

Ouvrez <http://localhost:5173>. Le studio est accessible sur
<http://localhost:5173/#admin>.

### Base Postgres locale (optionnel)

```bash
createdb voxmory
export DATABASE_URL="postgresql://votre_user@localhost:5432/voxmory"
export DATABASE_DRIVER="pg"
```

---

## Déploiement sur Vercel

### 1. Importer le projet

Depuis <https://vercel.com/new> : importez le dépôt GitHub.
Vercel détecte automatiquement Vite (`vercel.json` est déjà fourni).

### 2. Variables d'environnement

Dans **Settings → Environment Variables**, ajoutez toutes les variables de
`.env.example`. Les quatre indispensables au démarrage :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion Neon |
| `ADMIN_JWT_SECRET` | Signature des sessions — 32 caractères minimum |
| `ADMIN_EMAIL` | Compte administrateur créé par le seed |
| `ADMIN_PASSWORD` | Mot de passe (haché, jamais stocké en clair) |

Générez une clé robuste :

```bash
openssl rand -base64 48
```

### 3. Créer le compte administrateur

Une fois la base déployée, lancez le seed **une seule fois** depuis votre
machine, en pointant sur la base Neon :

```bash
DATABASE_URL="postgresql://…neon.tech/voxmory?sslmode=require" \
DATABASE_DRIVER="neon" \
ADMIN_EMAIL="admin@voxmory.com" \
ADMIN_PASSWORD="un-mot-de-passe-solide" \
npm run db:seed
```

Le schéma doit exister au préalable :

```bash
DATABASE_URL="postgresql://…neon.tech/voxmory?sslmode=require" \
DATABASE_DRIVER="neon" npm run db:push
```

### 4. Vérifier

```bash
curl https://votre-domaine.vercel.app/api/health
```

La réponse indique l'état de chaque service :

```json
{
  "ok": true,
  "features": {
    "database": true,
    "payments": true,
    "whatsapp": false,
    "ai": true,
    "storage": "blob"
  }
}
```

---

## Base de données Neon

1. Créez un projet sur <https://neon.tech>
2. Copiez la chaîne de connexion (avec `?sslmode=require`)
3. Collez-la dans `DATABASE_URL`

Le schéma compte **16 tables** : `orders`, `payments`, `webhook_events`,
`packages`, `gallery_songs`, `reviews`, `memory_pages`, `reminders`,
`broadcast_lists`, `broadcast_contacts`, `broadcast_campaigns`,
`daily_stats`, `settings`, `rate_limit_counters`, `audit_logs`,
`admin_users`.

### Migrations

```bash
npm run db:generate   # génère un fichier SQL dans drizzle/
npm run db:push       # applique directement le schéma (rapide)
npm run db:migrate    # applique les migrations versionnées
npm run db:studio     # explorateur de données
```

> En production, préférez `db:generate` puis `db:migrate` : chaque
> changement de schéma reste tracé et reproductible.

---

## Paiements SasPay

SasPay permet d'encaisser en mobile money et par carte en Afrique de l'Ouest
et du Centre. La RDC est couverte (code pays `CD`, devise par défaut `CDF`).

### Configuration

1. Créez un compte sur <https://app.saspay.me>
2. Récupérez votre clé secrète (`sk_test_…` pour les essais, `sk_live_…` en production (jamais côté client))
3. Créez un webhook pointant vers `https://votre-domaine.vercel.app/api/webhooks/saspay`
   et abonnez-le aux événements `transaction.success`, `transaction.failed`
   et `transaction.cancelled`
4. **Copiez le secret de signature immédiatement** : SasPay ne l'affiche qu'une seule fois
5. Renseignez `SASPAY_API_KEY` et `SASPAY_WEBHOOK_SECRET` dans Vercel

### Deux modes d'encaissement

| Mode | Fonctionnement |
|---|---|
| **Checkout hébergé** | Une page SasPay où le client choisit son réseau. Le plus simple. |
| **Softpay** | Push USSD directement sur le téléphone du client (réseau connu). |

### Points de vigilance respectés

- **Idempotence** : chaque intention de paiement porte une clé
  `Idempotency-Key`. Sans elle, une reprise réseau débiterait le client deux fois.
- **Vérification systématique** : le statut n'est jamais déduit d'un délai,
  on interroge toujours `/payments/{id}/verify/`.
- **Webhooks signés** : HMAC SHA-256 sur `{horodatage}.{corps_brut}`.
  Deux contrôles sont appliqués — la signature **et** la fraîcheur
  (5 minutes), sinon un webhook intercepté resterait rejouable indéfiniment.
- **Idempotence des webhooks** : chaque événement est journalisé et ne peut
  être traité qu'une seule fois.

### Devise

Vos tarifs sont affichés en dollars américains par défaut. Si votre compte
SasPay exige le franc congolais pour la RDC, modifiez la devise des formules
depuis **Réglages → Tarifs** du studio, ou ajustez `SASPAY_DEFAULT_CURRENCY`.

---

## Stockage des fichiers

### En production : Vercel Blob

1. Dans Vercel : **Storage → Blob → Create Store**
2. Connectez le store au projet
3. Vercel injecte automatiquement `BLOB_READ_WRITE_TOKEN`

Les fichiers sont envoyés **directement depuis le navigateur** vers Blob,
après obtention d'un jeton auprès de `/api/uploads`. Le contenu ne transite
donc pas par la fonction serverless, ce qui permet d'accepter des MP3
volumineux malgré la limite de 4,5 Mo imposée au corps des requêtes.

Le jeton public est restreint : 10 Mo maximum, types audio et image
uniquement, et 5 fichiers par heure et par adresse IP.

### En développement

Sans jeton Blob, les fichiers sont déposés dans `public/uploads/`.
La route correspondante est automatiquement désactivée en production.

---

## Notifications WhatsApp

VOXMORY utilise **OpenWA**, une passerelle auto-hébergée qui tourne sur votre
propre serveur. Depuis Vercel, on l'appelle simplement en HTTP : aucune
session persistante n'est nécessaire côté serverless.

```
OPENWA_URL="https://votre-serveur-openwa.com/api"
OPENWA_API_KEY="votre-cle"
OPENWA_SESSION_ID="votre-session"
ADMIN_WHATSAPP_NUMBER="243810000000"
```

Les messages automatiques : confirmation de commande (client), alerte de
nouvelle commande (administrateur), confirmation de paiement et livraison.

> **Attention** : les campagnes de diffusion sont plafonnées à 200
> destinataires et espacées d'1,5 seconde. Un envoi massif depuis un numéro
> professionnel entraîne un bannissement par WhatsApp.

---

## Assistant IA

L'assistant du studio (transcription, résumé émotionnel, paroles, prompts
Suno et Veo) utilise Google Gemini via `GEMINI_API_KEY`.

**Principe important** : sans clé configurée, l'assistant n'invente jamais de
contenu. Il affiche un message d'indisponibilité explicite, signalé par une
étiquette « ⚠️ ne pas livrer telle quelle ». Une réponse simulée crédible
risquerait d'être livrée à un client comme si elle était personnalisée.

---

## Sécurité

### Mesures en place

| Mesure | Détail |
|---|---|
| **Sessions** | JWT signé (HS256), cookie `httpOnly` + `Secure` + `SameSite=Lax`, durée 8 h |
| **Mots de passe** | bcrypt, 12 tours. Aucun mot de passe en clair, ni dans le code ni en base |
| **Autorisation** | Décidée exclusivement côté serveur ; le front-end n'indique jamais ce qui est permis |
| **Validation** | Schémas Zod stricts : les champs inconnus sont rejetés |
| **Prix** | Calculés côté serveur à partir de la formule ; jamais repris de la requête |
| **Suivi public** | Endpoint dédié n'exposant ni téléphone, ni e-mail, ni histoire personnelle |
| **Identifiants** | Référence aléatoire + jeton de suivi de 24 caractères hexadécimaux |
| **Limitation de débit** | Connexion (8/15 min), commandes (5/h), paiements (10/10 min), téléversements (5/h), envois WhatsApp (60/h) |
| **Webhooks** | HMAC SHA-256 + contrôle de fraîcheur + déduplication |
| **Journal d'audit** | Chaque action d'administration est tracée (qui, quoi, quand, IP) |
| **En-têtes HTTP** | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` |

### Tests de sécurité vérifiés

Les exploits suivants ont été rejoués contre la nouvelle version et
**échouent tous** :

```
GET  /api/orders                     → 401  (était 200 avec toutes les commandes)
DEL  /api/orders/:id                 → 401  (était 200)
GET  /api/admin/gallery              → 401
POST /api/whatsapp/send              → 401
Commande forgée minimale             → 400 + liste des champs manquants
Tentative de statut « Livrée / Payé »→ statut imposé par le serveur
Webhook sans signature               → 401
Webhook avec signature périmée       → 401
Webhook rejoué                       → ignoré (dédupliqué)
9ᵉ tentative de connexion            → 429
```

---

## Commandes utiles

```bash
npm run dev          # API + site en mode développement
npm run build        # Build de production
npm run lint         # Vérification TypeScript
npm run db:push      # Synchroniser le schéma
npm run db:seed      # Créer l'admin et les formules
npm run db:studio    # Explorer les données
```

---

## Dépannage

**`DATABASE_URL` manquante**
Copiez `.env.example` vers `.env` et renseignez la chaîne de connexion.

**`ADMIN_JWT_SECRET` trop courte**
Générez-en une d'au moins 32 caractères : `openssl rand -base64 48`.

**Impossible de se connecter au studio**
Vérifiez que le compte a bien été créé :
```bash
ADMIN_EMAIL="admin@voxmory.com" ADMIN_PASSWORD="…" npm run db:seed
```

**« Paiement en ligne momentanément indisponible »**
`SASPAY_API_KEY` n'est pas définie. Sans elle, le site fonctionne mais
l'encaissement en ligne est désactivé.

**Les fichiers ne se téléversent pas en local**
Vérifiez que `NODE_ENV` n'est pas `production` : la route de repli locale
est volontairement désactivée en production.

**Erreurs de connexion Postgres sous Vercel**
Assurez-vous que `DATABASE_URL` contient `?sslmode=require` et que le driver
Neon est utilisé (`DATABASE_DRIVER=neon`, actif par défaut en production
sur une URL Neon).

---

## Structure du projet

```
api/
  index.ts              Point d'entrée Vercel
  app.ts                Application Express et toutes les routes
  _lib/
    auth.ts             Sessions, bcrypt, middleware d'autorisation
    validation.ts       Schémas Zod
    ratelimit.ts        Quotas adossés à Postgres
    saspay.ts           Paiements + vérification des webhooks
    storage.ts          Téléversement Vercel Blob
    whatsapp.ts         Passerelle OpenWA
    ai.ts               Google Gemini
    db/
      index.ts          Connexion (Neon ou node-postgres)
      schema.ts         Schéma Drizzle — 16 tables
scripts/
  migrate.ts            Application des migrations
  seed.ts               Amorçage (admin, formules, réglages)
src/
  lib/api.ts            Client API typé
  lib/upload.ts         Téléversement navigateur
  admin/                Studio d'administration
  pages/                Pages publiques
drizzle/                Migrations SQL générées
vercel.json             Configuration de déploiement
```

---

<div align="center">

**VOXMORY** — Votre histoire. Votre chanson.

</div>

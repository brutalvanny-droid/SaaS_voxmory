#!/usr/bin/env python3
"""
Fabrique les fichiers dérivés du logo.

Le composant React suffit à l'affichage, mais le navigateur réclame aussi
des fichiers sur disque : favicon, icône d'écran d'accueil, icônes de
l'application installée. Tous sont rendus ici à partir de la même
géométrie, pour qu'une modification du logo se répercute partout.
"""

import os
from PIL import Image, ImageDraw, ImageFont

ICI = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(os.path.dirname(ICI), 'public')

VERT = (163, 255, 18)
BLANC = (255, 255, 255)
FOND = (7, 8, 10)

# Même courbe que le composant React.
COURBE = [0.48, 1.0, 0.7, 1.0, 0.48]
LARGEUR_BARRE = 5.6
ECART = 2.8
HAUTEUR_MAX = 34.0


def barres(taille):
    """Coordonnées des barres dans un carré de `taille` pixels."""
    echelle = taille / 44.0
    total = len(COURBE) * LARGEUR_BARRE + (len(COURBE) - 1) * ECART
    depart = (44 - total) / 2.0
    out = []
    for i, f in enumerate(COURBE):
        h = HAUTEUR_MAX * f
        out.append(
            (
                (depart + i * (LARGEUR_BARRE + ECART)) * echelle,
                (22 - h / 2) * echelle,
                LARGEUR_BARRE * echelle,
                h * echelle,
            )
        )
    return out


def dessiner_marque(draw, taille, couleur=VERT):
    for x, y, w, h in barres(taille):
        draw.rounded_rectangle([x, y, x + w, y + h], radius=w / 2, fill=couleur)


def icone(taille, fond=FOND, marge_ratio=0.18):
    """Icône carrée : la marque centrée sur un fond sombre."""
    im = Image.new('RGBA', (taille, taille), fond + (255,))
    draw = ImageDraw.Draw(im)
    interieur = taille * (1 - 2 * marge_ratio)
    decalage = (taille - interieur) / 2

    sous = Image.new('RGBA', (taille, taille), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(sous)
    dessiner_marque(d2, taille)
    # Recadrage sur le contenu, puis centrage : la marque occupe toujours
    # la même proportion quelle que soit la taille demandée.
    boite = sous.getbbox()
    if boite:
        marque = sous.crop(boite)
        largeur = int(interieur)
        hauteur = max(1, int(largeur * (boite[3] - boite[1]) / (boite[2] - boite[0])))
        marque = marque.resize((largeur, hauteur), Image.LANCZOS)
        im.paste(
            marque,
            (int((taille - largeur) / 2), int((taille - hauteur) / 2)),
            marque,
        )
    return im


def icone_pleine(taille):
    """Icône sans marge, pour le masque Android (safe zone de 80 %)."""
    return icone(taille, marge_ratio=0.30)


def police_texte(taille_px, gras=800):
    chemin = os.path.expanduser('~/.fonts/inter/inter.ttf')
    if os.path.exists(chemin):
        try:
            f = ImageFont.truetype(chemin, taille_px)
            f.set_variation_by_axes([800] if gras >= 800 else [700])
            return f
        except Exception:
            pass
    return ImageFont.load_default()


def logo_complet(hauteur=160, fond=None):
    """Logo horizontal complet : marque + nom."""
    largeur = int(hauteur * (240 / 44.0))
    im = Image.new('RGBA', (largeur, hauteur), (fond or (0, 0, 0, 0)))
    draw = ImageDraw.Draw(im)

    sous = Image.new('RGBA', (hauteur, hauteur), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(sous)
    dessiner_marque(d2, hauteur)
    boite = sous.getbbox()
    if boite:
        cote = int(hauteur * 0.78)
        marque = sous.crop(boite).resize((cote, cote), Image.LANCZOS)
        im.paste(marque, (0, (hauteur - cote) // 2), marque)

    police = police_texte(int(hauteur * 0.60))
    x = int(hauteur * 1.30)
    y = hauteur // 2

    # « VOX » blanc, « MORY » vert : même découpe que le composant React.
    draw.text((x, y), 'VOX', font=police, fill=BLANC, anchor='lm')
    largeur_vox = draw.textlength('VOX', font=police)
    draw.text((x + largeur_vox, y), 'MORY', font=police, fill=VERT, anchor='lm')

    return im.crop(im.getbbox()) if fond is None else im


def ecrire(im, nom):
    chemin = os.path.join(PUBLIC, nom)
    im.save(chemin)
    taille = os.path.getsize(chemin)
    print(f'  {nom:26} {im.size[0]}×{im.size[1]:<5} {taille / 1024:6.1f} Ko')


print('  Fichiers du logo')
print('  ' + '─' * 52)

# Favicon multi-tailles
ecrire(icone(32), 'favicon-32x32.png')
ecrire(icone(16), 'favicon-16x16.png')
im = icone(64)
im.save(os.path.join(PUBLIC, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
print(f'  {"favicon.ico":26} multi       {os.path.getsize(os.path.join(PUBLIC, "favicon.ico")) / 1024:6.1f} Ko')

# Écran d'accueil iOS
ecrire(icone(180, marge_ratio=0.14), 'apple-touch-icon.png')

# Application installée (PWA)
ecrire(icone(192, marge_ratio=0.16), 'icon-192.png')
ecrire(icone(512, marge_ratio=0.16), 'icon-512.png')
ecrire(icone_pleine(192), 'icon-maskable-192.png')
ecrire(icone_pleine(512), 'icon-maskable-512.png')

# Logo autonome
ecrire(logo_complet(160), 'logo.png')
ecrire(logo_complet(160, fond=FOND), 'logo-dark.png')
ecrire(logo_complet(480), 'logo-large.png')
logo_complet(160).save(os.path.join(PUBLIC, 'logo-transparent.png'))

print('  ' + '─' * 52)
print('  terminé')

#!/usr/bin/env python3
"""
Fabrique la vignette de partage.

Quelqu'un envoie votre lien sur WhatsApp : avant même le titre, c'est cette
image qui apparaît. Elle décide si le destinataire clique. Une vignette
absente ou générique donne l'impression d'un lien douteux.

Format imposé : 1200 × 630 pixels. En dessous, la vignette est rognée sur
Facebook et LinkedIn.

Le texte est volontairement court et placé à gauche, sur la partie sombre
du plan, pour rester lisible une fois l'image réduite à la taille d'une
vignette dans une conversation.
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

ICI = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(os.path.dirname(ICI), 'public')

LARGEUR, HAUTEUR = 1200, 630
VERT = (163, 255, 18)
BLANC = (255, 255, 255)
GRIS = (162, 171, 181)


def police(taille, axe=800):
    chemin = os.path.expanduser('~/.fonts/inter/inter.ttf')
    if os.path.exists(chemin):
        try:
            f = ImageFont.truetype(chemin, taille)
            f.set_variation_by_axes([axe])
            return f
        except Exception:
            pass
    return ImageFont.load_default()


def construire():
    # ---- Fond : le plan du studio, assombri et recadré ----
    fond = Image.open(os.path.join(ICI, 'hero-source.jpg')).convert('RGB')
    fond = fond.resize(
        (LARGEUR, int(LARGEUR * fond.size[1] / fond.size[0])), Image.LANCZOS
    )
    # Recadrage centré sur la partie lumineuse, à droite.
    decalage = int((fond.size[0] - LARGEUR) * 0.30)
    if fond.size[1] < HAUTEUR:
        fond = fond.resize((LARGEUR, HAUTEUR), Image.LANCZOS)
    else:
        haut = (fond.size[1] - HAUTEUR) // 2
        fond = fond.crop((decalage, haut, decalage + LARGEUR, haut + HAUTEUR))

    fond = ImageEnhance.Brightness(fond).enhance(0.92)
    fond = fond.filter(ImageFilter.GaussianBlur(0.4))

    # ---- Voile : garantit le contraste du texte quoi qu'il arrive ----
    voile = Image.new('RGBA', (LARGEUR, HAUTEUR), (0, 0, 0, 0))
    dv = ImageDraw.Draw(voile)
    # Dégradé horizontal : noir à gauche, transparent à droite.
    for x in range(LARGEUR):
        t = min(1.0, x / (LARGEUR * 0.86))
        alpha = int(232 * (1 - t) ** 1.6)
        dv.line([(x, 0), (x, HAUTEUR)], fill=(6, 7, 9, alpha))
    # Et un assombrissement en pied, pour la signature.
    for y in range(int(HAUTEUR * 0.72), HAUTEUR):
        alpha = int(120 * (y - HAUTEUR * 0.72) / (HAUTEUR * 0.28))
        dv.line([(0, y), (LARGEUR, y)], fill=(6, 7, 9, alpha))

    image = Image.alpha_composite(fond.convert('RGBA'), voile)
    d = ImageDraw.Draw(image)

    # ---- Logo ----
    logo = Image.open(os.path.join(PUBLIC, 'logo.png')).convert('RGBA')
    hauteur_logo = 62
    logo = logo.resize(
        (int(logo.size[0] * hauteur_logo / logo.size[1]), hauteur_logo), Image.LANCZOS
    )
    image.paste(logo, (86, 74), logo)

    # ---- Titre ----
    p_titre = police(78, 900)
    p_sous = police(31, 500)

    y = 208
    d.text((86, y), 'Votre histoire.', font=p_titre, fill=BLANC)
    d.text((86, y + 88), 'Votre chanson.', font=p_titre, fill=VERT)

    # ---- Sous-titre ----
    y = 424
    d.text(
        (86, y),
        'Chansons personnalisées écrites et enregistrées',
        font=p_sous,
        fill=GRIS,
    )
    d.text((86, y + 44), 'pour vos mariages, anniversaires et hommages.', font=p_sous, fill=GRIS)

    # ---- Signature ----
    d.text((86, HAUTEUR - 62), 'voxmory.com', font=police(27, 700), fill=VERT)

    # ---- Liseré d'accent ----
    d.rounded_rectangle([86, 190, 86 + 64, 194], radius=2, fill=VERT)

    return image.convert('RGB')


def principale():
    chemin = os.path.join(PUBLIC, 'og-image.jpg')
    image = construire()
    image.save(chemin, quality=88, optimize=True, progressive=True)
    print(f'  og-image.jpg  {image.size[0]}×{image.size[1]}  {os.path.getsize(chemin) / 1024:.0f} Ko')

    # Vérification : le texte doit rester lisible, donc le fond doit être
    # sombre là où il se trouve.
    zone = image.crop((86, 190, 700, 520))
    px = list(zone.getdata())
    lum = sum(0.299 * r + 0.587 * g + 0.114 * b for r, g, b in px) / len(px)
    print(f'  luminance de la zone de texte : {lum:.0f} / 255')
    print(f'  -> {"contraste suffisant ✓" if lum < 80 else "trop clair, le texte risque de se perdre ✗"}')


if __name__ == '__main__':
    print('  Vignette de partage')
    print('  ' + '-' * 46)
    principale()

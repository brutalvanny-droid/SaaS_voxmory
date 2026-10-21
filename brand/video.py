#!/usr/bin/env python3
"""
Fabrique la vidéo d'accueil.

Un plan fixe ne suffit pas : en haut de page, l'œil attend un mouvement,
même imperceptible, pour comprendre qu'il y a quelque chose à regarder.
On anime donc le plan d'origine d'un lent travelling avant, et on ajoute
une vibration d'onde sonore en surimpression — le sujet du site, au fond,
c'est une voix.

Le mouvement est « aller-retour » : la dernière image rejoint exactement la
première, si bien que la lecture en boucle ne montre aucun saut.

Sortie volontairement en 720p et sans piste audio. Une vidéo d'arrière-plan
n'a pas besoin de plus, et chaque mégaoctet économisé se traduit par une
page qui s'affiche plus vite — surtout en Afrique, sur un téléphone.
"""

import math
import os
import subprocess
from PIL import Image, ImageEnhance, ImageFilter

ICI = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(os.path.dirname(ICI), 'public')
IMAGES = os.path.join(PUBLIC, 'images')
os.makedirs(IMAGES, exist_ok=True)

SOURCE = os.path.join(ICI, 'hero-source.jpg')
REPERTOIRE_IMAGES = os.path.join(ICI, '_images')

LARGEUR, HAUTEUR = 1280, 720
IMAGES_PAR_SECONDE = 24
DUREE = 12  # secondes
TOTAL = DUREE * IMAGES_PAR_SECONDE

VERT = (163, 255, 18)


def adouci(x):
    """Progression fluide : départ et arrivée sans à-coup."""
    return 0.5 - 0.5 * math.cos(math.pi * x)


def preparer():
    """Redimensionne la source une seule fois, pour aller vite ensuite."""
    src = Image.open(SOURCE).convert('RGB')
    # On part d'un peu plus grand que le cadre : le travelling va s'y
    # déplacer sans jamais laisser apparaître de bord.
    marge = 1.22
    nw = int(LARGEUR * marge)
    nh = int(HAUTEUR * marge)
    src = src.resize((nw, nh), Image.LANCZOS)
    return src


def image_de(base, i):
    """Compose l'image numéro `i`."""
    # Aller-retour : 0 → 1 → 0 sur la durée de la boucle.
    t = i / TOTAL
    aller_retour = adouci(adouci(1 - abs(2 * t - 1)))

    zoom = 1.0 + 0.10 * aller_retour
    largeur_z = int(LARGEUR / zoom)
    hauteur_z = int(HAUTEUR / zoom)

    # Léger déplacement : le cadre glisse un peu vers la lumière.
    bx, by = base.size
    decalage_x = int((bx - largeur_z) * (0.42 + 0.10 * aller_retour))
    decalage_y = int((by - hauteur_z) * 0.52)

    image = base.crop(
        (decalage_x, decalage_y, decalage_x + largeur_z, decalage_y + hauteur_z)
    ).resize((LARGEUR, HAUTEUR), Image.BICUBIC)

    # La source est très sombre : on remonte légèrement les détails pour
    # que le studio se devine sans éclaircir la zone du texte.
    image = ImageEnhance.Brightness(image).enhance(1.10)
    image = ImageEnhance.Contrast(image).enhance(1.06)

    return image, aller_retour


def onde(image, i, progression):
    """Onde sonore discrète, en bas du cadre."""
    calque = Image.new('RGBA', (LARGEUR, HAUTEUR), (0, 0, 0, 0))
    d = ImageDraw = __import__('PIL.ImageDraw', fromlist=['ImageDraw']).ImageDraw(calque)

    barres = 64
    largeur_barre = 7
    ecart = (LARGEUR - barres * largeur_barre) / (barres + 1)
    base_y = int(HAUTEUR * 0.90)

    for n in range(barres):
        # Plusieurs fréquences superposées : le mouvement paraît vivant
        # sans jamais se répéter de façon évidente.
        p = n / barres
        phase = i / IMAGES_PAR_SECONDE
        amplitude = (
            0.42 * abs(math.sin(p * 7.0 + phase * 1.5))
            + 0.30 * abs(math.sin(p * 13.0 - phase * 0.9))
            + 0.22 * abs(math.sin(p * 3.0 + phase * 0.6))
        )
        # Les extrémités s'estompent pour que l'onde se fonde dans le noir.
        fondu = math.sin(math.pi * p) ** 1.4
        h = int(amplitude * fondu * HAUTEUR * 0.13) + 2
        x = ecart + n * (largeur_barre + ecart)
        opacite = int(120 * fondu * (0.35 + 0.65 * progression))
        d.rounded_rectangle(
            [x, base_y - h, x + largeur_barre, base_y],
            radius=largeur_barre / 2,
            fill=VERT + (opacite,),
        )

    image = image.convert('RGBA')
    image.alpha_composite(calque)
    return image.convert('RGB')


def principales():
    base = preparer()
    os.makedirs(REPERTOIRE_IMAGES, exist_ok=True)

    for i in range(TOTAL):
        image, progression = image_de(base, i)
        image = onde(image, i, progression)
        image.save(os.path.join(REPERTOIRE_IMAGES, f'{i:04d}.png'))

        if i % 48 == 0:
            print(f'  image {i:>4} / {TOTAL}')

    # L'image d'affiche : première image de la boucle.
    poster = Image.open(os.path.join(REPERTOIRE_IMAGES, '0000.png'))
    poster.save(os.path.join(IMAGES, 'hero-poster.jpg'), quality=82, optimize=True)
    print(f'  affiche : images/hero-poster.jpg')


def encoder():
    entrees = os.path.join(REPERTOIRE_IMAGES, '%04d.png')

    mp4 = os.path.join(IMAGES, 'hero.mp4')
    subprocess.run(
        [
            'ffmpeg', '-y', '-loglevel', 'error',
            '-framerate', str(IMAGES_PAR_SECONDE),
            '-i', entrees,
            '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
            '-crf', '30', '-preset', 'slow',
            '-movflags', '+faststart',
            '-an', mp4,
        ],
        check=True,
    )

    webm = os.path.join(IMAGES, 'hero.webm')
    subprocess.run(
        [
            'ffmpeg', '-y', '-loglevel', 'error',
            '-framerate', str(IMAGES_PAR_SECONDE),
            '-i', entrees,
            '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p',
            '-crf', '38', '-b:v', '0', '-row-mt', '1',
            '-an', webm,
        ],
        check=True,
    )

    for nom in ('hero.mp4', 'hero.webm', 'hero-poster.jpg'):
        chemin = os.path.join(IMAGES, nom)
        ko = os.path.getsize(chemin) / 1024
        print(f'  {nom:18} {ko:7.0f} Ko')


if __name__ == '__main__':
    print('  Vidéo d\'accueil')
    print('  ' + '─' * 46)
    principales()
    encoder()
    # Nettoyage : les images intermédiaires ne servent plus.
    import shutil
    shutil.rmtree(REPERTOIRE_IMAGES, ignore_errors=True)
    print('  ' + '─' * 46)
    print('  terminé')

# -*- coding: utf-8 -*-
"""Génère icon-192.png et icon-512.png sans dépendance externe.
Relancer avec : python make_icons.py
"""
import math, struct, zlib

FOND   = (61, 107, 69)     # vert
POUSSE = (207, 227, 194)   # vert clair
TERRE  = (138, 106, 79)    # terre


def melange(bas, haut, alpha):
    return tuple(int(round(b + (h - b) * alpha)) for b, h in zip(bas, haut))


def couverture(test, x, y, echantillons=3):
    """Anticrénelage : moyenne de N x N sous-pixels."""
    total = 0
    pas = 1.0 / (echantillons + 1)
    for i in range(1, echantillons + 1):
        for j in range(1, echantillons + 1):
            if test(x + i * pas, y + j * pas):
                total += 1
    return total / float(echantillons * echantillons)


def carre_arrondi(taille, rayon):
    def test(x, y):
        dx = max(rayon - x, x - (taille - rayon), 0)
        dy = max(rayon - y, y - (taille - rayon), 0)
        return dx * dx + dy * dy <= rayon * rayon
    return test


def ellipse(cx, cy, a, b, angle_deg):
    ang = math.radians(angle_deg)
    ca, sa = math.cos(ang), math.sin(ang)

    def test(x, y):
        dx, dy = x - cx, y - cy
        u = dx * ca + dy * sa
        v = -dx * sa + dy * ca
        return (u / a) ** 2 + (v / b) ** 2 <= 1.0
    return test


def tige(cx, haut, bas, largeur):
    def test(x, y):
        if y < haut or y > bas:
            return False
        # légère courbure
        decalage = math.sin((y - haut) / max(bas - haut, 1) * math.pi) * largeur * 0.5
        return abs(x - cx - decalage) <= largeur / 2.0
    return test


def dessiner(taille):
    S = float(taille)
    fond_test = carre_arrondi(S, S * 0.22)
    monticule = ellipse(S * 0.5, S * 0.90, S * 0.32, S * 0.11, 0)
    tige_test = tige(S * 0.5, S * 0.34, S * 0.80, S * 0.055)
    feuille_g = ellipse(S * 0.34, S * 0.47, S * 0.19, S * 0.085, -28)
    feuille_d = ellipse(S * 0.66, S * 0.40, S * 0.19, S * 0.085, 28)

    lignes = []
    for y in range(taille):
        ligne = bytearray()
        ligne.append(0)  # filtre "none"
        for x in range(taille):
            a_fond = couverture(fond_test, x, y)
            if a_fond <= 0:
                ligne.extend((0, 0, 0, 0))
                continue

            couleur = FOND
            a_terre = couverture(monticule, x, y)
            if a_terre > 0:
                couleur = melange(couleur, TERRE, a_terre)

            a_plante = max(couverture(tige_test, x, y),
                           couverture(feuille_g, x, y),
                           couverture(feuille_d, x, y))
            if a_plante > 0:
                couleur = melange(couleur, POUSSE, a_plante)

            ligne.extend(couleur)
            ligne.append(int(round(255 * a_fond)))
        lignes.append(bytes(ligne))
    return b"".join(lignes)


def morceau(nom, donnees):
    return (struct.pack(">I", len(donnees)) + nom + donnees
            + struct.pack(">I", zlib.crc32(nom + donnees) & 0xffffffff))


def ecrire_png(chemin, taille):
    brut = dessiner(taille)
    entete = struct.pack(">IIBBBBB", taille, taille, 8, 6, 0, 0, 0)
    png = (b"\x89PNG\r\n\x1a\n"
           + morceau(b"IHDR", entete)
           + morceau(b"IDAT", zlib.compress(brut, 9))
           + morceau(b"IEND", b""))
    with open(chemin, "wb") as f:
        f.write(png)
    print("cree :", chemin, taille, "px")


if __name__ == "__main__":
    ecrire_png("icon-192.png", 192)
    ecrire_png("icon-512.png", 512)

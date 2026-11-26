"""Dessine les silhouettes de familles des espèces marines (assets/catalog/family-<famille>[@2x|@3x].png).

Même style plat que les illustrations d'eau douce (120 × 60 px en 1x, fond transparent) :
corps, ventre clair, nageoires colorées, œil blanc. Une espèce sans dessin propre affiche la silhouette de sa famille.
  python scripts/catalog/draw_family_silhouettes.py assets/catalog
"""
import math, os, sys

from PIL import Image, ImageDraw

W, H = 360, 180  # repère de dessin = taille @3x
SS = 4  # suréchantillonnage pour l'anticrénelage
EYE_WHITE, PUPIL = (255, 255, 255, 255), (30, 40, 45, 255)


def rgba(hex_color: str):
    h = hex_color.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def lens(cx, cy, length, height, nose=0.0, n=80):
    """Corps en fuseau : contour lisse, plus pointu à l'avant si nose > 0. Renvoie une liste de points."""
    pts = []
    for i in range(n + 1):
        t = math.pi * i / n
        x = cx - length / 2 * math.cos(t)
        y = cy - height / 2 * math.sin(t) ** (1 + nose)
        pts.append((x, y))
    for i in range(n + 1):
        t = math.pi * i / n
        x = cx + length / 2 * math.cos(t)
        y = cy + height / 2 * math.sin(t) ** (1 + nose * 0.6)
        pts.append((x, y))
    return pts


class Canvas:
    def __init__(self):
        self.img = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)

    def s(self, pts):
        return [(x * SS, y * SS) for x, y in pts]

    def poly(self, pts, color):
        self.d.polygon(self.s(pts), fill=rgba(color) if isinstance(color, str) else color)

    def ellipse(self, x0, y0, x1, y1, color):
        self.d.ellipse([x0 * SS, y0 * SS, x1 * SS, y1 * SS], fill=rgba(color) if isinstance(color, str) else color)

    def line(self, pts, color, width):
        self.d.line(self.s(pts), fill=rgba(color), width=int(width * SS), joint='curve')

    def eye(self, x, y, r=9):
        self.ellipse(x - r, y - r, x + r, y + r, EYE_WHITE)
        self.ellipse(x - r * 0.5, y - r * 0.5, x + r * 0.5, y + r * 0.5, PUPIL)

    def save(self, folder, name):
        for suffix, factor in (('', 1), ('@2x', 2), ('@3x', 3)):
            size = (W * factor // 3, H * factor // 3)
            self.img.resize(size, Image.LANCZOS).save(os.path.join(folder, f'family-{name}{suffix}.png'), optimize=True)


def belly(c, body_pts, color, cut):
    """Ventre clair : la partie du corps sous la ligne y = cut."""
    c.poly([(x, max(y, cut)) for x, y in body_pts], color)


def forked_tail(c, x, cy, size, color, depth=0.45):
    c.poly([(x, cy), (x + size, cy - size * 0.95), (x + size * (1 - depth), cy), (x + size, cy + size * 0.95)], color)


def bass(c):
    body = lens(170, 92, 270, 82, nose=0.3)
    c.poly([(120, 55), (140, 30), (160, 26), (175, 52)], '#5d7380')  # 1re dorsale épineuse
    c.poly([(190, 54), (205, 36), (235, 38), (240, 58)], '#5d7380')  # 2e dorsale
    c.poly([(210, 128), (225, 146), (245, 128)], '#5d7380')
    forked_tail(c, 296, 92, 52, '#6f8794')
    c.poly(body, '#93a8b3')
    belly(c, body, '#e4ebee', 104)
    c.line([(70, 90), (290, 90)], '#6f8794', 3)
    c.eye(70, 84)


def sparid(c):
    body = lens(170, 92, 240, 118, nose=0.1)
    c.poly([(105, 45), (125, 22), (230, 30), (255, 62)], '#b88a3b')  # longue dorsale
    c.poly([(200, 140), (215, 160), (250, 140)], '#b88a3b')
    forked_tail(c, 282, 92, 58, '#a9b6bd')
    c.poly(body, '#c7d0d5')
    belly(c, body, '#eef1f2', 110)
    c.line([(100, 72), (100, 115)], '#d9a640', 6)  # bande dorée (daurade)
    c.eye(80, 82, 10)


def mullet(c):
    body = lens(172, 94, 270, 74, nose=-0.15)
    c.poly([(135, 60), (150, 38), (165, 60)], '#5a6b78')
    c.poly([(215, 60), (228, 44), (245, 62)], '#5a6b78')
    forked_tail(c, 300, 94, 50, '#6c7d89')
    c.poly(body, '#8d9ea9')
    belly(c, body, '#e7ecef', 106)
    for y in (78, 88, 98):
        c.line([(80, y), (290, y)], '#6c7d89', 2)
    c.eye(66, 88, 8)


def mackerel(c):
    body = lens(170, 92, 280, 62, nose=0.4)
    c.poly([(130, 62), (145, 42), (160, 63)], '#2d5c6b')
    c.poly([(205, 63), (215, 50), (228, 64)], '#2d5c6b')
    for x in range(240, 290, 10):  # pinnules
        c.poly([(x, 66), (x + 5, 58), (x + 9, 67)], '#2d5c6b')
        c.poly([(x, 118), (x + 5, 126), (x + 9, 117)], '#2d5c6b')
    forked_tail(c, 302, 92, 50, '#2d5c6b', depth=0.7)
    c.poly(body, '#3f8298')
    belly(c, body, '#e5eef0', 98)
    for x in range(95, 280, 22):  # barres ondulées du dos
        c.line([(x, 66), (x + 8, 76), (x + 2, 88)], '#1f3f4a', 4)
    c.eye(62, 88, 8)


def gadid(c):
    body = lens(172, 94, 280, 70, nose=0.2)
    for x0, x1 in ((110, 150), (165, 215), (225, 270)):  # trois dorsales
        c.poly([(x0, 64), ((x0 + x1) / 2, 44), (x1, 64)], '#6b5e3d')
    c.poly([(310, 70), (330, 70), (330, 118), (310, 118), (300, 94)], '#7d6f49')  # queue droite
    c.poly(body, '#a08f5f')
    belly(c, body, '#ece4cc', 104)
    c.line([(55, 108), (52, 122)], '#6b5e3d', 3)  # barbillon
    c.line([(80, 92), (300, 92)], '#ece4cc', 3)
    c.eye(66, 86, 9)


def wrasse(c):
    body = lens(170, 92, 250, 100, nose=-0.1)
    c.poly([(95, 50), (110, 32), (240, 38), (260, 68)], '#c0612f')
    c.poly([(200, 136), (215, 152), (250, 132)], '#c0612f')
    c.ellipse(282, 62, 328, 122, '#c0612f')  # queue arrondie
    c.poly(body, '#4f8a5b')
    belly(c, body, '#e6c7a0', 112)
    for (x, y) in ((120, 80), (150, 95), (180, 78), (210, 98), (240, 84), (135, 110), (195, 112)):
        c.ellipse(x - 6, y - 6, x + 6, y + 6, '#d9864a')
    c.ellipse(42, 96, 60, 108, '#d98a6a')  # lèvres épaisses
    c.eye(72, 82, 9)


def flatfish(c):
    c.poly([(278, 90), (325, 62), (318, 90), (325, 118)], '#8b7353')  # petite queue
    c.ellipse(36, 34, 290, 146, '#8b7353')  # frange de nageoires
    c.ellipse(52, 46, 276, 134, '#b39770')  # corps plat vu de dessus
    for (x, y) in ((110, 70), (150, 105), (190, 66), (220, 112), (240, 82), (130, 118), (175, 88)):
        c.ellipse(x - 7, y - 7, x + 7, y + 7, '#8b7353')
    c.eye(84, 70, 7)
    c.eye(96, 92, 7)  # deux yeux du même côté


def eel(c):
    pts = []
    for i in range(0, 101):
        t = i / 100
        x = 30 + 300 * t
        y = 90 + 18 * math.sin(t * 2 * math.pi * 1.3)
        pts.append((x, y))
    for (x, y), t in zip(pts, [i / 100 for i in range(101)]):  # nageoire continue (contour sombre), qui s'affine vers la queue
        r = 17 - 9 * t
        c.ellipse(x - r, y - r, x + r, y + r, '#3a4a52')
    for (x, y), t in zip(pts, [i / 100 for i in range(101)]):
        r = 11 - 7 * t
        c.ellipse(x - r, y - r, x + r, y + r, '#5f7480')
    c.ellipse(20, 76, 58, 104, '#5f7480')
    c.eye(44, 86, 6)


def scorpionfish(c):
    body = lens(178, 96, 250, 96, nose=-0.2)
    for x in range(110, 230, 16):  # épines
        c.poly([(x, 62), (x + 8, 30), (x + 14, 62)], '#8a3a26')
    c.ellipse(290, 66, 334, 126, '#8a3a26')
    c.poly(body, '#b5583a')
    belly(c, body, '#e9c3a6', 114)
    for (x, y) in ((120, 84), (160, 100), (200, 82), (240, 98), (140, 110)):
        c.ellipse(x - 9, y - 7, x + 9, y + 7, '#7d3322')
    c.ellipse(40, 66, 120, 130, '#b5583a')  # grosse tête
    c.eye(84, 80, 11)


def cephalopod(c):
    c.ellipse(70, 52, 300, 128, '#b07a8c')  # jupe (nageoire de la seiche)
    c.ellipse(90, 60, 290, 120, '#d6a2b3')  # manteau
    for i, y in enumerate((70, 80, 90, 100, 110)):  # bras
        c.line([(92, y), (60, y + (i - 2) * 6), (30, y + (i - 2) * 12)], '#c58b9e', 6)
    for (x, y) in ((150, 80), (190, 96), (230, 78), (250, 102), (170, 108)):
        c.ellipse(x - 6, y - 6, x + 6, y + 6, '#b07a8c')
    c.eye(108, 82, 8)


def shark(c):
    body = lens(170, 96, 290, 58, nose=0.5)
    c.poly([(140, 70), (160, 40), (175, 70)], '#6e6a5f')
    c.poly([(215, 74), (230, 56), (240, 76)], '#6e6a5f')
    c.poly([(300, 92), (340, 62), (330, 100), (305, 104)], '#6e6a5f')  # queue asymétrique
    c.poly([(110, 112), (130, 132), (140, 112)], '#6e6a5f')
    c.poly(body, '#a29c8a')
    belly(c, body, '#ece8dc', 104)
    for (x, y) in ((90, 82), (120, 90), (150, 80), (185, 92), (215, 84), (245, 92), (270, 88)):
        c.ellipse(x - 4, y - 4, x + 4, y + 4, '#5a564d')
    c.eye(60, 88, 7)


def other(c):
    body = lens(172, 94, 260, 100, nose=0.0)
    c.poly([(110, 52), (130, 34), (230, 38), (250, 62)], '#5e4a36')
    c.poly([(205, 138), (220, 154), (248, 136)], '#5e4a36')
    c.ellipse(286, 64, 330, 124, '#5e4a36')
    c.poly(body, '#8a6d4f')
    belly(c, body, '#e8d9c2', 112)
    for (x, y) in ((120, 80), (165, 96), (205, 78), (240, 96), (140, 108)):
        c.ellipse(x - 8, y - 8, x + 8, y + 8, '#a5876a')
    c.eye(74, 82, 10)


FAMILIES = {'bass': bass, 'sparid': sparid, 'mullet': mullet, 'mackerel': mackerel, 'gadid': gadid, 'wrasse': wrasse,
            'flatfish': flatfish, 'eel': eel, 'scorpionfish': scorpionfish, 'cephalopod': cephalopod, 'shark': shark,
            'other': other}

if __name__ == '__main__':
    folder = sys.argv[1] if len(sys.argv) > 1 else 'assets/catalog'
    os.makedirs(folder, exist_ok=True)
    for name, draw in FAMILIES.items():
        canvas = Canvas()
        draw(canvas)
        canvas.save(folder, name)
    print(f'{len(FAMILIES)} silhouettes × 3 tailles dans {folder}')

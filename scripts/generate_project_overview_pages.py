from __future__ import annotations

from pathlib import Path
import fitz
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = Path(r"C:\Users\Sthyra\Downloads\Aadhya Serene Brochure Draft_compressed (1).pdf")
BROCHURE_BG_1 = ROOT / "public" / "BROCHUREIMAGE1.png"
BROCHURE_BG_2 = ROOT / "public" / "BROCHUREIMAGE2.avif"
BROCHURE_BG_2_CONVERTED = ROOT / ".tmp" / "BROCHUREIMAGE2.png"
BROCHURE_RENDER_DIR = ROOT / ".tmp" / "brochure-pages"
OUTPUT_DIR = ROOT / "public" / "project-overview-book" / "textures"

PAGE_WIDTH = 1536
PAGE_HEIGHT = 2052
PAGE_SIZE = (PAGE_WIDTH, PAGE_HEIGHT)

TAN = "#d7b06b"
TAN_DEEP = "#c79d57"
PURPLE = "#4a3777"
NAVY = "#24407a"
SOFT_WHITE = "#f6f1e7"
TEXT_DARK = "#433c32"
TEXT_MUTED = "#6f6758"


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        Path(r"C:\Windows\Fonts\segoeuib.ttf") if bold else Path(r"C:\Windows\Fonts\segoeui.ttf"),
        Path(r"C:\Windows\Fonts\arialbd.ttf") if bold else Path(r"C:\Windows\Fonts\arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def ensure_sources() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    BROCHURE_RENDER_DIR.mkdir(parents=True, exist_ok=True)

    if not BROCHURE_BG_2_CONVERTED.exists():
        raise FileNotFoundError(
            f"Missing converted rooftop image at {BROCHURE_BG_2_CONVERTED}. "
            "Convert public/BROCHUREIMAGE2.avif to .tmp/BROCHUREIMAGE2.png first."
        )

    if not (BROCHURE_RENDER_DIR / "page-01.png").exists():
        if not PDF_PATH.exists():
            raise FileNotFoundError(f"Missing brochure PDF at {PDF_PATH}")
        render_brochure_pages()


def render_brochure_pages() -> None:
    doc = fitz.open(PDF_PATH)
    try:
        for index in range(min(doc.page_count, 2)):
            page = doc.load_page(index)
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
            pix.save(BROCHURE_RENDER_DIR / f"page-{index + 1:02d}.png")
    finally:
        doc.close()


def fit_crop(image: Image.Image, crop_box: tuple[int, int, int, int]) -> Image.Image:
    return ImageOps.fit(
        image.crop(crop_box),
        PAGE_SIZE,
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )


def paste_cover(
    base: Image.Image,
    source: Image.Image,
    box: tuple[int, int, int, int],
    *,
    radius: int = 30,
) -> None:
    panel = ImageOps.fit(
        source,
        (box[2] - box[0], box[3] - box[1]),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )
    mask = Image.new("L", panel.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, panel.size[0], panel.size[1]),
        radius=radius,
        fill=255,
    )
    base.paste(panel, box[:2], mask)


def draw_wrapped_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.ImageFont,
    fill: str,
    box: tuple[int, int, int, int],
    *,
    line_spacing: int = 8,
) -> int:
    words = text.split()
    lines: list[str] = []
    current = ""
    max_width = box[2] - box[0]

    for word in words:
        candidate = word if not current else f"{current} {word}"
        if draw.textbbox((0, 0), candidate, font=font)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word

    if current:
        lines.append(current)

    y = box[1]
    for line in lines:
        draw.text((box[0], y), line, font=font, fill=fill)
        line_box = draw.textbbox((box[0], y), line, font=font)
        y += (line_box[3] - line_box[1]) + line_spacing

    return y


def generate_custom_rooftop_page(source: Image.Image) -> Image.Image:
    canvas = Image.new("RGB", PAGE_SIZE, NAVY)
    source_panel = ImageOps.fit(source, PAGE_SIZE, method=Image.Resampling.LANCZOS)
    source_panel = source_panel.filter(ImageFilter.GaussianBlur(0.3))
    canvas.paste(source_panel, (0, 0))

    overlay = Image.new("RGBA", PAGE_SIZE, (8, 16, 34, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle((0, 0, PAGE_WIDTH, PAGE_HEIGHT), fill=(11, 18, 30, 72))
    overlay_draw.rounded_rectangle((72, 72, PAGE_WIDTH - 72, 340), radius=42, fill=(13, 22, 39, 158))
    overlay_draw.rounded_rectangle((72, PAGE_HEIGHT - 278, PAGE_WIDTH - 72, PAGE_HEIGHT - 72), radius=42, fill=(245, 239, 225, 226))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")

    draw = ImageDraw.Draw(canvas)
    draw.text((106, 118), "Skyline Leisure", font=load_font(40, bold=True), fill=SOFT_WHITE)
    draw.text((106, 168), "An elevated view of calm, light, and layered greens.", font=load_font(22), fill=SOFT_WHITE)

    quote = (
        "Aadhya Serene brings together modern massing, shaded balconies, "
        "landscaped edges, and rooftop moments designed for a quieter daily rhythm."
    )
    draw_wrapped_text(
        draw,
        quote,
        load_font(22),
        SOFT_WHITE,
        (106, 230, PAGE_WIDTH - 106, 500),
        line_spacing=10,
    )

    text_y = PAGE_HEIGHT - 246
    draw.text((106, text_y), "Brochure Study", font=load_font(22, bold=True), fill=PURPLE)
    bullets = [
        "Thoughtfully designed 2 & 3 BHK residences",
        "Urban escape beside Manyata Tech Park",
        "Lifestyle-driven design with landscaped leisure",
    ]
    current_y = text_y + 54
    bullet_font = load_font(22)
    for bullet in bullets:
        draw.ellipse((106, current_y + 8, 118, current_y + 20), fill=PURPLE)
        draw.text((138, current_y), bullet, font=bullet_font, fill=TEXT_DARK)
        current_y += 48

    return canvas


def generate_floor_plan_page(source: Image.Image) -> Image.Image:
    canvas = Image.new("RGB", PAGE_SIZE, "#f4f1ea")
    draw = ImageDraw.Draw(canvas)

    draw.rectangle((0, 0, PAGE_WIDTH, 210), fill="#ece7dd")
    draw.text((96, 72), "Typical Floor Plans", font=load_font(50, bold=True), fill=TEXT_DARK)
    draw.text(
        (96, 138),
        "Intelligently planned 2 & 3 BHK homes. Every space optimized for modern living.",
        font=load_font(24),
        fill=TEXT_MUTED,
    )

    inset = (70, 260, PAGE_WIDTH - 70, 1456)
    floor_art = ImageOps.contain(source, (inset[2] - inset[0], inset[3] - inset[1]), method=Image.Resampling.LANCZOS)
    framed = Image.new("RGB", (inset[2] - inset[0], inset[3] - inset[1]), "#ffffff")
    framed_draw = ImageDraw.Draw(framed)
    framed_draw.rounded_rectangle((0, 0, framed.width - 1, framed.height - 1), radius=24, outline="#ddd6ca", width=4)
    floor_x = (framed.width - floor_art.width) // 2
    floor_y = (framed.height - floor_art.height) // 2
    framed.paste(floor_art, (floor_x, floor_y))
    paste_cover(canvas, framed, inset, radius=28)

    stats = [
        ("First Floor", "18 Units"),
        ("2nd & 3rd Floor", "36 Units"),
        ("4th to 6th Floor", "36 Units"),
    ]
    stat_top = 1548
    stat_width = 418
    gap = 28
    for index, (title, value) in enumerate(stats):
        x = 70 + index * (stat_width + gap)
        draw.rounded_rectangle((x, stat_top, x + stat_width, stat_top + 220), radius=28, fill="#ffffff", outline="#ddd6ca", width=3)
        draw.text((x + 34, stat_top + 38), title, font=load_font(24, bold=True), fill=PURPLE)
        draw.text((x + 34, stat_top + 106), value, font=load_font(38, bold=True), fill=TEXT_DARK)
        draw.text((x + 34, stat_top + 162), "Optimized circulation and balanced daylight planning", font=load_font(18), fill=TEXT_MUTED)

    return canvas


def generate_back_cover(source: Image.Image) -> Image.Image:
    base = ImageOps.fit(source, PAGE_SIZE, method=Image.Resampling.LANCZOS)
    base = base.filter(ImageFilter.GaussianBlur(8))

    overlay = Image.new("RGBA", PAGE_SIZE, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle((0, 0, PAGE_WIDTH, PAGE_HEIGHT), fill=(18, 22, 29, 142))
    overlay_draw.rounded_rectangle((110, 160, PAGE_WIDTH - 110, PAGE_HEIGHT - 170), radius=44, fill=(245, 239, 225, 228))
    overlay_draw.rectangle((0, 0, PAGE_WIDTH, 34), fill=PURPLE)
    overlay_draw.rectangle((0, PAGE_HEIGHT - 34, PAGE_WIDTH, PAGE_HEIGHT), fill=PURPLE)
    canvas = Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")

    draw = ImageDraw.Draw(canvas)
    draw.text((160, 250), "Aadhya Serene", font=load_font(70, bold=True), fill=PURPLE)
    draw.text((160, 338), "Luxury Living, Redefined", font=load_font(34), fill=TEXT_DARK)

    info_lines = [
        "Luxury 2 & 3 BHK Homes",
        "Just minutes from Manyata Tech Park, Hennur",
        "",
        "Abhigna Constructions",
        "27, 7th Cross Rd, LBS Nagar, Mahadevapura, Bengaluru, Karnataka 560037",
        "M: +91 96637 63333",
        "www.abhignaconstructions.com",
    ]

    y = 470
    for line in info_lines:
        if not line:
            y += 26
            continue
        y = draw_wrapped_text(
            draw,
            line,
            load_font(28, bold=("Abhigna" in line or line.startswith("M:"))),
            TEXT_DARK,
            (160, y, PAGE_WIDTH - 160, y + 120),
            line_spacing=8,
        ) + 12

    quote = (
        "Designed to inspire living that feels extraordinary. "
        "A quieter rhythm, crafted amenities, and a composed North Bengaluru address."
    )
    draw_wrapped_text(
        draw,
        quote,
        load_font(24),
        TEXT_MUTED,
        (160, 1080, PAGE_WIDTH - 160, 1300),
        line_spacing=12,
    )

    image_panel = ImageOps.fit(source, (PAGE_WIDTH - 320, 520), method=Image.Resampling.LANCZOS)
    paste_cover(canvas, image_panel, (160, 1320, PAGE_WIDTH - 160, 1840), radius=30)
    draw.rounded_rectangle((160, 1320, PAGE_WIDTH - 160, 1840), radius=30, outline=(255, 255, 255), width=4)

    return canvas


def save(image: Image.Image, name: str) -> None:
    image.save(OUTPUT_DIR / name, format="PNG", optimize=True)


def generate() -> None:
    ensure_sources()

    page1 = Image.open(BROCHURE_RENDER_DIR / "page-01.png").convert("RGB")
    page2 = Image.open(BROCHURE_RENDER_DIR / "page-02.png").convert("RGB")
    brochure1 = Image.open(BROCHURE_BG_1).convert("RGB")
    brochure2 = Image.open(BROCHURE_BG_2_CONVERTED).convert("RGB")

    save(fit_crop(page1, (2053, 1518, 3079, 3026)), "page-cover.png")
    save(fit_crop(page1, (3079, 1518, 4106, 3026)), "page-gate.png")
    save(fit_crop(page1, (0, 1518, 1026, 3026)), "page-manyata.png")
    save(fit_crop(page1, (1026, 1518, 2053, 3026)), "page-location.png")
    save(fit_crop(page1, (0, 0, 2053, 1518)), "page-urban.png")
    save(generate_custom_rooftop_page(brochure2), "page-rooftop.png")
    save(fit_crop(page1, (2053, 0, 3079, 1518)), "page-pool.png")
    save(fit_crop(page1, (3079, 0, 4106, 1518)), "page-play.png")
    save(generate_floor_plan_page(page2.crop((0, 0, 4106, 1910))), "page-floorplan.png")
    save(fit_crop(page2, (0, 1910, 2053, 3026)), "page-night.png")
    save(fit_crop(page2, (2053, 1910, 4106, 3026)), "page-specs.png")
    save(generate_back_cover(brochure1), "page-back-cover.png")


if __name__ == "__main__":
    generate()
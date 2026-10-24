#!/usr/bin/env python3
"""Draw the Aureline icon, splash, and favicon. No third-party artwork."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BG = (7, 20, 33, 255)
PLATE = (31, 111, 147, 255)
WELL = (8, 32, 51, 255)
CORAL = (255, 93, 74, 255)
GOLD = (255, 209, 92, 255)

# Diagonal line of coral, plus two gold discs, on a 4 by 4 plate.
CORAL_CELLS = {(0, 3), (1, 2), (2, 1), (3, 0)}
GOLD_CELLS = {(2, 3), (3, 3)}


def rounded_rect(draw: ImageDraw.ImageDraw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def draw_plate(base: Image.Image, box):
    draw = ImageDraw.Draw(base)
    left, top, right, bottom = box
    width = right - left
    height = bottom - top
    radius = int(width * 0.18)
    rounded_rect(draw, box, radius, PLATE)
    cols = 4
    rows = 4
    pad = width * 0.12
    cell = min((width - pad * 2) / cols, (height - pad * 2) / rows)
    grid_w = cell * cols
    grid_h = cell * rows
    origin_x = left + (width - grid_w) / 2
    origin_y = top + (height - grid_h) / 2
    hole = cell * 0.34
    for row in range(rows):
        for col in range(cols):
            cx = origin_x + cell * col + cell / 2
            cy = origin_y + cell * row + cell / 2
            if (col, row) in CORAL_CELLS:
                fill = CORAL
            elif (col, row) in GOLD_CELLS:
                fill = GOLD
            else:
                fill = WELL
            draw.ellipse((cx - hole, cy - hole, cx + hole, cy + hole), fill=fill)
            if fill != WELL:
                highlight = hole * 0.28
                draw.ellipse(
                    (
                        cx - hole * 0.45,
                        cy - hole * 0.55,
                        cx - hole * 0.45 + highlight,
                        cy - hole * 0.55 + highlight,
                    ),
                    fill=(255, 255, 255, 150),
                )


def icon_only() -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), BG)
    draw_plate(image, (120, 120, 904, 904))
    return image


def icon_foreground() -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_plate(image, (160, 160, 864, 864))
    return image


def icon_background() -> Image.Image:
    return Image.new("RGBA", (1024, 1024), BG)


def splash(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), BG)
    plate = int(size * 0.42)
    origin = (size - plate) // 2
    draw_plate(image, (origin, origin, origin + plate, origin + plate))
    return image


IOS_ICONS = [
    ("icon-20.png", 20),
    ("icon-20@2x.png", 40),
    ("icon-20@3x.png", 60),
    ("icon-29.png", 29),
    ("icon-29@2x.png", 58),
    ("icon-29@3x.png", 87),
    ("icon-40.png", 40),
    ("icon-40@2x.png", 80),
    ("icon-40@3x.png", 120),
    ("icon-60@2x.png", 120),
    ("icon-60@3x.png", 180),
    ("icon-76.png", 76),
    ("icon-76@2x.png", 152),
    ("icon-83.5@2x.png", 167),
    ("icon-1024.png", 1024),
    ("AppIcon-512@2x.png", 1024),
]

ANDROID_LAUNCHER = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}

ANDROID_FOREGROUND = {
    "mdpi": 108,
    "hdpi": 162,
    "xhdpi": 216,
    "xxhdpi": 324,
    "xxxhdpi": 432,
}


def save_resized(image: Image.Image, size: int, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.resize((size, size), Image.Resampling.LANCZOS).save(path)


def install_platform_icons(mark: Image.Image, foreground: Image.Image, splash_image: Image.Image) -> None:
    iconset = ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    for name, size in IOS_ICONS:
        save_resized(mark, size, iconset / name)
    contents = {
        "images": [
            {"size": "20x20", "idiom": "iphone", "filename": "icon-20@2x.png", "scale": "2x"},
            {"size": "20x20", "idiom": "iphone", "filename": "icon-20@3x.png", "scale": "3x"},
            {"size": "29x29", "idiom": "iphone", "filename": "icon-29@2x.png", "scale": "2x"},
            {"size": "29x29", "idiom": "iphone", "filename": "icon-29@3x.png", "scale": "3x"},
            {"size": "40x40", "idiom": "iphone", "filename": "icon-40@2x.png", "scale": "2x"},
            {"size": "40x40", "idiom": "iphone", "filename": "icon-40@3x.png", "scale": "3x"},
            {"size": "60x60", "idiom": "iphone", "filename": "icon-60@2x.png", "scale": "2x"},
            {"size": "60x60", "idiom": "iphone", "filename": "icon-60@3x.png", "scale": "3x"},
            {"size": "20x20", "idiom": "ipad", "filename": "icon-20.png", "scale": "1x"},
            {"size": "20x20", "idiom": "ipad", "filename": "icon-20@2x.png", "scale": "2x"},
            {"size": "29x29", "idiom": "ipad", "filename": "icon-29.png", "scale": "1x"},
            {"size": "29x29", "idiom": "ipad", "filename": "icon-29@2x.png", "scale": "2x"},
            {"size": "40x40", "idiom": "ipad", "filename": "icon-40.png", "scale": "1x"},
            {"size": "40x40", "idiom": "ipad", "filename": "icon-40@2x.png", "scale": "2x"},
            {"size": "76x76", "idiom": "ipad", "filename": "icon-76.png", "scale": "1x"},
            {"size": "76x76", "idiom": "ipad", "filename": "icon-76@2x.png", "scale": "2x"},
            {"size": "83.5x83.5", "idiom": "ipad", "filename": "icon-83.5@2x.png", "scale": "2x"},
            {"size": "1024x1024", "idiom": "ios-marketing", "filename": "icon-1024.png", "scale": "1x"},
            {
                "filename": "AppIcon-512@2x.png",
                "idiom": "universal",
                "platform": "ios",
                "size": "1024x1024",
            },
        ],
        "info": {"author": "xcode", "version": 1},
    }
    (iconset / "Contents.json").write_text(
        __import__("json").dumps(contents, indent=2) + "\n",
        encoding="utf-8",
    )

    res = ROOT / "android/app/src/main/res"
    for density, size in ANDROID_LAUNCHER.items():
        folder = res / f"mipmap-{density}"
        save_resized(mark, size, folder / "ic_launcher.png")
        save_resized(mark, size, folder / "ic_launcher_round.png")
    for density, size in ANDROID_FOREGROUND.items():
        save_resized(foreground, size, res / f"mipmap-{density}" / "ic_launcher_foreground.png")

    for splash_path in res.glob("**/splash.png"):
        with Image.open(splash_path) as current:
            width, height = current.size
        fitted = splash_image.resize((width, height), Image.Resampling.LANCZOS)
        fitted.save(splash_path)


def main() -> None:
    assets = ROOT / "assets"
    public = ROOT / "browser" / "public"
    assets.mkdir(parents=True, exist_ok=True)
    mark = icon_only()
    foreground = icon_foreground()
    splash_image = splash(2732)
    mark.save(assets / "icon-only.png")
    foreground.save(assets / "icon-foreground.png")
    icon_background().save(assets / "icon-background.png")
    splash_image.save(assets / "splash.png")
    splash_image.save(assets / "splash-dark.png")
    mark.resize((180, 180), Image.Resampling.LANCZOS).save(public / "apple-touch-icon.png")
    mark.resize((32, 32), Image.Resampling.LANCZOS).save(public / "favicon.png")
    if (ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset").exists():
        install_platform_icons(mark, foreground, splash_image)
    print("wrote brand assets")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Recaptures the homepage showcase screenshots from the built site.

These were taken by hand the first time, so nobody could reproduce them and
nothing recorded which page each one came from. They are the only pictures on
the homepage, so they need to be regenerable when a tool changes or the theme
moves under them.

    npm run build && python3 scripts/capture_showcase.py

Pass --light to write the light-theme set instead. Playwright drives this
rather than the site's own toolchain because it is a development tool, not part
of the build, and the project has no browser automation dependency otherwise.
"""
import asyncio
import socket
import subprocess
import sys
import urllib.request
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "static" / "img" / "showcase"
def _free_port() -> int:
    """A port nothing else holds.

    A fixed one is not safe here. Another project was already serving on the
    port this used, with a catch-all that answered 200 for every path, so the
    readiness check passed and eight screenshots were taken of somebody else's
    website before anyone looked at them.
    """
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


PORT = _free_port()
BASE = f"http://localhost:{PORT}/telemark"
THEME = "light" if "--light" in sys.argv else "dark"

# The width and height the homepage expects; every shot is written at this size.
SIZE = {"width": 1100, "height": 726}

# The third field is what to bring into frame. A tools page opens on its own
# heading with the tool a long way below the fold, so without this every
# calculator came out as the same shot of the page title.
#
# Class names are hashed per build, hence the prefix match rather than an exact
# one. WORKBENCH is the panel holding whichever tool the hash selected.
WORKBENCH = '[class*="shell_"]'

SHOTS = [
    ("slide-calculator", "/simulator#slide", WORKBENCH),
    ("cad-check", "/simulator#cad-check", WORKBENCH),
    ("arm-simulator", "/simulator#arm-sim", WORKBENCH),
    ("gear-ratio", "/simulator#gear-ratio", WORKBENCH),
    ("beam-deflection", "/simulator#deflection", WORKBENCH),
    ("weight-budget", "/simulator#weight", WORKBENCH),
    ("lesson", "/docs/unit-00/classes-and-objects", "article, main"),
    ("cad-practice", "/mechanical/module-00/design-cycle", "article, main"),
]


async def wait_for_server() -> None:
    for _ in range(60):
        await asyncio.sleep(0.5)
        try:
            with urllib.request.urlopen(f"{BASE}/", timeout=2) as response:
                if response.status != 200:
                    continue
                # 200 is not proof it is our site: whatever is listening may
                # answer for any path. Check who it is.
                body = response.read(4096).decode("utf-8", "replace")
                if "Telemark" not in body:
                    raise RuntimeError(
                        f"something other than Telemark is serving port {PORT}"
                    )
                return
        except RuntimeError:
            raise
        except Exception:
            continue
    raise RuntimeError(f"the built site never came up on port {PORT}")


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    server = subprocess.Popen(
        ["npx", "docusaurus", "serve", "--port", str(PORT), "--no-open"],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        await wait_for_server()
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context(
                viewport=SIZE,
                device_scale_factor=2,
                reduced_motion="reduce",
                # Both, because the stored choice and the system preference are
                # separate paths into the same switch and either one alone has
                # been seen to leave the attribute unset before hydration.
                color_scheme=THEME,
            )
            # Docusaurus reads the stored choice before first paint, so setting
            # it here avoids capturing a flash of the other theme.
            await context.add_init_script(
                f"try {{ localStorage.setItem('theme', '{THEME}') }} catch (e) {{}}"
            )
            page = await context.new_page()
            for name, url, focus in SHOTS:
                await page.goto(f"{BASE}{url}", wait_until="networkidle", timeout=60000)
                await page.wait_for_timeout(1200)
                title = await page.title()
                if "Telemark" not in title:
                    raise RuntimeError(
                        f"{name}: expected a Telemark page, got {title!r}"
                    )
                # Assert on the pixels, not the attribute. What matters is
                # that the shot came out dark, and the attribute can lag a
                # frame behind the stylesheet that actually paints the page.
                lightness = await page.evaluate(
                    "() => { const c = getComputedStyle(document.body)"
                    ".backgroundColor.match(/\\d+/g).map(Number);"
                    " return (c[0] + c[1] + c[2]) / 3 }"
                )
                too_light = THEME == "dark" and lightness > 90
                too_dark = THEME == "light" and lightness < 160
                if too_light or too_dark:
                    raise RuntimeError(
                        f"{name}: wanted the {THEME} theme, page painted a "
                        f"background at lightness {lightness:.0f}"
                    )
                # The ask button floats over the corner of every page and is
                # chrome, not content; it should not be in eight screenshots.
                await page.add_style_tag(
                    content='[class*="askLauncher"], [class*="askPanel"]'
                    " { display: none !important }"
                )
                moved = await page.evaluate(
                    "(sel) => { const el = document.querySelector(sel);"
                    " if (!el) return false;"
                    " const top = el.getBoundingClientRect().top + window.scrollY;"
                    " window.scrollTo(0, Math.max(0, top - 16)); return true }",
                    focus,
                )
                if not moved:
                    raise RuntimeError(
                        f"{name}: nothing matched {focus!r}, so the shot would "
                        "have been of the page header instead of the tool"
                    )
                await page.wait_for_timeout(600)
                await page.screenshot(
                    path=str(OUT / f"{name}.jpg"), type="jpeg", quality=82
                )
                print(f"  {name}  {url}")
            await context.close()
            await browser.close()
    finally:
        server.terminate()
    print(f"Wrote {len(SHOTS)} {THEME}-theme screenshots to static/img/showcase")


asyncio.run(main())

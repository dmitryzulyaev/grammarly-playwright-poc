// @ts-check
const { expect } = require('@playwright/test');
const zlib = require('node:zlib');
const { captureDesktopScreenshot } = require('../evidence/desktopEvidence');
const { getGrammarlyWindowCount } = require('../system/grammarlyAccessibility');

/**
 * Captures the real desktop repeatedly and passes once the Grammarly bubble is detected.
 * The check looks for a compact red/pink circular cluster in the page area.
 *
 * @param {object} options
 * @param {import('@playwright/test').Page} options.page
 * @param {import('@playwright/test').Locator} options.editor
 * @param {import('@playwright/test').TestInfo} options.testInfo
 */
async function expectGrammarlyBubbleVisible({ page, editor, testInfo }) {
  expect(await editor.boundingBox(), 'editor should have a bounding box before checking Grammarly bubble').not.toBeNull();

  for (let attempt = 0; attempt < 16; attempt += 1) {
    await page.waitForTimeout(attempt === 0 ? 0 : 250);

    const screenshot = await captureDesktopScreenshot();
    await testInfo.attach(`bubble-check-${attempt * 250}ms`, {
      body: screenshot,
      contentType: 'image/png'
    });

    if (findGrammarlyBubble(screenshot)) {
      expect(true, 'Grammarly bubble should be visible near the editor').toBe(true);
      return;
    }
  }

  expect(false, 'Grammarly bubble should be visible near the editor').toBe(true);
}

/**
 * Passes once the Grammarly suggestions popup is open.
 * Checks via AX (window count > 1) and attaches a desktop screenshot as evidence.
 *
 * @param {object} options
 * @param {import('@playwright/test').Page} options.page
 * @param {import('@playwright/test').TestInfo} options.testInfo
 */
async function expectGrammarlySuggestionsVisible({ page, testInfo }) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.waitForTimeout(attempt === 0 ? 0 : 250);

    const screenshot = await captureDesktopScreenshot();
    await testInfo.attach(`suggestions-check-${attempt * 250}ms`, {
      body: screenshot,
      contentType: 'image/png'
    });

    // Primary: AX reports more than one Grammarly window (popup is open).
    const windowCount = await getGrammarlyWindowCount();
    if (windowCount > 1) {
      expect(true, 'Grammarly suggestions popup should be visible').toBe(true);
      return;
    }

    // Fallback: bubble has disappeared, which strongly suggests the popup opened.
    if (!findGrammarlyBubble(screenshot)) {
      expect(true, 'Grammarly suggestions popup should be visible (bubble closed after click)').toBe(true);
      return;
    }
  }

  expect(false, 'Grammarly suggestions popup should be visible after clicking the bubble').toBe(true);
}

/**
 * Passes once the Grammarly bubble is absent from the desktop screenshot.
 * Use for negative scenarios where no bubble is expected (e.g. clean text).
 *
 * When `editor` is provided the check is restricted to the region just right
 * of the editor using dark-border detection (more reliable, avoids false
 * positives from red elements elsewhere on screen such as macOS menu bar icons).
 *
 * @param {object} options
 * @param {import('@playwright/test').Page} options.page
 * @param {import('@playwright/test').TestInfo} options.testInfo
 * @param {import('@playwright/test').Locator} [options.editor]
 */
async function expectGrammarlyBubbleAbsent({ page, testInfo, editor }) {
  const { execFileSync } = require('node:child_process');

  async function getSearchRegion(screenshot) {
    if (!editor) return null;
    const editorBox = await editor.boundingBox();
    if (!editorBox) return null;

    const info = await page.evaluate(() => {
      const chromeLeft = (window.outerWidth - window.innerWidth) / 2;
      const chromeTop = window.outerHeight - window.innerHeight - chromeLeft;
      return { screenX: window.screenX, screenY: window.screenY, chromeLeft, chromeTop };
    });

    const imgW = screenshot.readUInt32BE(16);
    let logicalScreenWidth;
    try {
      const out = execFileSync('/usr/bin/osascript', [
        '-e', 'tell application "Finder"\nset b to bounds of window of desktop\nreturn (item 3 of b)\nend tell'
      ], { encoding: 'utf8', timeout: 3000 });
      logicalScreenWidth = parseInt(out.trim(), 10) || Math.round(imgW / 2);
    } catch {
      logicalScreenWidth = Math.round(imgW / 2);
    }
    const screenDpr = imgW / logicalScreenWidth;

    const editorRightPhys = Math.round((info.screenX + info.chromeLeft + editorBox.x + editorBox.width) * screenDpr);
    const editorTopPhys = Math.round((info.screenY + info.chromeTop + editorBox.y) * screenDpr);
    const editorBottomPhys = Math.round(editorTopPhys + editorBox.height * screenDpr);

    return {
      left: editorRightPhys + 5,
      right: editorRightPhys + 300,
      top: Math.max(0, editorTopPhys - 80),
      bottom: editorBottomPhys + 150
    };
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.waitForTimeout(attempt === 0 ? 0 : 500);

    const screenshot = await captureDesktopScreenshot();
    await testInfo.attach(`bubble-absent-check-${attempt * 500}ms`, {
      body: screenshot,
      contentType: 'image/png'
    });

    let bubbleFound;
    if (editor) {
      const region = await getSearchRegion(screenshot);
      bubbleFound = region ? Boolean(findGrammarlyBubbleByBorder(screenshot, region)) : Boolean(findGrammarlyBubble(screenshot));
    } else {
      bubbleFound = Boolean(findGrammarlyBubble(screenshot));
    }

    if (!bubbleFound) {
      expect(true, 'Grammarly bubble should not appear for correct text').toBe(true);
      return;
    }
  }

  expect(false, 'Grammarly bubble should not appear for correct text').toBe(true);
}

/**
 * @param {object} options
 * @param {import('@playwright/test').Page} options.page
 * @param {import('@playwright/test').TestInfo} options.testInfo
 */
async function expectGrammarlyBubbleClosed({ page, testInfo }) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.waitForTimeout(attempt === 0 ? 0 : 250);

    const screenshot = await captureDesktopScreenshot();
    await testInfo.attach(`bubble-closed-check-${attempt * 250}ms`, {
      body: screenshot,
      contentType: 'image/png'
    });

    if (!findGrammarlyBubble(screenshot)) {
      expect(true, 'Grammarly bubble should close after user opens suggestions').toBe(true);
      return;
    }
  }

  expect(false, 'Grammarly bubble should close after user opens suggestions').toBe(true);
}

/**
 * @param {Buffer} png
 * @param {{ left: number, top: number, right: number, bottom: number } | null} [region]
 *   Optional bounding box in physical screenshot pixels. When provided, only
 *   red clusters whose centre falls inside this region are considered.
 * @param {{ x: number, y: number } | null} [nearPoint]
 *   Optional preferred location in physical screenshot pixels. When provided,
 *   all valid candidates are collected and the one closest to this point is
 *   returned (avoids false positives from other on-screen red elements).
 */
function findGrammarlyBubble(png, region = null, nearPoint = null) {
  const image = decodePng(png);
  const redMask = buildRedMask(image);
  const visited = new Uint8Array(image.width * image.height);

  const candidates = [];

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = y * image.width + x;

      if (!redMask[index] || visited[index]) {
        continue;
      }

      const component = collectComponent(redMask, visited, image.width, image.height, x, y);
      if (isLikelyGrammarlyBubble(component, image, region)) {
        if (!nearPoint) {
          return {
            centerX: Math.round((component.minX + component.maxX) / 2),
            centerY: Math.round((component.minY + component.maxY) / 2),
            imageWidth: image.width,
            imageHeight: image.height
          };
        }
        candidates.push(component);
      }
    }
  }

  if (candidates.length === 0) return null;

  // Return the candidate whose centre is closest to the expected bubble location.
  let best = candidates[0];
  let bestDist = Infinity;
  for (const c of candidates) {
    const cx = (c.minX + c.maxX) / 2;
    const cy = (c.minY + c.maxY) / 2;
    const dist = Math.hypot(cx - nearPoint.x, cy - nearPoint.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }

  return {
    centerX: Math.round((best.minX + best.maxX) / 2),
    centerY: Math.round((best.minY + best.maxY) / 2),
    imageWidth: image.width,
    imageHeight: image.height
  };
}

/**
 * @param {Buffer} png
 */
function hasGrammarlyBubble(png) {
  return Boolean(findGrammarlyBubble(png));
}

/**
 * Locates the Grammarly bubble by its dark circular border in a restricted
 * search region.  More reliable than red-pixel detection because the bubble
 * is a white circle with a dark outline, not a red blob.
 *
 * @param {Buffer} png
 * @param {{ left: number, top: number, right: number, bottom: number }} searchRegion
 *   Physical pixel rectangle to scan (from getBubbleSearchRegion).
 */
function findGrammarlyBubbleByBorder(png, searchRegion) {
  const image = decodePng(png);
  const { left, top, right, bottom } = searchRegion;

  // Dark mask limited to the search region only.
  const mask = new Uint8Array(image.width * image.height);
  const clampedRight = Math.min(right, image.width);
  const clampedBottom = Math.min(bottom, image.height);

  for (let y = Math.max(0, top); y < clampedBottom; y += 1) {
    for (let x = Math.max(0, left); x < clampedRight; x += 1) {
      const pixelIndex = (y * image.width + x) * 4;
      const r = image.pixels[pixelIndex];
      const g = image.pixels[pixelIndex + 1];
      const b = image.pixels[pixelIndex + 2];
      if (r < 120 && g < 120 && b < 120) {
        mask[y * image.width + x] = 1;
      }
    }
  }

  const visited = new Uint8Array(image.width * image.height);

  for (let y = Math.max(0, top); y < clampedBottom; y += 1) {
    for (let x = Math.max(0, left); x < clampedRight; x += 1) {
      const index = y * image.width + x;
      if (!mask[index] || visited[index]) continue;

      const component = collectComponent(mask, visited, image.width, image.height, x, y);
      if (isLikelyBubbleBorder(component, image)) {
        return {
          centerX: Math.round((component.minX + component.maxX) / 2),
          centerY: Math.round((component.minY + component.maxY) / 2),
          imageWidth: image.width,
          imageHeight: image.height
        };
      }
    }
  }

  return null;
}

/**
 * Returns true when the component looks like the dark circular border of the
 * Grammarly suggestion-count badge (a small white-filled circle).
 *
 * @param {{ minX: number, maxX: number, minY: number, maxY: number, pixels: number, width: number, height: number }} component
 * @param {{ width: number, height: number, pixels: Buffer }} image
 */
function isLikelyBubbleBorder(component, image) {
  const { minX, maxX, minY, maxY, pixels, width, height } = component;

  // Physical size: Grammarly badge is ~30–100px in diameter at any DPR.
  if (width < 25 || width > 120 || height < 25 || height > 120) return false;

  // Roughly circular (not the textarea's rectangular border).
  const aspectRatio = width / height;
  if (aspectRatio < 0.55 || aspectRatio > 1.8) return false;

  // Ring, not solid: border pixels are a small fraction of the bounding box.
  const fillRatio = pixels / (width * height);
  if (fillRatio < 0.08 || fillRatio > 0.50) return false;

  // The interior of the ring should be predominantly white (the badge fill).
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const innerRadius = Math.min(width, height) / 2 - 4;

  let brightCount = 0;
  let totalCount = 0;

  for (let y = Math.round(cy - innerRadius); y <= Math.round(cy + innerRadius); y += 1) {
    for (let x = Math.round(cx - innerRadius); x <= Math.round(cx + innerRadius); x += 1) {
      if (x < 0 || x >= image.width || y < 0 || y >= image.height) continue;
      if (Math.hypot(x - cx, y - cy) > innerRadius) continue;
      totalCount += 1;
      const idx = (y * image.width + x) * 4;
      if (image.pixels[idx] > 220 && image.pixels[idx + 1] > 220 && image.pixels[idx + 2] > 220) {
        brightCount += 1;
      }
    }
  }

  return totalCount > 0 && brightCount / totalCount > 0.4;
}

/**
 * Locates the green "Accept" button in the Grammarly suggestions popup by
 * scanning the desktop screenshot for a filled teal-green rectangle.
 *
 * @param {Buffer} png
 */
function findAcceptButton(png) {
  const image = decodePng(png);
  const greenMask = buildGreenMask(image);
  const visited = new Uint8Array(image.width * image.height);

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = y * image.width + x;
      if (!greenMask[index] || visited[index]) {
        continue;
      }

      const component = collectComponent(greenMask, visited, image.width, image.height, x, y);
      if (isLikelyAcceptButton(component, image)) {
        return {
          centerX: Math.round((component.minX + component.maxX) / 2),
          centerY: Math.round((component.minY + component.maxY) / 2),
          imageWidth: image.width,
          imageHeight: image.height
        };
      }
    }
  }

  return null;
}

/**
 * @param {{ width: number, height: number, pixels: Buffer }} image
 */
function buildGreenMask(image) {
  const mask = new Uint8Array(image.width * image.height);

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const pixelIndex = (y * image.width + x) * 4;
      const red = image.pixels[pixelIndex];
      const green = image.pixels[pixelIndex + 1];
      const blue = image.pixels[pixelIndex + 2];

      // Grammarly's Accept button is a filled dark teal-green rectangle.
      // R very low, G dominant, B medium.
      if (green > 90 && red < 60 && blue < 140 && green > blue && green > red * 2) {
        mask[y * image.width + x] = 1;
      }
    }
  }

  return mask;
}

/**
 * @param {{ minX: number, maxX: number, minY: number, maxY: number, pixels: number, width: number, height: number }} component
 * @param {{ width: number, height: number }} image
 */
function isLikelyAcceptButton(component, image) {
  const aspectRatio = component.width / component.height;
  // Accept button is a filled horizontal rounded rectangle.
  // Sizes vary by display DPI; at 2x Retina roughly 100–280px wide, 40–90px tall.
  const isButtonSized = component.width >= 40 && component.width <= 320
    && component.height >= 18 && component.height <= 100;
  const isHorizontal = aspectRatio >= 1.5 && aspectRatio <= 8;
  // Most of the bounding box should be filled (solid button, not just an outline).
  const isFilled = component.pixels >= component.width * component.height * 0.45;
  const isInContentArea = component.minX > image.width * 0.05
    && component.maxX < image.width * 0.97
    && component.minY > image.height * 0.05
    && component.maxY < image.height * 0.95;

  return isButtonSized && isHorizontal && isFilled && isInContentArea;
}

/**
 * @param {{ width: number, height: number, pixels: Buffer }} image
 */
function buildRedMask(image) {
  const mask = new Uint8Array(image.width * image.height);

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const pixelIndex = (y * image.width + x) * 4;
      const red = image.pixels[pixelIndex];
      const green = image.pixels[pixelIndex + 1];
      const blue = image.pixels[pixelIndex + 2];

      if (red > 180 && green < 125 && blue < 155) {
        mask[y * image.width + x] = 1;
      }
    }
  }

  return mask;
}

/**
 * @param {Uint8Array} mask
 * @param {Uint8Array} visited
 * @param {number} width
 * @param {number} height
 * @param {number} startX
 * @param {number} startY
 */
function collectComponent(mask, visited, width, height, startX, startY) {
  const stack = [[startX, startY]];
  let minX = startX;
  let maxX = startX;
  let minY = startY;
  let maxY = startY;
  let pixels = 0;

  visited[startY * width + startX] = 1;

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    pixels += 1;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    for (const [nextX, nextY] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
        continue;
      }

      const nextIndex = nextY * width + nextX;
      if (!mask[nextIndex] || visited[nextIndex]) {
        continue;
      }

      visited[nextIndex] = 1;
      stack.push([nextX, nextY]);
    }
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    pixels,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

/**
 * @param {{ minX: number, maxX: number, minY: number, maxY: number, pixels: number, width: number, height: number }} component
 * @param {{ width: number, height: number }} image
 * @param {{ left: number, top: number, right: number, bottom: number } | null} [region]
 */
function isLikelyGrammarlyBubble(component, image, region = null) {
  const aspectRatio = component.width / component.height;
  const centerX = (component.minX + component.maxX) / 2;
  const centerY = (component.minY + component.maxY) / 2;

  // When a browser viewport region is given, restrict the search to that area
  // (with a small margin to allow the bubble that sits just outside the textarea).
  if (region) {
    const margin = image.width * 0.05;
    if (
      centerX < region.left - margin || centerX > region.right + margin ||
      centerY < region.top || centerY > region.bottom
    ) {
      return false;
    }
  }

  const isCompact = component.width >= 8 && component.width <= 120 && component.height >= 8 && component.height <= 120;
  const isRoundish = aspectRatio >= 0.45 && aspectRatio <= 2.2;
  const hasEnoughRed = component.pixels >= 20;
  const isInPageArea = component.minY > image.height * 0.05 && component.maxY < image.height * 0.95;
  const isNotBrowserCloseButton = component.minX > image.width * 0.05;

  return isCompact && isRoundish && hasEnoughRed && isInPageArea && isNotBrowserCloseButton;
}

/**
 * Minimal PNG decoder for 8-bit RGB/RGBA screenshots generated by macOS screencapture.
 *
 * @param {Buffer} png
 */
function decodePng(png) {
  const signature = png.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error('Unsupported PNG signature');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    offset += 4;
    const type = png.subarray(offset, offset + 4).toString('ascii');
    offset += 4;
    const data = png.subarray(offset, offset + length);
    offset += length + 4;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      if (bitDepth !== 8 || ![2, 6].includes(colorType)) {
        throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}`);
      }
    }

    if (type === 'IDAT') {
      idatChunks.push(data);
    }
  }

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4);
  let inputOffset = 0;
  let previous = Buffer.alloc(stride);

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const current = Buffer.from(inflated.subarray(inputOffset, inputOffset + stride));
    inputOffset += stride;

    unfilterScanline(current, previous, bytesPerPixel, filter);

    for (let x = 0; x < width; x += 1) {
      const source = x * bytesPerPixel;
      const target = (y * width + x) * 4;
      pixels[target] = current[source];
      pixels[target + 1] = current[source + 1];
      pixels[target + 2] = current[source + 2];
      pixels[target + 3] = bytesPerPixel === 4 ? current[source + 3] : 255;
    }

    previous = current;
  }

  return { width, height, pixels };
}

/**
 * @param {Buffer} current
 * @param {Buffer} previous
 * @param {number} bytesPerPixel
 * @param {number} filter
 */
function unfilterScanline(current, previous, bytesPerPixel, filter) {
  for (let index = 0; index < current.length; index += 1) {
    const left = index >= bytesPerPixel ? current[index - bytesPerPixel] : 0;
    const up = previous[index] ?? 0;
    const upLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;

    if (filter === 1) {
      current[index] = (current[index] + left) & 255;
    } else if (filter === 2) {
      current[index] = (current[index] + up) & 255;
    } else if (filter === 3) {
      current[index] = (current[index] + Math.floor((left + up) / 2)) & 255;
    } else if (filter === 4) {
      current[index] = (current[index] + paeth(left, up, upLeft)) & 255;
    } else if (filter !== 0) {
      throw new Error(`Unsupported PNG filter: ${filter}`);
    }
  }
}

function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const distanceLeft = Math.abs(estimate - left);
  const distanceUp = Math.abs(estimate - up);
  const distanceUpLeft = Math.abs(estimate - upLeft);

  if (distanceLeft <= distanceUp && distanceLeft <= distanceUpLeft) {
    return left;
  }

  if (distanceUp <= distanceUpLeft) {
    return up;
  }

  return upLeft;
}

module.exports = {
  expectGrammarlyBubbleAbsent,
  expectGrammarlyBubbleClosed,
  expectGrammarlyBubbleVisible,
  expectGrammarlySuggestionsVisible,
  findAcceptButton,
  findGrammarlyBubble,
  findGrammarlyBubbleByBorder,
  hasGrammarlyBubble
};

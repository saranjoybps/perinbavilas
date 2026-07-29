'use server';

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { FamilyRecord } from '@/types/family';
import { formatDate, formatName } from '@/lib/formatters';
import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import { ImageLayoutResult, createImageLayout } from '@/services/family/image-layout-engine';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const CONTENT_MARGIN_X = 38;
const CONTENT_WIDTH = PAGE_WIDTH - CONTENT_MARGIN_X * 2;
const PAGE_BORDER_MARGIN = 20;
const PAGE_BORDER_THICKNESS = 2.2;
const PAGE_INNER_BORDER_GAP = 6;
const PAGE_INNER_BORDER_THICKNESS = 1.05;
const PAGE_BORDER_RADIUS = 8;
const PAGE_CONTENT_TOP_PADDING = 40;
const PAGE_CONTENT_BOTTOM_PADDING = 44;
const PAGE_TOP_FRAME_Y = PAGE_HEIGHT - PAGE_BORDER_MARGIN;
const PAGE_BOTTOM_FRAME_Y = PAGE_BORDER_MARGIN;
const PAGE_BLOCK_TOP = PAGE_TOP_FRAME_Y - PAGE_CONTENT_TOP_PADDING;
const PAGE_BLOCK_BOTTOM = PAGE_BOTTOM_FRAME_Y + PAGE_CONTENT_BOTTOM_PADDING;
const PAGE_BLOCK_MAX_HEIGHT = PAGE_BLOCK_TOP - PAGE_BLOCK_BOTTOM;
const PAGE_NUMBER_Y = 34;
const PAGE_NUMBER_FONT_SIZE = 8.5;

const GREEN = rgb(0.18, 0.44, 0.15);
const GREEN_LIGHT = rgb(0.84, 0.9, 0.82);
const GREEN_PALE = rgb(0.94, 0.97, 0.93);
const TEXT = rgb(0.12, 0.12, 0.12);
const WHITE = rgb(1, 1, 1);

const BLOCK_GAP = 24;
const BLOCK_PADDING_BOTTOM = 14;
const BLOCK_PADDING_X = 14;
const CODE_BADGE_HEIGHT = 20;
const CODE_BADGE_MIN_WIDTH = 76;
const CODE_BADGE_PADDING_X = 18;
const CODE_BADGE_TEXT_SIZE = 12.5;
const PHOTO_W = 126;
const PHOTO_H = 88;
const PHOTO_TOP_OFFSET = 32;
const DETAIL_ICON_SIZE = 10;
const DETAIL_FONT = 7.35;
const DETAIL_LABEL_WIDTH = 52;
const DETAIL_ROW_GAP = 5.2;
const DETAIL_LINE_HEIGHT = 11.2;
const DETAIL_VALUE_X_GAP = 8;
const DETAIL_RULE_TOP_OFFSET = 1.0;
const TABLE_HEADER_HEIGHT = 15;
const TABLE_ROW_HEIGHT = 14;
const TABLE_GAP = 8;
const TABLE_BOTTOM_PADDING = 10;
// Slight baseline increase to make photos a bit larger by default
const PHOTO_AREA_WIDTH = 215; // was 205
const PHOTO_SLOT_MAX_HEIGHT = 132; // was 126
const PHOTO_GAP = 6;
const PHOTO_DETAIL_GAP = 18;


type AssetName =
  | 'icon-name'
  | 'icon-dob'
  | 'icon-spouse'
  | 'icon-dod'
  | 'icon-address'
  | 'icon-phone'
  | 'icon-telephone';

type DetailRow = {
  icon: AssetName;
  label: string;
  value: string;
};

const ASSET_PATHS: Record<AssetName, string> = {
  'icon-name': 'pdf-assets/icon-name.svg',
  'icon-dob': 'pdf-assets/icon-dob.svg',
  'icon-spouse': 'pdf-assets/icon-spouse.svg',
  'icon-dod': 'pdf-assets/icon-dod.svg',
  'icon-address': 'pdf-assets/icon-address.svg',
  'icon-phone': 'pdf-assets/icon-phone.svg',
  'icon-telephone': 'pdf-assets/icon-telephone.svg',
};

function safeText(value: string | null | undefined, fallback = '') {
  return value?.trim() || fallback;
}

function measureTextWidth(font: PDFFont, text: string, size: number) {
  return font.widthOfTextAtSize(text, size);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [''];

  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (measureTextWidth(font, candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }

  lines.push(current);
  return lines;
}

function drawDottedRule(page: PDFPage, x1: number, y: number, x2: number, color = GREEN_LIGHT, dotWidth = 0.3, gap = 3.0) {
  let currentX = x1;
  while (currentX < x2) {
    const endX = Math.min(currentX + dotWidth, x2);
    page.drawRectangle({
      x: currentX,
      y,
      width: endX - currentX,
      height: dotWidth,
      color,
    });
    currentX += dotWidth + gap;
  }
}

async function loadAssetImage(pdfDoc: PDFDocument, assetName: AssetName): Promise<PDFImage> {
  const fullPath = path.join(process.cwd(), 'public', ASSET_PATHS[assetName]);
  const buffer = await fs.readFile(fullPath);
  const pngBuffer = await sharp(buffer).png().toBuffer();
  return pdfDoc.embedPng(pngBuffer);
}


function createAssetLoader(pdfDoc: PDFDocument) {
  const cache = new Map<AssetName, Promise<PDFImage>>();

  return async (assetName: AssetName) => {
    if (!cache.has(assetName)) {
      cache.set(assetName, loadAssetImage(pdfDoc, assetName));
    }
    return cache.get(assetName)!;
  };
}

function formatPhoneNumbers(record: FamilyRecord) {
  const numbers = record.cell_numbers?.map((value) => value.trim()).filter(Boolean) ?? [];
  return numbers.length ? numbers.join(', ') : '';
}

function buildDetailRows(record: FamilyRecord): DetailRow[] {
  const rows: DetailRow[] = [
    { icon: 'icon-name', label: 'NAME', value: formatName(safeText(record.name)).toUpperCase() },
    { icon: 'icon-dob', label: 'DOB', value: formatDate(record.dob).toUpperCase() },
    ...(safeText(record.dod) ? [{ icon: 'icon-dod' as const, label: 'DOD', value: formatDate(record.dod).toUpperCase() }] : []),
    { icon: 'icon-spouse', label: 'WO/HO', value: formatName(safeText(record.spouse?.name)).toUpperCase() },
    { icon: 'icon-dob', label: 'DOB', value: formatDate(record.spouse?.dob).toUpperCase() },
    ...(safeText(record.spouse?.dod) ? [{ icon: 'icon-dod' as const, label: 'DOD', value: formatDate(record.spouse?.dod).toUpperCase() }] : []),
    { icon: 'icon-phone', label: 'PHONE', value: formatPhoneNumbers(record).toUpperCase() },
    { icon: 'icon-telephone', label: 'TELEPHONE', value: safeText(record.landline).toUpperCase() },
    { icon: 'icon-address', label: 'ADDRESS', value: safeText(record.address).toUpperCase() },
  ];

  return rows.filter((row) => row.value.length > 0);
}

function computeDetailLayout(record: FamilyRecord, font: PDFFont, valueWidth: number) {
  const rows = buildDetailRows(record);

  let height = 0;
  const rowHeights = rows.map((row) => {
    const wrapped = wrapText(row.value, font, DETAIL_FONT, valueWidth);
    const rowHeight = Math.max(DETAIL_LINE_HEIGHT, wrapped.length * 8.2) + DETAIL_ROW_GAP;
    height += rowHeight;
    return rowHeight;
  });

  return { rows, rowHeights, height };
}

function getChildrenTableColumnWidths(tableWidth: number) {
  return [70, tableWidth - 70 - 94, 94];
}

function computeChildrenTableLayout(record: FamilyRecord, font: PDFFont, width: number) {
  if (!record.children?.length) {
    return { height: 0, rowHeights: [] as number[] };
  }

  const colWidths = getChildrenTableColumnWidths(width);
  const rowHeights = record.children.map((child) => {
    const values = [safeText(child.code).toUpperCase(), formatName(safeText(child.name)).toUpperCase(), formatDate(child.dob).toUpperCase()];
    const maxLines = values.reduce((count, value, index) => (
      Math.max(count, wrapText(value, font, 8, colWidths[index] - 10).length)
    ), 1);

    return Math.max(TABLE_ROW_HEIGHT, maxLines * 8.6 + 5);
  });

  return {
    height: TABLE_HEADER_HEIGHT + rowHeights.reduce((sum, rowHeight) => sum + rowHeight, 0) + TABLE_BOTTOM_PADDING,
    rowHeights,
  };
}

interface PhotoLayoutInfo {
  photos: Array<{ id: string; image: PDFImage; width: number; height: number }>;
  imageLayout: ImageLayoutResult | null;
  layoutWidth: number;
  layoutHeight: number;
  isHorizontal: boolean;
}

type PhotoInfo = PhotoLayoutInfo['photos'][number];

async function calculatePhotoLayout(
  pdfDoc: PDFDocument,
  record: FamilyRecord,
  areaWidth?: number,
  areaHeight?: number,
): Promise<PhotoLayoutInfo> {
  const photos = getPhotos(record);
  
  if (photos.length === 0) {
    return { photos: [], imageLayout: null, layoutWidth: 0, layoutHeight: 0, isHorizontal: false };
  }

  const embeddedPhotos: PhotoInfo[] = [];

  for (const [index, photoPath] of photos.slice(0, 2).entries()) {
    try {
      const { image, width: origW, height: origH } = await embedPhoto(pdfDoc, photoPath);
      
      embeddedPhotos.push({ id: `${index}`, image, width: origW, height: origH });
    } catch {
      // Skip photos that can't be loaded
    }
  }

  if (embeddedPhotos.length === 0) {
    return { photos: [], imageLayout: null, layoutWidth: 0, layoutHeight: 0, isHorizontal: false };
  }

  const containerW = areaWidth ?? PHOTO_AREA_WIDTH;
  const containerH = areaHeight ?? PHOTO_SLOT_MAX_HEIGHT;
  const imageLayout = createImageLayout(
    embeddedPhotos.map((photo) => ({ id: photo.id, width: photo.width, height: photo.height })),
    containerW,
    containerH,
    PHOTO_GAP,
  );

  return {
    photos: embeddedPhotos,
    imageLayout,
    layoutWidth: imageLayout.containerWidth,
    layoutHeight: imageLayout.containerHeight,
    isHorizontal: imageLayout.selectedLayout === 'side-by-side' || imageLayout.selectedLayout === 'portrait-beside-landscape',
  };
}

type FamilyBlockLayout = {
  blockHeight: number;
  photoLayout: PhotoLayoutInfo;
  detailX: number;
  detailRight: number;
  topSectionHeight: number;
  tableHeight: number;
  tableRowHeights: number[];
};

function measureFamilyBlockLayout(record: FamilyRecord, font: PDFFont, photoLayout: PhotoLayoutInfo): FamilyBlockLayout {
  const innerWidth = CONTENT_WIDTH - BLOCK_PADDING_X * 2;
  const photoX = CONTENT_MARGIN_X + BLOCK_PADDING_X;
  const contentRight = photoX + innerWidth;
  const hasPhotos = photoLayout.photos.length > 0;
  const detailX = hasPhotos ? photoX + PHOTO_AREA_WIDTH + PHOTO_DETAIL_GAP : photoX;
  const detailRight = contentRight;
  const valueX = detailX + DETAIL_ICON_SIZE + 6 + DETAIL_LABEL_WIDTH + DETAIL_VALUE_X_GAP;
  const detailValueWidth = Math.max(80, detailRight - valueX - 8);
  const detailLayout = computeDetailLayout(record, font, detailValueWidth);
  const topSectionHeight = Math.max(photoLayout.layoutHeight, detailLayout.height);
  const tableLayout = computeChildrenTableLayout(record, font, innerWidth);
  const tableHeight = tableLayout.height;
  const blockHeight = PHOTO_TOP_OFFSET + topSectionHeight + (tableHeight ? TABLE_GAP + tableHeight : 0) + BLOCK_PADDING_BOTTOM;

  return {
    blockHeight: Math.ceil(blockHeight),
    photoLayout,
    detailX,
    detailRight,
    topSectionHeight,
    tableHeight,
    tableRowHeights: tableLayout.rowHeights,
  };
}

async function measureFamilyBlock(
  pdfDoc: PDFDocument,
  record: FamilyRecord,
  font: PDFFont,
  photoAreaOverrides?: { areaWidth?: number; areaHeight?: number },
) {
  const photoLayout = await calculatePhotoLayout(
    pdfDoc,
    record,
    photoAreaOverrides?.areaWidth,
    photoAreaOverrides?.areaHeight,
  );
  return measureFamilyBlockLayout(record, font, photoLayout);
}

function roundedRectPath(x: number, y: number, width: number, height: number, radius: number) {
  const right = x + width;
  const top = y + height;
  const r = Math.min(radius, width / 2, height / 2);
  const c = r * 0.5522847498;

  return [
    `M ${x + r} ${y}`,
    `L ${right - r} ${y}`,
    `C ${right - r + c} ${y} ${right} ${y + r - c} ${right} ${y + r}`,
    `L ${right} ${top - r}`,
    `C ${right} ${top - r + c} ${right - r + c} ${top} ${right - r} ${top}`,
    `L ${x + r} ${top}`,
    `C ${x + r - c} ${top} ${x} ${top - r + c} ${x} ${top - r}`,
    `L ${x} ${y + r}`,
    `C ${x} ${y + r - c} ${x + r - c} ${y} ${x + r} ${y}`,
    'Z',
  ].join(' ');
}

function drawRoundedBorder(page: PDFPage, x: number, y: number, width: number, height: number, radius: number, borderWidth: number) {
  page.drawSvgPath(roundedRectPath(0, 0, width, height, radius), {
    x,
    y: y + height,
    borderColor: GREEN,
    borderWidth,
  });
}

async function drawDecorativeBorder(page: PDFPage) {
  const { width, height } = page.getSize();
  const innerBorderMargin = PAGE_BORDER_MARGIN + PAGE_INNER_BORDER_GAP;
  const outerLeft = PAGE_BORDER_MARGIN;
  const outerRight = width - PAGE_BORDER_MARGIN;
  const outerBottom = PAGE_BORDER_MARGIN;
  const outerTop = height - PAGE_BORDER_MARGIN;
  const innerLeft = innerBorderMargin;
  const innerRight = width - innerBorderMargin;
  const innerBottom = innerBorderMargin;
  const innerTop = height - innerBorderMargin;

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: WHITE,
  });

  drawRoundedBorder(page, outerLeft, outerBottom, outerRight - outerLeft, outerTop - outerBottom, PAGE_BORDER_RADIUS, PAGE_BORDER_THICKNESS);
  drawRoundedBorder(page, innerLeft, innerBottom, innerRight - innerLeft, innerTop - innerBottom, PAGE_BORDER_RADIUS - 2, PAGE_INNER_BORDER_THICKNESS);
}

async function loadPhotoBuffer(photoPath: string): Promise<Buffer> {
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    const response = await fetch(photoPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote image: ${photoPath} (${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  const fullPath = path.join(process.cwd(), 'public', photoPath);
  return fs.readFile(fullPath);
}

async function embedPhoto(pdfDoc: PDFDocument, photoPath: string) {
  const buffer = await loadPhotoBuffer(photoPath);
  const metadata = await sharp(buffer).metadata();

  const isJpeg = metadata.format === 'jpeg';
  const image = isJpeg
    ? await pdfDoc.embedJpg(buffer)
    : await pdfDoc.embedPng(buffer);
  return { image, width: metadata.width ?? PHOTO_W, height: metadata.height ?? PHOTO_H };
}

function getPhotos(record: FamilyRecord): string[] {
  const seen = new Set<string>();
  return (record.photos ?? []).filter((photo): photo is string => {
    if (typeof photo !== 'string' || photo.length === 0 || seen.has(photo)) {
      return false;
    }
    seen.add(photo);
    return true;
  });
}

async function drawCodeBadge(
  page: PDFPage,
  x: number,
  yTop: number,
  code: string,
  boldFont: PDFFont,
) {
  const text = `CODE ${code}`;
  const textSize = CODE_BADGE_TEXT_SIZE;
  const badgeWidth = Math.max(
    CODE_BADGE_MIN_WIDTH,
    measureTextWidth(boldFont, text, textSize) + CODE_BADGE_PADDING_X * 2,
  );
  const badgeHeight = CODE_BADGE_HEIGHT;
  const radius = badgeHeight / 2;
  const y = yTop - badgeHeight;
  const centerY = y + radius;

  page.drawRectangle({
    x: x + radius,
    y,
    width: badgeWidth - badgeHeight,
    height: badgeHeight,
    color: GREEN,
  });

  page.drawEllipse({
    x: x + radius,
    y: centerY,
    xScale: radius,
    yScale: radius,
    color: GREEN,
  });

  page.drawEllipse({
    x: x + badgeWidth - radius,
    y: centerY,
    xScale: radius,
    yScale: radius,
    color: GREEN,
  });

  page.drawText(text, {
    x: x + (badgeWidth - measureTextWidth(boldFont, text, textSize)) / 2,
    y: y + (badgeHeight - textSize) / 2 + 1.25,
    size: textSize,
    font: boldFont,
    color: WHITE,
  });
}

async function drawPhotoPanel(
  page: PDFPage,
  photoLayout: PhotoLayoutInfo,
  x: number,
  yTop: number,
): Promise<{ width: number; height: number }> {
  if (photoLayout.photos.length === 0 || !photoLayout.imageLayout) {
    return { width: 0, height: 0 };
  }

  const layoutBottomY = yTop - photoLayout.imageLayout.containerHeight;
  const photosById = new Map(photoLayout.photos.map((photo) => [photo.id, photo]));

  for (const placement of photoLayout.imageLayout.placements) {
    const photo = photosById.get(placement.imageId);
    if (!photo) {
      continue;
    }

    page.drawImage(photo.image, {
      x: x + placement.drawX,
      y: layoutBottomY + placement.drawY,
      width: placement.drawWidth,
      height: placement.drawHeight,
    });
  }

  return { width: photoLayout.layoutWidth, height: photoLayout.layoutHeight };
}

async function drawDetailRows(
  page: PDFPage,
  loadAsset: ReturnType<typeof createAssetLoader>,
  record: FamilyRecord,
  x: number,
  yTop: number,
  font: PDFFont,
  boldFont: PDFFont,
  rightX: number,
) {
  const innerRight = rightX;
  const valueX = x + DETAIL_ICON_SIZE + 6 + DETAIL_LABEL_WIDTH + DETAIL_VALUE_X_GAP;
  const valueWidth = Math.max(80, innerRight - valueX - 8);
  const { rows, rowHeights, height } = computeDetailLayout(record, font, valueWidth);
  const iconSize = 9.0;
  let currentTop = yTop;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowHeight = rowHeights[i];
    const rowBottom = currentTop - rowHeight;
    const wrapped = wrapText(row.value, font, DETAIL_FONT, valueWidth);

    const icon = await loadAsset(row.icon);
    page.drawImage(icon, {
      x,
      y: currentTop - 8.3,
      width: iconSize,
      height: iconSize,
    });

    page.drawText(row.label, {
      x: x + DETAIL_ICON_SIZE + 6,
      y: currentTop - 7.0,
      size: DETAIL_FONT,
      font: boldFont,
      color: GREEN,
    });

    page.drawText(':', {
      x: x + DETAIL_ICON_SIZE + 6 + DETAIL_LABEL_WIDTH - 6,
      y: currentTop - 7.0,
      size: DETAIL_FONT,
      font: boldFont,
      color: GREEN,
    });

    let lineY = currentTop - 7.0;
    for (const line of wrapped) {
      page.drawText(line, {
        x: valueX,
        y: lineY,
        size: DETAIL_FONT,
        font,
        color: TEXT,
      });
      lineY -= 8.1;
    }

    drawDottedRule(page, valueX, rowBottom + DETAIL_RULE_TOP_OFFSET, innerRight, GREEN_LIGHT, 0.5, 2.8);
    currentTop = rowBottom;
  }

  return { bottomY: currentTop, height };
}

function drawChildrenTable(
  page: PDFPage,
  record: FamilyRecord,
  x: number,
  yTop: number,
  width: number,
  font: PDFFont,
  boldFont: PDFFont,
  rowHeights: number[],
  startIndex = 0,
  rowCount = record.children?.length ?? 0,
) {
  if (!record.children?.length) {
    return yTop;
  }

  const tableWidth = width;
  const tableX = x;
  const colWidths = getChildrenTableColumnWidths(tableWidth);
  const headerLabels = ['CODE', 'NAME OF CHILDRENS', 'DOB'];
  const topY = yTop;

  page.drawRectangle({
    x: tableX,
    y: topY - TABLE_HEADER_HEIGHT,
    width: tableWidth,
    height: TABLE_HEADER_HEIGHT,
    color: GREEN,
  });

  let headerX = tableX;
  for (let i = 0; i < headerLabels.length; i += 1) {
    const label = headerLabels[i];
    const labelWidth = measureTextWidth(boldFont, label, 8.6);
    page.drawText(label, {
      x: headerX + (colWidths[i] - labelWidth) / 2,
      y: topY - 11.1,
      size: 8.6,
      font: boldFont,
      color: WHITE,
    });
    headerX += colWidths[i];
  }

  let currentTop = topY - TABLE_HEADER_HEIGHT;
  const endIndex = Math.min(record.children.length, startIndex + rowCount);
  for (let rowIndex = startIndex; rowIndex < endIndex; rowIndex += 1) {
    const child = record.children[rowIndex];
    const rowHeight = rowHeights[rowIndex] ?? TABLE_ROW_HEIGHT;
    const rowBottom = currentTop - rowHeight;

    page.drawRectangle({
      x: tableX,
      y: rowBottom,
      width: tableWidth,
      height: rowHeight,
      color: rowIndex % 2 === 0 ? WHITE : GREEN_PALE,
    });

    const values = [safeText(child.code).toUpperCase(), formatName(safeText(child.name)).toUpperCase(), formatDate(child.dob).toUpperCase()];
    const sizes = [8, 8, 8];
    let valueX = tableX;
    for (let colIndex = 0; colIndex < values.length; colIndex += 1) {
      const lines = wrapText(values[colIndex], font, sizes[colIndex], colWidths[colIndex] - 10);
      const totalTextHeight = lines.length * 8.6;
      let lineY = rowBottom + (rowHeight + totalTextHeight) / 2 - 6.4;

      for (const line of lines) {
        const textWidth = measureTextWidth(font, line, sizes[colIndex]);
        page.drawText(line, {
          x: valueX + (colWidths[colIndex] - textWidth) / 2,
          y: lineY,
          size: sizes[colIndex],
          font,
          color: TEXT,
        });
        lineY -= 8.6;
      }

      valueX += colWidths[colIndex];
    }

    currentTop = rowBottom;
  }

  return currentTop - TABLE_BOTTOM_PADDING;
}

function countRowsThatFit(rowHeights: number[], startIndex: number, availableHeight: number) {
  if (availableHeight <= 0) {
    return 0;
  }

  let used = 0;
  let count = 0;

  for (let i = startIndex; i < rowHeights.length; i += 1) {
    const next = rowHeights[i] ?? TABLE_ROW_HEIGHT;
    if (count > 0 && used + next > availableHeight) {
      break;
    }
    if (count === 0 && next > availableHeight) {
      return 1;
    }
    used += next;
    count += 1;
  }

  return count;
}

function sumRowHeights(rowHeights: number[], startIndex: number, rowCount: number) {
  return rowHeights.slice(startIndex, startIndex + rowCount).reduce((sum, height) => sum + height, 0);
}

async function drawFamilyBlock(
  page: PDFPage,
  record: FamilyRecord,
  startY: number,
  font: PDFFont,
  boldFont: PDFFont,
  loadAsset: ReturnType<typeof createAssetLoader>,
  layout: FamilyBlockLayout,
) {
  const innerWidth = CONTENT_WIDTH - BLOCK_PADDING_X * 2;
  const photoX = CONTENT_MARGIN_X + BLOCK_PADDING_X;
  
  const blockHeight = layout.blockHeight;
  const blockTop = startY;
  const blockBottom = blockTop - blockHeight;

  page.drawRectangle({
    x: CONTENT_MARGIN_X,
    y: blockBottom,
    width: CONTENT_WIDTH,
    height: blockHeight,
    borderColor: GREEN,
    borderWidth: 1,
    color: WHITE,
  });

  await drawCodeBadge(page, photoX, blockTop - 8, record.code, boldFont);
  
  await drawPhotoPanel(page, layout.photoLayout, photoX, blockTop - PHOTO_TOP_OFFSET);
  
  const detailTop = blockTop - PHOTO_TOP_OFFSET;
  const detailLayoutBottom = await drawDetailRows(page, loadAsset, record, layout.detailX, detailTop, font, boldFont, layout.detailRight);

  const topSectionBottom = Math.min(
    blockTop - PHOTO_TOP_OFFSET - layout.photoLayout.layoutHeight,
    detailLayoutBottom.bottomY
  );

  if (record.children?.length) {
    drawChildrenTable(page, record, photoX, topSectionBottom - TABLE_GAP, innerWidth, font, boldFont, layout.tableRowHeights);
  }

  return blockBottom;
}

async function drawOversizedFamilyBlock(
  pdfDoc: PDFDocument,
  page: PDFPage,
  record: FamilyRecord,
  startY: number,
  font: PDFFont,
  boldFont: PDFFont,
  loadAsset: ReturnType<typeof createAssetLoader>,
  layout: FamilyBlockLayout,
) {
  const innerWidth = CONTENT_WIDTH - BLOCK_PADDING_X * 2;
  const photoX = CONTENT_MARGIN_X + BLOCK_PADDING_X;
  let currentPage = page;
  let currentStartY = startY;
  let nextChildIndex = 0;
  let lastBlockBottom = startY;
  const childCount = record.children?.length ?? 0;

  const topSectionHeight = layout.topSectionHeight;
  const firstPageBaseHeight = PHOTO_TOP_OFFSET + topSectionHeight + BLOCK_PADDING_BOTTOM;
  const firstPageAvailable = currentStartY - PAGE_BLOCK_BOTTOM;

  if (firstPageAvailable < Math.min(firstPageBaseHeight, PAGE_BLOCK_MAX_HEIGHT)) {
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    await drawDecorativeBorder(currentPage);
    currentStartY = PAGE_BLOCK_TOP;
  }

  const tableChromeHeight = childCount ? TABLE_GAP + TABLE_HEADER_HEIGHT + TABLE_BOTTOM_PADDING : 0;
  const firstRowsAvailable = Math.max(0, currentStartY - PAGE_BLOCK_BOTTOM - firstPageBaseHeight - tableChromeHeight);
  const firstRows = childCount ? countRowsThatFit(layout.tableRowHeights, 0, firstRowsAvailable) : 0;
  const firstRowsHeight = sumRowHeights(layout.tableRowHeights, 0, firstRows);
  const firstSegmentHasTable = firstRows > 0;
  const firstSegmentHeight = firstPageBaseHeight + (
    firstSegmentHasTable ? TABLE_GAP + TABLE_HEADER_HEIGHT + firstRowsHeight + TABLE_BOTTOM_PADDING : 0
  );
  const firstBlockBottom = currentStartY - firstSegmentHeight;
  lastBlockBottom = firstBlockBottom;

  currentPage.drawRectangle({
    x: CONTENT_MARGIN_X,
    y: firstBlockBottom,
    width: CONTENT_WIDTH,
    height: firstSegmentHeight,
    borderColor: GREEN,
    borderWidth: 1,
    color: WHITE,
  });

  await drawCodeBadge(currentPage, photoX, currentStartY - 8, record.code, boldFont);
  await drawPhotoPanel(currentPage, layout.photoLayout, photoX, currentStartY - PHOTO_TOP_OFFSET);

  const detailTop = currentStartY - PHOTO_TOP_OFFSET;
  await drawDetailRows(currentPage, loadAsset, record, layout.detailX, detailTop, font, boldFont, layout.detailRight);

  if (firstSegmentHasTable) {
    drawChildrenTable(
      currentPage,
      record,
      photoX,
      currentStartY - PHOTO_TOP_OFFSET - topSectionHeight - TABLE_GAP,
      innerWidth,
      font,
      boldFont,
      layout.tableRowHeights,
      0,
      firstRows,
    );
  }

  nextChildIndex = firstRows;

  while (nextChildIndex < childCount) {
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    await drawDecorativeBorder(currentPage);
    currentStartY = PAGE_BLOCK_TOP;

    const rowsAvailable = PAGE_BLOCK_MAX_HEIGHT - PHOTO_TOP_OFFSET - TABLE_HEADER_HEIGHT - TABLE_BOTTOM_PADDING;
    const rowsOnPage = countRowsThatFit(layout.tableRowHeights, nextChildIndex, rowsAvailable);
    const rowsHeight = sumRowHeights(layout.tableRowHeights, nextChildIndex, rowsOnPage);
    const segmentHeight = PHOTO_TOP_OFFSET + TABLE_HEADER_HEIGHT + rowsHeight + TABLE_BOTTOM_PADDING;
    const blockBottom = currentStartY - segmentHeight;
    lastBlockBottom = blockBottom;

    currentPage.drawRectangle({
      x: CONTENT_MARGIN_X,
      y: blockBottom,
      width: CONTENT_WIDTH,
      height: segmentHeight,
      borderColor: GREEN,
      borderWidth: 1,
      color: WHITE,
    });

    await drawCodeBadge(currentPage, photoX, currentStartY - 8, record.code, boldFont);
    drawChildrenTable(
      currentPage,
      record,
      photoX,
      currentStartY - PHOTO_TOP_OFFSET,
      innerWidth,
      font,
      boldFont,
      layout.tableRowHeights,
      nextChildIndex,
      rowsOnPage,
    );

    nextChildIndex += rowsOnPage;
  }

  return { page: currentPage, cursorY: lastBlockBottom };
}

function drawPageNumbers(pdfDoc: PDFDocument, font: PDFFont) {
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  pages.forEach((page, index) => {
    const pageNumber = `${index + 1}/${totalPages}`;
    const pageNumberWidth = measureTextWidth(font, pageNumber, PAGE_NUMBER_FONT_SIZE);

    page.drawText(pageNumber, {
      x: (PAGE_WIDTH - pageNumberWidth) / 2,
      y: PAGE_NUMBER_Y,
      size: PAGE_NUMBER_FONT_SIZE,
      font,
      color: GREEN,
    });
  });
}

export async function generateFamilyDirectoryPDF(records: FamilyRecord[], title: string = 'Family Directory'): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(title);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const loadAsset = createAssetLoader(pdfDoc);

  // Two-pass layout: 1) measure all blocks, 2) paginate and compute leftover space,
  // 3) for pages with 1-2 cards apply a modest scale to photo area and re-measure.
  const measuredLayouts: FamilyBlockLayout[] = [];
  for (const record of records) {
    const layout = await measureFamilyBlock(pdfDoc, record, font);
    measuredLayouts.push(layout);
  }

  // Simulate pagination to group record indices into pages
  const pages: number[][] = [];
  let currentPage: number[] = [];
  let used = 0;
  for (let i = 0; i < records.length; i += 1) {
    const h = measuredLayouts[i].blockHeight;
    const gap = currentPage.length > 0 ? BLOCK_GAP : 0;
    if (used + gap + h > PAGE_BLOCK_MAX_HEIGHT) {
      if (currentPage.length > 0) pages.push(currentPage);
      currentPage = [i];
      used = h;
    } else {
      currentPage.push(i);
      used += gap + h;
    }
  }
  if (currentPage.length > 0) pages.push(currentPage);

  // Adjust layouts for pages with spare vertical space (1 or 2 cards)
  const baselinePhotoArea = PHOTO_AREA_WIDTH * PHOTO_SLOT_MAX_HEIGHT;
  for (const pageIndices of pages) {
    const n = pageIndices.length;
    if (n === 0) continue;
    const gapsTotal = Math.max(0, n - 1) * BLOCK_GAP;
    const sumHeights = pageIndices.reduce((s, idx) => s + measuredLayouts[idx].blockHeight, 0);
    const remainingSpace = PAGE_BLOCK_MAX_HEIGHT - (sumHeights + gapsTotal);

    if (remainingSpace <= 8) continue; // ignore tiny amounts

    if (n === 1 || n === 2) {
      // allocate a portion of remaining space to photo area growth
      const desiredExtra = remainingSpace * 0.6; // 60% goes to photos/top area
      const perCardExtra = desiredExtra / n;
      const scale = 1 + Math.min(0.2, perCardExtra / Math.max(1, baselinePhotoArea * 0.5));

      if (scale > 1.01) {
        // re-measure affected records with scaled photo area
        for (const idx of pageIndices) {
          const oldLayout = measuredLayouts[idx];
          const newAreaW = Math.round(PHOTO_AREA_WIDTH * scale);
          const newAreaH = Math.round(PHOTO_SLOT_MAX_HEIGHT * scale);
          const newLayout = await measureFamilyBlock(pdfDoc, records[idx], font, { areaWidth: newAreaW, areaHeight: newAreaH });
          // ensure we didn't overflow the page block max height; if so, keep old layout
          if (newLayout.blockHeight <= PAGE_BLOCK_MAX_HEIGHT) {
            measuredLayouts[idx] = newLayout;
          } else {
            measuredLayouts[idx] = oldLayout;
          }
        }
      }
    }
  }

  // Drawing pass using adjusted measuredLayouts
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  await drawDecorativeBorder(page);
  let cursorY = PAGE_BLOCK_TOP;

  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    const layout = measuredLayouts[i];
    const requiredHeight = layout.blockHeight;

    if (requiredHeight > PAGE_BLOCK_MAX_HEIGHT) {
      const result = await drawOversizedFamilyBlock(
        pdfDoc,
        page,
        record,
        cursorY,
        font,
        boldFont,
        loadAsset,
        layout,
      );
      page = result.page;
      cursorY = result.cursorY - BLOCK_GAP;
      continue;
    }

    if (cursorY - requiredHeight < PAGE_BLOCK_BOTTOM) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      await drawDecorativeBorder(page);
      cursorY = PAGE_BLOCK_TOP;
    }

    cursorY = await drawFamilyBlock(
      page,
      record,
      cursorY,
      font,
      boldFont,
      loadAsset,
      layout,
    );
    cursorY -= BLOCK_GAP;
  }

  drawPageNumbers(pdfDoc, font);

  return pdfDoc.save();
}

export async function exportSingleRecordPDF(record: FamilyRecord): Promise<Uint8Array> {
  return generateFamilyDirectoryPDF([record], `Family Record - ${formatName(record.name)}`);
}

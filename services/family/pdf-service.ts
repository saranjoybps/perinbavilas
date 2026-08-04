'use server';

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { FamilyRecord } from '@/types/family';
import { formatDate, formatName } from '@/lib/formatters';
import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
  appendBezierCurve,
  clip,
  closePath,
  endPath,
  lineTo,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
  rgb,
} from 'pdf-lib';
import { ImageLayoutResult, createImageLayout } from '@/services/family/image-layout-engine';
import { getSpouses, normalizePhotos } from '@/lib/family-utils';

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
const PAGE_NUMBER_FONT_SIZE = 11;

const GREEN = rgb(0.18, 0.44, 0.15);
const GREEN_LIGHT = rgb(0.84, 0.9, 0.82);
const GREEN_PALE = rgb(0.94, 0.97, 0.93);
const TEXT = rgb(0.12, 0.12, 0.12);
const WHITE = rgb(1, 1, 1);

const BLOCK_PADDING_BOTTOM = 14;
const BLOCK_PADDING_X = 14;
const CODE_BADGE_HEIGHT = 26;
const CODE_BADGE_MIN_WIDTH = 92;
const CODE_BADGE_PADDING_X = 10;
const CODE_BADGE_TEXT_SIZE = 16;
const PHOTO_W = 126;
const PHOTO_H = 88;
// Compact (non-single-digit) template: exactly 2 equal horizontal sections per page.
const COMPACT_SECTION_GAP = 12;
const COMPACT_SECTION_HEIGHT = Math.floor((PAGE_BLOCK_MAX_HEIGHT - COMPACT_SECTION_GAP) / 2);
const COMPACT_HEADER_GAP = 6;
const COMPACT_HEADER_HEIGHT = CODE_BADGE_HEIGHT + COMPACT_HEADER_GAP;
const COMPACT_MIN_ROW2_HEIGHT = 72;
const COMPACT_MIN_PHOTO_HEIGHT = 48;
const LARGE_FAMILY_CHILD_THRESHOLD = 6;
const DETAIL_ICON_SIZE = 10;
const DETAIL_FONT = 9.5;
const DETAIL_LABEL_WIDTH = 60;
const DETAIL_ROW_GAP = 7.5;
const DETAIL_LINE_HEIGHT = 11;
const DETAIL_VALUE_X_GAP = 10;
// Icon + label column + colon gap — fixed chrome; values use all width after this.
const DETAIL_CHROME_WIDTH = DETAIL_ICON_SIZE + 6 + DETAIL_LABEL_WIDTH + DETAIL_VALUE_X_GAP;

const TABLE_HEADER_HEIGHT = 19;
const TABLE_ROW_HEIGHT = 18;
const TABLE_GAP = 8;
const TABLE_BOTTOM_PADDING = 10;
const PHOTO_GAP = 6; // shared with single-digit template - keep unchanged
const PHOTO_DETAIL_GAP = 10;
// Rounded green photo frame (visual only — does not change layout sizing)
const PHOTO_FRAME_BORDER = 3.5;
const PHOTO_FRAME_PADDING = 2.5;
const PHOTO_FRAME_RADIUS = 10;
// Single-family (single-digit code) template: photos size dynamically by count
const SINGLE_DIGIT_SINGLE_PHOTO_HEIGHT = 240; // 1 photo: large centered portrait (220-260px)
const SINGLE_DIGIT_TWO_PHOTO_HEIGHT = 185; // 2 photos: side-by-side (170-200px each)
const SINGLE_DIGIT_PHOTO_DETAIL_GAP = 18; // 15-25px spacing between photos and details

const INTRO_IMAGE_PATH = 'index.PNG';
const INTRO_TITLE = 'INTRODUCTION';
const INTRO_TITLE_SIZE = 18;
const INTRO_FONT_SIZE = 10.5;
const INTRO_LINE_HEIGHT = 14;
const INTRO_PARAGRAPH_GAP = 7;
const INTRO_TITLE_GAP = 14;

const INTRO_TEXT = `Yesuvadiyan Nadar (b. 1845) and his family lived in Semmarikulam near Megnanapuram, Tuticorin District. His original name and his wife name were not known. It is presumed that he should have embraced Christianity and therefore left Semmarikulam and moved to Adayal in around 1875. During that period many people in and around the area have started settling in Adayal. The place name was called Adayal because it means 'adaithal' or settlement. A church was built in Adayal and the Christian people in Adayal started worshipping Jesus Christ.

He should has moved from semmarikulam after the birth of his eldest son. The eldest son name was Perumal Nadar, but after conversion his name was Perinbam Nadar. His sister and brother names were Christian names from the beginning.

Yesuvadiyan Nadar was born around 1845. He has got three children.
1. Perinbam Nadar (Perumal Nadar) 1872?-1956
2. Packiam Ammal (d)
3. Abraham Nadar (d)

Since, Perumal Nadar has become Christian, his name has changed from Perumal Nadar to Perinbam Nadar. The details of Perinbam Nadar family tree have only been incorporated in this book. However, the details of his brother and sister also have been collected and it is worth that those details are given here in short.

Packiam Ammal
Packiam ammal married Koilpillai Nadar of Mukuperi. They had 3 children, viz.
1. Rubavathy (d) m.Jesudoss (d)
2. Gnanamani (d) m. Roberts (d)
3. Packiamani (d) m.Moses (d)

Rubavathy had the following children. The places where they are living now are also indicated therein.
1. Packiathai (?) m.Wilson (?) USA
2. Wales (d) m.Sumathy USA
3. Stephen m.Rajakili (Washington, USA)
4. Suganthy ...?
5. Jeyaraj (d)
6. Kiruba ... ?
7. Joy ..... ?

Gnanamani had the following children. The places where they are living now are also indicated therein.
1. Florence m.Sundaraj (d.2015).. Palaniyappapuram
2. Vimala(d) m.John .Nazareth.Now lives with their daughter in Bangalore.
3. Radhabai (d?) before marriage expired.
4. Chandra (d?) m.Arunachalam Pillai of Srilanka and now in USA
5. Deboral (d.2015) m.Gunasingh (d.2014) lived with their son Rajkumar Gunasingh in Chennai
6. Robinson (d?) before marriage
7. Angela (d?) m.Mohandass (Retired HM) lives in Palayamkottai with their daughter Henrita Gnanam, Asst. Prof. in English in Sarah Tucker college.
8. Davidson m.Philomenal. Mr.Davidson is LIC Agent and Philomenal is staff nurse in JIPMER. Pondicherry.
9. Jesson Roberts m.Viji living in Washinton, USA. Their children are also settled in USA.

Packiamani ammal (d) married Moses (d) and they were having the following children:
1. Jesuran Ponraj m.Packiamani lives in Coimbatore Colombo Stores at Singanallur along with family.
2. Johnson Moses m.Jenilla Settled in USA
3. Joshua Moses (d) m.Ruth lives in Bangalore with family.
4. Jessen Moses m.Jasmine settled in USA
5. Joel Moses m.Julie lives in Bangalore with family.
6. Rani Moses m.Sugantha balan settled in USA

Abraham Nadar
Abraham Nadar m. Alagammai Ammal
They were having the following children:
1. Arputhamani Ammal (d) m.Palpandian (d) lived in Adayal
2. Isaac Theodre Nadar (b.18.07.1923 - d.21.02.1980)
   m.Lilliy Rajammal Annapoo (b.10.06.1930 - d.17.08.2013)

Arputhamani had the following children:
1. Alagubai (?) m. (?) Retired HM in Coimbatore
2. Jeyaseeli (d) m. (?) lived in Coimbatore
3. Beaulah (d) m. (?) lived in Pichivilai
4. Amala (d) m. (?) lived in Chennai

Isaac Theodre has the following children:
1. Abraham Stalin Rajakumar (d) m.Jeyakumari living with daughter in Chennai
2. Glory (d.10.04.1973) not married.
3. Mary m.Selwyn (d) lives in Srivaikuntam
4. Selwyn m.Sunirem Nightingale Lives in Kallidaikurichi

(m - married, b - born, d- died)

YPM was a well known paper and stationeries organization in Srilanka from 1950s onwards. It was situated in Maliban street, near Colombo Fort Railway Station. YPM stands for Yesuvadiyan, Perinbam and Manickavasagam. Yesuvadiyan Nadar, his son Perinbam Nadar and Manickavasagam Nadar, the brother in law of Perinbam Nadar founded and developed the co. to a great paper and stationery business centre, importing them directly from foreign countries like Sweden, Norway, South Africa, Japan, Holland through Triconamalai and Colombo ports. All four sons of Perinbam Nadar viz. Rajamani Nadar, Rajasigamani Nadar, Palpandian Nadar and Duraipandian Nadar and the sons of the daughters of Perinbam Nadar viz. Annamani, Annapoomani and Jothi Rethnamani were all involved in the business.

Simultaneously, they started business in Chennai, by acquiring buildings in and around Mambalam Railway Station. Now the organizations are well known by PVT. It consists of
1. Perinbavilas Transports
2. Perinbavilas Travels
3. Perinbavilas Theatre
4. Perinbavilas Towers
5. Perinbavilas Traders
6. Perinbavilas Thottam
7. Perinbam Stores
8. Perinbam Aqua Farms and others

Perinbavilas group took keen interest in building the new Church in Adayal. The entire family members lived in a common house, Pannaiya veedu, before moving to individual houses.

Before going to the Perinbavilas family tree, it is apt to indicate the family details of Annammal, wife of Perinbam Nadar also here. She is from Adayal. Her father was Abraham Nadar, who was called 'Vathiar', since he was a teacher.

Abraham Nadar had the following children:
1. Annammal Perinbam (b. 1886 - d. 1949)
2. Mary Ammal (She was married to a Hindu and her name was Mariammal)
3. Manickavasagam Nadar (b. 1897 - d 1958)
4. Devadasan Nadar (b. 1900 - d. 1974)
5. Navamani Nadar (b. 1903 - d. 1964)

It has to be noted that all the children of Abraham vathiar lived in Adayal only.

I have taken the initiative to collect various details about the family members of the Perinbam Nadar family tree and compile them. I would like to thank all the members of our family, who have furnished details about the members and their photographs.

D. SUTHANTHIRARAJ PERINBAM`;


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
  secondaryIcon?: AssetName;
  secondaryLabel?: string;
  secondaryValue?: string;
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
  const mainDob = formatDate(record.dob).toUpperCase();
  const mainDod = record.dod ? formatDate(record.dod).toUpperCase() : null;

  const rows: DetailRow[] = [
    { icon: 'icon-name', label: 'NAME', value: formatName(safeText(record.name)).toUpperCase() },
    mainDod
      ? { icon: 'icon-dob', label: 'DOB', value: mainDob, secondaryIcon: 'icon-dob', secondaryLabel: 'DOD', secondaryValue: mainDod }
      : { icon: 'icon-dob', label: 'DOB', value: mainDob },
  ];

  for (const spouse of getSpouses(record)) {
    const spouseDob = spouse.dob ? formatDate(spouse.dob).toUpperCase() : '';
    const spouseDod = spouse.dod ? formatDate(spouse.dod).toUpperCase() : null;
    rows.push({ icon: 'icon-spouse', label: 'WO/HO', value: formatName(safeText(spouse.name)).toUpperCase() });
    rows.push(
      spouseDod
        ? { icon: 'icon-dob', label: 'DOB', value: spouseDob, secondaryIcon: 'icon-dob', secondaryLabel: 'DOD', secondaryValue: spouseDod }
        : { icon: 'icon-dob', label: 'DOB', value: spouseDob },
    );
  }

  rows.push(
    { icon: 'icon-phone', label: 'PHONE', value: formatPhoneNumbers(record).toUpperCase() },
    { icon: 'icon-address', label: 'ADDRESS', value: safeText(record.address).toUpperCase() },
  );

  return rows.filter((row) => row.value.length > 0);
}

function isAddressDetailRow(row: DetailRow) {
  return row.label === 'ADDRESS';
}

function getDetailValueLines(row: DetailRow, font: PDFFont, valueWidth: number) {
  // Only ADDRESS wraps; all other fields stay on a single line whenever possible.
  if (!isAddressDetailRow(row)) {
    return [row.value];
  }
  return wrapText(row.value, font, DETAIL_FONT, Math.max(20, valueWidth));
}

function computeDetailLayout(record: FamilyRecord, font: PDFFont, valueWidth: number) {
  const rows = buildDetailRows(record);

  let height = 0;
  const rowHeights = rows.map((row) => {
    const lines = getDetailValueLines(row, font, valueWidth);
    const rowHeight = Math.max(DETAIL_LINE_HEIGHT, lines.length * 10.5) + DETAIL_ROW_GAP;
    height += rowHeight;
    return rowHeight;
  });

  return { rows, rowHeights, height };
}

/** Width the details value column needs so non-address fields stay on one line. */
function measurePreferredDetailWidth(record: FamilyRecord, font: PDFFont) {
  const rows = buildDetailRows(record);
  let maxValueWidth = 0;

  for (const row of rows) {
    if (isAddressDetailRow(row)) continue;

    let valueWidth = measureTextWidth(font, row.value, DETAIL_FONT);
    if (row.secondaryValue && row.secondaryLabel) {
      const secondaryBlock =
        24 +
        DETAIL_ICON_SIZE + 4 +
        measureTextWidth(font, row.secondaryLabel, DETAIL_FONT) +
        measureTextWidth(font, ':', DETAIL_FONT) + 3 +
        measureTextWidth(font, row.secondaryValue, DETAIL_FONT);
      valueWidth += secondaryBlock;
    }
    maxValueWidth = Math.max(maxValueWidth, valueWidth);
  }

  // Chrome (icon/label) + widest single-line value + small right padding.
  // Address may still wrap inside whatever width remains after images.
  return DETAIL_CHROME_WIDTH + maxValueWidth + 8;
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
      Math.max(count, wrapText(value, font, 10, colWidths[index] - 10).length)
    ), 1);

    return Math.max(TABLE_ROW_HEIGHT, maxLines * 11 + 5);
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

function isSingleDigitFamilyCode(code: string | number | null | undefined) {
  return /^\d$/.test(String(code ?? '').trim());
}

function isLargeFamily(record: FamilyRecord) {
  return (record.children?.length ?? 0) > LARGE_FAMILY_CHILD_THRESHOLD;
}

async function embedRecordPhotos(pdfDoc: PDFDocument, record: FamilyRecord): Promise<PhotoInfo[]> {
  const photos = getPhotos(record);
  if (photos.length === 0) return [];

  const embeddedPhotos: PhotoInfo[] = [];
  const seenContent = new Set<string>();

  for (const [index, photoPath] of photos.slice(0, 2).entries()) {
    try {
      const { image, width: origW, height: origH, contentHash } = await embedPhoto(pdfDoc, photoPath);
      if (seenContent.has(contentHash)) continue;
      seenContent.add(contentHash);
      embeddedPhotos.push({ id: `${index}`, image, width: origW, height: origH });
    } catch {
      // Skip photos that can't be loaded
    }
  }

  return embeddedPhotos;
}

/**
 * Image-first column sizing for compact Row 2.
 * 1) Size images from count + aspect ratio (as large as the row height allows)
 * 2) Assign ALL remaining width to family details — never a fixed details width
 * 3) If preferred images would force non-address fields to wrap, shrink images
 *    just enough so details can keep those fields on one line
 * 4) Two landscape images → prefer vertical stack when it yields a larger display
 *
 * Supports 1–N images: each image is its own column (or stacked); details fill the rest.
 */
function computeImageFirstColumns(
  photos: Array<{ width: number; height: number }>,
  rowWidth: number,
  rowHeight: number,
  preferredDetailWidth = 0,
): {
  photoAreaWidth: number;
  photoAreaHeight: number;
  columnWidths: number[];
  detailWidth: number;
  displayHeight: number;
  layoutMode: 'single' | 'side-by-side' | 'stack-vertical';
  stackSlotHeight: number;
} {
  if (photos.length === 0 || rowHeight <= 0 || rowWidth <= 0) {
    return {
      photoAreaWidth: 0,
      photoAreaHeight: 0,
      columnWidths: [] as number[],
      detailWidth: rowWidth,
      displayHeight: 0,
      layoutMode: 'single',
      stackSlotHeight: 0,
    };
  }

  const maxDetailCap = Math.max(
    0,
    rowWidth - PHOTO_DETAIL_GAP - photos.length * COMPACT_MIN_PHOTO_HEIGHT,
  );
  const targetDetailWidth = Math.min(Math.max(0, preferredDetailWidth), maxDetailCap);

  const fitSideBySide = () => {
    const gapsBetweenPhotos = Math.max(0, photos.length - 1) * PHOTO_GAP;
    const idealWidths = photos.map((photo) => {
      const aspect = Math.max(photo.width, 1) / Math.max(photo.height, 1);
      return rowHeight * aspect;
    });
    const idealTotal = idealWidths.reduce((sum, width) => sum + width, 0);
    const widthAfterPreferred = rowWidth - idealTotal - gapsBetweenPhotos - PHOTO_DETAIL_GAP;

    let photoBudget = Math.max(0, rowWidth - PHOTO_DETAIL_GAP - gapsBetweenPhotos);
    if (targetDetailWidth > 0 && widthAfterPreferred < targetDetailWidth) {
      photoBudget = Math.max(0, rowWidth - targetDetailWidth - PHOTO_DETAIL_GAP - gapsBetweenPhotos);
    }

    const scale = idealTotal > 0 ? Math.min(1, photoBudget / idealTotal) : 1;
    const columnWidths = idealWidths.map((width) => width * scale);
    const photoAreaWidth = columnWidths.reduce((sum, width) => sum + width, 0) + gapsBetweenPhotos;
    const displayHeight = Math.max(COMPACT_MIN_PHOTO_HEIGHT, rowHeight * scale);
    const area = columnWidths.reduce((sum, width) => sum + width * displayHeight, 0);

    return {
      photoAreaWidth,
      photoAreaHeight: rowHeight,
      columnWidths,
      detailWidth: Math.max(0, rowWidth - photoAreaWidth - PHOTO_DETAIL_GAP),
      displayHeight,
      layoutMode: (photos.length === 1 ? 'single' : 'side-by-side') as 'single' | 'side-by-side',
      stackSlotHeight: 0,
      area,
    };
  };

  const fitStacked = () => {
    const slotHeight = Math.max(COMPACT_MIN_PHOTO_HEIGHT, (rowHeight - PHOTO_GAP) / 2);
    const idealWidths = photos.map((photo) => {
      const aspect = Math.max(photo.width, 1) / Math.max(photo.height, 1);
      return slotHeight * aspect;
    });
    // Stacked images share one column width (wide enough for the wider landscape).
    const idealColumnWidth = Math.max(...idealWidths);
    const widthAfterPreferred = rowWidth - idealColumnWidth - PHOTO_DETAIL_GAP;

    let photoBudget = Math.max(0, rowWidth - PHOTO_DETAIL_GAP);
    if (targetDetailWidth > 0 && widthAfterPreferred < targetDetailWidth) {
      photoBudget = Math.max(0, rowWidth - targetDetailWidth - PHOTO_DETAIL_GAP);
    }

    const scale = idealColumnWidth > 0 ? Math.min(1, photoBudget / idealColumnWidth) : 1;
    const photoAreaWidth = idealColumnWidth * scale;
    const displayHeight = slotHeight * scale;
    const area = photos.length * photoAreaWidth * displayHeight;

    return {
      photoAreaWidth,
      photoAreaHeight: rowHeight,
      columnWidths: [photoAreaWidth],
      detailWidth: Math.max(0, rowWidth - photoAreaWidth - PHOTO_DETAIL_GAP),
      displayHeight,
      layoutMode: 'stack-vertical' as const,
      stackSlotHeight: displayHeight,
      area,
    };
  };

  const sideBySide = fitSideBySide();
  const bothLandscape = photos.length === 2 && photos.every((photo) => photo.width / Math.max(photo.height, 1) > 1.2);

  if (bothLandscape) {
    const stacked = fitStacked();
    if (stacked.area > sideBySide.area) {
      return stacked;
    }
  }

  return sideBySide;
}

function buildColumnPhotoLayout(
  embeddedPhotos: PhotoInfo[],
  columnWidths: number[],
  rowHeight: number,
  displayHeight: number,
  layoutMode: 'single' | 'side-by-side' | 'stack-vertical' = 'side-by-side',
  stackSlotHeight = 0,
): PhotoLayoutInfo {
  if (embeddedPhotos.length === 0 || columnWidths.length === 0) {
    return { photos: [], imageLayout: null, layoutWidth: 0, layoutHeight: 0, isHorizontal: false };
  }

  if (layoutMode === 'stack-vertical' && embeddedPhotos.length >= 2) {
    const photoAreaWidth = columnWidths[0] ?? 0;
    const slotHeight = stackSlotHeight > 0 ? stackSlotHeight : Math.max(1, (rowHeight - PHOTO_GAP) / 2);
    const topSlotY = rowHeight - slotHeight;
    const bottomSlotY = 0;

    const placements = embeddedPhotos.slice(0, 2).map((photo, index) => {
      const slotY = index === 0 ? topSlotY : bottomSlotY;
      const aspect = Math.max(photo.width, 1) / Math.max(photo.height, 1);
      let drawHeight = Math.min(displayHeight, slotHeight);
      let drawWidth = drawHeight * aspect;
      if (drawWidth > photoAreaWidth) {
        drawWidth = photoAreaWidth;
        drawHeight = drawWidth / aspect;
      }
      // Top-align within each stack slot (PDF y grows upward inside the panel).
      const drawY = slotY + slotHeight - drawHeight;
      const drawX = (photoAreaWidth - drawWidth) / 2;
      return {
        imageId: photo.id,
        x: 0,
        y: slotY,
        width: photoAreaWidth,
        height: slotHeight,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
        cropRect: { x: 0, y: 0, width: photo.width, height: photo.height },
      };
    });

    return {
      photos: embeddedPhotos,
      imageLayout: {
        selectedLayout: 'stack-vertical',
        containerWidth: photoAreaWidth,
        containerHeight: rowHeight,
        images: embeddedPhotos.map((photo) => ({
          id: photo.id,
          width: photo.width,
          height: photo.height,
          aspectRatio: photo.width / Math.max(photo.height, 1),
          type: 'landscape' as const,
        })),
        placements,
      },
      layoutWidth: photoAreaWidth,
      layoutHeight: rowHeight,
      isHorizontal: false,
    };
  }

  const photoAreaWidth = columnWidths.reduce((sum, width, index) => (
    sum + width + (index > 0 ? PHOTO_GAP : 0)
  ), 0);

  let x = 0;
  const placements = embeddedPhotos.map((photo, index) => {
    const slotWidth = columnWidths[index] ?? columnWidths[columnWidths.length - 1];
    const slotHeight = rowHeight;
    const aspect = Math.max(photo.width, 1) / Math.max(photo.height, 1);
    let drawHeight = Math.min(displayHeight, slotHeight);
    let drawWidth = drawHeight * aspect;
    if (drawWidth > slotWidth) {
      drawWidth = slotWidth;
      drawHeight = drawWidth / aspect;
    }
    const drawX = x + (slotWidth - drawWidth) / 2;
    // Top-align with family details — same Row 2 baseline.
    const drawY = slotHeight - drawHeight;
    const placement = {
      imageId: photo.id,
      x,
      y: 0,
      width: slotWidth,
      height: slotHeight,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
      cropRect: { x: 0, y: 0, width: photo.width, height: photo.height },
    };
    x += slotWidth + PHOTO_GAP;
    return placement;
  });

  return {
    photos: embeddedPhotos,
    imageLayout: {
      selectedLayout: embeddedPhotos.length === 1 ? 'image-detail' : 'images-detail',
      containerWidth: photoAreaWidth,
      containerHeight: rowHeight,
      images: embeddedPhotos.map((photo) => ({
        id: photo.id,
        width: photo.width,
        height: photo.height,
        aspectRatio: photo.width / Math.max(photo.height, 1),
        type: 'square' as const,
      })),
      placements,
    },
    layoutWidth: photoAreaWidth,
    layoutHeight: rowHeight,
    isHorizontal: embeddedPhotos.length > 1,
  };
}

async function calculatePhotoLayout(
  pdfDoc: PDFDocument,
  record: FamilyRecord,
  areaWidth?: number,
  areaHeight?: number,
  isSingleDigit = false,
): Promise<PhotoLayoutInfo> {
  const embeddedPhotos = await embedRecordPhotos(pdfDoc, record);

  if (embeddedPhotos.length === 0) {
    return { photos: [], imageLayout: null, layoutWidth: 0, layoutHeight: 0, isHorizontal: false };
  }

  const photoInputs = embeddedPhotos.map((photo) => ({ id: photo.id, width: photo.width, height: photo.height }));
  const containerW = areaWidth ?? (CONTENT_WIDTH - BLOCK_PADDING_X * 2);

  if (isSingleDigit) {
    if (embeddedPhotos.length === 1) {
      const imageLayout = createImageLayout(photoInputs, containerW, SINGLE_DIGIT_SINGLE_PHOTO_HEIGHT, PHOTO_GAP);
      return {
        photos: embeddedPhotos,
        imageLayout,
        layoutWidth: imageLayout.containerWidth,
        layoutHeight: imageLayout.containerHeight,
        isHorizontal: false,
      };
    }

    const imageLayout = createImageLayout(photoInputs, containerW, SINGLE_DIGIT_TWO_PHOTO_HEIGHT, PHOTO_GAP, { forceLayout: 'side-by-side' });
    return {
      photos: embeddedPhotos,
      imageLayout,
      layoutWidth: imageLayout.containerWidth,
      layoutHeight: imageLayout.containerHeight,
      isHorizontal: true,
    };
  }

  // Compact path uses measureCompactFamilyBlockLayout + image-first columns instead.
  const rowHeight = areaHeight ?? COMPACT_MIN_ROW2_HEIGHT;
  const columns = computeImageFirstColumns(embeddedPhotos, containerW, rowHeight, 0);
  return buildColumnPhotoLayout(
    embeddedPhotos,
    columns.columnWidths,
    rowHeight,
    columns.displayHeight,
    columns.layoutMode,
    columns.stackSlotHeight,
  );
}

type FamilyBlockLayout = {
  blockHeight: number;
  photoLayout: PhotoLayoutInfo;
  detailX: number;
  detailRight: number;
  topSectionHeight: number;
  tableHeight: number;
  tableRowHeights: number[];
  photoAreaWidth?: number;
  row2Height?: number;
  tableTopOffset?: number;
};

function scaleChildrenRowHeightsToFit(rowHeights: number[], maxBodyHeight: number) {
  if (rowHeights.length === 0) return rowHeights;
  const natural = rowHeights.reduce((sum, height) => sum + height, 0);
  if (natural <= maxBodyHeight || natural <= 0) return rowHeights;

  const scale = maxBodyHeight / natural;
  const scaled = rowHeights.map((height) => Math.max(1, Math.floor(height * scale)));
  let total = scaled.reduce((sum, height) => sum + height, 0);
  let guard = 0;
  while (total > maxBodyHeight && guard < scaled.length * 4) {
    const idx = guard % scaled.length;
    if (scaled[idx] > 1) {
      scaled[idx] -= 1;
      total -= 1;
    }
    guard += 1;
  }
  return scaled;
}

function measureCompactFamilyBlockLayout(
  record: FamilyRecord,
  font: PDFFont,
  embeddedPhotos: PhotoInfo[],
  sectionHeight: number,
): FamilyBlockLayout {
  const innerWidth = CONTENT_WIDTH - BLOCK_PADDING_X * 2;
  const photoX = CONTENT_MARGIN_X + BLOCK_PADDING_X;
  const contentRight = photoX + innerWidth;
  const hasPhotos = embeddedPhotos.length > 0;
  const hasChildren = (record.children?.length ?? 0) > 0;
  const headerHeight = COMPACT_HEADER_HEIGHT;
  const availableBelowHeader = Math.max(0, sectionHeight - headerHeight - BLOCK_PADDING_BOTTOM);

  // --- No images: skip image container entirely. Details are full-width and
  // content-sized; children sit directly underneath with only TABLE_GAP. ---
  if (!hasPhotos) {
    const detailValueWidth = Math.max(20, innerWidth - DETAIL_CHROME_WIDTH);
    const detailLayout = computeDetailLayout(record, font, detailValueWidth);
    const detailHeight = Math.max(DETAIL_LINE_HEIGHT, detailLayout.height);
    const tableChrome = hasChildren ? TABLE_GAP + TABLE_HEADER_HEIGHT + TABLE_BOTTOM_PADDING : 0;
    const tableBodyBudget = hasChildren
      ? Math.max(0, availableBelowHeader - detailHeight - tableChrome)
      : 0;

    const naturalTable = computeChildrenTableLayout(record, font, innerWidth);
    const tableRowHeights = hasChildren
      ? scaleChildrenRowHeightsToFit(
        naturalTable.rowHeights,
        Math.min(naturalTable.height - TABLE_HEADER_HEIGHT - TABLE_BOTTOM_PADDING, tableBodyBudget),
      )
      : [];
    const scaledBody = tableRowHeights.reduce((sum, height) => sum + height, 0);
    const tableHeight = hasChildren
      ? TABLE_HEADER_HEIGHT + scaledBody + TABLE_BOTTOM_PADDING
      : 0;

    return {
      blockHeight: sectionHeight,
      photoLayout: { photos: [], imageLayout: null, layoutWidth: 0, layoutHeight: 0, isHorizontal: false },
      detailX: photoX,
      detailRight: contentRight,
      topSectionHeight: detailHeight,
      tableHeight,
      tableRowHeights,
      photoAreaWidth: 0,
      row2Height: detailHeight,
      tableTopOffset: headerHeight + detailHeight + (hasChildren ? TABLE_GAP : 0),
    };
  }

  // --- Has images: keep equal half-page image+details row, then children. ---
  const naturalTable = computeChildrenTableLayout(record, font, innerWidth);
  const tableChrome = hasChildren ? TABLE_GAP + TABLE_HEADER_HEIGHT + TABLE_BOTTOM_PADDING : 0;

  let tableBodyBudget = hasChildren
    ? Math.min(naturalTable.height - TABLE_HEADER_HEIGHT - TABLE_BOTTOM_PADDING, Math.max(0, availableBelowHeader - tableChrome - COMPACT_MIN_ROW2_HEIGHT))
    : 0;

  if (hasChildren && isLargeFamily(record)) {
    // Large families must fit entirely on one page — give the table what it needs,
    // then shrink photo row (and row heights if still short).
    const neededBody = naturalTable.height - TABLE_HEADER_HEIGHT - TABLE_BOTTOM_PADDING;
    const maxBody = Math.max(0, availableBelowHeader - tableChrome - COMPACT_MIN_PHOTO_HEIGHT);
    tableBodyBudget = Math.min(neededBody, maxBody);
  }

  const tableRowHeights = hasChildren
    ? scaleChildrenRowHeightsToFit(naturalTable.rowHeights, tableBodyBudget)
    : [];
  const scaledBody = tableRowHeights.reduce((sum, height) => sum + height, 0);
  const tableHeight = hasChildren
    ? TABLE_HEADER_HEIGHT + scaledBody + TABLE_BOTTOM_PADDING
    : 0;

  const row2Height = Math.max(
    COMPACT_MIN_PHOTO_HEIGHT,
    availableBelowHeader - (hasChildren ? TABLE_GAP + tableHeight : 0),
  );

  const columns = computeImageFirstColumns(
    embeddedPhotos,
    innerWidth,
    row2Height,
    measurePreferredDetailWidth(record, font),
  );
  const photoLayout = buildColumnPhotoLayout(
    embeddedPhotos,
    columns.columnWidths,
    row2Height,
    columns.displayHeight,
    columns.layoutMode,
    columns.stackSlotHeight,
  );

  return {
    blockHeight: sectionHeight,
    photoLayout,
    detailX: photoX + columns.photoAreaWidth + PHOTO_DETAIL_GAP,
    detailRight: contentRight,
    topSectionHeight: row2Height,
    tableHeight,
    tableRowHeights,
    photoAreaWidth: columns.photoAreaWidth,
    row2Height,
    tableTopOffset: headerHeight + row2Height + (hasChildren ? TABLE_GAP : 0),
  };
}

function measureSingleDigitBlockLayout(record: FamilyRecord, font: PDFFont, photoLayout: PhotoLayoutInfo): FamilyBlockLayout {
  const innerWidth = CONTENT_WIDTH - BLOCK_PADDING_X * 2;
  const detailBlockWidth = 340;
  const centeredDetailX = CONTENT_MARGIN_X + BLOCK_PADDING_X + (innerWidth - detailBlockWidth) / 2;
  const valueX = centeredDetailX + DETAIL_ICON_SIZE + 6 + DETAIL_LABEL_WIDTH + DETAIL_VALUE_X_GAP;
  const detailRight = centeredDetailX + detailBlockWidth;
  const detailValueWidth = Math.max(80, detailRight - valueX - 8);
  const detailLayout = computeDetailLayout(record, font, detailValueWidth);
  const tableLayout = computeChildrenTableLayout(record, font, innerWidth);

  const photoHeight = photoLayout.layoutHeight;
  const detailHeight = detailLayout.height;
  const tableHeight = tableLayout.height;

  const gapBadgePhoto = photoHeight ? 8 : 0;
  const gapPhotoDetails = photoHeight && detailHeight ? SINGLE_DIGIT_PHOTO_DETAIL_GAP : 0;
  const gapDetailsTable = tableHeight ? TABLE_GAP : 0;

  const totalHeight = CODE_BADGE_HEIGHT + gapBadgePhoto + photoHeight + gapPhotoDetails + detailHeight + gapDetailsTable + tableHeight + TABLE_BOTTOM_PADDING + BLOCK_PADDING_BOTTOM;

  return {
    blockHeight: Math.ceil(totalHeight),
    photoLayout,
    detailX: centeredDetailX,
    detailRight,
    topSectionHeight: Math.max(photoHeight, detailHeight),
    tableHeight,
    tableRowHeights: tableLayout.rowHeights,
  };
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

/** PDF-space rounded rect operators (y-up) for clipping family photos. */
function roundedRectClipOperators(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  const c = r * 0.5522847498;
  const right = x + width;
  const top = y + height;

  return [
    moveTo(x + r, y),
    lineTo(right - r, y),
    appendBezierCurve(right - r + c, y, right, y + r - c, right, y + r),
    lineTo(right, top - r),
    appendBezierCurve(right, top - r + c, right - r + c, top, right - r, top),
    lineTo(x + r, top),
    appendBezierCurve(x + r - c, top, x, top - r + c, x, top - r),
    lineTo(x, y + r),
    appendBezierCurve(x, y + r - c, x + r - c, y, x + r, y),
    closePath(),
  ];
}

function drawRoundedBorder(page: PDFPage, x: number, y: number, width: number, height: number, radius: number, borderWidth: number) {
  page.drawSvgPath(roundedRectPath(0, 0, width, height, radius), {
    x,
    y: y + height,
    borderColor: GREEN,
    borderWidth,
  });
}

/**
 * Draw a family photo with a green rounded frame.
 * Frame fits inside the existing image rect so layout/sizing stay unchanged.
 */
function drawFramedPhoto(
  page: PDFPage,
  image: PDFImage,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const minSide = Math.min(width, height);
  if (minSide < PHOTO_FRAME_BORDER * 2 + PHOTO_FRAME_PADDING * 2 + 8) {
    page.drawImage(image, { x, y, width, height });
    return;
  }

  const radius = Math.min(PHOTO_FRAME_RADIUS, minSide / 4);
  // Keep the full stroke inside the layout rect; leave padding between stroke and image.
  const borderInset = PHOTO_FRAME_BORDER / 2;
  const imageInset = PHOTO_FRAME_BORDER + PHOTO_FRAME_PADDING;
  const imgX = x + imageInset;
  const imgY = y + imageInset;
  const imgW = width - imageInset * 2;
  const imgH = height - imageInset * 2;
  const imageRadius = Math.max(1, radius - imageInset + borderInset);

  const frameX = x + borderInset;
  const frameY = y + borderInset;
  const frameW = width - PHOTO_FRAME_BORDER;
  const frameH = height - PHOTO_FRAME_BORDER;

  // Clip image to rounded rect (overflow: hidden equivalent).
  page.pushOperators(
    pushGraphicsState(),
    ...roundedRectClipOperators(imgX, imgY, imgW, imgH, imageRadius),
    clip(),
    endPath(),
  );
  page.drawImage(image, {
    x: imgX,
    y: imgY,
    width: imgW,
    height: imgH,
  });
  page.pushOperators(popGraphicsState());

  drawRoundedBorder(page, frameX, frameY, frameW, frameH, radius, PHOTO_FRAME_BORDER);
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
  const contentHash = crypto.createHash('md5').update(buffer).digest('hex');
  return { image, width: metadata.width ?? PHOTO_W, height: metadata.height ?? PHOTO_H, contentHash };
}

function getPhotos(record: FamilyRecord): string[] {
  return normalizePhotos(record.photos);
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

    drawFramedPhoto(
      page,
      photo.image,
      x + placement.drawX,
      layoutBottomY + placement.drawY,
      placement.drawWidth,
      placement.drawHeight,
    );
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
  // Value column uses 100% of the remaining width after icon + label chrome.
  const valueX = x + DETAIL_CHROME_WIDTH;
  const valueWidth = Math.max(20, rightX - valueX);
  const { rows, rowHeights, height } = computeDetailLayout(record, font, valueWidth);
  const iconSize = 11;
  let currentTop = yTop;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowHeight = rowHeights[i];
    const rowBottom = currentTop - rowHeight;
    const lines = getDetailValueLines(row, font, valueWidth);

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
    for (const line of lines) {
      page.drawText(line, {
        x: valueX,
        y: lineY,
        size: DETAIL_FONT,
        font,
        color: TEXT,
      });
      lineY -= 10.5;
    }

    if (row.secondaryValue && row.secondaryIcon && row.secondaryLabel) {
      const dobValueWidth = measureTextWidth(font, row.value, DETAIL_FONT);
      const gap = 24;
      const secondaryIconX = valueX + dobValueWidth + gap;
      const dodIcon = await loadAsset(row.secondaryIcon);
      page.drawImage(dodIcon, {
        x: secondaryIconX,
        y: currentTop - 8.3,
        width: iconSize,
        height: iconSize,
      });

      const dodLabelX = secondaryIconX + iconSize + 4;
      page.drawText(row.secondaryLabel, {
        x: dodLabelX,
        y: currentTop - 7.0,
        size: DETAIL_FONT,
        font: boldFont,
        color: GREEN,
      });

      const dodColonX = dodLabelX + measureTextWidth(boldFont, row.secondaryLabel, DETAIL_FONT);
      page.drawText(':', {
        x: dodColonX,
        y: currentTop - 7.0,
        size: DETAIL_FONT,
        font: boldFont,
        color: GREEN,
      });

      const dodValueX = dodColonX + measureTextWidth(boldFont, ':', DETAIL_FONT) + 3;
      page.drawText(row.secondaryValue, {
        x: dodValueX,
        y: currentTop - 7.0,
        size: DETAIL_FONT,
        font,
        color: TEXT,
      });
    }

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
    const labelWidth = measureTextWidth(boldFont, label, 11);
    page.drawText(label, {
      x: headerX + (colWidths[i] - labelWidth) / 2,
      y: topY - 12,
      size: 11,
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
    const sizes = [10, 10, 10];
    let valueX = tableX;
    for (let colIndex = 0; colIndex < values.length; colIndex += 1) {
      const lines = wrapText(values[colIndex], font, sizes[colIndex], colWidths[colIndex] - 10);
      const totalTextHeight = lines.length * 11;
      let lineY = rowBottom + (rowHeight + totalTextHeight) / 2 - 7.9;

      for (const line of lines) {
        const textWidth = measureTextWidth(font, line, sizes[colIndex]);
        page.drawText(line, {
          x: valueX + (colWidths[colIndex] - textWidth) / 2,
          y: lineY,
          size: sizes[colIndex],
          font,
          color: TEXT,
        });
        lineY -= 11;
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

async function drawSingleDigitFamilyBlock(
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
  const blockTop = startY;
  const blockHeight = layout.blockHeight;
  let cursorY = blockTop;

  const badgeText = `CODE ${record.code}`;
  const badgeWidth = Math.max(CODE_BADGE_MIN_WIDTH, measureTextWidth(boldFont, badgeText, CODE_BADGE_TEXT_SIZE) + CODE_BADGE_PADDING_X * 2);
  const centeredBadgeX = photoX + (innerWidth - badgeWidth) / 2;
  await drawCodeBadge(page, centeredBadgeX, cursorY, record.code, boldFont);
  cursorY -= CODE_BADGE_HEIGHT;

  if (layout.photoLayout.photos.length > 0) {
    cursorY -= 8;
    const photoAreaWidth = layout.photoLayout.layoutWidth;
    const centeredPhotoX = photoX + (innerWidth - photoAreaWidth) / 2;
    await drawPhotoPanel(page, layout.photoLayout, centeredPhotoX, cursorY);
    cursorY -= layout.photoLayout.layoutHeight;
    cursorY -= SINGLE_DIGIT_PHOTO_DETAIL_GAP;
  }

  const detailResult = await drawDetailRows(page, loadAsset, record, layout.detailX, cursorY, font, boldFont, layout.detailRight);
  cursorY = detailResult.bottomY;

  if (record.children?.length) {
    cursorY -= TABLE_GAP;
    drawChildrenTable(page, record, photoX, cursorY, innerWidth, font, boldFont, layout.tableRowHeights);
  }

  return blockTop - blockHeight;
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
  if (isSingleDigitFamilyCode(record.code)) {
    return drawSingleDigitFamilyBlock(page, record, startY, font, boldFont, loadAsset, layout);
  }

  // Compact template: 3 equal-purpose rows within a fixed half/full-page section.
  // Row 1 — family code header; Row 2 — images + details; Row 3 — children table.
  const innerWidth = CONTENT_WIDTH - BLOCK_PADDING_X * 2;
  const photoX = CONTENT_MARGIN_X + BLOCK_PADDING_X;
  const blockHeight = layout.blockHeight;
  const blockTop = startY;
  const blockBottom = blockTop - blockHeight;
  const row2Top = blockTop - COMPACT_HEADER_HEIGHT;
  const row2Height = layout.row2Height ?? layout.topSectionHeight;

  await drawCodeBadge(page, photoX, blockTop, record.code, boldFont);

  if (layout.photoLayout.photos.length > 0) {
    await drawPhotoPanel(page, layout.photoLayout, photoX, row2Top);
  }

  await drawDetailRows(page, loadAsset, record, layout.detailX, row2Top, font, boldFont, layout.detailRight);

  if (record.children?.length) {
    const tableTop = layout.tableTopOffset != null
      ? blockTop - layout.tableTopOffset
      : row2Top - row2Height - TABLE_GAP;
    drawChildrenTable(page, record, photoX, tableTop, innerWidth, font, boldFont, layout.tableRowHeights);
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

  const isSingleDigitCode = isSingleDigitFamilyCode(record.code);
  let badgeX = photoX;
  if (isSingleDigitCode) {
    const badgeText = `CODE ${record.code}`;
    const badgeWidth = Math.max(CODE_BADGE_MIN_WIDTH, measureTextWidth(boldFont, badgeText, CODE_BADGE_TEXT_SIZE) + CODE_BADGE_PADDING_X * 2);
    badgeX = photoX + (innerWidth - badgeWidth) / 2;
  }

  const topSectionHeight = layout.topSectionHeight;
  const firstPageBaseHeight = isSingleDigitCode
    ? layout.blockHeight - (layout.tableHeight ? TABLE_GAP + layout.tableHeight + TABLE_BOTTOM_PADDING : 0)
    : COMPACT_HEADER_HEIGHT + topSectionHeight + BLOCK_PADDING_BOTTOM;
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

  if (isSingleDigitCode) {
    // Vertical stack for single-digit oversized first page
    let cursorY = currentStartY;
    await drawCodeBadge(currentPage, badgeX, cursorY, record.code, boldFont);
    cursorY -= CODE_BADGE_HEIGHT;

    if (layout.photoLayout.photos.length > 0) {
      cursorY -= 8;
      const photoAreaWidth = layout.photoLayout.layoutWidth;
      const centeredPhotoX = photoX + (innerWidth - photoAreaWidth) / 2;
      await drawPhotoPanel(currentPage, layout.photoLayout, centeredPhotoX, cursorY);
      cursorY -= layout.photoLayout.layoutHeight;
      cursorY -= SINGLE_DIGIT_PHOTO_DETAIL_GAP;
    }

    const detailResult = await drawDetailRows(currentPage, loadAsset, record, layout.detailX, cursorY, font, boldFont, layout.detailRight);
    cursorY = detailResult.bottomY;

    if (firstSegmentHasTable) {
      cursorY -= TABLE_GAP;
      drawChildrenTable(currentPage, record, photoX, cursorY, innerWidth, font, boldFont, layout.tableRowHeights, 0, firstRows);
    }
  } else {
    await drawCodeBadge(currentPage, photoX, currentStartY, record.code, boldFont);
    await drawPhotoPanel(currentPage, layout.photoLayout, photoX, currentStartY - COMPACT_HEADER_HEIGHT);

    const detailTop = currentStartY - COMPACT_HEADER_HEIGHT;
    await drawDetailRows(currentPage, loadAsset, record, layout.detailX, detailTop, font, boldFont, layout.detailRight);

    if (firstSegmentHasTable) {
      drawChildrenTable(
        currentPage,
        record,
        photoX,
        currentStartY - COMPACT_HEADER_HEIGHT - topSectionHeight - TABLE_GAP,
        innerWidth,
        font,
        boldFont,
        layout.tableRowHeights,
        0,
        firstRows,
      );
    }
  }

  nextChildIndex = firstRows;

  while (nextChildIndex < childCount) {
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    await drawDecorativeBorder(currentPage);
    currentStartY = PAGE_BLOCK_TOP;

    const topOffset = isSingleDigitCode ? CODE_BADGE_HEIGHT + 8 : COMPACT_HEADER_HEIGHT;
    const rowsAvailable = PAGE_BLOCK_MAX_HEIGHT - topOffset - TABLE_HEADER_HEIGHT - TABLE_BOTTOM_PADDING;
    const rowsOnPage = countRowsThatFit(layout.tableRowHeights, nextChildIndex, rowsAvailable);
    const rowsHeight = sumRowHeights(layout.tableRowHeights, nextChildIndex, rowsOnPage);
    const segmentHeight = topOffset + TABLE_HEADER_HEIGHT + rowsHeight + TABLE_BOTTOM_PADDING;
    const blockBottom = currentStartY - segmentHeight;
    lastBlockBottom = blockBottom;

    await drawCodeBadge(currentPage, badgeX, currentStartY, record.code, boldFont);
    drawChildrenTable(
      currentPage,
      record,
      photoX,
      currentStartY - topOffset,
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

async function embedIntroImage(pdfDoc: PDFDocument): Promise<PDFImage> {
  const fullPath = path.join(process.cwd(), 'public', INTRO_IMAGE_PATH);
  const buffer = await fs.readFile(fullPath);
  const metadata = await sharp(buffer).metadata();
  const isJpeg = metadata.format === 'jpeg';
  return isJpeg ? await pdfDoc.embedJpg(buffer) : await pdfDoc.embedPng(buffer);
}

async function drawCoverPage(pdfDoc: PDFDocument, image: PDFImage) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  });
}

async function drawIntroductionPages(pdfDoc: PDFDocument, font: PDFFont) {
  const innerWidth = CONTENT_WIDTH - BLOCK_PADDING_X * 2;
  const x = CONTENT_MARGIN_X + BLOCK_PADDING_X;

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  await drawDecorativeBorder(page);
  let cursorY = PAGE_BLOCK_TOP;

  const ensureSpace = async (needed: number) => {
    if (cursorY - needed < PAGE_BLOCK_BOTTOM) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      await drawDecorativeBorder(page);
      cursorY = PAGE_BLOCK_TOP;
    }
  };

  await ensureSpace(INTRO_TITLE_SIZE + INTRO_TITLE_GAP);
  const titleWidth = measureTextWidth(font, INTRO_TITLE, INTRO_TITLE_SIZE);
  page.drawText(INTRO_TITLE, {
    x: x + (innerWidth - titleWidth) / 2,
    y: cursorY - INTRO_TITLE_SIZE,
    size: INTRO_TITLE_SIZE,
    font,
    color: GREEN,
  });
  cursorY -= INTRO_TITLE_SIZE + INTRO_TITLE_GAP;

  const paragraphs = INTRO_TEXT
    .split(/\r?\n/)
    .map((line) => line.trim())
    .reduce<string[][]>((acc, line) => {
      if (!line) {
        if (acc.length && acc[acc.length - 1].length) acc.push([]);
        return acc;
      }
      if (!acc.length) acc.push([]);
      acc[acc.length - 1].push(line);
      return acc;
    }, []);

  for (const paragraph of paragraphs) {
    if (!paragraph.length) continue;
    const wrapped = wrapText(paragraph.join(' '), font, INTRO_FONT_SIZE, innerWidth);
    for (const line of wrapped) {
      await ensureSpace(INTRO_LINE_HEIGHT);
      page.drawText(line, {
        x,
        y: cursorY - INTRO_FONT_SIZE,
        size: INTRO_FONT_SIZE,
        font,
        color: TEXT,
      });
      cursorY -= INTRO_LINE_HEIGHT;
    }
    if (cursorY - INTRO_PARAGRAPH_GAP >= PAGE_BLOCK_BOTTOM) {
      cursorY -= INTRO_PARAGRAPH_GAP;
    }
  }
}

function drawPageNumbers(pdfDoc: PDFDocument, font: PDFFont, startIndex = 0) {
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  pages.forEach((page, index) => {
    if (index < startIndex) return;
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

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const boldFont = font;
  const loadAsset = createAssetLoader(pdfDoc);

  const introImage = await embedIntroImage(pdfDoc);
  await drawCoverPage(pdfDoc, introImage);
  await drawIntroductionPages(pdfDoc, font);

  // Pass 1: embed photos once, then measure each block.
  // Non-single-digit families use fixed half-page (or full-page for >6 children) sections.
  const embeddedPhotosByIndex: PhotoInfo[][] = [];
  const measuredLayouts: FamilyBlockLayout[] = [];

  for (const record of records) {
    const isSingleDigit = isSingleDigitFamilyCode(record.code);
    if (isSingleDigit) {
      embeddedPhotosByIndex.push([]);
      const photoLayout = await calculatePhotoLayout(pdfDoc, record, undefined, undefined, true);
      measuredLayouts.push(measureSingleDigitBlockLayout(record, font, photoLayout));
      continue;
    }

    const embeddedPhotos = await embedRecordPhotos(pdfDoc, record);
    embeddedPhotosByIndex.push(embeddedPhotos);
    // Provisional height — finalized after pagination decides solo vs paired.
    const provisionalHeight = isLargeFamily(record) ? PAGE_BLOCK_MAX_HEIGHT : COMPACT_SECTION_HEIGHT;
    measuredLayouts.push(measureCompactFamilyBlockLayout(record, font, embeddedPhotos, provisionalHeight));
  }

  // Pass 2: paginate — single-digit alone; >6 children alone on a full page;
  // all other compact families exactly 2 per page (never 3).
  type PageSlot = { index: number; sectionHeight: number };
  const pages: PageSlot[][] = [];
  let pendingPair: PageSlot[] = [];

  const flushPair = () => {
    if (pendingPair.length === 0) return;
    if (pendingPair.length === 1) {
      // Odd leftover: expand to full page so images use available space.
      const solo = pendingPair[0];
      solo.sectionHeight = PAGE_BLOCK_MAX_HEIGHT;
      pages.push([solo]);
    } else {
      pages.push(pendingPair);
    }
    pendingPair = [];
  };

  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];

    if (isSingleDigitFamilyCode(record.code)) {
      flushPair();
      pages.push([{ index: i, sectionHeight: measuredLayouts[i].blockHeight }]);
      continue;
    }

    if (isLargeFamily(record)) {
      flushPair();
      pages.push([{ index: i, sectionHeight: PAGE_BLOCK_MAX_HEIGHT }]);
      continue;
    }

    pendingPair.push({ index: i, sectionHeight: COMPACT_SECTION_HEIGHT });
    if (pendingPair.length === 2) {
      pages.push(pendingPair);
      pendingPair = [];
    }
  }
  flushPair();

  // Re-measure compact layouts with their final section heights.
  for (const pageSlots of pages) {
    for (const slot of pageSlots) {
      const record = records[slot.index];
      if (isSingleDigitFamilyCode(record.code)) continue;
      measuredLayouts[slot.index] = measureCompactFamilyBlockLayout(
        record,
        font,
        embeddedPhotosByIndex[slot.index],
        slot.sectionHeight,
      );
    }
  }

  // Pass 3: draw page by page with equal horizontal sections for paired families.
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const pageSlots = pages[pageIndex];
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    await drawDecorativeBorder(page);

    const onlySingleDigit = pageSlots.length === 1 && isSingleDigitFamilyCode(records[pageSlots[0].index].code);

    if (onlySingleDigit) {
      const slot = pageSlots[0];
      const record = records[slot.index];
      const layout = measuredLayouts[slot.index];
      const requiredHeight = layout.blockHeight;

      if (requiredHeight > PAGE_BLOCK_MAX_HEIGHT) {
        await drawOversizedFamilyBlock(
          pdfDoc,
          page,
          record,
          PAGE_BLOCK_TOP,
          font,
          boldFont,
          loadAsset,
          layout,
        );
        // Oversized single-digit may add continuation pages; those are already attached.
        continue;
      }

      // Always start a single-family page from the top — never vertically center.
      await drawFamilyBlock(page, record, PAGE_BLOCK_TOP, font, boldFont, loadAsset, layout);
      continue;
    }

    let cursorY = PAGE_BLOCK_TOP;
    for (let slotIndex = 0; slotIndex < pageSlots.length; slotIndex += 1) {
      const slot = pageSlots[slotIndex];
      const record = records[slot.index];
      const layout = measuredLayouts[slot.index];

      await drawFamilyBlock(page, record, cursorY, font, boldFont, loadAsset, layout);
      cursorY -= layout.blockHeight;
      if (slotIndex < pageSlots.length - 1) {
        cursorY -= COMPACT_SECTION_GAP;
      }
    }
  }

  drawPageNumbers(pdfDoc, font, 1);

  return pdfDoc.save();
}

export async function exportSingleRecordPDF(record: FamilyRecord): Promise<Uint8Array> {
  return generateFamilyDirectoryPDF([record], `Family Record - ${formatName(record.name)}`);
}

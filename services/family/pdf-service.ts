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

const BLOCK_GAP = 16;
const BLOCK_PADDING_BOTTOM = 14;
const BLOCK_PADDING_X = 14;
const CODE_BADGE_HEIGHT = 26;
const CODE_BADGE_MIN_WIDTH = 92;
const CODE_BADGE_PADDING_X = 10;
const CODE_BADGE_TEXT_SIZE = 16;
const PHOTO_W = 126;
const PHOTO_H = 88;
// Compact (non-single-digit) template: photo area uses the left column efficiently.
// Badge bottom sits 14px above the photo area (was 18px) to cut vertical whitespace.
const PHOTO_TOP_OFFSET = 40;
const DETAIL_ICON_SIZE = 10;
const DETAIL_FONT = 9.5;
const DETAIL_LABEL_WIDTH = 60;
const DETAIL_ROW_GAP = 7.5;
const DETAIL_LINE_HEIGHT = 11;
const DETAIL_VALUE_X_GAP = 10;

const TABLE_HEADER_HEIGHT = 19;
const TABLE_ROW_HEIGHT = 18;
const TABLE_GAP = 8;
const TABLE_BOTTOM_PADDING = 10;
// Compact (non-single-digit) template: photo container is wider (more of the left
// column) with tighter spacing so photos render ~20-30% larger without raising the
// card height (the vertical slot max grew only slightly, absorbed by the reduced
// top offset above).
const PHOTO_AREA_WIDTH = 250; // was 215 (compact template only)
const PHOTO_SLOT_MAX_HEIGHT = 142; // was 132
const PHOTO_GAP = 6; // shared with single-digit template - keep unchanged
const PHOTO_DETAIL_GAP = 12; // was 18
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

function computeDetailLayout(record: FamilyRecord, font: PDFFont, valueWidth: number) {
  const rows = buildDetailRows(record);

  let height = 0;
  const rowHeights = rows.map((row) => {
    const wrapped = wrapText(row.value, font, DETAIL_FONT, valueWidth);
    const rowHeight = Math.max(DETAIL_LINE_HEIGHT, wrapped.length * 10.5) + DETAIL_ROW_GAP;
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

async function calculatePhotoLayout(
  pdfDoc: PDFDocument,
  record: FamilyRecord,
  areaWidth?: number,
  areaHeight?: number,
  isSingleDigit = false,
): Promise<PhotoLayoutInfo> {
  const photos = getPhotos(record);
  
  if (photos.length === 0) {
    return { photos: [], imageLayout: null, layoutWidth: 0, layoutHeight: 0, isHorizontal: false };
  }

  const embeddedPhotos: PhotoInfo[] = [];
  const seenContent = new Set<string>();

  for (const [index, photoPath] of photos.slice(0, 2).entries()) {
    try {
      const { image, width: origW, height: origH, contentHash } = await embedPhoto(pdfDoc, photoPath);

      if (seenContent.has(contentHash)) {
        continue;
      }
      seenContent.add(contentHash);

      embeddedPhotos.push({ id: `${index}`, image, width: origW, height: origH });
    } catch {
      // Skip photos that can't be loaded
    }
  }

  if (embeddedPhotos.length === 0) {
    return { photos: [], imageLayout: null, layoutWidth: 0, layoutHeight: 0, isHorizontal: false };
  }

  const photoInputs = embeddedPhotos.map((photo) => ({ id: photo.id, width: photo.width, height: photo.height }));
  const containerW = areaWidth ?? (isSingleDigit ? CONTENT_WIDTH - BLOCK_PADDING_X * 2 : PHOTO_AREA_WIDTH);

  if (isSingleDigit) {
    // Single-family template: size the image container dynamically by photo count.
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

  const containerH = areaHeight ?? PHOTO_SLOT_MAX_HEIGHT;
  // Compact template: with 2 photos prefer side-by-side so each photo gets the full
  // slot width and looks larger, instead of the engine's default stack-vertical for
  // landscape shots. Fall back to the engine's own choice (stacked for ultra-wides)
  // when a photo is so wide that side-by-side slots would render it smaller.
  const anyUltraWide = embeddedPhotos.some((photo) => photo.width / photo.height > 1.8);
  const layoutOptions = embeddedPhotos.length === 2 && !anyUltraWide ? { forceLayout: 'side-by-side' as const } : undefined;
  const imageLayout = createImageLayout(photoInputs, containerW, containerH, PHOTO_GAP, layoutOptions);

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
  const iconSize = 11;
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
  if (/^\d$/.test(String(record.code).trim())) {
    return drawSingleDigitFamilyBlock(page, record, startY, font, boldFont, loadAsset, layout);
  }

  const innerWidth = CONTENT_WIDTH - BLOCK_PADDING_X * 2;
  const photoX = CONTENT_MARGIN_X + BLOCK_PADDING_X;
  
  const blockHeight = layout.blockHeight;
  const blockTop = startY;
  const blockBottom = blockTop - blockHeight;

  await drawCodeBadge(page, photoX, blockTop, record.code, boldFont);
  
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

  const isSingleDigitCode = /^\d$/.test(String(record.code).trim());
  let badgeX = photoX;
  if (isSingleDigitCode) {
    const badgeText = `CODE ${record.code}`;
    const badgeWidth = Math.max(CODE_BADGE_MIN_WIDTH, measureTextWidth(boldFont, badgeText, CODE_BADGE_TEXT_SIZE) + CODE_BADGE_PADDING_X * 2);
    badgeX = photoX + (innerWidth - badgeWidth) / 2;
  }

  const topSectionHeight = layout.topSectionHeight;
  const firstPageBaseHeight = isSingleDigitCode
    ? layout.blockHeight - (layout.tableHeight ? TABLE_GAP + layout.tableHeight + TABLE_BOTTOM_PADDING : 0)
    : PHOTO_TOP_OFFSET + topSectionHeight + BLOCK_PADDING_BOTTOM;
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
  }

  nextChildIndex = firstRows;

  while (nextChildIndex < childCount) {
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    await drawDecorativeBorder(currentPage);
    currentStartY = PAGE_BLOCK_TOP;

    const topOffset = isSingleDigitCode ? CODE_BADGE_HEIGHT + 8 : PHOTO_TOP_OFFSET;
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

  // Two-pass layout: 1) measure all blocks, 2) paginate and compute leftover space,
  // 3) for pages with 1-2 cards apply a modest scale to photo area and re-measure.
  const measuredLayouts: FamilyBlockLayout[] = [];
  for (const record of records) {
    const isSingleDigit = /^\d$/.test(String(record.code).trim());
    const photoLayout = await calculatePhotoLayout(pdfDoc, record, undefined, undefined, isSingleDigit);
    const layout = isSingleDigit
      ? measureSingleDigitBlockLayout(record, font, photoLayout)
      : measureFamilyBlockLayout(record, font, photoLayout);
    measuredLayouts.push(layout);
  }

  // Simulate pagination to group record indices into pages
  const pages: number[][] = [];
  let currentPage: number[] = [];
  let used = 0;
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    const h = measuredLayouts[i].blockHeight;
    const gap = currentPage.length > 0 ? BLOCK_GAP : 0;
    const isSingleDigitCode = /^\d$/.test(String(record.code).trim());

    if (isSingleDigitCode) {
      if (currentPage.length > 0) pages.push(currentPage);
      currentPage = [i];
      used = PAGE_BLOCK_MAX_HEIGHT + 1;
    } else if (used + gap + h > PAGE_BLOCK_MAX_HEIGHT) {
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
          const record = records[idx];
          if (/^\d$/.test(String(record.code).trim())) continue;
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
    const isSingleDigitCode = /^\d$/.test(String(record.code).trim());

    if (isSingleDigitCode) {
      if (requiredHeight <= PAGE_BLOCK_MAX_HEIGHT) {
        const centeredY = PAGE_BLOCK_TOP - (PAGE_BLOCK_MAX_HEIGHT - requiredHeight) / 2;
        if (centeredY - requiredHeight >= PAGE_BLOCK_BOTTOM) {
          if (cursorY >= PAGE_BLOCK_TOP) {
            cursorY = centeredY;
          } else {
            page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            await drawDecorativeBorder(page);
            cursorY = centeredY;
          }
        } else if (cursorY < PAGE_BLOCK_TOP) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          await drawDecorativeBorder(page);
          cursorY = PAGE_BLOCK_TOP;
        }
      } else if (cursorY < PAGE_BLOCK_TOP) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        await drawDecorativeBorder(page);
        cursorY = PAGE_BLOCK_TOP;
      }
    }

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
      cursorY = isSingleDigitCode ? PAGE_BLOCK_BOTTOM : result.cursorY - BLOCK_GAP;
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
    cursorY = isSingleDigitCode ? PAGE_BLOCK_BOTTOM : cursorY - BLOCK_GAP;
  }

  drawPageNumbers(pdfDoc, font, 1);

  return pdfDoc.save();
}

export async function exportSingleRecordPDF(record: FamilyRecord): Promise<Uint8Array> {
  return generateFamilyDirectoryPDF([record], `Family Record - ${formatName(record.name)}`);
}

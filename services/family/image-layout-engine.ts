export type ImageAspectType = 'portrait' | 'square' | 'landscape' | 'ultra-landscape';

export type ImageLayoutInput = {
  id: string;
  width: number;
  height: number;
};

export type ImageMetadata = ImageLayoutInput & {
  aspectRatio: number;
  type: ImageAspectType;
};

export type ImageCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImagePlacement = {
  imageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
  cropRect: ImageCropRect;
};

export type ImageLayoutResult = {
  selectedLayout: string;
  containerWidth: number;
  containerHeight: number;
  images: ImageMetadata[];
  placements: ImagePlacement[];
};

export type FixedCellLayoutOptions = {
  cellWidth: number;
  cellHeight: number;
};

export type ImageLayoutOptions = {
  fixedCell?: FixedCellLayoutOptions;
  forceLayout?: string;
};

type Slot = {
  imageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type LayoutTemplate = {
  id: string;
  slots: Slot[];
};

export function classifyImage(width: number, height: number): ImageMetadata {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const aspectRatio = safeWidth / safeHeight;

  let type: ImageAspectType;
  if (aspectRatio < 0.8) {
    type = 'portrait';
  } else if (aspectRatio <= 1.2) {
    type = 'square';
  } else if (aspectRatio <= 1.8) {
    type = 'landscape';
  } else {
    type = 'ultra-landscape';
  }

  return { id: '', width: safeWidth, height: safeHeight, aspectRatio, type };
}

export function createImageLayout(
  inputImages: ImageLayoutInput[],
  containerWidth: number,
  containerHeight: number,
  gap: number,
  options?: ImageLayoutOptions,
): ImageLayoutResult {
  const images = inputImages.slice(0, 2).map((image) => ({
    ...classifyImage(image.width, image.height),
    id: image.id,
  }));

  if (images.length === 0) {
    return {
      selectedLayout: 'empty',
      containerWidth: 0,
      containerHeight: 0,
      images,
      placements: [],
    };
  }

  let templates: LayoutTemplate[];
  let layoutWidth: number;
  let layoutHeight: number;

  const fixedCell = options?.fixedCell;
  if (fixedCell) {
    layoutWidth = images.length * fixedCell.cellWidth + Math.max(0, images.length - 1) * gap;
    layoutHeight = fixedCell.cellHeight;
    templates = [
      {
        id: 'fixed-cells',
        slots: images.map((image, index) => ({
          imageIndex: index,
          x: index * (fixedCell.cellWidth + gap),
          y: 0,
          width: fixedCell.cellWidth,
          height: fixedCell.cellHeight,
        })),
      },
    ];
  } else {
    layoutWidth = containerWidth;
    layoutHeight = containerHeight;
    templates = buildTemplates(images, containerWidth, containerHeight, gap);
  }

  if (options?.forceLayout) {
    const forced = templates.find((template) => template.id === options.forceLayout);
    if (forced) {
      return {
        selectedLayout: forced.id,
        containerWidth: layoutWidth,
        containerHeight: layoutHeight,
        images,
        placements: forced.slots.map((slot) => createPlacement(images[slot.imageIndex], slot)),
      };
    }
  }

  const best = templates
    .map((template) => ({ template, score: scoreTemplate(template, images) }))
    .sort((a, b) => b.score - a.score)[0].template;

  return {
    selectedLayout: best.id,
    containerWidth: layoutWidth,
    containerHeight: layoutHeight,
    images,
    placements: best.slots.map((slot) => createPlacement(images[slot.imageIndex], slot)),
  };
}

function buildTemplates(
  images: ImageMetadata[],
  containerWidth: number,
  containerHeight: number,
  gap: number,
): LayoutTemplate[] {
  if (images.length === 1) {
    return [{
      id: 'single-centered',
      slots: [{ imageIndex: 0, x: 0, y: 0, width: containerWidth, height: containerHeight }],
    }];
  }

  const halfWidth = (containerWidth - gap) / 2;
  const halfHeight = (containerHeight - gap) / 2;
  const templates: LayoutTemplate[] = [
    {
      id: 'stack-vertical',
      slots: [
        { imageIndex: 0, x: 0, y: halfHeight + gap, width: containerWidth, height: halfHeight },
        { imageIndex: 1, x: 0, y: 0, width: containerWidth, height: halfHeight },
      ],
    },
    {
      id: 'side-by-side',
      slots: [
        { imageIndex: 0, x: 0, y: 0, width: halfWidth, height: containerHeight },
        { imageIndex: 1, x: halfWidth + gap, y: 0, width: halfWidth, height: containerHeight },
      ],
    },
  ];

  const landscapeIndex = images.findIndex((image) => image.type === 'landscape' || image.type === 'ultra-landscape');
  const portraitIndex = images.findIndex((image) => image.type === 'portrait');

  if (landscapeIndex >= 0) {
    const otherIndex = landscapeIndex === 0 ? 1 : 0;
    templates.push({
      id: 'landscape-on-top',
      slots: [
        { imageIndex: landscapeIndex, x: 0, y: halfHeight + gap, width: containerWidth, height: halfHeight },
        { imageIndex: otherIndex, x: 0, y: 0, width: containerWidth, height: halfHeight },
      ],
    });
  }

  if (portraitIndex >= 0 && landscapeIndex >= 0 && portraitIndex !== landscapeIndex) {
    const portraitWidth = Math.min(containerWidth * 0.42, Math.max(containerWidth * 0.34, halfWidth));
    const landscapeWidth = containerWidth - gap - portraitWidth;
    templates.push({
      id: 'portrait-beside-landscape',
      slots: [
        { imageIndex: portraitIndex, x: 0, y: 0, width: portraitWidth, height: containerHeight },
        { imageIndex: landscapeIndex, x: portraitWidth + gap, y: 0, width: landscapeWidth, height: containerHeight },
      ],
    });
  }

  return templates.filter((template) => template.slots.every((slot) => slot.width > 0 && slot.height > 0));
}

function scoreTemplate(template: LayoutTemplate, images: ImageMetadata[]) {
  const slotAreas = template.slots.map((slot) => slot.width * slot.height);
  const visibleArea = slotAreas.reduce((sum, area) => sum + area, 0);
  const cropRetention = template.slots.reduce((sum, slot) => {
    const image = images[slot.imageIndex];
    return sum + getCropRetention(image, slot) * (slot.width * slot.height);
  }, 0) / Math.max(visibleArea, 1);
  const balance = Math.min(...slotAreas) / Math.max(...slotAreas);
  const fitQuality = template.slots.reduce((sum, slot) => {
    const image = images[slot.imageIndex];
    const slotAspect = slot.width / slot.height;
    return sum + Math.min(image.aspectRatio, slotAspect) / Math.max(image.aspectRatio, slotAspect);
  }, 0) / template.slots.length;
  const typeBonus = getTypeBonus(template.id, images);

  return visibleArea * (0.55 + cropRetention * 0.25 + balance * 0.1 + fitQuality * 0.1 + typeBonus);
}

function getTypeBonus(templateId: string, images: ImageMetadata[]) {
  const types = images.map((image) => image.type);
  if (templateId === 'side-by-side' && types.every((type) => type === 'portrait' || type === 'square')) {
    return 0.16;
  }
  if (templateId === 'stack-vertical' && types.every((type) => type === 'landscape' || type === 'ultra-landscape')) {
    return 0.1;
  }
  if (templateId === 'portrait-beside-landscape') {
    return 0.08;
  }
  if (templateId === 'landscape-on-top') {
    return 0.04;
  }
  return 0;
}

function getCropRetention(image: ImageMetadata, slot: Slot) {
  const slotAspect = slot.width / slot.height;
  if (image.aspectRatio > slotAspect) {
    return slotAspect / image.aspectRatio;
  }
  return image.aspectRatio / slotAspect;
}

function createPlacement(image: ImageMetadata, slot: Slot): ImagePlacement {
  const scale = Math.min(slot.width / image.width, slot.height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = slot.x + (slot.width - drawWidth) / 2;
  const drawY = slot.y + (slot.height - drawHeight) / 2;
  const cropRect = {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  };

  return {
    imageId: image.id,
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    cropRect,
  };
}

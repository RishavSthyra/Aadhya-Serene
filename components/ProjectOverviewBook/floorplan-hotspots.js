const SMALL_SPREAD_WIDTH = 915;
const SMALL_SPREAD_HEIGHT = 494;

const FIRST_FLOOR_BASE =
  'https://cdn.sthyra.com/AADHYA%20SERENE/images/individual-floorplans/First%20Floor/';
const SECOND_FLOOR_BASE =
  'https://cdn.sthyra.com/AADHYA%20SERENE/images/individual-floorplans/Second%20Floor/';
const FORTH_FLOOR_BASE =
  'https://cdn.sthyra.com/AADHYA%20SERENE/images/individual-floorplans/Forth%20Floor/';
const GENERATED_FLOORPLAN_BASE = '/generated-floorplans/';

function box(x1, y1, x2, y2, inset = 1) {
  const left = x1 + inset;
  const top = y1 + inset;
  const right = x2 - inset;
  const bottom = y2 - inset;

  return {
    x: left / SMALL_SPREAD_WIDTH,
    y: top / SMALL_SPREAD_HEIGHT,
    width: (right - left) / SMALL_SPREAD_WIDTH,
    height: (bottom - top) / SMALL_SPREAD_HEIGHT,
  };
}

function preview(unitCode, previewSrc) {
  return { unitCode, previewSrc };
}

function cdnPreview(baseUrl, filename, unitCode = filename.replace('.png', '')) {
  return preview(unitCode, `${baseUrl}${filename}`);
}

function localPreview(filename, unitCode = filename.replace('.png', '')) {
  return preview(unitCode, `${GENERATED_FLOORPLAN_BASE}${filename}`);
}

function buildHotspots(sectionKey, sectionLabel, previews, boxes) {
  return previews.map(({ unitCode, previewSrc }, index) => {
    return {
      id: `${sectionKey}-${unitCode}`,
      sectionLabel,
      unitCode,
      previewSrc,
      box: boxes[index],
    };
  });
}

const firstTopRowBoxes = [
  box(39, 36, 102, 94),
  box(108, 36, 173, 94),
  box(177, 36, 244, 94),
  box(248, 36, 317, 94),
  box(330, 36, 398, 94),
  box(456, 36, 542, 94),
  box(546, 36, 616, 94),
  box(620, 36, 693, 94),
  box(697, 36, 766, 94),
];

const firstBottomRowBoxes = [
  box(38, 98, 111, 156),
  box(144, 98, 209, 156),
  box(236, 98, 299, 156),
  box(321, 98, 365, 156),
  box(391, 98, 454, 156),
  box(476, 98, 533, 156),
  box(549, 98, 612, 156),
  box(635, 98, 699, 156),
  box(721, 98, 779, 156),
];

const secondTopRowBoxes = [
  box(46, 176, 109, 240),
  box(114, 176, 179, 240),
  box(183, 176, 250, 240),
  box(255, 176, 323, 240),
  box(335, 176, 403, 240),
  box(461, 176, 544, 240),
  box(549, 176, 618, 240),
  box(623, 176, 695, 240),
  box(699, 176, 767, 240),
];

const secondBottomRowBoxes = [
  box(38, 245, 111, 304),
  box(144, 245, 209, 304),
  box(236, 245, 299, 304),
  box(321, 245, 365, 304),
  box(391, 245, 454, 304),
  box(476, 245, 533, 304),
  box(549, 245, 612, 304),
  box(635, 245, 699, 304),
  box(721, 245, 779, 304),
];

const forthTopRowBoxes = [
  box(45, 327, 105, 392),
  box(114, 327, 176, 392),
  box(183, 327, 247, 392),
  box(255, 327, 319, 392),
  box(336, 327, 401, 392),
  box(459, 327, 533, 392),
  box(547, 327, 610, 392),
  box(624, 327, 690, 392),
  box(697, 327, 760, 392),
  box(778, 327, 840, 392),
  box(847, 327, 909, 392),
];

const forthBottomRowBoxes = [
  box(37, 397, 116, 458),
  box(148, 397, 208, 458),
  box(238, 397, 298, 458),
  box(327, 397, 386, 458),
  box(394, 397, 454, 458),
  box(482, 397, 542, 458),
  box(550, 397, 610, 458),
  box(638, 397, 699, 458),
  box(706, 397, 768, 458),
  box(778, 397, 839, 458),
  box(847, 397, 909, 458),
];

const firstFloorHotspots = buildHotspots(
  'first-floor',
  'First Floor Plan',
  [
    cdnPreview(FIRST_FLOOR_BASE, '110-E.png'),
    cdnPreview(FIRST_FLOOR_BASE, '111-W.png'),
    cdnPreview(FIRST_FLOOR_BASE, '112-E.png'),
    cdnPreview(FIRST_FLOOR_BASE, '113-W.png'),
    cdnPreview(FIRST_FLOOR_BASE, '114-W.png'),
    cdnPreview(FIRST_FLOOR_BASE, '115-E.png'),
    cdnPreview(FIRST_FLOOR_BASE, '116-W.png'),
    cdnPreview(FIRST_FLOOR_BASE, '117-E.png'),
    cdnPreview(FIRST_FLOOR_BASE, '118-W.png'),
    cdnPreview(FIRST_FLOOR_BASE, '109-N.png'),
    cdnPreview(FIRST_FLOOR_BASE, '108-N.png'),
    cdnPreview(FIRST_FLOOR_BASE, '107-N.png'),
    cdnPreview(FIRST_FLOOR_BASE, '106-N.png'),
    cdnPreview(FIRST_FLOOR_BASE, '105-N.png'),
    cdnPreview(FIRST_FLOOR_BASE, '104-N.png'),
    cdnPreview(FIRST_FLOOR_BASE, '103-N.png'),
    cdnPreview(FIRST_FLOOR_BASE, '102-N.png'),
    cdnPreview(FIRST_FLOOR_BASE, '101-N.png'),
  ],
  [...firstTopRowBoxes, ...firstBottomRowBoxes],
);

const secondFloorHotspots = buildHotspots(
  'second-floor',
  'Second & Third Floor Plan',
  [
    cdnPreview(SECOND_FLOOR_BASE, '210-E.png'),
    cdnPreview(SECOND_FLOOR_BASE, '211-W.png'),
    cdnPreview(SECOND_FLOOR_BASE, '212-E.png'),
    cdnPreview(SECOND_FLOOR_BASE, '213-W.png'),
    cdnPreview(SECOND_FLOOR_BASE, '214-W.png'),
    cdnPreview(SECOND_FLOOR_BASE, '215-E.png'),
    cdnPreview(SECOND_FLOOR_BASE, '216-W.png'),
    cdnPreview(SECOND_FLOOR_BASE, '217-E.png'),
    cdnPreview(SECOND_FLOOR_BASE, '218-W.png'),
    cdnPreview(SECOND_FLOOR_BASE, '209-N.png'),
    cdnPreview(SECOND_FLOOR_BASE, '208-N.png'),
    cdnPreview(SECOND_FLOOR_BASE, '207-N.png'),
    cdnPreview(SECOND_FLOOR_BASE, '206-N.png'),
    cdnPreview(SECOND_FLOOR_BASE, '205-N.png'),
    cdnPreview(SECOND_FLOOR_BASE, '204-N.png'),
    cdnPreview(SECOND_FLOOR_BASE, '203-N.png'),
    cdnPreview(SECOND_FLOOR_BASE, '202-N.png'),
    cdnPreview(SECOND_FLOOR_BASE, '201-N.png'),
  ],
  [...secondTopRowBoxes, ...secondBottomRowBoxes],
);

const forthFloorHotspots = buildHotspots(
  'forth-floor',
  'Fourth To Sixth Floors Plan',
  [
    cdnPreview(FORTH_FLOOR_BASE, '410-E.png'),
    cdnPreview(FORTH_FLOOR_BASE, '411-W.png'),
    cdnPreview(FORTH_FLOOR_BASE, '412-E.png'),
    cdnPreview(FORTH_FLOOR_BASE, '413-W.png'),
    cdnPreview(FORTH_FLOOR_BASE, '414-W.png'),
    cdnPreview(FORTH_FLOOR_BASE, '415-E.png'),
    cdnPreview(FORTH_FLOOR_BASE, '416-W.png'),
    cdnPreview(FORTH_FLOOR_BASE, '417-E.png'),
    cdnPreview(FORTH_FLOOR_BASE, '418-W.png'),
    cdnPreview(FORTH_FLOOR_BASE, '419-E.png'),
    cdnPreview(FORTH_FLOOR_BASE, '420-W.png'),
    localPreview('409-N.png'),
    cdnPreview(FORTH_FLOOR_BASE, '408-N.png'),
    cdnPreview(FORTH_FLOOR_BASE, '407-N.png'),
    cdnPreview(FORTH_FLOOR_BASE, '406-N.png'),
    cdnPreview(FORTH_FLOOR_BASE, '405-N.png'),
    cdnPreview(FORTH_FLOOR_BASE, '404-N.png'),
    cdnPreview(FORTH_FLOOR_BASE, '403-N.png'),
    cdnPreview(FORTH_FLOOR_BASE, '402-N.png'),
    cdnPreview(FORTH_FLOOR_BASE, '401-N.png'),
    cdnPreview(FORTH_FLOOR_BASE, '422-N.png'),
    localPreview('421-W.png', '421-W'),
  ],
  [...forthTopRowBoxes, ...forthBottomRowBoxes],
);

export const spreadFloorplanHotspots = [
  ...firstFloorHotspots,
  ...secondFloorHotspots,
  ...forthFloorHotspots,
];

export const spreadFloorplanPreviewUrls = spreadFloorplanHotspots.map(
  (hotspot) => hotspot.previewSrc,
);

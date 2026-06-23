const coverPage = '/FlipbookPages/coverpagenew.avif';
const backCover = '/FlipbookPages/page8.avif'
const spreadPage = '/FlipbookPages/Page5_And_6.avif';
const masterplanSpreadPage = '/FlipbookPages/Masterplan%20Page.avif';
const specificationsLeftPage = '/FlipbookPages/Spec%20Left%20section%20Image.avif';
const specificationsRightPage = '/FlipbookPages/Specificaitions%20Right%20Page.avif';

export const flipbookPages = [
  {
    key: 'cover',
    src: coverPage,
    alt: 'Project overview cover',
    hard: true,
  },
  {
    key: 'page-3',
    src: '/FlipbookPages/page3new2.avif',
    alt: 'Project overview page 3',
  },
  {
    key: 'page-4',
    src: '/FlipbookPages/page4new.avif',
    alt: 'Project overview page 4',
  },
  {
    key: 'page-7',
    src: '/FlipbookPages/page7new.avif',
    alt: 'Project overview page 7',
  },
  {
    key: 'page-8',
    src: '/FlipbookPages/page9new.avif',
    alt: 'Project overview page 8',
  },
  {
    key: 'spread-left',
    src: spreadPage,
    alt: 'Project overview spread pages 5 and 6 left side',
    crop: 'left',
  },
  {
    key: 'spread-right',
    src: spreadPage,
    alt: 'Project overview spread pages 5 and 6 right side',
    crop: 'right',
  },
  {
    key: 'masterplan-left',
    src: masterplanSpreadPage,
    alt: 'Project overview masterplan spread left side',
    crop: 'left',
  },
  {
    key: 'masterplan-right',
    src: masterplanSpreadPage,
    alt: 'Project overview masterplan spread right side',
    crop: 'right',
  },
  {
    key: 'specifications-left',
    src: specificationsLeftPage,
    alt: 'Project overview specifications spread left side',
  },
  {
    key: 'specifications-right',
    src: specificationsRightPage,
    alt: 'Project overview specifications spread right side',
  },
  {
    key: 'back-cover',
    src: backCover,
    alt: 'Project overview back cover',
    hard: true,
  },
];

const coverPage = '/FlipbookPages/Coverpage.png';
const spreadPage = '/FlipbookPages/Page5_And_6.png';

export const flipbookPages = [
  {
    key: 'cover',
    src: coverPage,
    alt: 'Project overview cover',
    hard: true,
  },
  {
    key: 'page-1',
    src: '/FlipbookPages/Page1.png',
    alt: 'Project overview page 1',
  },
  {
    key: 'page-2',
    src: '/FlipbookPages/Page2.png',
    alt: 'Project overview page 2',
  },
  {
    key: 'page-3',
    src: '/FlipbookPages/Page3.png',
    alt: 'Project overview page 3',
  },
  {
    key: 'page-4',
    src: '/FlipbookPages/Page4.png',
    alt: 'Project overview page 4',
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
    key: 'back-cover',
    src: coverPage,
    alt: 'Project overview back cover',
    hard: true,
  },
];

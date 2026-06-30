import Script from 'next/script';

export default function GoogleAdsTag() {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18286156175"
        strategy="afterInteractive"
      />
      <Script id="google-ads-aw-18286156175" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', 'AW-18286156175');
        `}
      </Script>
    </>
  );
}

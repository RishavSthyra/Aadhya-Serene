const stylesheet = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Aadhya Serene Sitemap</title>
        <style>
          body {
            margin: 0;
            padding: 32px;
            background: #0b0d12;
            color: #f5f1e6;
            font-family: Inter, Arial, sans-serif;
          }

          .wrap {
            max-width: 1200px;
            margin: 0 auto;
          }

          h1 {
            margin: 0 0 12px;
            font-size: 34px;
            letter-spacing: 0.04em;
          }

          p {
            margin: 0 0 24px;
            color: #c5bfaf;
            line-height: 1.7;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
            border: 1px solid rgba(220, 194, 124, 0.18);
            border-radius: 8px;
            background: rgba(18, 22, 30, 0.92);
          }

          thead {
            background: rgba(220, 194, 124, 0.12);
          }

          th,
          td {
            padding: 14px 16px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            font-size: 14px;
            vertical-align: top;
          }

          th {
            color: #dcc27c;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 12px;
          }

          td {
            color: #f5f1e6;
          }

          tr:last-child td {
            border-bottom: none;
          }

          a {
            color: #f5f1e6;
            text-decoration: none;
            word-break: break-all;
          }

          a:hover {
            color: #dcc27c;
          }

          .meta {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin: 0 0 24px;
          }

          .stat {
            padding: 16px;
            border: 1px solid rgba(220, 194, 124, 0.18);
            border-radius: 8px;
            background: rgba(18, 22, 30, 0.92);
          }

          .label {
            display: block;
            margin-bottom: 8px;
            color: #9fa6b2;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .value {
            font-size: 20px;
            color: #f5f1e6;
          }

          @media (max-width: 900px) {
            body {
              padding: 20px;
            }

            .meta {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            th,
            td {
              padding: 12px;
              font-size: 13px;
            }
          }

          @media (max-width: 640px) {
            .meta {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>Aadhya Serene Sitemap</h1>
          <p>This sitemap is generated dynamically and styled for browser readability while remaining valid XML for search engines.</p>

          <div class="meta">
            <div class="stat">
              <span class="label">Total URLs</span>
              <span class="value">
                <xsl:value-of select="count(sitemap:urlset/sitemap:url)" />
              </span>
            </div>
            <div class="stat">
              <span class="label">Primary Domain</span>
              <span class="value">aadhyaserene.com</span>
            </div>
            <div class="stat">
              <span class="label">Format</span>
              <span class="value">XML + XSL</span>
            </div>
            <div class="stat">
              <span class="label">Coverage</span>
              <span class="value">Static + Dynamic Routes</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Last Modified</th>
                <th>Change Frequency</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a>
                      <xsl:attribute name="href">
                        <xsl:value-of select="sitemap:loc" />
                      </xsl:attribute>
                      <xsl:value-of select="sitemap:loc" />
                    </a>
                  </td>
                  <td><xsl:value-of select="sitemap:lastmod" /></td>
                  <td><xsl:value-of select="sitemap:changefreq" /></td>
                  <td><xsl:value-of select="sitemap:priority" /></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`;

export function GET() {
  return new Response(stylesheet, {
    headers: {
      'Content-Type': 'text/xsl; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

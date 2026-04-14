
const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '../public/index.html');
const componentsDir = path.join(__dirname, '../components/Home');

if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
}

const html = fs.readFileSync(indexHtmlPath, 'utf8');

// Regex to find the SVGs inside the specific containers used in the legacy code
// Logo 1: class="styles-module__TIZ3rG__heroLogo1" ... <svg ...> ... </svg>
const logo1Regex = /<div class="[^"]*heroLogo1[^"]*">.*?<svg([^>]*)>(.*?)<\/svg>.*?<\/div>/s;
const logo2Regex = /<div class="[^"]*heroLogo2[^"]*">.*?<svg([^>]*)>(.*?)<\/svg>.*?<\/div>/s;

function extractAndSave(name, regex, filename) {
    const match = html.match(regex);
    if (match) {
        let svgAttrs = match[1];
        let svgContent = match[2];

        // Convert style string to object-like string for JSX (simplified)
        // actually for exact match we might want to just dump it, but React requires camelCase styles.
        // The legacy HTML has style="shape-rendering:geometricPrecision..."

        // Quick fix for common attributes to JSX
        svgAttrs = svgAttrs.replace(/xmlns:xml="[^"]*"/g, ''); // React warns about namespaced attrs
        svgAttrs = svgAttrs.replace(/xml:space="preserve"/g, 'xmlSpace="preserve"');
        svgAttrs = svgAttrs.replace(/style="([^"]*)"/g, (m, s) => {
            const rules = s.split(';').filter(r => r.trim()).map(r => {
                const [k, v] = r.split(':');
                const camelK = k.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                return `${camelK}:"${v.trim()}"`;
            });
            return `style={{${rules.join(', ')}}}`;
        });

        // Content replacements
        svgContent = svgContent.replace(/class="/g, 'className="');
        svgContent = svgContent.replace(/style="([^"]*)"/g, (m, s) => {
            const rules = s.split(';').filter(r => r.trim()).map(r => {
                const [k, v] = r.split(':');
                const camelK = k.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                return `${camelK}:"${v.trim()}"`;
            });
            return `style={{${rules.join(', ')}}}`;
        });

        // gradients stop-color -> stopColor
        svgContent = svgContent.replace(/stop-color/g, 'stopColor');
        svgContent = svgContent.replace(/stop-opacity/g, 'stopOpacity');
        svgContent = svgContent.replace(/fill-rule/g, 'fillRule');
        svgContent = svgContent.replace(/clip-rule/g, 'clipRule');

        const componentContent = `import React from 'react';

export default function ${name}(props) {
  return (
    <svg ${svgAttrs} {...props}>
      ${svgContent}
    </svg>
  );
}
`;
        fs.writeFileSync(path.join(componentsDir, filename), componentContent);
        console.log(`Saved ${filename}`);
    } else {
        console.error(`Could not find logo for ${name}`);
    }
}

extractAndSave('AadhyaLogo', logo1Regex, 'AadhyaLogo.jsx');
extractAndSave('AbhignaLogo', logo2Regex, 'AbhignaLogo.jsx');

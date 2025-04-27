const fs = require('fs');
const path = require('path');
const TripService = require('../service/trips-service.js')
const ExcursionService = require('../service/excursion-service.js')
const PlaceService = require('../service/places-service.js')

const BASE_URL = process.env.CLIENT_URL;

async function generateSitemapAndRobots() {
  const staticRoutes = ['/', '/places', '/trips', '/excursions'];

  const tripIds = await TripService.getVisibleTripIds();
  const placeIds = await PlaceService.getVisiblePlaceIds();
  const excursionIds = await ExcursionService.getVisibleExcursionIds();

  const dynamicRoutes = [
    ...tripIds.map(id => `/trip?_id=${id}`),
    ...placeIds.map(id => `/place?_id=${id}`),
    ...excursionIds.map(id => `/excursion?_id=${id}`),
  ];

  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url><loc>${BASE_URL}${route}</loc></url>`).join('\n')}
</urlset>`;

  const sitemapPath = path.resolve(__dirname, '../dist/sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap, 'utf-8');
  console.log(`[Sitemap] Generated at ${sitemapPath}`);

  const robots = `User-agent: *
Disallow: /cabinet/
Disallow: /admin/
Disallow: /auth
Disallow: /reg
Disallow: /create-*
Disallow: /edit-*
Disallow: /moderate-*
Disallow: /fourothree
Disallow: /contract-create
Disallow: /payment
Disallow: /wl
Disallow: /catalog
Disallow: /documents
Disallow: /print-contract
Disallow: /poster
Disallow: /offer-trip
Disallow: /offers
Disallow: /calc
Disallow: /contacts
Disallow: /companions
Disallow: /forgot-password

Allow: /$
Allow: /places$
Allow: /trips$
Allow: /excursions$
Allow: /trip?_id=
Allow: /place?_id=
Allow: /excursion?_id=

Sitemap: ${BASE_URL}/sitemap.xml
`;

  const robotsPath = path.resolve(__dirname, '../dist/robots.txt');
  fs.writeFileSync(robotsPath, robots, 'utf-8');
  console.log(`[robots.txt] Generated at ${robotsPath}`);
}


module.exports = generateSitemapAndRobots
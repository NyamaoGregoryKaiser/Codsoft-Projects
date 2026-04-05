const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const targetRoute = require('./target.route');
const scrapeJobRoute = require('./scrapeJob.route');
const scrapedDataRoute = require('./scrapedData.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/targets',
    route: targetRoute,
  },
  {
    path: '/scrape-jobs',
    route: scrapeJobRoute,
  },
  {
    path: '/scraped-data',
    route: scrapedDataRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
const express = require("express");
const ee = require("@google/earthengine");

const router = express.Router();

router.get("/", (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const y = parseInt(req.query.year, 10);
  const m = parseInt(req.query.month, 10);

  if (isNaN(lat) || isNaN(lon) || isNaN(y) || isNaN(m)) {
    return res.status(400).json({ error: "lat, lon, year, and month required" });
  }

  const start = `${y}-${m}-01`;
  const endY = m === 12 ? y + 1 : y;
  const endM = m === 12 ? 1 : m + 1;
  const end = `${endY}-${endM}-01`;

  const point = ee.Geometry.Point([lon, lat]);

  const image = ee
    .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(point)
    .filterDate(start, end)
    .median()
    .normalizedDifference(["B8", "B4"])
    .rename("NDVI");

  image
    .reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: point,
      scale: 10,
    })
    .evaluate((val, err) => {
      if (err) res.status(500).send(err);
      else res.json({ lat, lon, year: y, month: m, ndvi: val ? val.NDVI : null });
    });
});

module.exports = router;

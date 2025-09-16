const express = require("express");
const ee = require("@google/earthengine");

const router = express.Router();

router.get("/", (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const date = req.query.date || "2023-06-01";

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: "lat and lon required" });
  }

  const point = ee.Geometry.Point([lon, lat]);

  const image = ee
    .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(point)
    .filterDate(date, ee.Date(date).advance(1, "month"))
    .median()
    .normalizedDifference(["B8", "B4"])
    .rename("NDVI");

  image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: point,
    scale: 10,
  }).evaluate((val, err) => {
    if (err) res.status(500).send(err);
    else res.json({ lat, lon, date, ndvi: val ? val.NDVI : null });
  });
});

module.exports = router;

const express = require("express");
const ee = require("@google/earthengine");
const fs = require("fs");
const path = require("path");

const router = express.Router();

function maskClouds(img) {
  const scl = img.select("SCL");
  const mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
  return img.updateMask(mask);
}

router.get("/", (req, res) => {
  const racePath = path.join(__dirname, "data", "horsham_4326.geojson");
  const race = JSON.parse(fs.readFileSync(racePath));
  const aoi = ee.FeatureCollection(race);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const start = ee.Date.fromYMD(year, month, 1);
  const end = start.advance(1, "month");

  const collection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(aoi)
    .filterDate(start, end)
    .map(maskClouds)
    .map(img => img.normalizedDifference(["B8", "B4"]).rename("NDVI"));

  collection.size().getInfo(s => {
    console.log(`Scenes found for ${year}-${month}:`, s);
  });

  const mean = collection.mean().clip(aoi);

  mean.reduceRegion({
    reducer: ee.Reducer.minMax(),
    geometry: aoi,
    scale: 10,
    maxPixels: 1e9
  }).getInfo(info => {
    console.log(`NDVI min/max for ${year}-${month}:`, info);
  });

  const vis = { min: -1, max: 1, palette: ["blue", "white", "brown", "yellow", "green"] };


  mean.getMap(vis, (mapObj, err) => {
    if (err) return res.status(500).send(err);
    const tileUrl = `https://earthengine.googleapis.com/v1/${mapObj.mapid}/tiles/{z}/{x}/{y}`;
    res.json({ tileUrl, year, month });
  });
});

module.exports = router;

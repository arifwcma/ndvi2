const express = require("express");
const ee = require("@google/earthengine");

const router = express.Router();

router.get("/", (req, res) => {
  const y = parseInt(req.query.year, 10) || new Date().getFullYear();
  const m = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
  const start = `${y}-${m}-01`;
  const endY = m === 12 ? y + 1 : y;
  const endM = m === 12 ? 1 : m + 1;
  const end = `${endY}-${endM}-01`;

  const region = ee.Geometry.Polygon([
    [
      [140.963783171735315, -37.368096687169292],
      [143.363961290248056, -37.368096687169292],
      [143.363961290248056, -35.656805505972457],
      [140.963783171735315, -35.656805505972457],
      [140.963783171735315, -37.368096687169292]
    ]
  ]);

  const maskClouds = (img) => {
    const scl = img.select("SCL");
    const mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
    return img.updateMask(mask);
  };

  const ndvi = ee
    .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(region)
    .filterDate(start, end)
    .map(maskClouds)
    .map((img) => img.normalizedDifference(["B8", "B4"]).rename("NDVI"))
    .mean()
    .clip(region);

  ndvi.getMap({ min: -1, max: 1, palette: ["brown", "white", "green"] }, (mapObj, err) => {
    if (err) return res.status(500).send(err);
    let tileUrl = `https://earthengine.googleapis.com/map/${mapObj.mapid}/{z}/{x}/{y}.png`;
    if (mapObj.token) {
      tileUrl += `?token=${mapObj.token}`;
    }
    res.json({ mapid: mapObj.mapid, token: mapObj.token, tileUrl, start, end });
  });

});

module.exports = router;

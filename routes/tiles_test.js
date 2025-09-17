const express = require("express");
const ee = require("@google/earthengine");

const router = express.Router();

router.get("/", (req, res) => {
  const img = ee.Image.constant(1).visualize({
    min: 0,
    max: 1,
    palette: ["black", "white"]
  });

  img.getMap({}, (mapObj, err) => {
    if (err) return res.status(500).send(err);

    const tileUrl = `https://earthengine.googleapis.com/${mapObj.mapid}/{z}/{x}/{y}.png`;
    const sample = tileUrl
      .replace("{z}", "0")
      .replace("{x}", "0")
      .replace("{y}", "0");

    res.json({ tileUrl, sample });
  });
});

module.exports = router;

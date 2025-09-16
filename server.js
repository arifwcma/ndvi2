const express = require("express");
const bodyParser = require("body-parser");
const ee = require("@google/earthengine");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

const privateKey = JSON.parse(fs.readFileSync("service-account.json"));

ee.data.authenticateViaPrivateKey(privateKey, () => {
  ee.initialize(null, null, () => {
    console.log("✅ EE initialized with service account");
  });
});

app.get("/ndvi", (req, res) => {
  const region = ee.Geometry.Polygon([
    [
      [140.963783171735315, -37.368096687169292],
      [143.363961290248056, -37.368096687169292],
      [143.363961290248056, -35.656805505972457],
      [140.963783171735315, -35.656805505972457],
      [140.963783171735315, -37.368096687169292],
    ],
  ]);

  const image = ee
    .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterDate("2023-06-01", "2023-06-30")
    .filterBounds(region)
    .median()
    .normalizedDifference(["B8", "B4"])
    .visualize({ min: 0, max: 1, palette: ["brown", "yellow", "green"] });

  image.getThumbURL(
    { dimensions: 512, region: region, format: "png" },
    (url, error) => {
      if (error) res.status(500).send(error);
      else res.json({ url });
    }
  );
});

app.listen(3001, () =>
  console.log("Server running on http://localhost:3001")
);

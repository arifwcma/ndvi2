const express = require("express");
const bodyParser = require("body-parser");
const ee = require("@google/earthengine");
const fs = require("fs");

const app = express();

const cors = require("cors");
app.use(cors());

app.use(bodyParser.json());

const privateKey = JSON.parse(fs.readFileSync("service-account.json"));

ee.data.authenticateViaPrivateKey(privateKey, () => {
  ee.initialize(null, null, () => {
    console.log("✅ EE initialized with service account");
  });
});

const ndviRoutes = require("./routes/ndvi");
app.use("/ndvi", ndviRoutes);

const valueRoutes = require("./routes/value");
app.use("/ndvi/value", valueRoutes);

const valueMonthRoutes = require("./routes/value_month");
app.use("/ndvi/value_month", valueMonthRoutes);

const tilesTest = require("./routes/tiles_test");
app.use("/test/tiles", tilesTest);

const tilesToy = require("./routes/tiles_toy");
app.use("/toy/tiles", tilesToy);

const boundary = require("./routes/boundary");
app.use("/boundary", boundary);

const ndviMonth = require("./routes/ndvi_month");
app.use("/ndvi/month", ndviMonth);

const ndviRace = require("./routes/ndvi_race");
app.use("/ndvi/race", ndviRace);

const ndviWcma = require("./routes/ndvi_wcma");
app.use("/ndvi/wcma", ndviWcma);

const ndviWcmaMonthly = require("./routes/ndvi_wcma_monthly")
app.use("/ndvi/wcma_monthly", ndviWcmaMonthly)

app.listen(3001, () =>
  console.log("Server running on http://localhost:3001")
);


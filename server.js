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

const ndviRoutes = require("./routes/ndvi");
app.use("/ndvi", ndviRoutes);

const valueRoutes = require("./routes/value");
app.use("/ndvi/value", valueRoutes);

const valueMonthRoutes = require("./routes/value_month");
app.use("/ndvi/value_month", valueMonthRoutes);


app.listen(3001, () =>
  console.log("Server running on http://localhost:3001")
);


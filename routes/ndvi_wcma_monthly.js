const express = require("express")
const ee = require("@google/earthengine")
const fs = require("fs")
const path = require("path")

const router = express.Router()

router.get("/", (req, res) => {
  const year = parseInt(req.query.year)
  const month = parseInt(req.query.month)

  if (!year || !month) {
    return res.status(400).json({ error: "Missing year or month" })
  }

  const boundaryPath = path.join(__dirname, "data", "boundary_4326.geojson")
  const boundary = JSON.parse(fs.readFileSync(boundaryPath))
  const aoi = ee.FeatureCollection(boundary)

  const start = ee.Date.fromYMD(year, month, 1)
  const end = start.advance(1, "month")

  const maskClouds = image => {
    const scl = image.select("SCL")
    const mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10))
    return image.updateMask(mask)
  }

  const collection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(aoi)
    .filterDate(start, end)
    .map(maskClouds)
    .map(img => img.normalizedDifference(["B8", "B4"]).rename("NDVI"))

  collection.size().getInfo(size => {
    console.log(`Scenes found for ${year}-${month}:`, size)
  })

  const mean = collection.mean().clip(aoi)
  const vis = { min: -1, max: 1, palette: ["brown", "yellow", "green"] }

  mean.getMap(vis, (mapObj, err) => {
    if (err) return res.status(500).send(err)

    const tileUrl = `https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/${mapObj.mapid}/tiles/{z}/{x}/{y}`
    res.json({ tileUrl, year, month })
  })
})

module.exports = router

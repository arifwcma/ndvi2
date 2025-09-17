const express = require("express")
const ee = require("@google/earthengine")
const fs = require("fs")
const path = require("path")

const router = express.Router()

router.get("/", (req, res) => {
  const boundaryPath = path.join(__dirname, "data", "boundary_4326.geojson")
  const boundary = JSON.parse(fs.readFileSync(boundaryPath))
  const aoi = ee.FeatureCollection(boundary)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const start = ee.Date.fromYMD(year, month, 1)
  const end = start.advance(1, "month")

  const collection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(aoi)
    .filterDate(start, end)
    .map(img => img.normalizedDifference(["B8", "B4"]).rename("NDVI"))

  collection.size().getInfo(size => {
    console.log(`Scenes found for WCMA ${year}-${month}:`, size)
  })

  const mean = collection.mean().clip(aoi)
  const vis = { 
    min: -1, 
    max: 1, 
    palette: ["blue", "white", "yellow", "green", "darkgreen"] 
  }

  mean.getMap(vis, (mapObj, err) => {
    if (err) return res.status(500).send(err)

    const tileUrl = `https://earthengine.googleapis.com/v1/${mapObj.mapid}/tiles/{z}/{x}/{y}`
    res.json({ tileUrl, year, month })
  })
})

module.exports = router

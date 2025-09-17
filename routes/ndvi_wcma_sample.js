const express = require("express")
const ee = require("@google/earthengine")
const fs = require("fs")
const path = require("path")

const router = express.Router()

router.get("/", (req, res) => {
  const year = parseInt(req.query.year)
  const month = parseInt(req.query.month)
  const lat = parseFloat(req.query.lat)
  const lon = parseFloat(req.query.lon)
  if (!year || !month || isNaN(lat) || isNaN(lon)) return res.status(400).json({ error: "Missing params" })

  const boundaryPath = path.join(__dirname, "data", "boundary_4326.geojson")
  const boundary = JSON.parse(fs.readFileSync(boundaryPath))
  const aoi = ee.FeatureCollection(boundary)
  const point = ee.Geometry.Point([lon, lat])

  aoi.geometry().contains(point).getInfo(isInside => {
    if (!isInside) return res.json({ inside: false, ndvi: null, lat, lon, year, month })

    const start = ee.Date.fromYMD(year, month, 1)
    const end = start.advance(1, "month")
    const collection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
      .filterBounds(aoi)
      .filterDate(start, end)
      .map(img => img.normalizedDifference(["B8", "B4"]).rename("NDVI"))
    const mean = collection.mean().clip(aoi)
    const val = mean.sample(point, 10).first().get("NDVI")
    val.getInfo(ndvi => {
      res.json({ inside: true, ndvi, lat, lon, year, month })
    }, err => res.status(500).send(err))
  }, err => res.status(500).send(err))
})

module.exports = router

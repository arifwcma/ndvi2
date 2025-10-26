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

    const collection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(aoi)
        .filterDate(start, end)

    collection.size().getInfo(size => {
        console.log(`Images found for WCMA ${year}-${month}:`, size)
        res.json({ year, month, count: size })
    })
})

module.exports = router

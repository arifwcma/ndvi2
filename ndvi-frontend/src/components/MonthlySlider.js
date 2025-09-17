import React, { useState, useEffect } from "react"
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet"
import "leaflet/dist/leaflet.css"

function MonthlySlider() {
  const [tileUrl, setTileUrl] = useState(null)
  const [boundary, setBoundary] = useState(null)
  const [offset, setOffset] = useState(84)
  const [label, setLabel] = useState("")

  const getMonthYear = (monthsBack) => {
    const now = new Date()
    now.setMonth(now.getMonth() - monthsBack)
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      label: now.toLocaleString("default", { month: "short", year: "numeric" })
    }
  }

  const fetchNdvi = (monthsBack) => {
    const { year, month, label } = getMonthYear(monthsBack)
    setLabel(label)
    fetch(`http://localhost:3001/ndvi/wcma_monthly?year=${year}&month=${month}`)
      .then(res => res.json())
      .then(data => setTileUrl(data.tileUrl))
  }

  useEffect(() => {
    fetchNdvi(0)
    fetch("/data/boundary_4326.geojson")
      .then(res => res.json())
      .then(data => setBoundary(data))
  }, [])

  return (
    <div>
      <h3>NDVI for {label}</h3>
      <input
        type="range"
        min="0"
        max="84"
        value={offset}
        onChange={e => {
          const v = parseInt(e.target.value)
          setOffset(v)
          fetchNdvi(84 - v)
        }}
      />
      <MapContainer center={[-36.7, 142.0]} zoom={7} style={{ height: "90vh" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {tileUrl && <TileLayer url={tileUrl} opacity={0.6} />}
        {boundary && (
          <GeoJSON
            data={boundary}
            style={{ color: "black", weight: 2, fillOpacity: 0 }}
          />
        )}
      </MapContainer>
    </div>
  )
}

export default MonthlySlider

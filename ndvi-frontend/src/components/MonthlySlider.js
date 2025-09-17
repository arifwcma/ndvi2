import React, { useState, useEffect } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

const maxPast = 72

function BoundaryLayer({ data }) {
  const map = useMap()
  useEffect(() => {
    if (data) {
      const layer = new L.GeoJSON(data)
      map.fitBounds(layer.getBounds())
    }
  }, [data, map])
  return <GeoJSON data={data} style={{ color: "black", weight: 2, fillOpacity: 0 }} />
}

function MonthlySlider() {
  const [tileUrl, setTileUrl] = useState(null)
  const [boundary, setBoundary] = useState(null)
  const [offset, setOffset] = useState(maxPast)
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

  const handleRelease = () => {
    fetchNdvi(maxPast - offset)
  }

  return (
    <div>
      <h3>NDVI for {label}</h3>
      <input
        type="range"
        min="0"
        max={maxPast}
        value={offset}
        onChange={e => setOffset(parseInt(e.target.value))}
        onMouseUp={handleRelease}
        onTouchEnd={handleRelease}
      />
      <MapContainer style={{ height: "90vh" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {tileUrl && <TileLayer url={tileUrl} opacity={0.6} />}
        {boundary && <BoundaryLayer data={boundary} />}
      </MapContainer>
    </div>
  )
}

export default MonthlySlider

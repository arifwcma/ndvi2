import React, { useState, useEffect } from "react"
import { MapContainer, TileLayer } from "react-leaflet"

function MonthlySlider() {
  const [tileUrl, setTileUrl] = useState(null)
  const [monthOffset, setMonthOffset] = useState(0)
  const [label, setLabel] = useState("")

  const getMonthYear = offset => {
    const now = new Date()
    now.setMonth(now.getMonth() - offset)
    return { year: now.getFullYear(), month: now.getMonth() + 1, label: now.toLocaleString("default", { month: "short", year: "numeric" }) }
  }

  const fetchNdvi = async offset => {
    const { year, month, label } = getMonthYear(offset)
    setLabel(label)
    const res = await fetch(`http://localhost:3001/ndvi_wcma_monthly?year=${year}&month=${month}`)
    const data = await res.json()
    setTileUrl(data.tileUrl)
  }

  useEffect(() => {
    fetchNdvi(0)
  }, [])

  return (
    <div>
      <h3>NDVI for {label}</h3>
      <input type="range" min="0" max="84" value={monthOffset} onChange={e => { const v = parseInt(e.target.value); setMonthOffset(v); fetchNdvi(v) }} />
      <MapContainer center={[-36.5, 142]} zoom={7} style={{ height: "600px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {tileUrl && <TileLayer url={tileUrl} />}
      </MapContainer>
    </div>
  )
}

export default MonthlySlider

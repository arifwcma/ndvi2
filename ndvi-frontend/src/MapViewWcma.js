import React, { useEffect, useState } from "react"
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet"
import "leaflet/dist/leaflet.css"

function MapViewWcma() {
  const [wcmaTileUrl, setWcmaTileUrl] = useState(null)
  const [wcmaBoundary, setWcmaBoundary] = useState(null)

  useEffect(() => {
    fetch("http://localhost:3001/ndvi/wcma")
      .then(res => res.json())
      .then(data => setWcmaTileUrl(data.tileUrl))

    fetch("/data/boundary_4326.geojson")
      .then(res => res.json())
      .then(data => setWcmaBoundary(data))
  }, [])

  return (
    <MapContainer center={[-36.7, 142.0]} zoom={7} style={{ height: "100vh" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {wcmaTileUrl && <TileLayer url={wcmaTileUrl} opacity={0.6} />}
      {wcmaBoundary && (
        <GeoJSON
          data={wcmaBoundary}
          style={{ color: "black", weight: 2, fillOpacity: 0 }}
        />
      )}
    </MapContainer>
  )
}

export default MapViewWcma

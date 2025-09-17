import React, { useState, useEffect } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/marker-icon-2x.png",
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png"
})


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

function ClickHandler({ onClick }) {
  const map = useMap()
  useEffect(() => {
    const handleClick = (e) => {
      onClick(e.latlng)
    }
    map.on("click", handleClick)
    return () => {
      map.off("click", handleClick)
    }
  }, [map, onClick])
  return null
}

function MonthlySlider() {
  const [tileUrl, setTileUrl] = useState(null)
  const [boundary, setBoundary] = useState(null)
  const [offset, setOffset] = useState(maxPast)
  const [label, setLabel] = useState("")
  const [info, setInfo] = useState(null)
  const [marker, setMarker] = useState(null)

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
        <button
          onClick={() => {
            const newVal = Math.max(0, offset - 1)
            setOffset(newVal)
            fetchNdvi(maxPast - newVal)
          }}
          disabled={offset === 0}
        >
          -
        </button>
        <input
          type="range"
          min="0"
          max={maxPast}
          value={offset}
          onChange={e => setOffset(parseInt(e.target.value))}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          style={{ width: "300px", margin: "0 10px" }}
        />
        <button
          onClick={() => {
            const newVal = Math.min(maxPast, offset + 1)
            setOffset(newVal)
            fetchNdvi(maxPast - newVal)
          }}
          disabled={offset === maxPast}
        >
          +
        </button>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <MapContainer style={{ height: "90vh" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {tileUrl && <TileLayer url={tileUrl} opacity={0.6} />}
            {boundary && <BoundaryLayer data={boundary} />}
            {marker && (
              <Marker position={marker}>
                <Popup>
                  <b>NDVI:</b> {info && info.ndvi !== null ? info.ndvi.toFixed(3) : "N/A"}
                </Popup>
              </Marker>
            )}
            <ClickHandler
              onClick={(latlng) => {
                fetch(
                  `http://localhost:3001/ndvi/wcma_sample?year=${getMonthYear(maxPast - offset).year}&month=${getMonthYear(maxPast - offset).month}&lat=${latlng.lat}&lon=${latlng.lng}`
                )
                  .then(res => res.json())
                  .then(data => {
                    if (data.inside) {
                      setMarker(latlng)
                      setInfo(data)
                    } else {
                      setMarker(null)
                      setInfo(null)
                    }
                  })
              }}
            />
          </MapContainer>
        </div>
        <div style={{ width: "250px", padding: "10px", borderLeft: "1px solid #ccc" }}>
          <h4>Info Panel</h4>
          {info ? (
            <div>
              <p><b>Month:</b> {label}</p>
              <p><b>Place:</b> {info.lon.toFixed(5)}, {info.lat.toFixed(5)}</p>
              <p><b>NDVI:</b> {info.ndvi !== null ? info.ndvi.toFixed(3) : "N/A"}</p>
            </div>
          ) : (
            <p>Click inside AOI to see info</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MonthlySlider

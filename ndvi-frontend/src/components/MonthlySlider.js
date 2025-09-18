import React, { useState, useEffect } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from "react-leaflet"
import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/images/marker-icon-2x.png",
    iconUrl: "/images/marker-icon.png",
    shadowUrl: "/images/marker-shadow.png"
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
        const handleClick = (e) => onClick(e.latlng)
        map.on("click", handleClick)
        return () => map.off("click", handleClick)
    }, [map, onClick])
    return null
}

function MonthlySlider() {
    const [tileUrl, setTileUrl] = useState(null)
    const [boundary, setBoundary] = useState(null)
    const [offset, setOffset] = useState(maxPast)
    const [info, setInfo] = useState(null)
    const [marker, setMarker] = useState(null)
    const [label, setLabel] = useState("")
    const [series, setSeries] = useState({ labels: [], data: [] })

    const [fromMonth, setFromMonth] = useState(1)
    const [fromYear, setFromYear] = useState(2019)
    const [toMonth, setToMonth] = useState(new Date().getMonth() + 1)
    const [toYear, setToYear] = useState(new Date().getFullYear())

    const getMonthYear = (monthsBack) => {
        const now = new Date()
        now.setMonth(now.getMonth() - monthsBack)
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            label: now.toLocaleString("default", { month: "short", year: "numeric" })
        }
    }

    const generateMonthsBetween = (startYear, startMonth, endYear, endMonth) => {
        const start = new Date(startYear, startMonth - 1, 1)
        const end = new Date(endYear, endMonth - 1, 1)
        const arr = []
        while (start <= end) {
            arr.push({
                year: start.getFullYear(),
                month: start.getMonth() + 1,
                label: start.toLocaleString("default", { month: "short", year: "numeric" })
            })
            start.setMonth(start.getMonth() + 1)
        }
        return arr
    }

    const fetchNdviSeries = (year, month, lat, lon, n = 6) => {
        const items = []
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(year, month - 1, 1)
            d.setMonth(d.getMonth() - i)
            items.push({
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                label: d.toLocaleString("default", { month: "short", year: "numeric" })
            })
        }
        const url = (y, m) => `${process.env.REACT_APP_BASE_URL}/ndvi/wcma_sample?year=${y}&month=${m}&lat=${lat}&lon=${lon}`
        Promise.all(items.map(it => fetch(url(it.year, it.month)).then(r => r.json()).catch(() => ({ ndvi: null, inside: false }))))
            .then(res => {
                const labels = items.map(it => it.label)
                const data = res.map(x => (x && x.inside && x.ndvi !== null ? x.ndvi : null))
                setSeries({ labels, data })
                if (labels.length > 0) {
                    const [firstYear, firstMonth] = [items[0].year, items[0].month]
                    const [lastYear, lastMonth] = [items[items.length - 1].year, items[items.length - 1].month]
                    setFromYear(firstYear)
                    setFromMonth(firstMonth)
                    setToYear(lastYear)
                    setToMonth(lastMonth)
                }
            })
    }

    const fetchRangeSeries = (lat, lon, fy, fm, ty, tm) => {
        const items = generateMonthsBetween(fy, fm, ty, tm)
        const url = (y, m) => `${process.env.REACT_APP_BASE_URL}/ndvi/wcma_sample?year=${y}&month=${m}&lat=${lat}&lon=${lon}`
        Promise.all(items.map(it => fetch(url(it.year, it.month)).then(r => r.json()).catch(() => ({ ndvi: null, inside: false }))))
            .then(res => {
                const labels = items.map(it => it.label)
                const data = res.map(x => (x && x.inside && x.ndvi !== null ? x.ndvi : null))
                setSeries({ labels, data })
            })
    }

    const fetchNdvi = (monthsBack) => {
        const { year, month, label } = getMonthYear(monthsBack)
        setLabel(label)
        if (marker) {
            fetch(`${process.env.REACT_APP_BASE_URL}/ndvi/wcma_sample?year=${year}&month=${month}&lat=${marker.lat}&lon=${marker.lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data.inside) {
                        setInfo({ ...data, label })
                        fetchNdviSeries(year, month, marker.lat, marker.lng, 6)
                    } else {
                        setMarker(null)
                        setInfo(null)
                        setSeries({ labels: [], data: [] })
                    }
                })
        }
        fetch(`${process.env.REACT_APP_BASE_URL}/ndvi/wcma_monthly?year=${year}&month=${month}`)
            .then(res => res.json())
            .then(data => setTileUrl(data.tileUrl))
    }

    useEffect(() => {
        fetchNdvi(0)
        fetch("/data/boundary_4326.geojson").then(res => res.json()).then(data => setBoundary(data))
    }, [])

    const handleRelease = () => {
        fetchNdvi(maxPast - offset)
    }

    const chartData = {
        labels: series.labels,
        datasets: [
            {
                label: "NDVI",
                data: series.data,
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.2,
                borderColor: "#00589c",
                backgroundColor: "#00589c"
            }
        ]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { min: -1, max: 1 }
        },
        plugins: {
            legend: { display: false },
            title: { display: false }
        }
    }

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    const yearRange = []
    const thisYear = new Date().getFullYear()
    for (let y = 2019; y <= thisYear; y++) yearRange.push(y)

    const firstVal = series.data.length > 0 ? series.data[0] : null
    const lastVal = series.data.length > 0 ? series.data[series.data.length - 1] : null
    const diffVal = firstVal !== null && lastVal !== null ? (lastVal - firstVal) : null
    const firstLabel = series.labels.length > 0 ? series.labels[0] : ""
    const lastLabel = series.labels.length > 0 ? series.labels[series.labels.length - 1] : ""

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
                                const { year, month, label } = getMonthYear(maxPast - offset)
                                setLabel(label)
                                fetch(`${process.env.REACT_APP_BASE_URL}/ndvi/wcma_sample?year=${year}&month=${month}&lat=${latlng.lat}&lon=${latlng.lng}`)
                                    .then(res => res.json())
                                    .then(data => {
                                        if (data.inside) {
                                            setMarker(latlng)
                                            setInfo({ ...data, label })
                                            fetchNdviSeries(year, month, latlng.lat, latlng.lng, 6)
                                        } else {
                                            setMarker(null)
                                            setInfo(null)
                                            setSeries({ labels: [], data: [] })
                                        }
                                    })
                            }}
                        />
                    </MapContainer>
                </div>
                <div style={{ width: "260px", padding: "10px", borderLeft: "1px solid #ccc" }}>
                    <h4>Info Panel</h4>
                    {info ? (
                        <div>
                            <p><b>Month:</b> {info.label}</p>
                            <p><b>Place:</b> {info.lon.toFixed(5)}, {info.lat.toFixed(5)}</p>
                            <p><b>NDVI:</b> {info.ndvi !== null ? info.ndvi.toFixed(3) : "N/A"}</p>
                            {/* Controls ABOVE the plot */}
                            <div style={{ marginBottom: "10px" }}>
                                <div>
                                    From{" "}
                                    <select value={fromMonth} onChange={e => setFromMonth(parseInt(e.target.value))}>
                                        {monthNames.map((m, i) => (
                                            <option key={i+1} value={i+1}>{m}</option>
                                        ))}
                                    </select>{" "}
                                    <select value={fromYear} onChange={e => setFromYear(parseInt(e.target.value))}>
                                        {yearRange.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    To{" "}
                                    <select value={toMonth} onChange={e => setToMonth(parseInt(e.target.value))}>
                                        {monthNames.map((m, i) => (
                                            <option key={i+1} value={i+1}>{m}</option>
                                        ))}
                                    </select>{" "}
                                    <select value={toYear} onChange={e => setToYear(parseInt(e.target.value))}>
                                        {yearRange.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <button
                                        onClick={() => {
                                            if (marker) {
                                                fetchRangeSeries(marker.lat, marker.lng, fromYear, fromMonth, toYear, toMonth)
                                            }
                                        }}
                                    >
                                        Show
                                    </button>
                                </div>
                            </div>
                            {/* Plot */}
                            <div style={{ height: 180 }}>
                                <Line data={chartData} options={chartOptions} />
                            </div>
                            {/* Summary BELOW the plot */}
                            {series.labels.length > 1 && (
                                <div style={{ marginTop: "10px" }}>
                                    <p><b>Initial NDVI ({firstLabel}):</b> {firstVal !== null ? firstVal.toFixed(3) : "N/A"}</p>
                                    <p><b>Last NDVI ({lastLabel}):</b> {lastVal !== null ? lastVal.toFixed(3) : "N/A"}</p>
                                    <p><b>Difference:</b> {diffVal !== null ? diffVal.toFixed(3) : "N/A"}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>Click a pixel to see info</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MonthlySlider

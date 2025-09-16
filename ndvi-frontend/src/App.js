import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function App() {
  const [tileUrl, setTileUrl] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/ndvi?year=2024&month=2")
      .then(res => res.json())
      .then(data => setTileUrl(data.tileUrl));
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer center={[-37.3, 142.9]} zoom={8} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {tileUrl && (
          <TileLayer attribution="NDVI from GEE" url={tileUrl} />
        )}
      </MapContainer>
    </div>
  );
}

export default App;

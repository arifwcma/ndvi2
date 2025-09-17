import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapView() {
  const [boundary, setBoundary] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/boundary")
      .then((res) => res.json())
      .then((data) => setBoundary(data));
  }, []);

  return (
    <MapContainer center={[-36.8, 142.0]} zoom={7} style={{ height: "100vh", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {boundary && (
        <GeoJSON
          data={boundary}
          style={{ color: "black", weight: 2, fillOpacity: 0 }}
        />
      )}
    </MapContainer>
  );
}

export default MapView;

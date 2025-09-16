import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchNdvi } from "../services/api";

function MapView({ year, month }) {
  const [tileUrl, setTileUrl] = useState(null);

  useEffect(() => {
    fetchNdvi(year, month).then(data => setTileUrl(data.tileUrl));
  }, [year, month]);

  return (
    <MapContainer center={[-37.3, 142.9]} zoom={8} style={{ height: "90vh", width: "100%" }}>
      <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {tileUrl && <TileLayer attribution="NDVI" url={tileUrl} />}
    </MapContainer>
  );
}

export default MapView;

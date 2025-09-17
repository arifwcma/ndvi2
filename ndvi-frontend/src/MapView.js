import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchRaceNdvi } from "./services/api";

function MapView() {
  const [tileUrl, setTileUrl] = useState(null);
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    fetchRaceNdvi().then(data => setTileUrl(data.tileUrl));
    fetch("/data/horsham_4326.geojson").then(r => r.json()).then(setGeojson);
  }, []);

  return (
    <MapContainer center={[-36.71, 142.19]} zoom={14} style={{ height: "100vh", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {tileUrl && <TileLayer url={tileUrl} />}
      {geojson && <GeoJSON data={geojson} style={{ color: "black", weight: 2, fillOpacity: 0 }} />}
    </MapContainer>
  );
}

export default MapView;

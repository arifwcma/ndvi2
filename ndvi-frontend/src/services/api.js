export function fetchNdvi(year, month) {
  return fetch(`http://localhost:3001/ndvi?year=${year}&month=${month}`)
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch NDVI");
      return res.json();
    });
}

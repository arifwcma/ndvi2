export async function fetchRaceNdvi() {
  const res = await fetch("http://localhost:3001/ndvi/race");
  return await res.json();
}

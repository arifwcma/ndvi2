export async function fetchRaceNdvi() {
  const res = await fetch("${process.env.REACT_APP_BASE_URL}/ndvi/race");
  return await res.json();
}

import React, { useState } from "react";
import MapView from "./components/MapView";
import MonthSlider from "./components/MonthSlider";

function App() {
  const [year] = useState(2024);
  const [month, setMonth] = useState(2);

  return (
    <div>
      <MonthSlider year={year} month={month} onChange={(y, m) => setMonth(m)} />
      <MapView year={year} month={month} />
    </div>
  );
}

export default App;

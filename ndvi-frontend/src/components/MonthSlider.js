import React from "react";

function MonthSlider({ year, month, onChange }) {
  const handleChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    onChange(year, newMonth);
  };

  return (
    <div style={{ margin: "10px" }}>
      <input
        type="range"
        min="1"
        max="12"
        value={month}
        onChange={handleChange}
      />
      <span> {year}-{month} </span>
    </div>
  );
}

export default MonthSlider;

import React from "react";

export default function DarkModeToggle({ isDark, setIsDark }) {
  return (
    <label className="dark-toggle">
      <input
        type="checkbox"
        checked={isDark}
        onChange={() => setIsDark(!isDark)}
      />
      <span>{isDark ? "🌙 다크모드" : "☀️ 라이트모드"}</span>
    </label>
  );
}

import React from "react";

export default function ThemeSelector({ theme, setTheme }) {
  return (
    <select
      onChange={(e) => setTheme(e.target.value)}
      value={theme}
      className="theme-selector"
    >
      <option value="classic">Classic</option>
      <option value="dark">Dark</option>
      <option value="wood">Wood</option>
      <option value="ocean">Ocean</option>
    </select>
  );
}

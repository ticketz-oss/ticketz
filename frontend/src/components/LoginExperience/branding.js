import { getContrastRatio } from "@material-ui/core/styles";

export const loginBrandStyles = (settings = {}, dark = false) => {
  const configured = settings[dark ? "primaryColorDark" : "primaryColorLight"];
  const accent = /^#[0-9a-f]{6}$/i.test(configured || "")
    ? configured
    : dark
      ? "#FF8A43"
      : "#C2480A";
  const rgb = [1, 3, 5].map(
    index => parseInt(accent.slice(index, index + 2), 16) / 255
  );
  const max = Math.max(...rgb),
    min = Math.min(...rgb),
    delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  if (delta) {
    if (max === rgb[0]) hue = ((rgb[1] - rgb[2]) / delta) % 6;
    else if (max === rgb[1]) hue = (rgb[2] - rgb[0]) / delta + 2;
    else hue = (rgb[0] - rgb[1]) / delta + 4;
  }
  return {
    "--primary": `${(hue * 60 + 360) % 360} ${delta ? (delta / (1 - Math.abs(2 * lightness - 1))) * 100 : 0}% ${lightness * 100}%`,
    "--primary-foreground":
      getContrastRatio(accent, "#fff") >= 3 ? "0 0% 100%" : "0 0% 9%",
    "--login-accent": accent
  };
};

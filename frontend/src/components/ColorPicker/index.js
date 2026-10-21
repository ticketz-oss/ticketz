import { Button, Dialog, DialogActions, Input } from "@material-ui/core";
import React, { useState, useEffect } from "react";
import { i18nToast } from "../../helpers/i18nToast";
import { i18n } from "../../translate/i18n";
import { ColorBox } from "material-ui-color";

const ColorPicker = ({ onChange, currentColor, handleClose, open }) => {
  const [selectedColor, setSelectedColor] = useState("#808080");

  useEffect(() => {
    setSelectedColor(currentColor);
  }, [currentColor]);

  const colors = {
    red1: "#B80000",
    orange1: "#DB3E00",
    yellow1: "#FCCB00",
    green1: "#008B02",
    teal1: "#006B76",
    blue1: "#1273DE",
    gray1: "#BEDADC",
    gray2: "#C4DEF6",
    gray3: "#BED3F3",
    purple1: "#D4C4FB",
    dark1: "#4D4D4D",
    gray4: "#999999",
    red2: "#F44E3B",
    orange2: "#FE9200",
    yellow2: "#FCDC00",
    yellow3: "#DBDF00",
    green2: "#A4DD00",
    teal2: "#68CCCA",
    blue2: "#73D8FF",
    purple2: "#AEA1FF",
    pink1: "#FDA1FF",
    dark2: "#333333",
    gray5: "#808080",
    gray6: "#cccccc",
    red3: "#D33115",
    orange3: "#E27300",
    yellow4: "#FCC400",
    yellow5: "#B0BC00",
    green3: "#68BC00",
    teal3: "#16A5A5",
    blue3: "#009CE0",
    purple3: "#7B64FF",
    pink2: "#FA28FF",
    gray7: "#666666",
    gray8: "#B3B3B3",
    red4: "#9F0500",
    orange4: "#C45100",
    yellow6: "#FB9E00",
    yellow7: "#808900",
    green4: "#194D33",
    teal4: "#0C797D",
    blue4: "#0062B1",
    purple4: "#653294",
    pink3: "#AB149E"
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <ColorBox
        disableAlpha={true}
        hslGradient={false}
        style={{ margin: "20px auto 0" }}
        value={selectedColor}
        onChange={color => setSelectedColor(`#${color.hex}`)}
        palette={colors}
        inputFormats={[]}
      />
      <Input
        type="text"
        value={selectedColor}
        onChange={e => setSelectedColor(e.target.value)}
        style={{ margin: "20px auto 0", width: "80%" }}
        inputProps={{ maxLength: 7 }}
      />
      <DialogActions>
        <Button onClick={handleClose}>{i18n.t("common.cancel")}</Button>
        <Button
          color="primary"
          onClick={() => {
            if (!/^#[0-9A-Fa-f]{6}$/.test(selectedColor)) {
              i18nToast.error("common.error");
              return;
            }
            handleClose();
            onChange(selectedColor);
          }}
        >
          {i18n.t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColorPicker;

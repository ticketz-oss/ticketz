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

  const colors = [
    "#B80000", "#DB3E00", "#FCCB00", "#008B02", "#006B76", "#1273DE",
    "#BEDADC", "#C4DEF6", "#BED3F3", "#D4C4FB", "#4D4D4D", "#999999",
    "#F44E3B", "#FE9200", "#FCDC00", "#DBDF00", "#A4DD00", "#68CCCA",
    "#73D8FF", "#AEA1FF", "#FDA1FF", "#333333", "#808080", "#cccccc",
    "#D33115", "#E27300", "#FCC400", "#B0BC00", "#68BC00", "#16A5A5",
    "#009CE0", "#7B64FF", "#FA28FF", "#666666", "#B3B3B3", "#9F0500",
    "#C45100", "#FB9E00", "#808900", "#194D33", "#0C797D", "#0062B1",
    "#653294", "#AB149E",
  ];

  return (
    <Dialog
      onClose={handleClose}
      open={open}
    >
      <ColorBox
        disableAlpha={true}
        hslGradient={false}
        style={{ margin: '20px auto 0' }}
        value={selectedColor}
        onChange={color => setSelectedColor(`#${color.hex}`)}
        palette={colors}
        inputFormats={[]}
      />
      <Input 
        type="text"
        value={selectedColor}
        onChange={e => setSelectedColor(e.target.value)}
        style={{ margin: '20px auto 0', width: '80%' }}
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

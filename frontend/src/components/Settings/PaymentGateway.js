import React, { useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import useSettings from "../../hooks/useSettings";
import { toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import EfiSettings from "../PaymentGateways/Efi/EfiSettings";
import OwenSettings from "../PaymentGateways/Owen/OwenSettings";
import OwenAd from "../PaymentGateways/Owen/OwenAd";

const useStyles = makeStyles((_) => ({
  fieldContainer: {
    width: "100%",
    textAlign: "left",
  },
}));

export default function PaymentGateway(props) {
  const { settings } = props;
  const classes = useStyles();
  const [paymentGateway, setPaymentGateway] = useState("");

  const { update } = useSettings();

  useEffect(() => {
    if (Array.isArray(settings) && settings.length) {
      const paymentGatewaySetting = settings.find((s) => s.key === "_paymentGateway");
      if (paymentGatewaySetting) {
        setPaymentGateway(paymentGatewaySetting.value);
      }
    }
  }, [settings]);

  async function handleChangePaymentGateway(value) {
    setPaymentGateway(value);
    await update({
      key: "_paymentGateway",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
  }

  return (
    <>
      <Grid spacing={3} container>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.fieldContainer}>
            <InputLabel id="paymentgateway-label">Payment Gateway</InputLabel>
            <Select
              labelId="paymentgateway-label"
              value={paymentGateway}
              onChange={async (e) => {
                handleChangePaymentGateway(e.target.value);
              }}
            >
              <MenuItem value={""}>None</MenuItem>
              <MenuItem value={"owen"}>Owen Payments 💎</MenuItem>
              <MenuItem value={"efi"}>Efí</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      { paymentGateway === "efi" && 
        <EfiSettings settings={settings} />
      }
      { paymentGateway === "owen" && 
        <OwenSettings settings={settings} />
      }
      { paymentGateway === "" && 
        <OwenAd />
      }
    </>
  );
}

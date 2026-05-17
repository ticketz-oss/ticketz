import { getIO } from "../../libs/socket";
import ConnectionAlert from "../../models/ConnectionAlert";

const EmitConnectionAlert = (alert: ConnectionAlert) => {
  const io = getIO();

  io.to("super")
    .to(`company-${alert.companyId}-admin`)
    .emit("connectionAlert", {
      action: "create",
      alert
    });
};

export default EmitConnectionAlert;
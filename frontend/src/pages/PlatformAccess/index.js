import { useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import { CircularProgress } from "@material-ui/core";
import api from "../../services/api";
import { setStoredToken } from "../../helpers/token";

const PlatformAccess = () => {
  const { token } = useParams();
  const history = useHistory();

  useEffect(() => {
    let active = true;
    api
      .post("/api/platform/v1/acesso/trocar", { token })
      .then(({ data }) => {
        if (!active) return;
        setStoredToken(data.token);
        localStorage.setItem("companyId", String(data.user.companyId));
        localStorage.setItem("userId", String(data.user.id));
        window.location.replace("/");
      })
      .catch(() => {
        if (active) history.replace("/login");
      });
    return () => {
      active = false;
    };
  }, [history, token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <CircularProgress />
    </div>
  );
};

export default PlatformAccess;

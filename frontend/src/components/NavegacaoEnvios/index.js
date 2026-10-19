import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { Send, CalendarClock, Users, Settings2 } from "lucide-react";
import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";
import { useIdentidade } from "../interface";
import { canSeeScreen, screenForPath } from "../../helpers/screenAccess";

export default function NavegacaoEnvios() {
  const { user } = useContext(AuthContext);
  const identidade = useIdentidade();
  if (
    !["campaigns", "contact-lists", "campaigns-config"].some(screen =>
      canSeeScreen(user, screen)
    )
  )
    return null;
  return (
    <nav
      className="ew-ui ew-tabs"
      style={identidade}
      aria-label={i18n.t("envios.titulo")}
    >
      {[
        { to: "/campaigns", chave: "massivo", icone: Send },
        { to: "/schedules", chave: "agendamentos", icone: CalendarClock },
        { to: "/contact-lists", chave: "publicos", icone: Users },
        { to: "/campaigns-config", chave: "configuracao", icone: Settings2 }
      ]
        .filter(item => canSeeScreen(user, screenForPath(item.to)))
        .map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className="ew-tab"
            activeClassName="ew-tab-ativa"
          >
            <item.icone size={15} />
            {i18n.t(`envios.${item.chave}`)}
          </NavLink>
        ))}
    </nav>
  );
}

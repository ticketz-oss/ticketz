import React, { useEffect, useState, useRef } from "react";
import { Button, useTheme } from "@material-ui/core";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import AvatarUsuario from "../AvatarUsuario";
import { i18n } from "../../translate/i18n";

export default function FotoUsuario({
  usuario,
  arquivo,
  remover,
  aoAlterar,
  desabilitado
}) {
  const theme = useTheme();
  const entrada = useRef(null);
  const [previa, definirPrevia] = useState(null);
  useEffect(() => {
    if (!arquivo) {
      definirPrevia(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    definirPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "8px 0 20px"
      }}
    >
      <AvatarUsuario
        preview
        usuario={{
          ...usuario,
          profilePicUrl: previa || (remover ? null : usuario.profilePicUrl)
        }}
        tamanho={72}
      />
      <div>
        <input
          ref={entrada}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={evento => {
            const foto = evento.target.files?.[0];
            evento.target.value = "";
            if (!foto) return;
            if (
              foto.size > 5 * 1024 * 1024 ||
              !["image/jpeg", "image/png", "image/webp"].includes(foto.type)
            ) {
              toast.error(i18n.t("perfilFoto.invalida"));
              return;
            }
            aoAlterar(foto, false);
          }}
        />
        <Button
          type="button"
          disabled={desabilitado}
          variant="outlined"
          size="small"
          startIcon={<Camera size={16} />}
          onClick={() => entrada.current.click()}
        >
          {i18n.t("perfilFoto.alterar")}
        </Button>
        {(arquivo || (!remover && usuario.profilePicUrl)) && (
          <Button
            type="button"
            disabled={desabilitado}
            size="small"
            aria-label={i18n.t("perfilFoto.remover")}
            onClick={() => aoAlterar(null, true)}
          >
            <Trash2 size={16} />
          </Button>
        )}
        <p
          style={{
            fontSize: theme.isStardew ? 16 : 11,
            opacity: 0.65,
            margin: "8px 0 0"
          }}
        >
          {i18n.t("perfilFoto.ajuda")}
        </p>
      </div>
    </div>
  );
}

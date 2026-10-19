import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useTheme } from "@material-ui/core/styles";
import { X } from "../AnimatedIcon";
import { i18n } from "../../translate/i18n";
import "./interface.css";
import "./motion.css";

export const useIdentidade = () => {
  const theme = useTheme();
  return {
    "--ew-primary": theme.palette.primary.main,
    "--ew-on-primary": theme.palette.primary.contrastText,
    "--ew-bg": theme.palette.background.default,
    "--ew-surface": theme.palette.background.paper,
    "--ew-text": theme.palette.text.primary,
    "--ew-muted": theme.palette.text.secondary,
    "--ew-border": theme.palette.divider,
    "--ew-error": theme.palette.error.main
  };
};

export const Botao = React.forwardRef(
  ({ variante = "secondary", className = "", children, ...props }, ref) => (
    <button
      type="button"
      {...props}
      ref={ref}
      className={`ew-button ew-button--${variante} ${className}`}
    >
      {children}
    </button>
  )
);

export const BotaoIcone = React.forwardRef(
  ({ titulo, children, ...props }, ref) => (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Botao
            ref={ref}
            {...props}
            aria-label={titulo}
            className="ew-icon-button"
          >
            {children}
          </Botao>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="ew-tooltip" sideOffset={6}>
            {titulo}
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
);

export const Alternador = ({ rotulo, checked, onCheckedChange, disabled }) => (
  <label className="ew-switch-label">
    <span>{rotulo}</span>
    <Switch.Root
      className="ew-switch"
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      aria-label={rotulo}
    >
      <Switch.Thumb className="ew-switch-thumb" />
    </Switch.Root>
  </label>
);

export const Janela = ({
  aberta,
  aoMudar,
  titulo,
  descricao,
  classeOverlay = "",
  classe = "",
  tituloOculto = false,
  focoInicial,
  children
}) => {
  const identidade = useIdentidade();
  return (
    <Dialog.Root open={aberta} onOpenChange={aoMudar}>
      <Dialog.Portal>
        <Dialog.Overlay className={`ew-overlay ${classeOverlay}`} />
        <Dialog.Content
          className={`ew-ui ew-dialog ${classe}`}
          style={identidade}
          onOpenAutoFocus={focoInicial}
        >
          <header
            className={`ew-panel-head ${tituloOculto ? "ew-panel-head--flutuante" : ""}`}
          >
            <Dialog.Title className={tituloOculto ? "ew-sr-only" : ""}>
              {titulo}
            </Dialog.Title>
            <Dialog.Close asChild>
              <BotaoIcone titulo={i18n.t("fluxos.fechar")}>
                <X size={16} />
              </BotaoIcone>
            </Dialog.Close>
          </header>
          <Dialog.Description
            className={`ew-dialog-description ${tituloOculto ? "ew-sr-only" : ""}`}
          >
            {descricao}
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

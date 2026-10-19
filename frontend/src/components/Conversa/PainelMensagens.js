import React, { useMemo, useState } from "react";
import { File } from "lucide-react";
import { Search, X, Download } from "../AnimatedIcon";
import { BotaoIcone } from "../interface";
import { i18n } from "../../translate/i18n";
import chatMediaUrl from "../../helpers/chatMediaUrl";

export default function PainelMensagens({
  mensagens,
  modo,
  aoFechar,
  aoSelecionar
}) {
  const [busca, definirBusca] = useState("");
  const itens = useMemo(
    () =>
      mensagens.filter(mensagem => {
        if (modo === "arquivos" && !(mensagem.mediaUrl || mensagem.mediaPath))
          return false;
        return `${mensagem.body || mensagem.message || ""} ${mensagem.mediaName || ""}`
          .toLocaleLowerCase()
          .includes(busca.toLocaleLowerCase());
      }),
    [mensagens, modo, busca]
  );
  return (
    <section
      className="conversa-pesquisa"
      aria-label={i18n.t(`conversa.${modo}`)}
    >
      <header>
        <strong>{i18n.t(`conversa.${modo}`)}</strong>
        <BotaoIcone titulo={i18n.t("fluxos.fechar")} onClick={aoFechar}>
          <X size={16} />
        </BotaoIcone>
      </header>
      <label className="conversa-busca">
        <Search size={16} />
        <input
          autoFocus
          value={busca}
          onChange={e => definirBusca(e.target.value)}
          placeholder={i18n.t("conversa.pesquisar")}
          aria-label={i18n.t("conversa.pesquisar")}
        />
      </label>
      <small>{i18n.t("conversa.mensagensCarregadas")}</small>
      <div className="conversa-resultados">
        {itens.length === 0 && (
          <p className="conversa-sem-resultados">
            {i18n.t("conversa.semResultados")}
          </p>
        )}
        {itens.map(mensagem => (
          <article key={mensagem.id}>
            {modo === "arquivos" ? (
              <a
                href={mensagem.mediaUrl || chatMediaUrl(mensagem.mediaPath)}
                target="_blank"
                rel="noreferrer"
              >
                <File size={18} />
                <span>
                  {mensagem.mediaName ||
                    mensagem.body ||
                    mensagem.message ||
                    i18n.t("conversa.arquivo")}
                  <time>
                    {new Date(mensagem.createdAt).toLocaleDateString(
                      i18n.language
                    )}
                  </time>
                </span>
                <Download size={14} />
              </a>
            ) : (
              <button type="button" onClick={() => aoSelecionar(mensagem.id)}>
                <span>{mensagem.body || mensagem.message}</span>
                <time>
                  {new Date(mensagem.createdAt).toLocaleString(i18n.language)}
                </time>
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

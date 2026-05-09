/*
  Integração com Focus NFe para emissão de NFS-e após pagamento confirmado.
  Docs: https://doc.focusnfe.com.br/reference/introducao
  Auth: HTTP Basic com API token como username, senha vazia.
  Preço: ~R$ 0,05/NFS-e em produção; sandbox gratuito para testes.
*/

import axios from "axios";
import { logger } from "../../utils/logger";
import Invoices from "../../models/Invoices";
import Company from "../../models/Company";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";

interface FocusNfseConfig {
  apiToken: string;
  sandbox: boolean;
  cnpjEmitente: string;
  inscricaoMunicipal: string;
  codigoMunicipio: string;
  regimeTributario: string; // "1"=Simples, "2"=Lucro Presumido, "3"=Lucro Real
  codigoServico: string;    // item LC116, ex: "0107"
  descricaoServico: string;
  aliquotaIss: number;      // ex: 2.0 para 2%
}

async function getNfseConfig(): Promise<FocusNfseConfig | null> {
  try {
    const [
      apiToken,
      sandboxRaw,
      cnpjEmitente,
      inscricaoMunicipal,
      codigoMunicipio,
      regimeTributario,
      codigoServico,
      descricaoServico,
      aliquotaIss
    ] = await Promise.all([
      GetSuperSettingService({ key: "_nfseApiToken" }),
      GetSuperSettingService({ key: "_nfseSandbox" }),
      GetSuperSettingService({ key: "_nfseCnpjEmitente" }),
      GetSuperSettingService({ key: "_nfseInscricaoMunicipal" }),
      GetSuperSettingService({ key: "_nfseCodigoMunicipio" }),
      GetSuperSettingService({ key: "_nfseRegimeTributario" }),
      GetSuperSettingService({ key: "_nfseCodigoServico" }),
      GetSuperSettingService({ key: "_nfseDescricaoServico" }),
      GetSuperSettingService({ key: "_nfseAliquotaIss" })
    ]);

    if (!apiToken) {
      return null;
    }

    return {
      apiToken,
      sandbox: sandboxRaw === "true",
      cnpjEmitente: cnpjEmitente || "",
      inscricaoMunicipal: inscricaoMunicipal || "",
      codigoMunicipio: codigoMunicipio || "",
      regimeTributario: regimeTributario || "1",
      codigoServico: codigoServico || "0107",
      descricaoServico: descricaoServico || "Licença de uso de software SaaS",
      aliquotaIss: Number(aliquotaIss) || 2.0
    };
  } catch (error) {
    logger.error(error, "getNfseConfig: erro ao carregar configurações NFS-e");
    return null;
  }
}

export const emitirNfse = async (
  invoice: Invoices,
  company: Company
): Promise<void> => {
  const config = await getNfseConfig();

  if (!config) {
    logger.debug("emitirNfse: NFS-e não configurada, pulando emissão");
    return;
  }

  const baseUrl = config.sandbox
    ? "https://homologacao.focusnfe.com.br"
    : "https://api.focusnfe.com.br";

  try {
    const valor = Number(invoice.value);
    const aliquota = config.regimeTributario === "MEI" ? 0 : config.aliquotaIss;
    const valorIss = parseFloat((valor * (aliquota / 100)).toFixed(2));
    const valorLiquido = parseFloat((valor - valorIss).toFixed(2));

    const tomadorDoc = (company as any).document?.replace(/\D/g, "") || "";
    const isCnpj = tomadorDoc.length === 14;

    const tomador: Record<string, any> = {
      razao_social: company.name || "Cliente",
      email: company.email || ""
    };

    if (tomadorDoc) {
      if (isCnpj) {
        tomador.cnpj = tomadorDoc;
      } else {
        tomador.cpf = tomadorDoc;
      }
    }

    // MEI paga ISS via DAS (valor fixo mensal), então a NFS-e não retém ISS
    const isMei = config.regimeTributario === "MEI";
    const regimeTributarioCode = isMei ? "1" : config.regimeTributario;
    const valorIssNota = isMei ? 0 : valorIss;
    const valorLiquidoNota = isMei ? valor : valorLiquido;

    const body = {
      data_emissao: new Date().toISOString(),
      prestador: {
        cnpj: config.cnpjEmitente.replace(/\D/g, ""),
        inscricao_municipal: config.inscricaoMunicipal,
        codigo_municipio: config.codigoMunicipio
      },
      tomador,
      servico: {
        aliquota: isMei ? 0 : config.aliquotaIss,
        base_calculo: valor,
        discriminacao: `${config.descricaoServico} - Fatura #${invoice.id}`,
        iss_retido: false,
        item_lista_servico: config.codigoServico,
        optante_simples_nacional: true,
        valor_servicos: valor,
        valor_iss: valorIssNota,
        valor_liquido: valorLiquidoNota
      },
      // regime_especial_tributacao 6 = MEI (suportado por alguns municípios)
      ...(isMei ? { regime_especial_tributacao: "6" } : {}),
      regime_tributario: regimeTributarioCode,
      optante_simples_nacional: true
    };

    const response = await axios.post(`${baseUrl}/v2/nfse`, body, {
      auth: {
        username: config.apiToken,
        password: ""
      },
      headers: { "Content-Type": "application/json" },
      timeout: 30000
    });

    const nfseData = response.data;
    const nfseId =
      nfseData?.uuid || nfseData?.ref || nfseData?.numero_nfse || "";
    const nfseUrl =
      nfseData?.caminho_xml_nota_fiscal ||
      nfseData?.url_danfse ||
      nfseData?.caminho_danfse ||
      "";
    const nfseStatus = nfseData?.status || "autorizado";

    await invoice.update({ nfseId, nfseUrl, nfseStatus });

    logger.info(
      { invoiceId: invoice.id, nfseId, nfseStatus },
      "NFS-e emitida com sucesso via Focus NFe"
    );
  } catch (error) {
    // Não falha o pagamento se a NFS-e der erro — apenas loga
    logger.error(
      { error: (error as any)?.response?.data || error },
      `emitirNfse: erro ao emitir NFS-e para fatura ${invoice.id}`
    );
  }
};

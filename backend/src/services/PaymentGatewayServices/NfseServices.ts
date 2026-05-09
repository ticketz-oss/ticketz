/*
  Integração com WebmaniaBR para emissão de NFS-e após pagamento confirmado.
  Plano gratuito: 100 NFS-e/mês sem custo.
  Docs: https://webmaniabr.com/docs/rest-api-nfse/
*/

import axios from "axios";
import { logger } from "../../utils/logger";
import Invoices from "../../models/Invoices";
import Company from "../../models/Company";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";

interface WebmaniaBRConfig {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  cnpjEmitente: string;
  regimeTributario: string; // "1"=Simples, "2"=Lucro Presumido, "3"=Lucro Real
  naturezaOperacao: string; // código IBGE do município
  codigoServico: string;   // código LC116 ex: "1.07"
  descricaoServico: string;
  aliquotaIss: number;     // ex: 2.0 para 2%
}

async function getNfseConfig(): Promise<WebmaniaBRConfig | null> {
  try {
    const [
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret,
      cnpjEmitente,
      regimeTributario,
      naturezaOperacao,
      codigoServico,
      descricaoServico,
      aliquotaIss
    ] = await Promise.all([
      GetSuperSettingService({ key: "_nfseConsumerKey" }),
      GetSuperSettingService({ key: "_nfseConsumerSecret" }),
      GetSuperSettingService({ key: "_nfseAccessToken" }),
      GetSuperSettingService({ key: "_nfseAccessTokenSecret" }),
      GetSuperSettingService({ key: "_nfseCnpjEmitente" }),
      GetSuperSettingService({ key: "_nfseRegimeTributario" }),
      GetSuperSettingService({ key: "_nfseNaturezaOperacao" }),
      GetSuperSettingService({ key: "_nfseCodigoServico" }),
      GetSuperSettingService({ key: "_nfseDescricaoServico" }),
      GetSuperSettingService({ key: "_nfseAliquotaIss" })
    ]);

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      return null;
    }

    return {
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret,
      cnpjEmitente: cnpjEmitente || "",
      regimeTributario: regimeTributario || "1",
      naturezaOperacao: naturezaOperacao || "Prestação de Serviço",
      codigoServico: codigoServico || "1.07",
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

  try {
    const tomadorDoc = (company as any).document?.replace(/\D/g, "") || "";
    const isCnpj = tomadorDoc.length === 14;

    const body: Record<string, any> = {
      natureza_operacao: config.naturezaOperacao,
      regime_tributario: config.regimeTributario,
      data_emissao: new Date().toISOString(),
      prestador: {
        cnpj: config.cnpjEmitente.replace(/\D/g, ""),
        inscricao_municipal: await GetSuperSettingService({
          key: "_nfseInscricaoMunicipal"
        })
      },
      tomador: {
        razao_social: company.name || "Cliente",
        email: company.email || ""
      },
      itens: [
        {
          descricao: `${config.descricaoServico} - Fatura #${invoice.id}`,
          codigo_servico: config.codigoServico,
          aliquota_iss: config.aliquotaIss,
          valor_unitario: Number(invoice.value),
          quantidade: 1
        }
      ]
    };

    if (tomadorDoc) {
      if (isCnpj) {
        body.tomador.cnpj = tomadorDoc;
      } else {
        body.tomador.cpf = tomadorDoc;
      }
    }

    const response = await axios.post(
      "https://webmaniabr.com/api/2/nfse/emissao/",
      body,
      {
        auth: {
          username: config.consumerKey,
          password: config.consumerSecret
        },
        headers: {
          "X-Access-Token": config.accessToken,
          "X-Access-Token-Secret": config.accessTokenSecret,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const nfseData = response.data;
    const nfseId = nfseData?.uuid || nfseData?.id || "";
    const nfseUrl = nfseData?.url_pdf || nfseData?.url || "";
    const nfseStatus = nfseData?.status || "emitida";

    await invoice.update({ nfseId, nfseUrl, nfseStatus });

    logger.info(
      { invoiceId: invoice.id, nfseId, nfseUrl },
      "NFS-e emitida com sucesso"
    );
  } catch (error) {
    // Não falha o pagamento se a NFS-e der erro — apenas loga
    logger.error(
      { error: (error as any)?.response?.data || error },
      `emitirNfse: erro ao emitir NFS-e para fatura ${invoice.id}`
    );
  }
};

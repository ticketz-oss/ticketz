import fs from "fs";
import os from "os";
import path from "path";
import Company from "../../models/Company";
import User from "../../models/User";
import {
  canUseProspeccao,
  isProspeccaoCompany,
  isProspeccaoConfigured,
  prospeccaoConfig,
  prospeccaoSlugs
} from "../../helpers/prospeccao";
import { normalizaTelefone } from "../../services/ProspeccaoServices/SyncProspeccaoLeadsService";

type CompanyLike = Pick<Company, "slug">;
type UserLike = Pick<User, "profile" | "super">;

const company = (slug: string | null): CompanyLike =>
  ({ slug }) as unknown as CompanyLike;

const user = (profile: string, isSuper = false): UserLike =>
  ({ profile, super: isSuper }) as unknown as UserLike;

describe("helpers/prospeccao", () => {
  const envOriginal = { ...process.env };

  afterEach(() => {
    process.env = { ...envOriginal };
  });

  describe("isProspeccaoCompany", () => {
    it("libera o tenant padrão da ferramenta", () => {
      expect(isProspeccaoCompany(company("teste"))).toBe(true);
    });

    it("ignora caixa e espaços no slug", () => {
      expect(isProspeccaoCompany(company("  TESTE "))).toBe(true);
    });

    it("bloqueia qualquer outro tenant", () => {
      expect(isProspeccaoCompany(company("acnorte"))).toBe(false);
      expect(isProspeccaoCompany(company(null))).toBe(false);
      expect(isProspeccaoCompany(null)).toBe(false);
    });

    it("não permite ampliar o acesso por variável de ambiente", () => {
      process.env.PROSPECCAO_SLUGS = "teste,parceiro";
      expect(isProspeccaoCompany(company("parceiro"))).toBe(false);
      expect(isProspeccaoCompany(company("outro"))).toBe(false);
    });

    it("mantém teste habilitado mesmo com variável vazia", () => {
      process.env.PROSPECCAO_SLUGS = " , ";
      expect(prospeccaoSlugs()).toEqual(["teste"]);
      expect(isProspeccaoCompany(company("teste"))).toBe(true);
    });
  });

  describe("canUseProspeccao", () => {
    it("aceita admin do tenant e super", () => {
      expect(canUseProspeccao(user("admin"))).toBe(true);
      expect(canUseProspeccao(user("user", true))).toBe(true);
    });

    it("recusa atendente comum", () => {
      expect(canUseProspeccao(user("user"))).toBe(false);
      expect(canUseProspeccao(null)).toBe(false);
    });
  });

  describe("prospeccaoConfig", () => {
    it("remove barra final das URLs configuradas", () => {
      process.env.PROSPECCAO_API_URL = "http://prospeccao.local:8000/";
      process.env.PROSPECCAO_BRIDGE_URL = "http://bridge.local:8001//";
      const config = prospeccaoConfig();
      expect(config.apiUrl).toBe("http://prospeccao.local:8000");
      expect(config.bridgeUrl).toBe("http://bridge.local:8001");
    });

    it("só se considera configurada quando existe chave", () => {
      delete process.env.PROSPECCAO_API_KEY;
      delete process.env.PROSPECCAO_API_KEY_FILE;
      expect(isProspeccaoConfigured()).toBe(false);
      process.env.PROSPECCAO_API_KEY = "chave-de-teste";
      expect(isProspeccaoConfigured()).toBe(true);
    });

    it("lê a chave do arquivo do secret quando não vem pelo ambiente", () => {
      const caminho = path.join(os.tmpdir(), `prospeccao-${Date.now()}.key`);
      // O docker secret costuma terminar em newline; a chave não pode levá-la
      // junto para o header.
      fs.writeFileSync(caminho, "chave-do-arquivo\n");
      delete process.env.PROSPECCAO_API_KEY;
      process.env.PROSPECCAO_API_KEY_FILE = caminho;

      expect(prospeccaoConfig().apiKey).toBe("chave-do-arquivo");

      fs.unlinkSync(caminho);
    });

    it("a variável direta tem prioridade sobre o arquivo", () => {
      process.env.PROSPECCAO_API_KEY = "chave-do-ambiente";
      process.env.PROSPECCAO_API_KEY_FILE = "/caminho/que/nao/existe";
      expect(prospeccaoConfig().apiKey).toBe("chave-do-ambiente");
    });

    it("não derruba o backend quando o arquivo do secret não existe", () => {
      delete process.env.PROSPECCAO_API_KEY;
      process.env.PROSPECCAO_API_KEY_FILE = "/caminho/que/nao/existe";
      expect(prospeccaoConfig().apiKey).toBe("");
      expect(isProspeccaoConfigured()).toBe(false);
    });
  });

  // É a chave que decide se uma busca nova está trazendo um lead inédito ou
  // repetindo alguém que já foi trabalhado.
  describe("normalizaTelefone", () => {
    it("acrescenta DDI a telefone brasileiro formatado", () => {
      expect(normalizaTelefone("(68) 99988-4999")).toBe("5568999884999");
    });

    it("mantém número que já veio com DDI", () => {
      expect(normalizaTelefone("5568999999999")).toBe("5568999999999");
    });

    it("aceita telefone fixo com DDD", () => {
      expect(normalizaTelefone("(68) 3223-4455")).toBe("556832234455");
    });

    it("repassa número estrangeiro sem inventar DDI", () => {
      expect(normalizaTelefone("+351 912 345 678")).toBe("351912345678");
    });

    it("cai para o WhatsApp do Instagram quando não há telefone", () => {
      expect(normalizaTelefone(null, "5568999999999")).toBe("5568999999999");
    });

    it("devolve vazio quando não há telefone utilizável", () => {
      expect(normalizaTelefone("", null, undefined)).toBe("");
      expect(normalizaTelefone("sem numero")).toBe("");
    });

    it("gera a mesma chave para o mesmo número escrito de formas diferentes", () => {
      expect(normalizaTelefone("(68) 99988-4999")).toBe(
        normalizaTelefone("+55 68 99988 4999")
      );
    });
  });
});

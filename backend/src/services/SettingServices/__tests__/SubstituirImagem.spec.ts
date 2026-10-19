import Setting from "../../../models/Setting";
import UpdateSettingService from "../UpdateSettingService";
import { removerArquivoBranding } from "../../../helpers/brandingFiles";
jest.mock("../../../models/Setting", () => ({
  __esModule: true,
  default: {
    findOrCreate: jest.fn(),
    count: jest.fn(),
    sequelize: { transaction: jest.fn() }
  }
}));
jest.mock("../../../helpers/brandingFiles", () => ({
  isBrandingKey: () => true,
  removerArquivoBranding: jest.fn()
}));
jest.mock("../../../libs/socket", () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) })
}));
jest.mock("../../TranslationServices/i18nService", () => ({
  updateDefaultLanguage: jest.fn()
}));
jest.mock("../GetSettingService", () => ({ safeSettingsKeys: {} }));

describe("substituição de imagens nas configurações", () => {
  const antigo = "branding/1/logo_light-old.png";
  const novo = "branding/1/logo_light-new.png";
  let registro;
  beforeEach(() => {
    registro = {
      key: "appLogoLight",
      companyId: 1,
      value: antigo,
      reload: jest.fn(),
      update: jest.fn(async dados => {
        registro.value = dados.value;
      })
    };
    (Setting.findOrCreate as jest.Mock).mockResolvedValue([registro]);
    (Setting.count as jest.Mock).mockResolvedValue(0);
    (Setting.sequelize.transaction as jest.Mock).mockImplementation(acao =>
      acao({ LOCK: { UPDATE: "UPDATE" } })
    );
  });
  it("exclui o antigo depois de salvar a configuração", async () => {
    await UpdateSettingService({
      key: "appLogoLight",
      companyId: 1,
      value: novo,
      arquivoNovo: true
    });
    expect(registro.value).toEqual(novo);
    expect(removerArquivoBranding).toHaveBeenCalledWith(
      1,
      "appLogoLight",
      antigo
    );
    expect(registro.update.mock.invocationCallOrder[0]).toBeLessThan(
      (removerArquivoBranding as jest.Mock).mock.invocationCallOrder[0]
    );
  });
  it("limpa apenas o novo quando a gravação falha", async () => {
    registro.update.mockRejectedValueOnce(new Error("failed"));
    await expect(
      UpdateSettingService({
        key: "appLogoLight",
        companyId: 1,
        value: novo,
        arquivoNovo: true
      })
    ).rejects.toThrow("failed");
    expect(removerArquivoBranding).toHaveBeenCalledWith(
      1,
      "appLogoLight",
      novo
    );
    expect(removerArquivoBranding).not.toHaveBeenCalledWith(
      1,
      "appLogoLight",
      antigo
    );
  });
  it("remove o arquivo ao limpar a imagem", async () => {
    await UpdateSettingService({
      key: "appLogoLight",
      companyId: 1,
      value: ""
    });
    expect(removerArquivoBranding).toHaveBeenCalledWith(
      1,
      "appLogoLight",
      antigo
    );
  });
  it("preserva um arquivo ainda referenciado em outra configuração", async () => {
    (Setting.count as jest.Mock).mockResolvedValueOnce(1);
    await UpdateSettingService({
      key: "appLogoLight",
      companyId: 1,
      value: novo
    });
    expect(removerArquivoBranding).not.toHaveBeenCalled();
  });
});

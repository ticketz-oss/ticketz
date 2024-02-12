import Setting from "../../models/Setting";

interface Request {
    companyId: number;
    key?: string;
}

const ListSettingsServiceOne = async ({
    companyId,
    key
}: Request): Promise<Setting | undefined> => {
    const setting = await Setting.findOne({
        where: {
            companyId,
            ...(key && { key })
        }
    });

    return setting;
};

export default ListSettingsServiceOne;
/*

   DO NOT REMOVE / NÃO REMOVER

   VERSÃO EM PORTUGUÊS MAIS ABAIXO

   PROPRIETARY CODE

   Author: Claudemir Todo Bom
   Email: claudemir@todobom.com
   
   If you had access to this code, you are not allowed to
   share, copy or distribute it. You are not allowed to use
   it in your projects, create your own projects based on
   it or use it in any way without a written authorization.
   
   CÓDIGO PROPRIETÁRIO

   Autor: Claudemir Todo Bom
   Email: claudemir@todobom.com

   Se você teve acesso a este código, não está autorizado a
   compartilhá-lo, copiá-lo ou distribuí-lo. Não está autorizado
   a utilizá-lo em seus projetos, criar projetos baseados nele
   ou utilizá-lo de qualquer forma sem autorização por escrito.
   
 */

import axios from "axios";
import GetSuperSettingService from "../SettingServices/GetSuperSettingService";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import User from "../../models/User";
import sequelize from "../../database";
import Invoices from "../../models/Invoices";

/**
 * Get a WHMCS option
 * @param key Option key
 * @returns Option value
 *
 * This function is used to get a WHMCS option
 * from the database. The option is stored in the
 * database as a Setting with the key prefixed with
 * "_whmcs" to avoid collision with other settings.
 *
 */
async function whmcsGetOption(key: string) {
  const value = GetSuperSettingService({
    key: `_whmcs${key}`
  });

  return value;
}

export async function isWhmcsEnabled() {
  return (await whmcsGetOption("Enabled")) === "1";
}

async function whmcsApiGetCall(props) {
  const baseUrl = await whmcsGetOption("BaseUrl");
  const apiIdentifier = await whmcsGetOption("ApiIdentifier");
  const apiSecret = await whmcsGetOption("ApiSecret");

  const url = `${baseUrl}/includes/api.php`;

  const response = await axios.post(
    url,
    {
      action: props.action,
      username: apiIdentifier,
      password: apiSecret,
      responsetype: "json",
      ...props.data
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  return response.data;
}

async function getWhmcsCustomer(email: string) {
  const response = await whmcsApiGetCall({
    action: "GetClientsDetails",
    data: {
      email,
      stats: true
    }
  });

  const client = response.result === "success" && response.client;

  if (!client) {
    return null;
  }

  return client;
}

async function getWhmcsCustomerProducts(clientId: number) {
  const response = await whmcsApiGetCall({
    action: "GetClientsProducts",
    data: {
      clientid: clientId
    }
  });

  const products = response.result === "success" && response.products?.product;

  if (!products) {
    return [];
  }

  return products;
}

async function getWhmcsCustomerProduct(clientId: number, productId: number) {
  const products = await getWhmcsCustomerProducts(clientId);

  return products.find(product => product.pid === productId);
}

export async function checkAndInitializeWhmcsCustomer(
  email: string,
  password: string
) {
  const existantUser = await User.findOne({
    where: {
      email
    }
  });

  if (existantUser) {
    return null;
  }

  const existantCompany = await Company.findOne({
    where: {
      email
    }
  });

  if (existantCompany) {
    return null;
  }

  const productCode = Number(await whmcsGetOption("ProductCode"));

  const client = await getWhmcsCustomer(email);
  if (!client) {
    return null;
  }

  const product = await getWhmcsCustomerProduct(client.id, productCode);
  if (!product) {
    return null;
  }

  if (product.status !== "Active") {
    return null;
  }

  const passwordField = product.customfields.customfield.find(field =>
    field.name.toLowerCase().startsWith("password")
  );

  if (!passwordField) {
    return null;
  }

  if (passwordField.value !== password) {
    return null;
  }

  const planOption = product.configoptions.configoption.find(
    option => option.option === "Plan"
  );

  const plan = await Plan.findOne({
    where: {
      name: planOption.value
    }
  });

  if (!plan) {
    return null;
  }

  const billingCycles = {
    Montly: "MENSAL",
    Quarterly: "TRIMESTRAL",
    "Semi-Annually": "SEMESTRAL",
    Annually: "ANUAL"
  };

  await sequelize.transaction(async t => {
    const company = await Company.create(
      {
        name: `${client.firstname} ${client.lastname}`,
        email: client.email,
        phone: client.telephoneNumber,
        status: true,
        dueDate: new Date(product.nextduedate).toISOString(),
        recurrence: billingCycles[product.billingcycle] || "MENSAL",
        planId: plan.id
      },
      { transaction: t }
    );

    await User.create(
      {
        name: `${client.firstname} ${client.lastname}`,
        email,
        password,
        profile: "admin",
        companyId: company.id
      },
      { transaction: t }
    );
  });

  return true;
}

export async function whmcsCheckNewInvoice(
  invoice: Invoices
): Promise<boolean> {
  if (!(await isWhmcsEnabled())) {
    return false;
  }

  await invoice.reload({
    include: { model: Company, as: "company" }
  });

  const client = await getWhmcsCustomer(invoice.company.email);
  if (!client) {
    return false;
  }

  const product = await getWhmcsCustomerProduct(
    client.id,
    Number(await whmcsGetOption("ProductCode"))
  );
  if (!product) {
    return false;
  }

  invoice.payGw = "whmcs";
  await invoice.save();
  return true;
}

export async function whmcsCheckAndUpdateOpenInvoice(
  invoice: Invoices
): Promise<void> {
  if (invoice.payGw !== "whmcs") {
    throw new Error("Invalid payment gateway");
  }

  await invoice.reload({
    include: { model: Company, as: "company" }
  });

  const client = await getWhmcsCustomer(invoice.company.email);
  if (!client) {
    return;
  }

  const product = await getWhmcsCustomerProduct(
    client.id,
    Number(await whmcsGetOption("ProductCode"))
  );
  if (!product) {
    return;
  }

  if (product.status !== "Active") {
    return;
  }

  if (new Date(product.nextduedate) > new Date(invoice.dueDate)) {
    invoice.status = "paid";
    await invoice.save();
    invoice.company.dueDate = new Date(product.nextduedate).toISOString();
    await invoice.company.save();
  }
}

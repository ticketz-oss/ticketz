export type CloudAPINamedParameter = {
  param_name: string;
  example: string;
};

export type CloudAPIComponentExample = {
  header_text_named_params?: CloudAPINamedParameter[];
  body_text_named_params?: CloudAPINamedParameter[];
};

export type CloudAPIButton = {
  type: "QUICK_REPLY";
  text: string;
};

export type CloudAPIComponent = {
  type: "BODY" | "HEADER" | "FOOTER" | "BUTTONS";
  format?: "TEXT";
  text?: string;
  example?: CloudAPIComponentExample;
  buttons?: CloudAPIButton[];
};

export type CloudAPITemplate = {
  name: string;
  parameter_format: "NAMED";
  components: CloudAPIComponent[];
  language: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  category: "MARKETING" | "UTILITY";
  id?: string;
};

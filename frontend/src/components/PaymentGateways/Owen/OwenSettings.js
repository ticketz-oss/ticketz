import React, { useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import useSettings from "../../../hooks/useSettings";
import { toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import axios from "axios";
import { Button, Link, Typography } from "@material-ui/core";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { validateCNPJ } from "validations-br";
import { isValidPhoneNumber } from 'libphonenumber-js'
import { getBackendURL } from "../../../services/config";

const useStyles = makeStyles((_) => ({
  fieldContainer: {
    width: "100%",
    textAlign: "left",
  },
  
  uploadInput: {
    display: "none",
  },
  
  createAccount: {
    paddingTop: "10px",
    paddingBottom: "5px"
  },
  
  title: {
    paddingTop: "10px",
  }
}));


const createSchema = Yup.object().shape({
  nome: Yup.string()
    .min(2, "Too Short!")
    .required("Required"),
  cnpj: Yup.string().test('is-cnpj', "CNPJ is not valid", (value) => validateCNPJ(value)).required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  whatsapp: Yup.string().min(10).test('is-phone', "Whatsapp is not valid", (value) => isValidPhoneNumber(value,"BR")).required("Required"),
});

export default function OwenSettings(props) {
  const { settings } = props;
  const classes = useStyles();
  const [owenSettings, setOwenSettings] = useState({});
  const { update } = useSettings();

  const [showCreateForm, setShowCreateForm] = useState(true);

  const initialCreateState = { nome: "", "cnpj": "", email: "", whatsapp: "" };
  const [createData] = useState(initialCreateState);

  useEffect(() => {
    if (Array.isArray(settings)) {
      const newSettings = {}; 
      settings.forEach( (setting) => {
        if (setting.key.startsWith("_owen")) {
          newSettings[setting.key.substring(1)] = setting.value;
        }
      });
      setOwenSettings(newSettings);
      if (newSettings.owenCnpj && newSettings.owenToken && newSettings.owenSecretKey ) {
        setShowCreateForm(false);
      }
      console.debug(newSettings);
    }
  }, [settings]);

  async function storeSetting(key, value) {
    await update({
      key,
      value
    });
  }

  async function handleSaveSetting(key) {
    if (typeof owenSettings[key] !== "string") {
      return;
    }
    storeSetting(`_${key}`, owenSettings[key]);
    toast.success("Operação atualizada com sucesso.");
  }
  
  async function handleCreateForm(values) {
    const config = {
      baseURL: "https://pix.owenbrasil.com.br",
      timeout: 3000,
    };

    try {
      const r = await axios.post("/api/agencia/ticketz", values, config);
      console.debug("createFormResult", r);
      toast.success(r.data.message);
      setShowCreateForm(false); 
    } catch (error) {
      toast.caller(error?.message || "Erro enviando formulário");
      console.error("createFormResult", error);
    }    
   
  }
  
  return (
    <>
      <Typography variant="h5" color="primary" gutterBottom>
        Owen Payments apoia o Ticketz
      </Typography>
      { !showCreateForm &&
      <>
      <Typography><Link href="#" onClick={() => setShowCreateForm(true)}>Solicite aqui a abertura da sua conta</Link></Typography>
      <Grid spacing={3} container>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="owenCnpj"
              label="CNPJ"
              variant="standard"
              name="owenCnpj"
              value={owenSettings.owenCnpj || ""}
              onChange={(e) => {
                const newSettings = { ...owenSettings };
                newSettings.owenCnpj = e.target.value;
                setOwenSettings(newSettings);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("owenCnpj");
              }}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={3} md={12} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="owenTokenField"
              label="Token"
              variant="standard"
              name="owenToken"
              value={owenSettings.owenToken || ""}
              onChange={(e) => {
                const newSettings = { ...owenSettings };
                newSettings.owenToken = e.target.value;
                setOwenSettings(newSettings);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("owenToken");
              }}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={3} md={12} item>
          <FormControl className={classes.fieldContainer}>
            <TextField
              id="owenSecretKeyField"
              label="Secret Key"
              variant="standard"
              name="owenSecretKey"
              value={owenSettings.owenSecretKey || ""}
              onChange={(e) => {
                const newSettings = { ...owenSettings };
                newSettings.owenSecretKey = e.target.value;
                setOwenSettings(newSettings);
              }}
              onBlur={async (_) => {
                await handleSaveSetting("owenSecretKey");
              }}
            />
          </FormControl>
        </Grid>
        <Grid xs={12} sm={3} md={12} item>
          <Typography variant="h5" color="primary" gutterBottom>
            Configuração do Webhook
          </Typography>
          <Typography variant="body1">
            No painel de configurações da sua conta você precisa configurar o
            webhook para o seguinte conteúdo:
          </Typography>
          <Typography variant="pre">
            {getBackendURL()}/subscription/ticketz/webhook
          </Typography>
        </Grid>
      </Grid>
      </>
      }
      {showCreateForm &&
        <>
          <Typography><Link href="#" onClick={() => setShowCreateForm(false)}>Já abriu sua conta? Clique aqui!</Link></Typography>
        <Formik
          initialValues={createData}
          enableReinitialize={true}
          validationSchema={createSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleCreateForm(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
            {({ touched, errors, isSubmitting }) => (<Form className={classes.form}>

          <Grid spacing={3} container>
            <Grid xs={12} sm={6} md={4} item>
                  <Field
                    as={TextField}
                    fullWidth
                    id="createCnpj"
                    label="CNPJ"
                    name="cnpj"
                    error={touched.cnpj && Boolean(errors.cnpj)}
                    helperText={touched.cnpj && errors.cnpj}
                  />            
            </Grid>
            <Grid xs={12} sm={6} md={12} item>
                  <Field
                    as={TextField}
                    fullWidth
                    id="createNome"
                    label="Nome"
                    name="nome"
                    error={touched.nome && Boolean(errors.nome)}
                    helperText={touched.nome && errors.nome}
                  />            
            </Grid>
            <Grid xs={12} sm={6} md={12} item>
                  <Field
                    as={TextField}
                    fullWidth
                    id="createEmail"
                    label="Email"
                    name="email"
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />            
            </Grid>
            <Grid xs={12} sm={6} md={12} item>
                  <Field
                    as={TextField}
                    fullWidth
                    id="createWhatsapp"
                    label="Whatsapp"
                    name="whatsapp"
                    error={touched.whatsapp && Boolean(errors.whatsapp)}
                    helperText={touched.whatsapp && errors.whatsapp}
                  />            
            </Grid>
            <Grid xs={12} sm={6} md={12} item>
              <Button
                type="submit"
                variant="contained"
                color="primary"
              >
                Solicitar Abertura de Conta
              </Button>
            </Grid>
          </Grid>
          </Form>)}
          </Formik>
        </>
      }
    </>
  );
}

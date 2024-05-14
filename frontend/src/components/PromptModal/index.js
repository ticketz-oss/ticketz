import React, { useState, useEffect } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import { i18n } from "../../translate/i18n";
import { MenuItem, FormControl, InputLabel, Select } from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import { InputAdornment, IconButton } from "@material-ui/core";
import QueueSelectSingle from "../../components/QueueSelectSingle";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    },
    multFieldLine: {
        display: "flex",
        "& > *:not(:last-child)": {
            marginRight: theme.spacing(1),
        },
    },

    btnWrapper: {
        position: "relative",
    },

    buttonProgress: {
        color: green[500],
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    colorAdorment: {
        width: 20,
        height: 20,
    },
}));

const PromptSchema = Yup.object().shape({
    name: Yup.string().min(5, "Muito curto!").max(100, "Muito longo!").required("Obrigatório"),
    prompt: Yup.string().min(50, "Muito curto!").required("Descreva o treinamento para Inteligência Artificial"),
    voice: Yup.string().required("Informe o modo para Voz"),
    max_tokens: Yup.number().required("Informe o número máximo de tokens"),
    temperature: Yup.number().required("Informe a temperatura"),
    apikey: Yup.string().required("Informe a API Key"),
    queueId: Yup.number().required("Informe a fila"),
    max_messages: Yup.number().required("Informe o número máximo de mensagens")
});

const PromptModal = ({ open, onClose, promptId }) => {
    const classes = useStyles();
    const [selectedVoice, setSelectedVoice] = useState("texto");
    const [showApiKey, setShowApiKey] = useState(false);

    const handleToggleApiKey = () => {
        setShowApiKey(!showApiKey);
    };

    const initialState = {
        name: "",
        prompt: "",
        voice: "texto",
        voiceKey: "",
        voiceRegion: "",
        maxTokens: 100,
        temperature: 1,
        apiKey: "",
        queueId: null,
        maxMessages: 10
    };

    const [prompt, setPrompt] = useState(initialState);

    useEffect(() => {
        const fetchPrompt = async () => {
            if (!promptId) {
                setPrompt(initialState);
                return;
            }
            try {
                const { data } = await api.get(`/prompt/${promptId}`);
                setPrompt(prevState => {
                    return { ...prevState, ...data };
                });
                setSelectedVoice(data.voice);
            } catch (err) {
                toastError(err);
            }
        };

        fetchPrompt();
    }, [promptId, open]);

    const handleClose = () => {
        setPrompt(initialState);
        setSelectedVoice("texto");
        onClose();
    };

    const handleChangeVoice = (e) => {
        setSelectedVoice(e.target.value);
    };

    const handleSavePrompt = async values => {
        const promptData = { ...values, voice: selectedVoice };
        if (!values.queueId) {
            toastError("Informe o setor");
            return;
        }
        try {
            if (promptId) {
                await api.put(`/prompt/${promptId}`, promptData);
            } else {
                await api.post("/prompt", promptData);
            }
            toast.success(i18n.t("promptModal.success"));
        } catch (err) {
            toastError(err);
        }
        handleClose();
    };

    return (
        <div className={classes.root}>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                scroll="paper"
                fullWidth
            >
                <DialogTitle id="form-dialog-title">
                    {promptId
                        ? `${i18n.t("promptModal.title.edit")}`
                        : `${i18n.t("promptModal.title.add")}`}
                </DialogTitle>
                <Formik
                    initialValues={prompt}
                    enableReinitialize={true}
                    onSubmit={(values, actions) => {
                        setTimeout(() => {
                            handleSavePrompt(values);
                            actions.setSubmitting(false);
                        }, 400);
                    }}
                >
                    {({ touched, errors, isSubmitting, values }) => (
                        <Form style={{ width: "100%" }}>
                            <DialogContent dividers>
                                <Field
                                    as={TextField}
                                    label={i18n.t("promptModal.form.name")}
                                    name="name"
                                    error={touched.name && Boolean(errors.name)}
                                    helperText={touched.name && errors.name}
                                    variant="outlined"
                                    margin="dense"
                                    fullWidth
                                />
                                <FormControl fullWidth margin="dense" variant="outlined">
                                    <Field
                                        as={TextField}
                                        label={i18n.t("promptModal.form.apikey")}
                                        name="apiKey"
                                        type={showApiKey ? 'text' : 'password'}
                                        error={touched.apiKey && Boolean(errors.apiKey)}
                                        helperText={touched.apiKey && errors.apiKey}
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={handleToggleApiKey}>
                                                        {showApiKey ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </FormControl>
                                <Field
                                    as={TextField}
                                    label={i18n.t("promptModal.form.prompt")}
                                    name="prompt"
                                    error={touched.prompt && Boolean(errors.prompt)}
                                    helperText={touched.prompt && errors.prompt}
                                    variant="outlined"
                                    margin="dense"
                                    fullWidth
                                    rows={10}
                                    multiline={true}
                                />
                                <QueueSelectSingle />
                                <div className={classes.multFieldLine}>
                                    <FormControl fullWidth margin="dense" variant="outlined">
                                    <InputLabel>{i18n.t("promptModal.form.voice")}</InputLabel>
                                        <Select
                                            id="type-select"
                                            labelWidth={60}
                                            name="voice"
                                            value={selectedVoice}
                                            onChange={handleChangeVoice}
                                            multiple={false}
                                        >
                                            <MenuItem key={"texto"} value={"texto"}>
                                                Texto
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-FranciscaNeural"} value={"pt-BR-FranciscaNeural"}>
                                                Francisa
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-AntonioNeural"} value={"pt-BR-AntonioNeural"}>
                                                Antônio
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-BrendaNeural"} value={"pt-BR-BrendaNeural"}>
                                                Brenda
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-DonatoNeural"} value={"pt-BR-DonatoNeural"}>
                                                Donato
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-ElzaNeural"} value={"pt-BR-ElzaNeural"}>
                                                Elza
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-FabioNeural"} value={"pt-BR-FabioNeural"}>
                                                Fábio
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-GiovannaNeural"} value={"pt-BR-GiovannaNeural"}>
                                                Giovanna
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-HumbertoNeural"} value={"pt-BR-HumbertoNeural"}>
                                                Humberto
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-JulioNeural"} value={"pt-BR-JulioNeural"}>
                                                Julio
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-LeilaNeural"} value={"pt-BR-LeilaNeural"}>
                                                Leila
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-LeticiaNeural"} value={"pt-BR-LeticiaNeural"}>
                                                Letícia
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-ManuelaNeural"} value={"pt-BR-ManuelaNeural"}>
                                                Manuela
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-NicolauNeural"} value={"pt-BR-NicolauNeural"}>
                                                Nicolau
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-ValerioNeural"} value={"pt-BR-ValerioNeural"}>
                                                Valério
                                            </MenuItem>
                                            <MenuItem key={"pt-BR-YaraNeural"} value={"pt-BR-YaraNeural"}>
                                                Yara
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Field
                                        as={TextField}
                                        label={i18n.t("promptModal.form.voiceKey")}
                                        name="voiceKey"
                                        error={touched.voiceKey && Boolean(errors.voiceKey)}
                                        helperText={touched.voiceKey && errors.voiceKey}
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                    />
                                    <Field
                                        as={TextField}
                                        label={i18n.t("promptModal.form.voiceRegion")}
                                        name="voiceRegion"
                                        error={touched.voiceRegion && Boolean(errors.voiceRegion)}
                                        helperText={touched.voiceRegion && errors.voiceRegion}
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                    />
                                </div>
                                
                                <div className={classes.multFieldLine}>
                                    <Field
                                        as={TextField}
                                        label={i18n.t("promptModal.form.temperature")}
                                        name="temperature"
                                        error={touched.temperature && Boolean(errors.temperature)}
                                        helperText={touched.temperature && errors.temperature}
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                    />
                                    <Field
                                        as={TextField}
                                        label={i18n.t("promptModal.form.max_tokens")}
                                        name="maxTokens"
                                        error={touched.maxTokens && Boolean(errors.maxTokens)}
                                        helperText={touched.maxTokens && errors.maxTokens}
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                    />
                                    <Field
                                        as={TextField}
                                        label={i18n.t("promptModal.form.max_messages")}
                                        name="maxMessages"
                                        error={touched.maxMessages && Boolean(errors.maxMessages)}
                                        helperText={touched.maxMessages && errors.maxMessages}
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                    />
                                </div>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    onClick={handleClose}
                                    color="secondary"
                                    disabled={isSubmitting}
                                    variant="outlined"
                                >
                                    {i18n.t("promptModal.buttons.cancel")}
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    disabled={isSubmitting}
                                    variant="contained"
                                    className={classes.btnWrapper}
                                >
                                    {promptId
                                        ? `${i18n.t("promptModal.buttons.okEdit")}`
                                        : `${i18n.t("promptModal.buttons.okAdd")}`}
                                    {isSubmitting && (
                                        <CircularProgress
                                            size={24}
                                            className={classes.buttonProgress}
                                        />
                                    )}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </Dialog>
        </div>
    );
};

export default PromptModal;
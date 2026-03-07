import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    Button,
    DialogActions,
    CircularProgress,
    TextField,
    Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";
import { SelectLanguage } from "../SelectLanguage";

const useStyles = makeStyles((theme) => ({
    btnWrapper: { position: "relative" },
    buttonProgress: {
        color: green[500],
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
    hint: {
        fontSize: "11px",
        color: theme.palette.text.secondary,
        marginBottom: theme.spacing(1),
    },
}));

const Schema = Yup.object().shape({
    name: Yup.string().min(2).max(50).required(),
    facebookPageUserId: Yup.string().required("Phone Number ID obrigatório"),
    facebookUserToken: Yup.string().required("Token de acesso obrigatório"),
});

const WaCloudModal = ({ open, onClose, whatsAppId }) => {
    const classes = useStyles();
    const initialState = {
        name: "",
        facebookPageUserId: "",
        facebookUserToken: "",
        tokenMeta: "",
        greetingMessage: "",
        complationMessage: "",
        outOfHoursMessage: "",
        ratingMessage: "",
        transferMessage: "",
        language: localStorage.getItem("language") || "",
        channel: "whatsapp_cloud",
    };
    const [whatsApp, setWhatsApp] = useState(initialState);
    const [selectedQueueIds, setSelectedQueueIds] = useState([]);

    useEffect(() => {
        if (!whatsAppId) return;
        (async () => {
            try {
                const { data } = await api.get(`whatsapp/${whatsAppId}?session=0`);
                setWhatsApp(data);
                setSelectedQueueIds(data.queues?.map((q) => q.id) || []);
            } catch (err) {
                toastError(err);
            }
        })();
    }, [whatsAppId]);

    const handleSave = async (values) => {
        const payload = {
            ...values,
            queueIds: selectedQueueIds,
            channel: "whatsapp_cloud",
        };
        delete payload.queues;
        delete payload.session;
        try {
            if (whatsAppId) {
                await api.put(`/whatsapp/${whatsAppId}`, payload);
            } else {
                await api.post("/whatsapp", payload);
            }
            toast.success(i18n.t("whatsappModal.success"));
            onClose();
        } catch (err) {
            toastError(err);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
            <DialogTitle>
                {whatsAppId
                    ? "Editar conexão WhatsApp Cloud API"
                    : "Nova conexão WhatsApp Cloud API"}
            </DialogTitle>
            <Formik
                initialValues={whatsApp}
                enableReinitialize
                validationSchema={Schema}
                onSubmit={(values, actions) => {
                    setTimeout(() => { handleSave(values); actions.setSubmitting(false); }, 400);
                }}
            >
                {({ touched, errors, isSubmitting }) => (
                    <Form>
                        <DialogContent dividers>
                            <Typography className={classes.hint}>
                                Preencha os dados do seu WhatsApp Business via Meta (Cloud API).
                            </Typography>
                            <Field
                                as={TextField}
                                label="Nome da conexão"
                                name="name"
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                error={touched.name && Boolean(errors.name)}
                                helperText={touched.name && errors.name}
                            />
                            <Field
                                as={TextField}
                                label="Phone Number ID"
                                name="facebookPageUserId"
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                error={touched.facebookPageUserId && Boolean(errors.facebookPageUserId)}
                                helperText={touched.facebookPageUserId && errors.facebookPageUserId}
                            />
                            <Field
                                as={TextField}
                                label="Token de Acesso Permanente"
                                name="facebookUserToken"
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                error={touched.facebookUserToken && Boolean(errors.facebookUserToken)}
                                helperText={touched.facebookUserToken && errors.facebookUserToken}
                            />
                            <Field
                                as={TextField}
                                label="App Secret (opcional, para verificação de assinatura)"
                                name="tokenMeta"
                                fullWidth
                                variant="outlined"
                                margin="dense"
                            />
                            <Field
                                as={TextField}
                                label={i18n.t("queueModal.form.greetingMessage")}
                                name="greetingMessage"
                                multiline
                                rows={3}
                                fullWidth
                                variant="outlined"
                                margin="dense"
                            />
                            <Field
                                as={TextField}
                                label={i18n.t("queueModal.form.complationMessage")}
                                name="complationMessage"
                                multiline
                                rows={3}
                                fullWidth
                                variant="outlined"
                                margin="dense"
                            />
                            <Field
                                as={TextField}
                                label={i18n.t("queueModal.form.outOfHoursMessage")}
                                name="outOfHoursMessage"
                                multiline
                                rows={3}
                                fullWidth
                                variant="outlined"
                                margin="dense"
                            />
                            <QueueSelect
                                selectedQueueIds={selectedQueueIds}
                                onChange={setSelectedQueueIds}
                            />
                            <Field
                                as={SelectLanguage}
                                name="language"
                                fullWidth
                                variant="outlined"
                                margin="dense"
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={onClose} color="secondary" variant="outlined" disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <div className={classes.btnWrapper}>
                                <Button type="submit" color="primary" variant="contained" disabled={isSubmitting}>
                                    {whatsAppId ? "Salvar" : "Adicionar"}
                                </Button>
                                {isSubmitting && <CircularProgress size={24} className={classes.buttonProgress} />}
                            </div>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
};

export default WaCloudModal;

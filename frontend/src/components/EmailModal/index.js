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
    Grid,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";

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
    section: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(1),
        fontWeight: 600,
    },
}));

const Schema = Yup.object().shape({
    name: Yup.string().min(2).max(50).required("Nome obrigatório"),
    emailSmtpHost: Yup.string().required("Host SMTP obrigatório"),
    emailSmtpUser: Yup.string().email("E-mail inválido").required("Usuário SMTP obrigatório"),
    emailSmtpPass: Yup.string().required("Senha SMTP obrigatória"),
    emailFrom: Yup.string().email("E-mail inválido").nullable(),
});

const EmailModal = ({ open, onClose, whatsAppId }) => {
    const classes = useStyles();
    const initialState = {
        name: "",
        emailSmtpHost: "",
        emailSmtpPort: 587,
        emailSmtpUser: "",
        emailSmtpPass: "",
        emailImapHost: "",
        emailImapPort: 993,
        emailFrom: "",
        greetingMessage: "",
        complationMessage: "",
        outOfHoursMessage: "",
        channel: "email",
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
            emailSmtpPort: Number(values.emailSmtpPort) || 587,
            emailImapPort: Number(values.emailImapPort) || 993,
            queueIds: selectedQueueIds,
            channel: "email",
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
                {whatsAppId ? "Editar conexão E-mail" : "Nova conexão E-mail"}
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
                                Configure SMTP (envio) e IMAP (recebimento de e-mails).
                                O sistema verificará sua caixa a cada 30 segundos.
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

                            <Typography className={classes.section}>⚙️ SMTP (Envio)</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={9}>
                                    <Field
                                        as={TextField}
                                        label="Servidor SMTP"
                                        name="emailSmtpHost"
                                        fullWidth
                                        variant="outlined"
                                        margin="dense"
                                        error={touched.emailSmtpHost && Boolean(errors.emailSmtpHost)}
                                        helperText={touched.emailSmtpHost && errors.emailSmtpHost}
                                    />
                                </Grid>
                                <Grid item xs={3}>
                                    <Field
                                        as={TextField}
                                        label="Porta"
                                        name="emailSmtpPort"
                                        type="number"
                                        fullWidth
                                        variant="outlined"
                                        margin="dense"
                                    />
                                </Grid>
                            </Grid>
                            <Field
                                as={TextField}
                                label="Usuário (e-mail)"
                                name="emailSmtpUser"
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                error={touched.emailSmtpUser && Boolean(errors.emailSmtpUser)}
                                helperText={touched.emailSmtpUser && errors.emailSmtpUser}
                            />
                            <Field
                                as={TextField}
                                label="Senha"
                                name="emailSmtpPass"
                                type="password"
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                error={touched.emailSmtpPass && Boolean(errors.emailSmtpPass)}
                                helperText={touched.emailSmtpPass && errors.emailSmtpPass}
                            />
                            <Field
                                as={TextField}
                                label="E-mail remetente (opcional, ex: Suporte <suporte@empresa.com>)"
                                name="emailFrom"
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                error={touched.emailFrom && Boolean(errors.emailFrom)}
                                helperText={touched.emailFrom && errors.emailFrom}
                            />

                            <Typography className={classes.section}>📥 IMAP (Recebimento)</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={9}>
                                    <Field
                                        as={TextField}
                                        label="Servidor IMAP (vazio = usar SMTP)"
                                        name="emailImapHost"
                                        fullWidth
                                        variant="outlined"
                                        margin="dense"
                                    />
                                </Grid>
                                <Grid item xs={3}>
                                    <Field
                                        as={TextField}
                                        label="Porta"
                                        name="emailImapPort"
                                        type="number"
                                        fullWidth
                                        variant="outlined"
                                        margin="dense"
                                    />
                                </Grid>
                            </Grid>

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
                            <QueueSelect
                                selectedQueueIds={selectedQueueIds}
                                onChange={setSelectedQueueIds}
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

export default EmailModal;

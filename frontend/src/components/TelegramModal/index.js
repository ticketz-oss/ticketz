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
    name: Yup.string().min(2).max(50).required("Nome obrigatório"),
    telegramToken: Yup.string().required("Bot Token obrigatório"),
});

const TelegramModal = ({ open, onClose, whatsAppId }) => {
    const classes = useStyles();
    const initialState = {
        name: "",
        telegramToken: "",
        telegramBotName: "",
        greetingMessage: "",
        complationMessage: "",
        outOfHoursMessage: "",
        ratingMessage: "",
        transferMessage: "",
        channel: "telegram",
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
            channel: "telegram",
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

    const telegramWebhookBase = `${window.location.origin}/backend/webhook/telegram`;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
            <DialogTitle>
                {whatsAppId ? "Editar conexão Telegram" : "Nova conexão Telegram"}
            </DialogTitle>
            <Formik
                initialValues={whatsApp}
                enableReinitialize
                validationSchema={Schema}
                onSubmit={(values, actions) => {
                    setTimeout(() => { handleSave(values); actions.setSubmitting(false); }, 400);
                }}
            >
                {({ touched, errors, isSubmitting, values }) => (
                    <Form>
                        <DialogContent dividers>
                            <Typography className={classes.hint}>
                                Crie um bot no Telegram via @BotFather e cole o token abaixo.
                                Configure o webhook: <strong>{telegramWebhookBase}/SEU_TOKEN</strong>
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
                                label="Bot Token (formato: 123456789:ABC...)"
                                name="telegramToken"
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                error={touched.telegramToken && Boolean(errors.telegramToken)}
                                helperText={touched.telegramToken && errors.telegramToken}
                            />
                            <Field
                                as={TextField}
                                label="Nome do bot (ex: @MeuBot)"
                                name="telegramBotName"
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

export default TelegramModal;

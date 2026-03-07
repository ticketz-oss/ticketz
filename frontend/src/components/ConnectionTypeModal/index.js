import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import EmailIcon from "@material-ui/icons/Email";
import SendIcon from "@material-ui/icons/Send";

const useStyles = makeStyles((theme) => ({
    card: {
        textAlign: "center",
        padding: theme.spacing(2),
        border: "2px solid transparent",
        borderRadius: 12,
        transition: "all 0.2s",
    },
    selected: {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light + "22",
    },
    icon: {
        fontSize: 40,
        marginBottom: theme.spacing(1),
    },
    instagramIcon: {
        fontSize: 40,
        marginBottom: theme.spacing(1),
        background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    waCloudIcon: {
        color: "#25D366",
        fontSize: 40,
        marginBottom: theme.spacing(1),
    },
    telegramIcon: {
        color: "#2CA5E0",
        fontSize: 40,
        marginBottom: theme.spacing(1),
    },
}));

const channels = [
    {
        id: "whatsapp",
        label: "WhatsApp (Baileys)",
        description: "QR Code — conexão direta",
        icon: "whatsapp",
        color: "#25D366",
    },
    {
        id: "whatsapp_cloud",
        label: "WhatsApp Cloud API",
        description: "Meta Business — API oficial",
        icon: "wacloud",
        color: "#0866FF",
    },
    {
        id: "instagram",
        label: "Instagram",
        description: "Mensagens diretas",
        icon: "instagram",
        color: "#E1306C",
    },
    {
        id: "telegram",
        label: "Telegram",
        description: "Bot via API Oficial",
        icon: "telegram",
        color: "#2CA5E0",
    },
    {
        id: "email",
        label: "E-mail",
        description: "SMTP + IMAP",
        icon: "email",
        color: "#EA4335",
    },
];

const ConnectionTypeModal = ({ open, onClose, onSelect }) => {
    const classes = useStyles();
    const [selected, setSelected] = useState(null);

    const handleSelect = () => {
        if (selected) {
            onSelect(selected);
            onClose();
        }
    };

    const getIcon = (channel) => {
        switch (channel.icon) {
            case "whatsapp":
            case "wacloud":
                return (
                    <WhatsAppIcon
                        className={classes.icon}
                        style={{ color: channel.color }}
                    />
                );
            case "telegram":
                return (
                    <SendIcon
                        className={classes.icon}
                        style={{ color: channel.color }}
                    />
                );
            case "email":
                return (
                    <EmailIcon
                        className={classes.icon}
                        style={{ color: channel.color }}
                    />
                );
            case "instagram":
                return (
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        style={{ marginBottom: 8 }}
                    >
                        <defs>
                            <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#f09433" />
                                <stop offset="50%" stopColor="#dc2743" />
                                <stop offset="100%" stopColor="#bc1888" />
                            </linearGradient>
                        </defs>
                        <path
                            fill="url(#ig-grad)"
                            d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                        />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Selecionar tipo de conexão</DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    {channels.map((ch) => (
                        <Grid item xs={6} sm={4} key={ch.id}>
                            <Card
                                className={`${classes.card} ${selected === ch.id ? classes.selected : ""
                                    }`}
                                variant="outlined"
                            >
                                <CardActionArea onClick={() => setSelected(ch.id)}>
                                    <CardContent>
                                        {getIcon(ch)}
                                        <Typography variant="subtitle2">{ch.label}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {ch.description}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary" variant="outlined">
                    Cancelar
                </Button>
                <Button
                    onClick={handleSelect}
                    color="primary"
                    variant="contained"
                    disabled={!selected}
                >
                    Continuar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConnectionTypeModal;

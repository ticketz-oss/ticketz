import React, { useState, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import {
	Button,
	TableBody,
	TableRow,
	TableCell,
	IconButton,
	Table,
	TableHead,
	Paper,
	Tooltip,
	Typography,
	CircularProgress,
	Checkbox,
	Chip,
} from "@material-ui/core";
import {
	Edit,
	CheckCircle,
	SignalCellularConnectedNoInternet2Bar,
	SignalCellularConnectedNoInternet0Bar,
	SignalCellular4Bar,
	CropFree,
	DeleteOutline,
	Lock,
	Refresh,
	Replay,
	Email as EmailIcon,
	Send as SendIcon,
} from "@material-ui/icons";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhoneSlash, faQrcode, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";

import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import WaCloudModal from "../../components/WaCloudModal";
import InstagramModal from "../../components/InstagramModal";
import TelegramModal from "../../components/TelegramModal";
import EmailModal from "../../components/EmailModal";
import ConnectionTypeModal from "../../components/ConnectionTypeModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import PrivacyModal from "../../components/PrivacyModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import WavoipModal from "../../components/WavoipModal";
import { wavoipAvailable } from "../../helpers/wavoipCallManager";

// ─── Channel badge helper ──────────────────────────────────────────────────────
const CHANNEL_LABELS = {
	whatsapp: { label: "WhatsApp", color: "#25D366" },
	whatsapp_cloud: { label: "WA Cloud", color: "#0866FF" },
	instagram: { label: "Instagram", color: "#E1306C" },
	telegram: { label: "Telegram", color: "#2CA5E0" },
	email: { label: "E-mail", color: "#EA4335" },
};

const ChannelBadge = ({ channel }) => {
	const info = CHANNEL_LABELS[channel] || { label: channel || "WhatsApp", color: "#25D366" };
	return (
		<Chip
			label={info.label}
			size="small"
			style={{
				backgroundColor: info.color + "22",
				color: info.color,
				fontWeight: 600,
				fontSize: 11,
				border: `1px solid ${info.color}55`,
			}}
		/>
	);
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const useStyles = makeStyles(theme => ({
	mainPaper: {
		flex: 1,
		padding: theme.spacing(1),
		overflowY: "scroll",
		...theme.scrollbarStyles,
	},
	customTableCell: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	tooltip: {
		backgroundColor: "#f5f5f9",
		color: "rgba(0, 0, 0, 0.87)",
		fontSize: theme.typography.pxToRem(14),
		border: "1px solid #dadde9",
		maxWidth: 450,
	},
	tooltipPopper: {
		textAlign: "center",
	},
	buttonProgress: {
		color: green[500],
	},
}));

const CustomToolTip = ({ title, content, children }) => {
	const classes = useStyles();
	return (
		<Tooltip
			arrow
			classes={{ tooltip: classes.tooltip, popper: classes.tooltipPopper }}
			title={
				<React.Fragment>
					<Typography gutterBottom color="inherit">{title}</Typography>
					{content && <Typography>{content}</Typography>}
				</React.Fragment>
			}
		>
			{children}
		</Tooltip>
	);
};

// ─── Is Baileys-type channel ──────────────────────────────────────────────────
const isBaileyChannel = (ch) => !ch || ch === "whatsapp";

// ─── Main component ───────────────────────────────────────────────────────────
const Connections = () => {
	const classes = useStyles();

	const { whatsApps, loading } = useContext(WhatsAppsContext);

	// Generic connection edit modal
	const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);

	// Baileys WhatsApp modals
	const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
	const [qrModalOpen, setQrModalOpen] = useState(false);
	const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
	const [wavoipModalOpen, setWavoipModalOpen] = useState(false);

	// New channel modals
	const [connectionTypeModalOpen, setConnectionTypeModalOpen] = useState(false);
	const [waCloudModalOpen, setWaCloudModalOpen] = useState(false);
	const [instagramModalOpen, setInstagramModalOpen] = useState(false);
	const [telegramModalOpen, setTelegramModalOpen] = useState(false);
	const [emailModalOpen, setEmailModalOpen] = useState(false);

	// Confirmation
	const confirmationModalInitialState = { action: "", title: "", message: "", whatsAppId: "", open: false };
	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const [confirmModalInfo, setConfirmModalInfo] = useState(confirmationModalInitialState);

	// ── Open the right modal for a given channel ──────────────────────────────
	const openModalForChannel = (channel, whatsApp) => {
		setSelectedWhatsApp(whatsApp);
		const ch = channel || "whatsapp";
		if (ch === "whatsapp") setWhatsAppModalOpen(true);
		else if (ch === "whatsapp_cloud") setWaCloudModalOpen(true);
		else if (ch === "instagram") setInstagramModalOpen(true);
		else if (ch === "telegram") setTelegramModalOpen(true);
		else if (ch === "email") setEmailModalOpen(true);
		else setWhatsAppModalOpen(true);
	};

	// ── Close helpers ─────────────────────────────────────────────────────────
	const closeAll = () => {
		setSelectedWhatsApp(null);
		setWhatsAppModalOpen(false);
		setWaCloudModalOpen(false);
		setInstagramModalOpen(false);
		setTelegramModalOpen(false);
		setEmailModalOpen(false);
		setQrModalOpen(false);
		setPrivacyModalOpen(false);
		setWavoipModalOpen(false);
	};

	// ── Add button: open channel type selector ────────────────────────────────
	const handleAddConnection = () => {
		setSelectedWhatsApp(null);
		setConnectionTypeModalOpen(true);
	};

	const handleChannelTypeSelected = (channelType) => {
		setConnectionTypeModalOpen(false);
		openModalForChannel(channelType, null);
	};

	const handleEditWhatsApp = (whatsApp) => {
		openModalForChannel(whatsApp.channel, whatsApp);
	};

	// ── Session handlers ──────────────────────────────────────────────────────
	const handleStartWhatsAppSession = async whatsAppId => {
		try { await api.post(`/whatsappsession/${whatsAppId}`); }
		catch (err) { toastError(err); }
	};

	const handleRequestNewQrCode = async whatsAppId => {
		try { await api.put(`/whatsappsession/${whatsAppId}`); }
		catch (err) { toastError(err); }
	};

	const handleOpenQrModal = whatsApp => {
		setSelectedWhatsApp(whatsApp);
		setQrModalOpen(true);
	};

	const handleOpenPrivacyWhatsApp = (whatsApp) => {
		setSelectedWhatsApp(whatsApp);
		setPrivacyModalOpen(true);
	};

	const refreshWhatsApp = async whatsApp => {
		try { await api.get(`/whatsappsession/refresh/${whatsApp.id}`); }
		catch (err) { toastError(err); }
	};

	const handleOpenWavoipModal = whatsApp => {
		setSelectedWhatsApp(whatsApp);
		setWavoipModalOpen(true);
	};

	// ── Confirmation modal ────────────────────────────────────────────────────
	const handleOpenConfirmationModal = (action, whatsAppId) => {
		if (action === "disconnect") {
			setConfirmModalInfo({
				action,
				title: i18n.t("connections.confirmationModal.disconnectTitle"),
				message: i18n.t("connections.confirmationModal.disconnectMessage"),
				whatsAppId,
			});
		}
		if (action === "delete") {
			setConfirmModalInfo({
				action,
				title: i18n.t("connections.confirmationModal.deleteTitle"),
				message: i18n.t("connections.confirmationModal.deleteMessage"),
				whatsAppId,
			});
		}
		setConfirmModalOpen(true);
	};

	const handleSubmitConfirmationModal = async (checked) => {
		if (confirmModalInfo.action === "disconnect") {
			try { await api.delete(`/whatsappsession/${confirmModalInfo.whatsAppId}`); }
			catch (err) { toastError(err); }
		}
		if (confirmModalInfo.action === "delete") {
			try {
				await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}`, {
					params: { closeTickets: checked }
				});
				toast.success(i18n.t("connections.toasts.deleted"));
			} catch (err) { toastError(err); }
		}
		setConfirmModalInfo(confirmationModalInitialState);
	};

	// ── Status & action renderers ─────────────────────────────────────────────
	const renderStatusToolTips = whatsApp => {
		const ch = whatsApp.channel;

		// Non-Baileys channels: just show CONNECTED / DISCONNECTED by status field
		if (!isBaileyChannel(ch)) {
			return (
				<div className={classes.customTableCell}>
					{(whatsApp.status === "CONNECTED" || whatsApp.status === "OPENING") ? (
						<CustomToolTip title="Conectado">
							<SignalCellular4Bar style={{ color: green[500] }} />
						</CustomToolTip>
					) : (
						<CustomToolTip title="Configurado — webhook ativo">
							<SignalCellular4Bar style={{ color: green[500] }} />
						</CustomToolTip>
					)}
				</div>
			);
		}

		return (
			<div className={classes.customTableCell}>
				{whatsApp.status === "DISCONNECTED" && (
					<CustomToolTip
						title={i18n.t("connections.toolTips.disconnected.title")}
						content={i18n.t("connections.toolTips.disconnected.content")}
					>
						<SignalCellularConnectedNoInternet0Bar color="secondary" />
					</CustomToolTip>
				)}
				{whatsApp.status === "OPENING" && (
					<CircularProgress size={24} className={classes.buttonProgress} />
				)}
				{whatsApp.status === "qrcode" && (
					<CustomToolTip
						title={i18n.t("connections.toolTips.qrcode.title")}
						content={i18n.t("connections.toolTips.qrcode.content")}
					>
						<CropFree />
					</CustomToolTip>
				)}
				{whatsApp.status === "CONNECTED" && (
					<CustomToolTip title={i18n.t("connections.toolTips.connected.title")}>
						<SignalCellular4Bar style={{ color: green[500] }} />
					</CustomToolTip>
				)}
				{(whatsApp.status === "TIMEOUT" || whatsApp.status === "PAIRING") && (
					<CustomToolTip
						title={i18n.t("connections.toolTips.timeout.title")}
						content={i18n.t("connections.toolTips.timeout.content")}
					>
						<SignalCellularConnectedNoInternet2Bar color="secondary" />
					</CustomToolTip>
				)}
			</div>
		);
	};

	const renderActionButtons = whatsApp => {
		const ch = whatsApp.channel;

		// Non-Baileys channels have no QR/session management
		if (!isBaileyChannel(ch)) {
			return null;
		}

		return (
			<>
				{whatsApp.status === "qrcode" && (
					<Tooltip title={i18n.t("connections.toolTips.scan")}>
						<IconButton size="small" onClick={() => handleOpenQrModal(whatsApp)}>
							<FontAwesomeIcon icon={faQrcode} />
						</IconButton>
					</Tooltip>
				)}
				{whatsApp.status === "DISCONNECTED" && (
					<>
						<Tooltip title={i18n.t("connections.toolTips.retry")}>
							<IconButton size="small" onClick={() => handleStartWhatsAppSession(whatsApp.id)}>
								<Replay />
							</IconButton>
						</Tooltip>
						<Tooltip title={i18n.t("connections.toolTips.newQr")}>
							<IconButton size="small" onClick={() => handleRequestNewQrCode(whatsApp.id)}>
								<FontAwesomeIcon icon={faWandMagicSparkles} />
							</IconButton>
						</Tooltip>
					</>
				)}
				{(whatsApp.status === "CONNECTED" || whatsApp.status === "PAIRING" || whatsApp.status === "TIMEOUT") && (
					<Tooltip title={i18n.t("connections.toolTips.disconnect")}>
						<IconButton size="small" onClick={() => handleOpenConfirmationModal("disconnect", whatsApp.id)}>
							<FontAwesomeIcon icon={faPhoneSlash} />
						</IconButton>
					</Tooltip>
				)}
				{whatsApp.status === "CONNECTED" && (
					<Tooltip title={i18n.t("connections.toolTips.refresh")}>
						<IconButton size="small" onClick={() => refreshWhatsApp(whatsApp)}>
							<Refresh />
						</IconButton>
					</Tooltip>
				)}
			</>
		);
	};

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<MainContainer>
			<ConfirmationModal
				title={confirmModalInfo.title}
				open={confirmModalOpen}
				onClose={setConfirmModalOpen}
				onConfirm={handleSubmitConfirmationModal}
				checkbox={confirmModalInfo.action === "delete" ? i18n.t("connections.confirmationModal.closeTickets") : undefined}
			>
				{confirmModalInfo.message}
			</ConfirmationModal>

			<QrcodeModal
				open={qrModalOpen}
				onClose={() => { setSelectedWhatsApp(null); setQrModalOpen(false); }}
				whatsAppId={!whatsAppModalOpen && !privacyModalOpen && selectedWhatsApp?.id}
			/>

			{/* Baileys WhatsApp */}
			<WhatsAppModal
				open={whatsAppModalOpen}
				onClose={closeAll}
				whatsAppId={!qrModalOpen && !privacyModalOpen && selectedWhatsApp?.id}
			/>
			<PrivacyModal
				open={privacyModalOpen}
				onClose={() => { setSelectedWhatsApp(null); setPrivacyModalOpen(false); }}
				whatsAppId={!qrModalOpen && !whatsAppModalOpen && selectedWhatsApp?.id}
			/>
			<WavoipModal
				open={wavoipModalOpen}
				onClose={() => { setWavoipModalOpen(false); setSelectedWhatsApp(null); }}
				whatsappId={selectedWhatsApp?.id}
			/>

			{/* Channel selector */}
			<ConnectionTypeModal
				open={connectionTypeModalOpen}
				onClose={() => setConnectionTypeModalOpen(false)}
				onSelect={handleChannelTypeSelected}
			/>

			{/* New channel modals */}
			<WaCloudModal
				open={waCloudModalOpen}
				onClose={closeAll}
				whatsAppId={selectedWhatsApp?.id}
			/>
			<InstagramModal
				open={instagramModalOpen}
				onClose={closeAll}
				whatsAppId={selectedWhatsApp?.id}
			/>
			<TelegramModal
				open={telegramModalOpen}
				onClose={closeAll}
				whatsAppId={selectedWhatsApp?.id}
			/>
			<EmailModal
				open={emailModalOpen}
				onClose={closeAll}
				whatsAppId={selectedWhatsApp?.id}
			/>

			<MainHeader>
				<Title>{i18n.t("connections.title")}</Title>
				<MainHeaderButtonsWrapper>
					<Button
						variant="contained"
						color="primary"
						onClick={handleAddConnection}
					>
						Adicionar canais
					</Button>
				</MainHeaderButtonsWrapper>
			</MainHeader>

			<Paper className={classes.mainPaper} variant="outlined">
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell align="center">{i18n.t("connections.table.name")}</TableCell>
							<TableCell align="center">Canal</TableCell>
							<TableCell align="center">{i18n.t("connections.table.status")}</TableCell>
							<TableCell align="center">{i18n.t("connections.table.session")}</TableCell>
							<TableCell align="center">{i18n.t("connections.table.lastUpdate")}</TableCell>
							<TableCell align="center">{i18n.t("connections.table.default")}</TableCell>
							<TableCell align="center">{i18n.t("connections.table.actions")}</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRowSkeleton />
						) : (
							<>
								{whatsApps?.length > 0 &&
									whatsApps.map(whatsApp => (
										<TableRow key={whatsApp.id}>
											<TableCell align="center">{whatsApp.name}</TableCell>
											<TableCell align="center">
												<ChannelBadge channel={whatsApp.channel || "whatsapp"} />
											</TableCell>
											<TableCell align="center">
												{renderStatusToolTips(whatsApp)}
											</TableCell>
											<TableCell align="center">
												{renderActionButtons(whatsApp)}
											</TableCell>
											<TableCell align="center">
												{format(parseISO(whatsApp.updatedAt), "dd/MM/yy HH:mm")}
											</TableCell>
											<TableCell align="center">
												{whatsApp.isDefault && (
													<div className={classes.customTableCell}>
														<CheckCircle style={{ color: green[500] }} />
													</div>
												)}
											</TableCell>
											<TableCell align="center">
												<IconButton size="small" onClick={() => handleEditWhatsApp(whatsApp)}>
													<Edit />
												</IconButton>

												{whatsApp.status === "CONNECTED" && isBaileyChannel(whatsApp.channel) && (
													<IconButton size="small" onClick={() => handleOpenPrivacyWhatsApp(whatsApp)}>
														<Lock />
													</IconButton>
												)}

												{false && whatsApp.channel === "whatsapp" && wavoipAvailable() && (
													<IconButton size="small" onClick={() => handleOpenWavoipModal(whatsApp)}>
														<img src={require("../../assets/wavoip.webp")} alt="Wavoip" style={{ width: 20, height: 20 }} />
													</IconButton>
												)}

												<IconButton
													size="small"
													onClick={() => handleOpenConfirmationModal("delete", whatsApp.id)}
												>
													<DeleteOutline />
												</IconButton>
											</TableCell>
										</TableRow>
									))}
							</>
						)}
					</TableBody>
				</Table>
			</Paper>
		</MainContainer>
	);
};

export default Connections;
import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import {
	Dialog,
	DialogContent,
	DialogTitle,
	Button,
	DialogActions,
	CircularProgress,
	Grid,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	makeStyles,
} from "@material-ui/core";
import { green } from "@material-ui/core/colors";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
		backgroundColor: theme.palette.tabHeaderBackground,
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
}));

const PrivacyModal = ({ open, onClose, whatsAppId }) => {
	const classes = useStyles();
	const initialState = {
		readreceipts: 'all',
        profile: 'all',
        status: 'all',
        online: 'all',
        last: 'all',
        groupadd: 'all',
        calladd: 'all',
        disappearing: '0'
	};
	const [privacy, setPrivacy] = useState(initialState);

	useEffect(() => {
		const fetchSession = async () => {
			if (!whatsAppId) return;

			try {
				const { data } = await api.get(`whatsapp/privacy/${whatsAppId}`);
				setPrivacy(data);
			} catch (err) {
				toastError(err);
			}
		};
		fetchSession();
	}, [whatsAppId]);

	const handleSavePrivacy = async (values) => {
		const privacyData = { ...values };

		try {
			await api.put(`/whatsapp/privacy/${whatsAppId}`, privacyData);
			toast.success(i18n.t("privacyModal.success"));
			handleClose();
		} catch (err) {
			toastError(err);
		}
	};

	const handleClose = () => {
		onClose();
		setPrivacy(initialState);
	};

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="md"
				fullWidth
				scroll="paper"
			>
				<DialogTitle>
					{i18n.t("privacyModal.title")}
                    {privacy.whatsapp && (
                        <>
                        - {privacy?.whatsapp?.name}
                        </>
                    )}
				</DialogTitle>
				<Formik
					initialValues={privacy}
					enableReinitialize={true}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSavePrivacy(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ values, touched, errors, isSubmitting }) => (
						<Form>
							<DialogContent dividers>
								<div className={classes.multFieldLine}>
									<Grid spacing={2} container>
                                        <Grid xs={6} md={6} item>
											<FormControl
												variant="outlined"
												margin="dense"
												className={classes.FormControl}
												fullWidth
											>
												<InputLabel id="readreceipts-selection-label">
													{i18n.t("privacyModal.form.readreceipts")}
												</InputLabel>
												<Field
													as={Select}
													name="readreceipts"
													id="readreceipts"
													label={i18n.t("privacyModal.form.readreceipts")}
													placeholder={i18n.t("privacyModal.form.readreceipts")}
													labelId="readreceipts-selection-label"
												>
                                                    <MenuItem value="all">
                                                        {i18n.t("privacyModal.form.menu.all")}
                                                    </MenuItem>
                                                    <MenuItem value="none">
                                                        {i18n.t("privacyModal.form.menu.none")}
                                                    </MenuItem>
												</Field>
											</FormControl>
										</Grid>

                                        <Grid xs={6} md={6} item>
											<FormControl
												variant="outlined"
												margin="dense"
												className={classes.FormControl}
												fullWidth
											>
												<InputLabel id="profile-selection-label">
													{i18n.t("privacyModal.form.profile")}
												</InputLabel>
												<Field
													as={Select}
													name="profile"
													id="profile"
													label={i18n.t("privacyModal.form.profile")}
													placeholder={i18n.t("privacyModal.form.profile")}
													labelId="profile-selection-label"
												>
                                                    <MenuItem value="all">
                                                        {i18n.t("privacyModal.form.menu.all")}
                                                    </MenuItem>
                                                    <MenuItem value="contacts">
                                                        {i18n.t("privacyModal.form.menu.contacts")}
                                                    </MenuItem>
                                                    <MenuItem value="contact_blacklist">
                                                        {i18n.t("privacyModal.form.menu.contact_blacklist")}
                                                    </MenuItem>
                                                    <MenuItem value="none">
                                                        {i18n.t("privacyModal.form.menu.none")}
                                                    </MenuItem>
												</Field>
											</FormControl>
										</Grid>

                                        <Grid xs={6} md={6} item>
                                            <FormControl
                                                variant="outlined"
                                                margin="dense"
                                                className={classes.FormControl}
                                                fullWidth
                                            >
                                                <InputLabel id="status-selection-label">
                                                    {i18n.t("privacyModal.form.status")}
                                                </InputLabel>
                                                <Field
                                                    as={Select}
                                                    name="status"
                                                    id="status"
                                                    label={i18n.t("privacyModal.form.status")}
                                                    placeholder={i18n.t("privacyModal.form.status")}
                                                    labelId="status-selection-label"
                                                >
                                                    <MenuItem value="all">
                                                        {i18n.t("privacyModal.form.menu.all")}
                                                    </MenuItem>
                                                    <MenuItem value="contacts">
                                                        {i18n.t("privacyModal.form.menu.contacts")}
                                                    </MenuItem>
                                                    <MenuItem value="contact_blacklist">
                                                        {i18n.t("privacyModal.form.menu.contact_blacklist")}
                                                    </MenuItem>
                                                    <MenuItem value="none">
                                                        {i18n.t("privacyModal.form.menu.none")}
                                                    </MenuItem>
                                                </Field>
                                            </FormControl>
                                        </Grid>

                                        <Grid xs={6} md={6} item>
                                            <FormControl
                                                variant="outlined"
                                                margin="dense"
                                                className={classes.FormControl}
                                                fullWidth
                                            >
                                                <InputLabel id="online-selection-label">
                                                    {i18n.t("privacyModal.form.online")}
                                                </InputLabel>
                                                <Field
                                                    as={Select}
                                                    name="online"
                                                    id="online"
                                                    label={i18n.t("privacyModal.form.online")}
                                                    placeholder={i18n.t("privacyModal.form.online")}
                                                    labelId="online-selection-label"
                                                >
                                                    <MenuItem value="all">
                                                        {i18n.t("privacyModal.form.menu.all")}
                                                    </MenuItem>
                                                    <MenuItem value="match_last_seen">
                                                        {i18n.t("privacyModal.form.menu.match_last_seen")}
                                                    </MenuItem>
                                                </Field>
                                            </FormControl>
                                        </Grid>

                                        <Grid xs={6} md={6} item>
                                            <FormControl
                                                variant="outlined"
                                                margin="dense"
                                                className={classes.FormControl}
                                                fullWidth
                                            >
                                                <InputLabel id="last-selection-label">
                                                    {i18n.t("privacyModal.form.last")}
                                                </InputLabel>
                                                <Field
                                                    as={Select}
                                                    name="last"
                                                    id="last"
                                                    label={i18n.t("privacyModal.form.last")}
                                                    placeholder={i18n.t("privacyModal.form.last")}
                                                    labelId="last-selection-label"
                                                >
                                                    <MenuItem value="all">
                                                        {i18n.t("privacyModal.form.menu.all")}
                                                    </MenuItem>
                                                    <MenuItem value="contacts">
                                                        {i18n.t("privacyModal.form.menu.contacts")}
                                                    </MenuItem>
                                                    <MenuItem value="contact_blacklist">
                                                        {i18n.t("privacyModal.form.menu.contact_blacklist")}
                                                    </MenuItem>
                                                    <MenuItem value="none">
                                                        {i18n.t("privacyModal.form.menu.none")}
                                                    </MenuItem>
                                                </Field>
                                            </FormControl>
                                        </Grid>

                                        <Grid xs={6} md={6} item>
                                            <FormControl
                                                variant="outlined"
                                                margin="dense"
                                                className={classes.FormControl}
                                                fullWidth
                                            >
                                                <InputLabel id="last-selection-label">
                                                    {i18n.t("privacyModal.form.groupadd")}
                                                </InputLabel>
                                                <Field
                                                    as={Select}
                                                    name="groupadd"
                                                    id="groupadd"
                                                    label={i18n.t("privacyModal.form.groupadd")}
                                                    placeholder={i18n.t("privacyModal.form.groupadd")}
                                                    labelId="groupadd-selection-label"
                                                >
                                                    <MenuItem value="all">
                                                        {i18n.t("privacyModal.form.menu.all")}
                                                    </MenuItem>
                                                    <MenuItem value="contacts">
                                                        {i18n.t("privacyModal.form.menu.contacts")}
                                                    </MenuItem>
                                                    <MenuItem value="contact_blacklist">
                                                        {i18n.t("privacyModal.form.menu.contact_blacklist")}
                                                    </MenuItem>
                                                </Field>
                                            </FormControl>
                                        </Grid>

                                        {/*<Grid xs={6} md={6} item>
                                            <FormControl
                                                variant="outlined"
                                                margin="dense"
                                                className={classes.FormControl}
                                                fullWidth
                                            >
                                                <InputLabel id="last-selection-label">
                                                    {i18n.t("privacyModal.form.disappearing")}
                                                </InputLabel>
                                                <Field
                                                    as={Select}
                                                    name="disappearing"
                                                    id="disappearing"
                                                    label={i18n.t("privacyModal.form.disappearing")}
                                                    placeholder={i18n.t("privacyModal.form.disappearing")}
                                                    labelId="disappearing-selection-label"
                                                >
                                                    <MenuItem value="0">
                                                        {i18n.t("privacyModal.form.menu.disable")}
                                                    </MenuItem>
                                                    <MenuItem value="86400">
                                                        {i18n.t("privacyModal.form.menu.hrs24")}
                                                    </MenuItem>
                                                    <MenuItem value="604800">
                                                        {i18n.t("privacyModal.form.menu.dias7")}
                                                    </MenuItem>
                                                    <MenuItem value="7776000">
                                                        {i18n.t("privacyModal.form.menu.dias90")}
                                                    </MenuItem>
                                                </Field>
                                            </FormControl>
                                        </Grid>*/}

                                        <Grid xs={6} md={6} item>
                                            <FormControl
                                                variant="outlined"
                                                margin="dense"
                                                className={classes.FormControl}
                                                fullWidth
                                            >
                                                <InputLabel id="last-selection-label">
                                                    {i18n.t("privacyModal.form.calladd")}
                                                </InputLabel>
                                                <Field
                                                    as={Select}
                                                    name="calladd"
                                                    id="calladd"
                                                    label={i18n.t("privacyModal.form.calladd")}
                                                    placeholder={i18n.t("privacyModal.form.calladd")}
                                                    labelId="calladd-selection-label"
                                                >
                                                    <MenuItem value="all">
                                                        {i18n.t("privacyModal.form.menu.all")}
                                                    </MenuItem>
                                                    <MenuItem value="known">
                                                        {i18n.t("privacyModal.form.menu.known")}
                                                    </MenuItem>
                                                </Field>
                                            </FormControl>
                                        </Grid>
									</Grid>
								</div>
							</DialogContent>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("privacyModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{i18n.t("privacyModal.buttons.okEdit")}
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

export default React.memo(PrivacyModal);

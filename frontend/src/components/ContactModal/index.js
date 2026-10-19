import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import CircularProgress from "@material-ui/core/CircularProgress";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Grid from "@material-ui/core/Grid";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SelectLanguage } from "../SelectLanguage";
import { TagsContainer } from "../TagsContainer";
import { PhoneNumberInput } from "../PhoneNumberInput";
import useSettings from "../../hooks/useSettings";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
    width: "100%"
  },

  extraAttr: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  btnWrapper: {
    position: "relative"
  },

  buttonProgress: {
    color: theme.isStardew ? theme.stardew.green : green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12
  }
}));

const ContactSchema = Yup.object()
  .shape({
    name: Yup.string()
      .min(2, "Too Short!")
      .max(50, "Too Long!")
      .required("Required"),
    number: Yup.string().min(8, "Too Short!").max(50, "Too Long!"),
    email: Yup.string().email("Invalid email"),
    birthdayDay: Yup.number()
      .transform((value, original) => (original === "" ? null : value))
      .nullable()
      .min(1)
      .max(31),
    birthdayMonth: Yup.number()
      .transform((value, original) => (original === "" ? null : value))
      .nullable()
      .min(1)
      .max(12)
  })
  .test(
    "birthday",
    i18n.t("contactModal.validation.invalidBirthday"),
    values => {
      if (!values) return true;
      const { birthdayDay, birthdayMonth } = values;
      if (!birthdayDay && !birthdayMonth) return true;
      if (!birthdayDay || !birthdayMonth) return false;
      const date = new Date(2000, birthdayMonth - 1, birthdayDay);
      return (
        date.getMonth() === birthdayMonth - 1 && date.getDate() === birthdayDay
      );
    }
  );

const ContactModal = ({ open, onClose, contactId, initialValues, onSave }) => {
  const classes = useStyles();
  const { getSetting } = useSettings();

  const initialState = {
    name: "",
    nickname: "",
    number: "",
    email: "",
    birthdayDay: "",
    birthdayMonth: "",
    language: localStorage.getItem("language") || "",
    disableBot: false
  };

  const [contact, setContact] = useState(initialState);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    let active = true;
    getSetting("tagsMode")
      .then(res => {
        if (active) setShowTags(["contact", "both"].includes(res));
      })
      .catch(() => {});

    const fetchContact = async () => {
      if (initialValues) {
        if (active)
          setContact(prevState => {
            return { ...prevState, ...initialValues };
          });
      }

      if (!contactId) return;

      try {
        const { data } = await api.get(`/contacts/${contactId}`);
        if (active) setContact(data);
      } catch (err) {
        if (active) toastError(err);
      }
    };

    fetchContact();
    return () => {
      active = false;
    };
  }, [contactId, open, initialValues]);

  const handleClose = () => {
    onClose();
    setContact(initialState);
  };

  const handleSaveContact = async values => {
    try {
      if (contactId) {
        await api.put(`/contacts/${contactId}`, values);
        handleClose();
      } else {
        const { data } = await api.post("/contacts", values);
        if (onSave) {
          onSave(data);
        }
        handleClose();
      }
      toast.success(i18n.t("contactModal.success"));
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div className={classes.root}>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" scroll="paper">
        <DialogTitle id="form-dialog-title">
          {contactId
            ? `${i18n.t("contactModal.title.edit")}`
            : `${i18n.t("contactModal.title.add")}`}
        </DialogTitle>
        <Formik
          initialValues={contact}
          enableReinitialize={true}
          validationSchema={ContactSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveContact(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ values, errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <Typography variant="subtitle1" gutterBottom>
                  {i18n.t("contactModal.form.mainInfo")}
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={8}>
                    <Field
                      as={TextField}
                      label={i18n.t("contactModal.form.name")}
                      name="name"
                      autoFocus
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Field
                      as={TextField}
                      label={i18n.t("contactModal.form.nickname")}
                      name="nickname"
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <Field
                      as={PhoneNumberInput}
                      label={i18n.t("contactModal.form.number")}
                      name="number"
                      error={touched.number && Boolean(errors.number)}
                      helperText={touched.number && errors.number}
                      variant="outlined"
                      margin="dense"
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Field
                      as={TextField}
                      label={i18n.t("contactModal.form.birthdayDay")}
                      name="birthdayDay"
                      type="number"
                      inputProps={{ min: 1, max: 31 }}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Field
                      as={TextField}
                      label={i18n.t("contactModal.form.birthdayMonth")}
                      name="birthdayMonth"
                      type="number"
                      inputProps={{ min: 1, max: 12 }}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>
                </Grid>
                <div>
                  <Field
                    as={TextField}
                    label={i18n.t("contactModal.form.email")}
                    name="email"
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    placeholder="Email address"
                    fullWidth
                    margin="dense"
                    variant="outlined"
                  />
                </div>
                <div>
                  <Field
                    as={SelectLanguage}
                    name="language"
                    fullWidth
                    margin="dense"
                    variant="outlined"
                  ></Field>
                </div>
                <>
                  <FormControlLabel
                    label={i18n.t("contactModal.form.disableBot")}
                    labelPlacement="start"
                    control={
                      <Switch
                        size="small"
                        checked={values.disableBot}
                        onChange={() =>
                          setContact({
                            ...values,
                            disableBot: !values.disableBot
                          })
                        }
                        name="disableBot"
                        color="primary"
                      />
                    }
                  />
                </>
                {contactId && showTags && <TagsContainer contact={contact} />}
                {contactId && (
                  <>
                    <Typography
                      style={{ marginBottom: 8, marginTop: 12 }}
                      variant="subtitle1"
                    >
                      {i18n.t("contactModal.form.extraInfo")}
                    </Typography>

                    <FieldArray name="extraInfo">
                      {({ push, remove }) => (
                        <>
                          {values.extraInfo &&
                            values.extraInfo.length > 0 &&
                            values.extraInfo.map((info, index) => (
                              <div
                                className={classes.extraAttr}
                                key={`${index}-info`}
                              >
                                <Field
                                  as={TextField}
                                  label={i18n.t("contactModal.form.extraName")}
                                  name={`extraInfo[${index}].name`}
                                  variant="outlined"
                                  margin="dense"
                                  className={classes.textField}
                                />
                                <Field
                                  as={TextField}
                                  label={i18n.t("contactModal.form.extraValue")}
                                  name={`extraInfo[${index}].value`}
                                  variant="outlined"
                                  margin="dense"
                                  className={classes.textField}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => remove(index)}
                                >
                                  <DeleteOutlineIcon />
                                </IconButton>
                              </div>
                            ))}
                          <div className={classes.extraAttr}>
                            <Button
                              style={{ flex: 1, marginTop: 8 }}
                              variant="outlined"
                              color="primary"
                              onClick={() => push({ name: "", value: "" })}
                            >
                              {`+ ${i18n.t("contactModal.buttons.addExtraInfo")}`}
                            </Button>
                          </div>
                        </>
                      )}
                    </FieldArray>
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("contactModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {contactId
                    ? `${i18n.t("contactModal.buttons.okEdit")}`
                    : `${i18n.t("contactModal.buttons.okAdd")}`}
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

export default ContactModal;

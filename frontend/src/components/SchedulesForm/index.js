import React, { useState, useEffect } from "react";
import { makeStyles, TextField, Grid } from "@material-ui/core";
import { Formik, Form, FastField, FieldArray } from "formik";
import { isArray } from "lodash";
import NumberFormat from "react-number-format";
import ButtonWithSpinner from "../ButtonWithSpinner";
import { i18n } from "../../translate/i18n";


const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  fullWidth: {
    width: "100%",
  },
  textfield: {
    width: "100%",
    fontSize: "0.875em"
  },
  row: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  control: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
  },
  buttonContainer: {
    textAlign: "right",
    padding: theme.spacing(1),
  },
}));

function SchedulesForm(props) {
  const { initialValues, onSubmit, loading, labelSaveButton } = props;
  const classes = useStyles();

  const [schedules, setSchedules] = useState([
    { weekday: i18n.t("queueModal.serviceHours.monday"), weekdayEn: "monday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.tuesday"), weekdayEn: "tuesday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.wednesday"), weekdayEn: "wednesday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.thursday"), weekdayEn: "thursday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.friday"), weekdayEn: "friday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.saturday"), weekdayEn: "saturday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.sunday"), weekdayEn: "sunday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
  ]);

  useEffect(() => {
    if (isArray(initialValues) && initialValues.length > 0) {
      setSchedules(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Formik
      enableReinitialize
      className={classes.fullWidth}
      initialValues={{ schedules }}
      onSubmit={({ schedules }) =>
        setTimeout(() => {
          handleSubmit(schedules);
        }, 500)
      }
    >
      {({ values }) => (
        <Form className={classes.fullWidth}>
          <FieldArray
            name="schedules"
            render={(arrayHelpers) => (
              <Grid spacing={4} container>
                {values.schedules.map((item, index) => {
                  return (
                    <Grid key={index} xs={12} md={4} item>
                      <Grid container>
                        <Grid className={classes.control} xs={12} item>
                          <FastField
                            as={TextField}
                            abel={i18n.t("queueModal.serviceHours.dayWeek")}
                            name={`schedules[${index}].weekday`}
                            disabled
                            variant="outlined"
                            className={classes.fullWidth}
                            margin="dense"
                          />
                        </Grid>
                        <Grid className={classes.control} xs={12} md={6} item>
                          <FastField
                            label={i18n.t("queueModal.serviceHours.startTimeA")}
                            name={`schedules[${index}].startTimeA`}
                          >
                            {({ field }) => (
                              <NumberFormat
                                {...field}
                                variant="outlined"
                                margin="dense"
                                customInput={TextField}
                                format="##:##"
                                className={classes.fullWidth}
                                label={i18n.t("queueModal.serviceHours.startTimeA")}
                              />
                            )}
                          </FastField>
                        </Grid>
                        <Grid className={classes.control} xs={12} md={6} item>
                          <FastField
                            label={i18n.t("queueModal.serviceHours.endTimeA")}
                            name={`schedules[${index}].endTimeA`}
                          >
                            {({ field }) => (
                              <NumberFormat
                                {...field}
                                variant="outlined"
                                margin="dense"
                                customInput={TextField}
                                format="##:##"
                                className={classes.fullWidth}
                                label={i18n.t("queueModal.serviceHours.endTimeA")}
                              />
                            )}
                          </FastField>
                        </Grid>
                        <Grid className={classes.control} xs={12} md={6} item>
                          <FastField
                            label={i18n.t("queueModal.serviceHours.startTimeB")}
                            name={`schedules[${index}].startTimeB`}
                          >
                            {({ field }) => (
                              <NumberFormat
                                {...field}
                                variant="outlined"
                                margin="dense"
                                customInput={TextField}
                                format="##:##"
                                className={classes.fullWidth}
                                label={i18n.t("queueModal.serviceHours.startTimeB")}
                              />
                            )}
                          </FastField>
                        </Grid>
                        <Grid className={classes.control} xs={12} md={6} item>
                          <FastField
                            label={i18n.t("queueModal.serviceHours.endTimeB")}
                            name={`schedules[${index}].endTimeB`}
                          >
                            {({ field }) => (
                              <NumberFormat
                                {...field}
                                variant="outlined"
                                margin="dense"
                                customInput={TextField}
                                format="##:##"
                                className={classes.fullWidth}
                                label={i18n.t("queueModal.serviceHours.endTimeB")}
                              />
                            )}
                          </FastField>
                        </Grid>
                      </Grid>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          ></FieldArray>
          <div className={classes.buttonContainer}>
            <ButtonWithSpinner
              loading={loading}
              type="submit"
              color="primary"
              variant="contained"
            >
              {labelSaveButton ?? i18n.t("whatsappModal.buttons.okEdit")}
            </ButtonWithSpinner>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export default SchedulesForm;

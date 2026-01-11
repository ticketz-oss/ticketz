import React, { useState, useEffect, useMemo } from "react";
import {
  makeStyles,
  Paper,
  Typography,
  Button,
  IconButton,
  Grid,
  TextField,
  Chip,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
  Divider,
  Autocomplete,
} from "@material-ui/core";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Public as PublicIcon,
} from "@material-ui/icons";
import { DatePicker } from "@material-ui/pickers";
import { format, startOfWeek, addDays } from "date-fns";
import { i18n } from "../../translate/i18n";

// Lista de timezones mais comuns
const COMMON_TIMEZONES = [
  { value: "America/Sao_Paulo", label: "América/São Paulo (BRT/BRST)" },
  { value: "America/New_York", label: "América/Nova York (EST/EDT)" },
  { value: "America/Chicago", label: "América/Chicago (CST/CDT)" },
  { value: "America/Denver", label: "América/Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "América/Los Angeles (PST/PDT)" },
  { value: "America/Mexico_City", label: "América/Cidade do México (CST)" },
  { value: "America/Buenos_Aires", label: "América/Buenos Aires (ART)" },
  { value: "America/Santiago", label: "América/Santiago (CLT/CLST)" },
  { value: "Europe/London", label: "Europa/Londres (GMT/BST)" },
  { value: "Europe/Paris", label: "Europa/Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Europa/Berlim (CET/CEST)" },
  { value: "Europe/Madrid", label: "Europa/Madrid (CET/CEST)" },
  { value: "Europe/Rome", label: "Europa/Roma (CET/CEST)" },
  { value: "Europe/Lisbon", label: "Europa/Lisboa (WET/WEST)" },
  { value: "Europe/Moscow", label: "Europa/Moscou (MSK)" },
  { value: "Asia/Dubai", label: "Ásia/Dubai (GST)" },
  { value: "Asia/Kolkata", label: "Ásia/Kolkata (IST)" },
  { value: "Asia/Shanghai", label: "Ásia/Xangai (CST)" },
  { value: "Asia/Tokyo", label: "Ásia/Tóquio (JST)" },
  { value: "Asia/Seoul", label: "Ásia/Seul (KST)" },
  { value: "Asia/Singapore", label: "Ásia/Singapura (SGT)" },
  { value: "Australia/Sydney", label: "Austrália/Sydney (AEDT/AEST)" },
  { value: "Pacific/Auckland", label: "Pacífico/Auckland (NZDT/NZST)" },
  { value: "UTC", label: "UTC (Tempo Universal Coordenado)" },
];

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  ruleCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
  },
  dayChip: {
    margin: theme.spacing(0.5),
  },
  timeField: {
    width: 120,
  },
  hourRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  addButton: {
    marginTop: theme.spacing(1),
  },
  overrideCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
  },
  tabPanel: {
    paddingTop: theme.spacing(2),
  },
  timezoneSection: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
}));

const ALL_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// Função para obter nomes dos dias da semana usando date-fns com locale do navegador
const getDayNames = () => {
  const dayNames = {};
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  
  // Começa de uma segunda-feira
  const monday = startOfWeek(new Date(2026, 0, 5), { weekStartsOn: 1 });
  
  dayKeys.forEach((key, index) => {
    const date = addDays(monday, index);
    // Formata o dia da semana de forma localizada ("Segunda", "Terça", etc.)
    dayNames[key] = format(date, "EEEE", { locale: undefined }).split("-")[0];
  });
  
  return dayNames;
};

const OpenHoursEditor = ({ value = {}, onChange }) => {
  const classes = useStyles();
  const [activeTab, setActiveTab] = useState(0);

  const [weeklyRules, setWeeklyRules] = useState(
    value.weeklyRules || [
      {
        days: ["mon", "tue", "wed", "thu", "fri"],
        hours: [{ from: "09:00", to: "18:00" }],
      },
    ]
  );

  const [overrides, setOverrides] = useState(value.overrides || []);
  const [timezone, setTimezone] = useState(
    value.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // Gera os nomes dos dias da semana usando date-fns com locale do navegador
  const DAYS_MAP = useMemo(() => getDayNames(), []);

  useEffect(() => {
    if (onChange) {
      onChange({
        weeklyRules,
        overrides,
        timezone,
      });
    }
  }, [weeklyRules, overrides, timezone]);

  // Weekly Rules handlers
  const handleAddWeeklyRule = () => {
    setWeeklyRules([
      ...weeklyRules,
      {
        days: [],
        hours: [{ from: "09:00", to: "18:00" }],
      },
    ]);
  };

  const handleRemoveWeeklyRule = (index) => {
    setWeeklyRules(weeklyRules.filter((_, i) => i !== index));
  };

  const handleToggleDay = (ruleIndex, day) => {
    const newRules = [...weeklyRules];
    const rule = newRules[ruleIndex];
    
    if (rule.days.includes(day)) {
      rule.days = rule.days.filter((d) => d !== day);
    } else {
      rule.days = [...rule.days, day];
    }
    
    setWeeklyRules(newRules);
  };

  const handleAddHourToRule = (ruleIndex) => {
    const newRules = [...weeklyRules];
    newRules[ruleIndex].hours.push({ from: "09:00", to: "18:00" });
    setWeeklyRules(newRules);
  };

  const handleRemoveHourFromRule = (ruleIndex, hourIndex) => {
    const newRules = [...weeklyRules];
    newRules[ruleIndex].hours = newRules[ruleIndex].hours.filter(
      (_, i) => i !== hourIndex
    );
    setWeeklyRules(newRules);
  };

  const handleUpdateHour = (ruleIndex, hourIndex, field, value) => {
    const newRules = [...weeklyRules];
    newRules[ruleIndex].hours[hourIndex][field] = value;
    setWeeklyRules(newRules);
  };

  // Override handlers
  const handleAddOverride = () => {
    setOverrides([
      ...overrides,
      {
        date: new Date().toISOString().split("T")[0],
        closed: false,
        hours: [{ from: "09:00", to: "18:00" }],
        label: "",
      },
    ]);
  };

  const handleRemoveOverride = (index) => {
    setOverrides(overrides.filter((_, i) => i !== index));
  };

  const handleUpdateOverride = (index, field, value) => {
    const newOverrides = [...overrides];
    newOverrides[index][field] = value;
    
    // If setting closed to true, remove hours
    if (field === "closed" && value) {
      delete newOverrides[index].hours;
    }
    
    setOverrides(newOverrides);
  };

  const handleAddHourToOverride = (overrideIndex) => {
    const newOverrides = [...overrides];
    if (!newOverrides[overrideIndex].hours) {
      newOverrides[overrideIndex].hours = [];
    }
    newOverrides[overrideIndex].hours.push({ from: "09:00", to: "18:00" });
    setOverrides(newOverrides);
  };

  const handleRemoveHourFromOverride = (overrideIndex, hourIndex) => {
    const newOverrides = [...overrides];
    newOverrides[overrideIndex].hours = newOverrides[overrideIndex].hours.filter(
      (_, i) => i !== hourIndex
    );
    setOverrides(newOverrides);
  };

  const handleUpdateOverrideHour = (overrideIndex, hourIndex, field, value) => {
    const newOverrides = [...overrides];
    newOverrides[overrideIndex].hours[hourIndex][field] = value;
    setOverrides(newOverrides);
  };

  return (
    <Paper className={classes.root}>
      <Box className={classes.timezoneSection}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PublicIcon fontSize="small" />
              {i18n.t("openHours.timezone.label")}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              value={COMMON_TIMEZONES.find(tz => tz.value === timezone) || null}
              onChange={(event, newValue) => {
                if (newValue) {
                  setTimezone(newValue.value);
                }
              }}
              options={COMMON_TIMEZONES}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={i18n.t("openHours.timezone.placeholder")}
                  variant="outlined"
                  size="small"
                  placeholder={i18n.t("openHours.timezone.searchPlaceholder")}
                />
              )}
              fullWidth
            />
            <Typography variant="caption" color="textSecondary" style={{ marginTop: 4, display: "block" }}>
              {i18n.t("openHours.timezone.selected")}: {timezone}
            </Typography>
          </Grid>
        </Grid>
      </Box>
      
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label={i18n.t("openHours.tabs.weekly")} icon={<ScheduleIcon />} />
        <Tab label={i18n.t("openHours.tabs.overrides")} icon={<EventIcon />} />
      </Tabs>

      {activeTab === 0 && (
        <Box className={classes.tabPanel}>
          <div className={classes.section}>
            <Typography variant="h6" className={classes.sectionTitle}>
              <ScheduleIcon />
              {i18n.t("openHours.weekly.title")}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {i18n.t("openHours.weekly.description")}
            </Typography>

            {weeklyRules.map((rule, ruleIndex) => (
              <Paper key={ruleIndex} className={classes.ruleCard} elevation={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" gutterBottom>
                        {i18n.t("openHours.weekly.rule")} {ruleIndex + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveWeeklyRule(ruleIndex)}
                        color="secondary"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" gutterBottom>
                      {i18n.t("openHours.weekly.days")}:
                    </Typography>
                    <Box>
                      {ALL_DAYS.map((day) => (
                        <Chip
                          key={day}
                          label={DAYS_MAP[day]}
                          onClick={() => handleToggleDay(ruleIndex, day)}
                          color={rule.days.includes(day) ? "primary" : "default"}
                          className={classes.dayChip}
                        />
                      ))}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" gutterBottom>
                      {i18n.t("openHours.weekly.hours")}:
                    </Typography>
                    {rule.hours.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">
                        {i18n.t("openHours.weekly.closedMessage")}
                      </Typography>
                    ) : (
                      rule.hours.map((hour, hourIndex) => (
                        <div key={hourIndex} className={classes.hourRow}>
                          <TextField
                            type="time"
                            label={i18n.t("openHours.weekly.from")}
                            value={hour.from}
                            onChange={(e) =>
                              handleUpdateHour(ruleIndex, hourIndex, "from", e.target.value)
                            }
                            className={classes.timeField}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                          />
                          <Typography>{i18n.t("openHours.weekly.until")}</Typography>
                          <TextField
                            type="time"
                            label={i18n.t("openHours.weekly.to")}
                            value={hour.to}
                            onChange={(e) =>
                              handleUpdateHour(ruleIndex, hourIndex, "to", e.target.value)
                            }
                            className={classes.timeField}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveHourFromRule(ruleIndex, hourIndex)}
                            color="secondary"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      ))
                    )}
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddHourToRule(ruleIndex)}
                      className={classes.addButton}
                    >
                      {i18n.t("openHours.weekly.addHour")}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            ))}

            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddWeeklyRule}
              fullWidth
            >
              {i18n.t("openHours.weekly.addRule")}
            </Button>
          </div>
        </Box>
      )}

      {activeTab === 1 && (
        <Box className={classes.tabPanel}>
          <div className={classes.section}>
            <Typography variant="h6" className={classes.sectionTitle}>
              <EventIcon />
              {i18n.t("openHours.overrides.title")}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {i18n.t("openHours.overrides.description")}
            </Typography>

            {overrides.map((override, overrideIndex) => (
              <Paper key={overrideIndex} className={classes.overrideCard} elevation={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2">
                        {i18n.t("openHours.overrides.exception")} {overrideIndex + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveOverride(overrideIndex)}
                        color="secondary"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label={i18n.t("openHours.overrides.date")}
                      value={override.date}
                      onChange={(e) =>
                        handleUpdateOverride(overrideIndex, "date", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={i18n.t("openHours.overrides.label")}
                      placeholder={i18n.t("openHours.overrides.labelPlaceholder")}
                      value={override.label || ""}
                      onChange={(e) =>
                        handleUpdateOverride(overrideIndex, "label", e.target.value)
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>{i18n.t("openHours.overrides.repeat")}</InputLabel>
                      <Select
                        value={override.repeat || "none"}
                        onChange={(e) =>
                          handleUpdateOverride(overrideIndex, "repeat", e.target.value === "none" ? undefined : e.target.value)
                        }
                      >
                        <MenuItem value="none">{i18n.t("openHours.overrides.repeatNone")}</MenuItem>
                        <MenuItem value="yearly">{i18n.t("openHours.overrides.repeatYearly")}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={override.closed || false}
                          onChange={(e) =>
                            handleUpdateOverride(overrideIndex, "closed", e.target.checked)
                          }
                          color="primary"
                        />
                      }
                      label={i18n.t("openHours.overrides.closedDay")}
                    />
                  </Grid>

                  {!override.closed && (
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        {i18n.t("openHours.overrides.specialHours")}:
                      </Typography>
                      {(override.hours || []).map((hour, hourIndex) => (
                        <div key={hourIndex} className={classes.hourRow}>
                          <TextField
                            type="time"
                            label={i18n.t("openHours.overrides.from")}
                            value={hour.from}
                            onChange={(e) =>
                              handleUpdateOverrideHour(
                                overrideIndex,
                                hourIndex,
                                "from",
                                e.target.value
                              )
                            }
                            className={classes.timeField}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                          />
                          <Typography>{i18n.t("openHours.overrides.until")}</Typography>
                          <TextField
                            type="time"
                            label={i18n.t("openHours.overrides.to")}
                            value={hour.to}
                            onChange={(e) =>
                              handleUpdateOverrideHour(
                                overrideIndex,
                                hourIndex,
                                "to",
                                e.target.value
                              )
                            }
                            className={classes.timeField}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleRemoveHourFromOverride(overrideIndex, hourIndex)
                            }
                            color="secondary"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddHourToOverride(overrideIndex)}
                        className={classes.addButton}
                      >
                        {i18n.t("openHours.overrides.addHour")}
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            ))}

            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddOverride}
              fullWidth
            >
              {i18n.t("openHours.overrides.addException")}
            </Button>
          </div>
        </Box>
      )}
    </Paper>
  );
};

export default OpenHoursEditor;

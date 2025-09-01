import React, { useState, useEffect } from "react";
import {
    makeStyles,
    Paper,
    Grid,
    TextField,
    Table,
    TableHead,
    TableBody,
    TableCell,
    TableRow,
    IconButton,
    FormControlLabel,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from "@material-ui/core";
import { Formik, Form, Field } from 'formik';
import ButtonWithSpinner from "../ButtonWithSpinner";
import ConfirmationModal from "../ConfirmationModal";
import CurrencyInput from "../CurrencyInput";
import InputMask from 'react-input-mask'
import { CheckBox, Edit as EditIcon } from "@material-ui/icons";
import CurrencyFormat from 'react-currency-format';
import MaskedInput from 'react-text-mask'

import { toast } from "react-toastify";
import usePlans from "../../hooks/usePlans";
import { safeValueFormat } from "../../helpers/safeValueFormat";
import { i18n } from "../../translate/i18n";
import cc from 'currency-codes'

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%'
    },
    mainPaper: {
        width: '100%',
        flex: 1,
        padding: theme.spacing(2)
    },
    fullWidth: {
        width: '100%'
    },
    tableContainer: {
        width: '100%',
        overflowX: "scroll",
        ...theme.scrollbarStyles
    },
    textfield: {
        width: '100%'
    },
    textRight: {
        textAlign: 'right'
    },
    row: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2)
    },
    control: {
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(1)
    },
    buttonContainer: {
        textAlign: 'right',
        padding: theme.spacing(1)
    }
}));

export function PlanManagerForm(props) {
    const { onSubmit, onDelete, onCancel, initialValue, loading } = props;
    const classes = useStyles()

    const [record, setRecord] = useState({
        name: '',
        users: 0,
        connections: 0,
        queues: 0,
        value: 0,
        currency: "",
        isPublic: true
    });

    useEffect(() => {
        setRecord(initialValue)
    }, [initialValue])

    const handleSubmit = async (data) => {
        onSubmit(data)
    }

    return (
        <Formik
            enableReinitialize
            className={classes.fullWidth}
            initialValues={record}
            onSubmit={(values, { resetForm }) =>
                setTimeout(() => {
                    handleSubmit(values)
                    resetForm()
                }, 500)
            }
        >
            {(values) => (
                <Form className={classes.fullWidth}>
                    <Grid spacing={2} justifyContent="flex-end" container>
                        <Grid xs={12} sm={6} md={3} item>
                            <Field
                                as={TextField}
                                label={i18n.t('common.name')}
                                name="name"
                                variant="outlined"
                                className={classes.fullWidth}
                                margin="dense"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={3} item>
                          <FormControl margin="dense" variant="outlined" fullWidth>
                            <InputLabel htmlFor="status-selection">{i18n.t("settings.Plans.public")}</InputLabel>
                            <Field
                                as={Select}
                                id="status-selection"
                                label={i18n.t("settings.Plans.public")}
                                labelId="status-selection-label"
                                name="isPublic"
                                margin="dense"
                            >
                                <MenuItem value={true}>{i18n.t("common.yes")}</MenuItem>
                                <MenuItem value={false}>{i18n.t("common.no")}</MenuItem>
                            </Field>
                          </FormControl>
                        </Grid>

                        <Grid xs={12} sm={6} md={3} item>
                          <FormControl margin="dense" variant="outlined" fullWidth>
                            <InputLabel id="currency-select-label">{i18n.t('settings.Plans.currencyCode')}</InputLabel>
                            <Field
                              as={Select}
                              labelId="currency-select-label"
                              id="currency-select"
                              name="currency"
                              label={i18n.t('settings.Plans.currencyCode')}
                              margin="dense"
                            >
                              {cc.codes().map(code => {
                                const currencyInfo = cc.code(code);
                                if (currencyInfo && currencyInfo.countries && currencyInfo.countries.length > 0) {
                                  if (currencyInfo.countries.length > 1) {
                                    return  (
                                      <MenuItem key={code} value={code}>
                                        {`${code} - ${currencyInfo.currency}`}
                                      </MenuItem>
                                    );
                                  } else {
                                    return (
                                      <MenuItem key={code} value={code}>
                                        {code} - {currencyInfo.countries[0]} - {currencyInfo.currency}
                                      </MenuItem>
                                    );
                                  }
                                } else {
                                  return (
                                    <MenuItem key={code} value={code}>
                                      {code}
                                    </MenuItem>
                                  );
                                }
                              })}
                            </Field>
                          </FormControl>
                        </Grid>
          
                        <Grid xs={12} sm={6} md={3} item>
                          <Field
                            as={TextField}
                                  label={i18n.t('common.value')}
                                  name="value"
                                  variant="outlined"
                                  className={classes.fullWidth}
                                  margin="dense"
                                  type="text"
                              />
                        </Grid>
                        <Grid xs={12} sm={6} md={4} item>
                            <Field
                                as={TextField}
                                label={i18n.t('settings.Plans.usersLimit')}
                                name="users"
                                variant="outlined"
                                className={classes.fullWidth}
                                margin="dense"
                                type="number"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={4} item>
                            <Field
                                as={TextField}
                                label={i18n.t('settings.Plans.connectionsLimit')}
                                name="connections"
                                variant="outlined"
                                className={classes.fullWidth}
                                margin="dense"
                                type="number"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={4} item>
                            <Field
                                as={TextField}
                                label={i18n.t('settings.Plans.queuesLimit')}
                                name="queues"
                                variant="outlined"
                                className={classes.fullWidth}
                                margin="dense"
                                type="number"
                            />
                        </Grid>
                        <Grid xs={12} item>
                            <Grid justifyContent="flex-end" spacing={1} container>
                                <Grid xs={4} md={1} item>
                                    <ButtonWithSpinner className={classes.fullWidth} loading={loading} onClick={() => onCancel()} variant="contained">
                                        {i18n.t('common.cancel')}
                                    </ButtonWithSpinner>
                                </Grid>
                                {record.id !== undefined ? (
                                    <Grid xs={4} md={1} item>
                                        <ButtonWithSpinner className={classes.fullWidth} loading={loading} onClick={() => onDelete(record)} variant="contained" color="secondary">
                                            {i18n.t('common.delete')}
                                        </ButtonWithSpinner>
                                    </Grid>
                                ) : null}
                                <Grid xs={4} md={1} item>
                                    <ButtonWithSpinner className={classes.fullWidth} loading={loading} type="submit" variant="contained" color="primary">
                                        {i18n.t('common.save')}
                                    </ButtonWithSpinner>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Form>
            )
            }
        </Formik >
    )
}

export function PlansManagerGrid(props) {
    const { records, onSelect } = props
    const classes = useStyles()

    return (
        <Paper className={classes.tableContainer}>
            <Table className={classes.fullWidth} size="small" aria-label="a dense table">
                <TableHead>
                    <TableRow>
                        <TableCell align="center" style={{ width: '1%' }}>#</TableCell>
                        <TableCell align="left">{i18n.t("common.name")}</TableCell>
                        <TableCell align="center">{i18n.t("settings.Plans.usersLimit")}</TableCell>
                        <TableCell align="center">{i18n.t("settings.Plans.public")}</TableCell>
                        <TableCell align="center">{i18n.t("settings.Plans.connectionsLimit")}</TableCell>
                        <TableCell align="center">{i18n.t("settings.Plans.queuesLimit")}</TableCell>
                        <TableCell align="center">{i18n.t("common.value")}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {records.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell align="center" style={{ width: '1%' }}>
                                <IconButton onClick={() => onSelect(row)} aria-label="delete">
                                    <EditIcon />
                                </IconButton>
                            </TableCell>
                            <TableCell align="left">{row.name || '-'}</TableCell>
                            <TableCell align="center">{row.users || '-'}</TableCell>
                            <TableCell align="center">{row.isPublic ? "Sim": "Não" || '-'}</TableCell>
                            <TableCell align="center">{row.connections || '-'}</TableCell>
                            <TableCell align="center">{row.queues || '-'}</TableCell>
                            <TableCell align="center">{safeValueFormat(row.value, row.currency)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    )
}

export default function PlansManager() {
    const classes = useStyles()
    const { list, save, update, remove } = usePlans()

    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [records, setRecords] = useState([])
    const [record, setRecord] = useState({
        name: '',
        users: 0,
        connections: 0,
        queues: 0,
        value: 0,
        currency: "",
    })

    useEffect(() => {
        async function fetchData() {
            await loadPlans()
        }
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadPlans = async () => {
        setLoading(true)
        try {
            const planList = await list()
            console.log(planList)
            setRecords(planList)
        } catch (e) {
            toast.error('Não foi possível carregar a lista de registros')
        }
        setLoading(false)
    }

    const handleSubmit = async (data) => {
        const datanew = {
            id: data.id,
            connections: data.connections,
            name: data.name,
            queues: data.queues,
            users: data.users,
            value: data.value.replace(",", "."),
            currency: data.currency,
            isPublic: data.isPublic
        }
        console.log(datanew)
        setLoading(true)
        try {
            if (data.id !== undefined) {
                await update(datanew)
            } else {
                await save(datanew)
            }
            await loadPlans()
            handleCancel()
            toast.success('Operação realizada com sucesso!')
        } catch (e) {
            toast.error('Não foi possível realizar a operação. Verifique se já existe uma plano com o mesmo nome ou se os campos foram preenchidos corretamente')
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        setLoading(true)
        try {
            await remove(record.id)
            await loadPlans()
            handleCancel()
            toast.success('Operação realizada com sucesso!')
        } catch (e) {
            toast.error('Não foi possível realizar a operação')
        }
        setLoading(false)
    }

    const handleOpenDeleteDialog = () => {
        setShowConfirmDialog(true)
    }

    const handleCancel = () => {
        setRecord({
            name: '',
            users: 0,
            connections: 0,
            queues: 0,
            value: 0,
            currency: "",
            isPublic: true
        })
    }

    const handleSelect = (data) => {
        setRecord({
            id: data.id,
            name: data.name || '',
            users: data.users || 0,
            connections: data.connections || 0,
            queues: data.queues || 0,
            value: data.value.toLocaleString('pt-br', { minimumFractionDigits: 2 }) || 0,
            currency: data.currency || '',
            isPublic: data.isPublic
        })
    }

    return (
        <Paper className={classes.mainPaper} elevation={0}>
            <Grid spacing={2} container>
                <Grid xs={12} item>
                    <PlanManagerForm
                        initialValue={record}
                        onDelete={handleOpenDeleteDialog}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        loading={loading}
                    />
                </Grid>
                <Grid xs={12} item>
                    <PlansManagerGrid
                        records={records}
                        onSelect={handleSelect}
                    />
                </Grid>
            </Grid>
            <ConfirmationModal
                title="Exclusão de Registro"
                open={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                onConfirm={() => handleDelete()}
            >
                Deseja realmente excluir esse registro?
            </ConfirmationModal>
        </Paper>
    )
}
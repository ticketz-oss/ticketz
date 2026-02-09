import { useState, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import List from '@material-ui/core/List';
import { makeStyles } from '@material-ui/core/styles';
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";

import TicketNotesItem from '../TicketNotesItem';
import ConfirmationModal from '../ConfirmationModal';

import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import ButtonWithSpinner from '../ButtonWithSpinner';
import useTicketNotes from '../../hooks/useTicketNotes';
import { Grid } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '350px',
        },
    },
    list: {
        width: '100%',
        maxWidth: '350px',
        maxHeight: '200px',
        backgroundColor: theme.palette.background.paper,
        overflow: 'auto'
    },
    inline: {
        width: '100%'
    }
}));

const NoteSchema = Yup.object().shape({
 note: Yup.string()
  .min(2, "Too Short!")
  .required("Required")
});

export function TicketNotes ({ ticket }) {
    const { id: ticketId, contactId } = ticket
    const classes = useStyles()
    const [loading, setLoading] = useState(false)
    const [showOnDeleteDialog, setShowOnDeleteDialog] = useState(false)
    const [selectedNote, setSelectedNote] = useState({})
    const [notes, setNotes] = useState([])
    const { saveNote, deleteNote, listNotes } = useTicketNotes()

    useEffect(() => {
        async function openAndFetchData () {
            setLoading(false)
            await loadNotes()
        }
        openAndFetchData()
    }, [])

    const handleSave = async (values, { resetForm }) => {
        setLoading(true)
        try {
            await saveNote({
                ...values,
                ticketId,
                contactId
            })
            await loadNotes()
            resetForm()
            toast.success(i18n.t("common.success"))
        } catch (e) {
            toast.error(e)
        }
        setLoading(false)
    }

    const handleOpenDialogDelete = (item) => {
        setSelectedNote(item)
        setShowOnDeleteDialog(true)
    }

    const handleDelete = async () => {
        setLoading(true)
        try {
            await deleteNote(selectedNote.id)
            await loadNotes()
            setSelectedNote({})
            toast.success(i18n.t("common.success"))
        } catch (e) {
            toast.error(e)
        }
        setLoading(false)
    }

    const loadNotes = async () => {
        setLoading(true)
        try {
            const notes = await listNotes({ ticketId, contactId })
            setNotes(notes)
        } catch (e) {
            toast.error(e)
        }
        setLoading(false)
    }

    const renderNoteList = () => {
        return notes.map((note) => {
            return <TicketNotesItem
                note={note}
                key={note.id}
                deleteItem={handleOpenDialogDelete}
            />
        })
    }

    return (
        <>
            <ConfirmationModal
                title={i18n.t("common.delete")}
                open={showOnDeleteDialog}
                onClose={setShowOnDeleteDialog}
                onConfirm={handleDelete} />
            <Formik
                initialValues={{ note: "" }}
                enableReinitialize={false}
                validationSchema={NoteSchema}
                onSubmit={handleSave}
            >
                {({ touched, errors, resetForm, setErrors }) => (
                    <Form>
                        <Grid container spacing={2}>
                            { notes.length > 0 && (
                                <Grid xs={12} item>
                                    <List className={classes.list}>
                                        { renderNoteList() }
                                    </List>
                                </Grid>
                            ) }
                            <Grid xs={12} item>
                                <Field
                                    as={TextField}
                                    name="note"
                                    rows={3}
                                    label={i18n.t("ticketOptionsMenu.appointmentsModal.textarea")}
                                    placeholder={i18n.t("ticketOptionsMenu.appointmentsModal.placeholder")}
                                    multiline={true}
                                    error={touched.note && Boolean(errors.note)}
                                    helperText={touched.note && errors.note}
                                    variant="outlined"
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={12} item>
                                <Grid container spacing={2}>
                                    <Grid xs={6} item>
                                        <Button
                                            onClick={() => {
                                                resetForm();
                                                setErrors({});
                                            }}
                                            color="primary"
                                            variant="outlined"
                                            fullWidth
                                        >
                                            {i18n.t("common.cancel")}
                                        </Button>
                                    </Grid>
                                    <Grid xs={6} item>
                                        <ButtonWithSpinner loading={loading} color="primary" type="submit" variant="contained" autoFocus fullWidth>
                                            {i18n.t("common.save")}
                                        </ButtonWithSpinner>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Form>
                )}
            </Formik>
        </>
    );
}
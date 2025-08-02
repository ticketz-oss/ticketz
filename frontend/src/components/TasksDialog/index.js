import React, { useState, useEffect } from 'react';
import { Button, TextField, DialogContent, DialogActions, FormGroup, Dialog, Grid, FormControlLabel, Switch, DialogTitle, FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import { Formik, Form, } from "formik";
import ButtonWithSpinner from '../ButtonWithSpinner';
import * as Yup from "yup";
import api from '../../services/api';
import { useContext } from 'react';
import { AuthContext } from '../../context/Auth/AuthContext';
import { isNil, isObject, has, get, head } from 'lodash';
import { toast } from 'react-toastify';


const TaskSchema = Yup.object().shape({
  startedAt: Yup.date().nullable().required('Obrigatório'),
  title: Yup.string().nullable().required('Obrigatório'),
  userId: Yup.string().nullable().required('Obrigatório'),

});

const initialValues = {
  title: '',
  description: '',
  status: 'open',
  isPrivate: true,
  userId: null,
  startedAt: new Date(),
};


export const TasksDialog = (props) => {

  const { openDialog, setOpen, selectedTask, reloadTasks, setSelectedTask } = props

  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState(initialValues);

  useEffect(() => {
    verifyAndSetTask()
  }, [selectedTask])


  const handleClose = () => {
    setOpen(false);
    setTask(initialValues);
    setSelectedTask(null);
  }

  const handleSave = async (values) => {

    if (taskSelectedIsValid()) {

      updateTask(values)

    } else {
      createTask(values)
    }

    reloadTasks();
    setTimeout(() => {
      setOpen(false);
    }, 300);


  }

  const taskSelectedIsValid = () => {
    return isObject(selectedTask) && has(selectedTask, 'id') && !isNil(get(selectedTask, 'id'))
  }

  const verifyAndSetTask = () => {
    if (taskSelectedIsValid()) {

      setTask(selectedTask);

    } else {
      setTask(initialValues)
    }
  }

  const createTask = async (values) => {
    try {

      await api.post('tasks', values);
      toast.success('Tarefa criada com sucesso')


    } catch (error) {

      toast.error('Erro ao criar nova tarefa')

    } finally {
      setTimeout(() => {
        setLoading(false)
      }, 200);

    }
  }

  const updateTask = async (values) => {
    try {

      await api.put(`tasks/${selectedTask.id}`, values);
      toast.success('Tarefa atualizada com sucesso')

    } catch (error) {

      toast.error('Erro ao atualizar tarefa')

    } finally {
      setTimeout(() => {
        setLoading(false)
      }, 200);

    }

  }

  const handleDone = async () => {


    try {

      await api.put(`tasks/${selectedTask.id}`, { status: 'done' });
      toast.success('Tarefa concluída com sucesso');
      reloadTasks();

    } catch (error) {

      toast.error('Erro ao concluir tarefa')

    } finally {
      setTimeout(() => {
        setLoading(false)
        setOpen(false)
      }, 200);
    }
  }




  return (
    <Dialog
      onClose={handleClose}
      open={openDialog}
      maxWidth="sm"
      fullWidth
    >

      <DialogTitle id="alert-dialog-title">
        Nova tarefa
      </DialogTitle>

      <Formik
        initialValues={task}
        enableReinitialize={true}
        validationSchema={TaskSchema}
        onSubmit={(values, actions) => {
          setLoading(true)
          setTimeout(() => {
            handleSave(values);
            actions.setSubmitting(false);
          }, 400);
        }}
      >

        {({ touched, errors, setFieldValue, values }) => (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={2}>

                <Grid item md={4}>
                  <TextField
                    label="Data Inicial"
                    type="date"
                    variant='outlined'
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    value={new Date(values.startedAt).toISOString().split('T')[0]}
                    error={touched.startedAt && Boolean(errors.startedAt)}
                    helperText={touched.startedAt && errors.startedAt}
                    onChange={(e) => {
                      setFieldValue('startedAt', e.target.value)

                    }}
                  />
                </Grid>


                <Grid item md={5}>


                  <UserContainer
                    value={values.userId}
                    setValue={setFieldValue}
                    selectedTask={selectedTask}
                  />

                </Grid>

                <Grid item md={2}>
                  <FormGroup>
                    <FormControlLabel control={<Switch defaultChecked color='primary'
                      checked={values.isPrivate}
                      onChange={(e) => {
                        setFieldValue('isPrivate', e.target.checked)
                      }}
                    />} label="Privado" />
                  </FormGroup>

                </Grid>

                <Grid item md={12}>
                  <TextField
                    label="Título"
                    variant='outlined'
                    error={touched.title && Boolean(errors.title)}
                    helperText={touched.title && errors.title}
                    fullWidth
                    value={values.title}
                    onChange={(e) => {
                      setFieldValue('title', e.target.value)

                    }}
                  />

                </Grid>


                <Grid item sm={12}>
                  <TextField
                    label="Descrição"
                    variant='outlined'
                    fullWidth
                    value={values.description}
                    onChange={(e) => {
                      setFieldValue('description', e.target.value)

                    }}
                    multiline
                    rows={6}
                  />

                </Grid>

              </Grid>
            </DialogContent>

            <DialogActions>
              {!taskSelectedIsValid() && (
                <Button color="primary">
                  Cancelar
                </Button>
              )}
              <ButtonWithSpinner loading={loading} color="primary" type="submit" variant="contained" autoFocus>
                {taskSelectedIsValid() ? 'Atualizar' : 'Salvar'}
              </ButtonWithSpinner>

              {taskSelectedIsValid() && (
                <ButtonWithSpinner loading={loading} color="primary" variant="contained" onClick={handleDone}  >
                  Concluir tarefa
                </ButtonWithSpinner>
              )}
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  )


}

export const UserContainer = (props) => {

  const { value, setValue, selectedTask } = props;
  const { user } = useContext(AuthContext);

  console.log('selectedTask', user)

  const [listUsers, setListUsers] = useState([]);

  useEffect(() => {
    handleGetListUsers();
  }, [])


  const handleGetListUsers = async () => {

    try {
      const { data } = await api.get('users/list');
      setListUsers(data);

      if (!selectedTask) {
        setValue('userId', user.id)
      }

    } catch (error) {

    }

  }

  return (
    <FormControl variant='outlined' fullWidth>
      <InputLabel shrink={true} id="demo-simple-select-label">Usuário</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={value}
        label="Usuário"
        disabled={user.profile !== 'admin'}
        onChange={(e) => {
          setValue('userId', e.target.value)
        }}
      >
        {listUsers.map((user) => {
          return (
            <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
          )
        })}
      </Select>
    </FormControl>
  )

}
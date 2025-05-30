import React from 'react';
import MainContainer from '../../components/MainContainer';
import MainHeader from '../../components/MainHeader';
import Title from '../../components/Title';
import MainHeaderButtonsWrapper from '../../components/MainHeaderButtonsWrapper';
import { makeStyles, Button, Paper } from "@material-ui/core";
import { TasksTable } from '../../components/TasksTable';
import { TasksDialog } from '../../components/TasksDialog';
import { useState } from 'react';
import ConfirmationModal from '../../components/ConfirmationModal';
import api from '../../services/api';
import { toast } from 'react-toastify';

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}));

export const Tasks = () => {

  const classes = useStyles();
  const [modalOpen, setModalOpen] = useState(false);
  const [showOnDeleteDialog, setShowOnDeleteDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reloadTasks, setReloadTasks] = useState(false);


  const handleOpenToEdit = (task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleDelete = async (task) => {

    try {

      await api.delete(`/tasks/${task.id}`);

      toast.info('Tarefa excluida com sucesso!');
      handleReloadTasks();

    } catch (error) {

      toast.error('Erro ao excluir tarefa!');

    }

  };

  const handleReloadTasks = () => {

    setReloadTasks(prev => !prev);

  }


  return (
    <>
      <TasksDialog
        openDialog={modalOpen}
        setOpen={setModalOpen}
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
        reloadTasks={handleReloadTasks}
      />

      <ConfirmationModal
        title="Excluir Registro"
        open={showOnDeleteDialog}
        onClose={setShowOnDeleteDialog}
        onConfirm={async () => {
          await handleDelete(selectedTask);
        }}
      >
        Deseja realmente excluir este registro?
      </ConfirmationModal>

      <MainContainer>
        <MainHeader>
          <Title>Tarefas</Title>
          <MainHeaderButtonsWrapper>
            <Button variant="contained" color="primary" onClick={() => setModalOpen(true)} >
              Nova tarefa
            </Button>
          </MainHeaderButtonsWrapper>
        </MainHeader>

        <Paper className={classes.mainPaper} variant="outlined">
          <TasksTable
            editTask={handleOpenToEdit}
            reloadTasks={reloadTasks}
            deleteTask={(task) => {
              setSelectedTask(task);
              setShowOnDeleteDialog(true);
            }}
          />
        </Paper>

      </MainContainer>
    </>

  );
}
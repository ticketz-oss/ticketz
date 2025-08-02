import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  IconButton
} from '@material-ui/core';
import {
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,

} from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../services/api";
import TableRowSkeleton from "../TableRowSkeleton";
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import PeopleAltOutlinedIcon from '@material-ui/icons/PeopleAltOutlined';




export const TasksTable = (props) => {

  const { editTask, deleteTask, reloadTasks } = props

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])


  useEffect(() => {
    setTimeout(() => {
      getListTasks();
    }, 200);
  }, [reloadTasks])

  const handleEdit = (task) => {
    editTask(task)
  }

  const handleDelete = (task) => {
    deleteTask(task);
  }

  const renderRows = () => {
    return rows.map((task) => {
      return (
        <TableRow key={task.id}>
          <TableCell align="center">{task.isPrivate ? <LockOutlinedIcon /> : <PeopleAltOutlinedIcon />}</TableCell>
          <TableCell align="center">{task.title}</TableCell>
          <TableCell align="left">{task.description}</TableCell>
          <TableCell align="left">{task.user?.name}</TableCell>
          <TableCell align="left">{new Date(task.startedAt).toLocaleDateString()}</TableCell>
          <TableCell align="left">{task.status === 'open' ? 'Não concluida' : 'Concluida'}</TableCell>

          <TableCell align="center">
            <IconButton
              disabled={task.status === 'done'}
              size="small"
              onClick={() => handleEdit(task)}
            >
              <EditIcon />
            </IconButton>

            <IconButton
              disabled={task.status === 'done'}
              size="small"
              onClick={() => handleDelete(task)}
            >
              <DeleteOutlineIcon />
            </IconButton>


          </TableCell>

        </TableRow>
      )
    })
  }

  const getListTasks = async () => {
    try {
      setLoading(true)
      const { data } = await api.get("/tasks");
      setRows(data)

    } catch (error) {

      toast.error('Erro ao carregar as tarefas.')

    } finally {
      setLoading(false)
    }
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell align="center">Privacidade</TableCell>
          <TableCell align="center">Título</TableCell>
          <TableCell align="left">Descrição</TableCell>
          <TableCell align="left">Usuário</TableCell>
          <TableCell align="left">Data</TableCell>
          <TableCell align="left">Status</TableCell>
          <TableCell align="center">Ações</TableCell>

        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? <TableRowSkeleton columns={3} /> : renderRows()}
      </TableBody>
    </Table>

  );
}
import { Op, Transaction } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import TaskBoardColumn from "../../models/TaskBoardColumn";
import TaskBoardTask from "../../models/TaskBoardTask";
import {
  assertTaskBoardDateRange,
  clampTaskPosition,
  cleanTaskBoardColor,
  cleanTaskBoardTitle,
  completedAtForDestination,
  parseTaskBoardDate
} from "./taskBoardRules";

type ColumnInput = {
  title?: string;
  color?: string | null;
  isDone?: boolean;
};

const getColumn = async (
  id: number | string,
  companyId: number,
  transaction?: Transaction
): Promise<TaskBoardColumn> => {
  const column = await TaskBoardColumn.findOne({
    where: { id, companyId },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });
  if (!column) throw new AppError("ERR_TASK_BOARD_COLUMN_NOT_FOUND", 404);
  return column;
};

const getTask = async (
  id: number | string,
  companyId: number,
  transaction?: Transaction
): Promise<TaskBoardTask> => {
  const task = await TaskBoardTask.findOne({
    where: { id, companyId },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });
  if (!task) throw new AppError("ERR_TASK_BOARD_TASK_NOT_FOUND", 404);
  return task;
};

export const ensureDefaultColumns = async (
  companyId: number
): Promise<void> => {
  await sequelize.transaction(async transaction => {
    await Company.findByPk(companyId, {
      attributes: ["id"],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    const count = await TaskBoardColumn.count({
      where: { companyId },
      transaction
    });
    if (count > 0) return;

    await TaskBoardColumn.bulkCreate(
      [
        { title: "Fazer", position: 0, isDone: false, companyId },
        { title: "Fazendo", position: 1, isDone: false, companyId },
        { title: "Feito", position: 2, isDone: true, companyId }
      ],
      { transaction }
    );
  });
};

export const listBoard = async ({
  companyId,
  completedFrom,
  completedTo
}: {
  companyId: number;
  completedFrom?: string;
  completedTo?: string;
}): Promise<{ columns: TaskBoardColumn[]; tasks: TaskBoardTask[] }> => {
  await ensureDefaultColumns(companyId);

  const columns = await TaskBoardColumn.findAll({
    where: { companyId },
    order: [
      ["position", "ASC"],
      ["id", "ASC"]
    ]
  });

  const from = parseTaskBoardDate(completedFrom);
  const to = parseTaskBoardDate(completedTo);
  assertTaskBoardDateRange(from, to);

  const doneColumn = columns.find(column => column.isDone);
  const where: Record<string, unknown> = { companyId };

  if (doneColumn && (from || to)) {
    const completedAt: Record<symbol, Date> = {};
    if (from) completedAt[Op.gte] = from;
    if (to) completedAt[Op.lte] = to;

    where[Op.or as unknown as string] = [
      { columnId: { [Op.ne]: doneColumn.id } },
      { columnId: doneColumn.id, completedAt }
    ];
  }

  const tasks = await TaskBoardTask.findAll({
    where,
    order: [
      ["columnId", "ASC"],
      ["position", "ASC"],
      ["id", "ASC"]
    ]
  });

  return { columns, tasks };
};

export const createColumn = async (
  companyId: number,
  input: ColumnInput
): Promise<TaskBoardColumn> => {
  await ensureDefaultColumns(companyId);
  return sequelize.transaction(async transaction => {
    const title = cleanTaskBoardTitle(input.title, 120);
    const color = cleanTaskBoardColor(input.color);
    const maxPosition = await TaskBoardColumn.max("position", {
      where: { companyId },
      transaction
    });

    if (input.isDone) {
      await TaskBoardColumn.update(
        { isDone: false },
        { where: { companyId, isDone: true }, transaction }
      );
      await TaskBoardTask.update(
        { completedAt: null },
        { where: { companyId, completedAt: { [Op.ne]: null } }, transaction }
      );
    }

    return TaskBoardColumn.create(
      {
        title,
        color,
        isDone: !!input.isDone,
        companyId,
        position: Number(maxPosition ?? -1) + 1
      },
      { transaction }
    );
  });
};

export const updateColumn = async (
  id: number | string,
  companyId: number,
  input: ColumnInput
): Promise<TaskBoardColumn> =>
  sequelize.transaction(async transaction => {
    const column = await getColumn(id, companyId, transaction);
    const values: ColumnInput = {};
    if (input.title !== undefined) {
      values.title = cleanTaskBoardTitle(input.title, 120);
    }
    if (input.color !== undefined) {
      values.color = cleanTaskBoardColor(input.color);
    }

    if (input.isDone === false && column.isDone) {
      throw new AppError("ERR_TASK_BOARD_DONE_COLUMN_REQUIRED", 409);
    }

    if (input.isDone === true && !column.isDone) {
      const oldDone = await TaskBoardColumn.findOne({
        where: { companyId, isDone: true },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (oldDone) {
        await oldDone.update({ isDone: false }, { transaction });
        await TaskBoardTask.update(
          { completedAt: null },
          { where: { companyId, columnId: oldDone.id }, transaction }
        );
      }

      values.isDone = true;
      await TaskBoardTask.update(
        { completedAt: new Date() },
        { where: { companyId, columnId: column.id }, transaction }
      );
    }

    await column.update(values, { transaction });
    return column;
  });

export const reorderColumns = async (
  companyId: number,
  ids: Array<number | string>
): Promise<void> => {
  await sequelize.transaction(async transaction => {
    const columns = await TaskBoardColumn.findAll({
      where: { companyId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    const owned = columns.map(column => String(column.id)).sort();
    const requested = [...new Set(ids.map(String))].sort();
    if (
      owned.length !== requested.length ||
      owned.some((id, index) => id !== requested[index])
    ) {
      throw new AppError("ERR_TASK_BOARD_INVALID_COLUMN_ORDER");
    }

    await Promise.all(
      ids.map((id, position) =>
        TaskBoardColumn.update(
          { position },
          { where: { id, companyId }, transaction }
        )
      )
    );
  });
};

export const deleteColumn = async (
  id: number | string,
  companyId: number
): Promise<void> => {
  await sequelize.transaction(async transaction => {
    const column = await getColumn(id, companyId, transaction);
    if (column.isDone) {
      throw new AppError("ERR_TASK_BOARD_CANNOT_DELETE_DONE_COLUMN", 409);
    }
    const taskCount = await TaskBoardTask.count({
      where: { companyId, columnId: column.id },
      transaction
    });
    if (taskCount > 0) {
      throw new AppError("ERR_TASK_BOARD_COLUMN_NOT_EMPTY", 409);
    }
    await column.destroy({ transaction });

    const remaining = await TaskBoardColumn.findAll({
      where: { companyId },
      order: [
        ["position", "ASC"],
        ["id", "ASC"]
      ],
      transaction
    });
    await Promise.all(
      remaining.map((item, position) =>
        item.update({ position }, { transaction })
      )
    );
  });
};

export const createTask = async (
  companyId: number,
  titleInput: unknown
): Promise<TaskBoardTask> => {
  await ensureDefaultColumns(companyId);
  return sequelize.transaction(async transaction => {
    const column = await TaskBoardColumn.findOne({
      where: { companyId },
      order: [
        ["position", "ASC"],
        ["id", "ASC"]
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!column) throw new AppError("ERR_TASK_BOARD_COLUMN_NOT_FOUND", 404);

    const maxPosition = await TaskBoardTask.max("position", {
      where: { companyId, columnId: column.id },
      transaction
    });
    return TaskBoardTask.create(
      {
        title: cleanTaskBoardTitle(titleInput, 255),
        companyId,
        columnId: column.id,
        position: Number(maxPosition ?? -1) + 1,
        completedAt: column.isDone ? new Date() : null
      },
      { transaction }
    );
  });
};

export const updateTask = async (
  id: number | string,
  companyId: number,
  titleInput: unknown
): Promise<TaskBoardTask> => {
  const task = await getTask(id, companyId);
  await task.update({ title: cleanTaskBoardTitle(titleInput, 255) });
  return task;
};

const updatePositions = async (
  tasks: TaskBoardTask[],
  transaction: Transaction
): Promise<void> => {
  await Promise.all(
    tasks.map((task, position) =>
      task.position === position
        ? Promise.resolve(task)
        : task.update({ position }, { transaction })
    )
  );
};

export const moveTask = async ({
  id,
  companyId,
  destinationColumnId,
  position
}: {
  id: number | string;
  companyId: number;
  destinationColumnId: number | string;
  position: number;
}): Promise<void> => {
  await sequelize.transaction(async transaction => {
    const task = await getTask(id, companyId, transaction);
    const destination = await getColumn(
      destinationColumnId,
      companyId,
      transaction
    );
    const sourceColumnId = task.columnId;
    const sameColumn = sourceColumnId === destination.id;

    const sourceTasks = await TaskBoardTask.findAll({
      where: { companyId, columnId: sourceColumnId },
      order: [
        ["position", "ASC"],
        ["id", "ASC"]
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    const sourceWithoutTask = sourceTasks.filter(item => item.id !== task.id);

    let destinationTasks = sourceWithoutTask;
    if (!sameColumn) {
      destinationTasks = await TaskBoardTask.findAll({
        where: { companyId, columnId: destination.id },
        order: [
          ["position", "ASC"],
          ["id", "ASC"]
        ],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
    }

    const targetPosition = clampTaskPosition(position, destinationTasks.length);
    destinationTasks.splice(targetPosition, 0, task);

    await task.update(
      {
        columnId: destination.id,
        completedAt: completedAtForDestination(
          destination.isDone,
          task.completedAt
        )
      },
      { transaction }
    );
    if (!sameColumn) await updatePositions(sourceWithoutTask, transaction);
    await updatePositions(destinationTasks, transaction);
  });
};

export const deleteTask = async (
  id: number | string,
  companyId: number
): Promise<void> => {
  await sequelize.transaction(async transaction => {
    const task = await getTask(id, companyId, transaction);
    const columnId = task.columnId;
    await task.destroy({ transaction });
    const remaining = await TaskBoardTask.findAll({
      where: { companyId, columnId },
      order: [
        ["position", "ASC"],
        ["id", "ASC"]
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    await updatePositions(remaining, transaction);
  });
};

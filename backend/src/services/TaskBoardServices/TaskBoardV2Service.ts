import { Op, Transaction, WhereOptions } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Queue from "../../models/Queue";
import TaskBoardColumn from "../../models/TaskBoardColumn";
import TaskBoardEvent from "../../models/TaskBoardEvent";
import TaskBoardTask from "../../models/TaskBoardTask";
import User from "../../models/User";
import UserQueue from "../../models/UserQueue";
import {
  assertTaskBoardDateRange,
  clampTaskPosition,
  cleanTaskBoardColor,
  cleanTaskBoardDescription,
  cleanTaskBoardTitle,
  parseTaskBoardDate,
  parseTaskBoardTarget
} from "./taskBoardRules";

type ColumnInput = { title?: string; color?: string | null; isDone?: boolean };
type TaskInput = {
  title?: unknown;
  description?: unknown;
  targetType?: unknown;
  assignedUserId?: unknown;
  assignedQueueId?: unknown;
  dueAt?: unknown;
  version?: unknown;
};
type Actor = { companyId: number; userId: number; profile: string };

const taskInclude = [
  {
    model: TaskBoardColumn,
    as: "column",
    attributes: ["id", "title", "isDone"]
  },
  { model: User, as: "assignedUser", attributes: ["id", "name"] },
  { model: Queue, as: "assignedQueue", attributes: ["id", "name", "color"] },
  { model: User, as: "createdBy", attributes: ["id", "name"] },
  { model: User, as: "completedBy", attributes: ["id", "name"] }
];

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

const userQueueIds = async (
  userId: number,
  transaction?: Transaction
): Promise<number[]> => {
  const links = await UserQueue.findAll({
    where: { userId },
    attributes: ["queueId"],
    transaction
  });
  return links.map(link => link.queueId);
};

export const taskVisibilityWhere = async (
  userId: number,
  transaction?: Transaction
): Promise<WhereOptions> => {
  const queueIds = await userQueueIds(userId, transaction);
  return {
    [Op.or]: [
      { targetType: "GLOBAL" },
      { targetType: "USER", assignedUserId: userId },
      ...(queueIds.length
        ? [{ targetType: "QUEUE", assignedQueueId: { [Op.in]: queueIds } }]
        : [])
    ]
  };
};

const assertVisible = async (
  task: TaskBoardTask,
  actor: Actor,
  transaction?: Transaction
): Promise<void> => {
  if (actor.profile === "admin" || task.targetType === "GLOBAL") return;
  if (task.targetType === "USER" && task.assignedUserId === actor.userId)
    return;
  if (task.targetType === "QUEUE") {
    const match = await UserQueue.findOne({
      where: { userId: actor.userId, queueId: task.assignedQueueId },
      transaction
    });
    if (match) return;
  }
  throw new AppError("ERR_TASK_BOARD_TASK_NOT_FOUND", 404);
};

export const isPersonalTaskOwnedBy = (
  task: Pick<TaskBoardTask, "targetType" | "assignedUserId" | "createdById">,
  userId: number
): boolean =>
  task.targetType === "USER" &&
  task.assignedUserId === userId &&
  task.createdById === userId;

const assertTaskCanBeManaged = (task: TaskBoardTask, actor: Actor): void => {
  if (actor.profile === "admin" || isPersonalTaskOwnedBy(task, actor.userId))
    return;
  throw new AppError("ERR_TASK_BOARD_TASK_NOT_FOUND", 404);
};

const normalizeTarget = async (
  companyId: number,
  input: TaskInput,
  transaction?: Transaction
) => {
  const targetType = parseTaskBoardTarget(input.targetType);
  const assignedUserId =
    targetType === "USER" ? Number(input.assignedUserId) : null;
  const assignedQueueId =
    targetType === "QUEUE" ? Number(input.assignedQueueId) : null;
  if (targetType === "USER") {
    if (!Number.isSafeInteger(assignedUserId) || assignedUserId <= 0)
      throw new AppError("ERR_TASK_BOARD_INVALID_TARGET");
    const user = await User.findOne({
      where: { id: assignedUserId, companyId },
      attributes: ["id"],
      transaction
    });
    if (!user) throw new AppError("ERR_TASK_BOARD_INVALID_TARGET");
  }
  if (targetType === "QUEUE") {
    if (!Number.isSafeInteger(assignedQueueId) || assignedQueueId <= 0)
      throw new AppError("ERR_TASK_BOARD_INVALID_TARGET");
    const queue = await Queue.findOne({
      where: { id: assignedQueueId, companyId },
      attributes: ["id"],
      transaction
    });
    if (!queue) throw new AppError("ERR_TASK_BOARD_INVALID_TARGET");
  }
  return { targetType, assignedUserId, assignedQueueId };
};

const assertVersion = (task: TaskBoardTask, value: unknown): void => {
  if (value === undefined || value === null || value === "") return;
  const version = Number(value);
  if (!Number.isSafeInteger(version) || version < 0 || version !== task.version)
    throw new AppError("ERR_TASK_BOARD_STALE_TASK", 409);
};

const addEvent = (
  task: TaskBoardTask,
  userId: number,
  eventType: "CREATED" | "EDITED" | "MOVED" | "COMPLETED" | "REOPENED",
  transaction: Transaction,
  values: Record<string, unknown> = {}
): Promise<TaskBoardEvent> =>
  TaskBoardEvent.create(
    {
      taskId: task.id,
      companyId: task.companyId,
      userId,
      eventType,
      data: {},
      ...values
    },
    { transaction }
  );

export const ensureDefaultColumns = async (
  companyId: number
): Promise<void> => {
  await sequelize.transaction(async transaction => {
    await Company.findByPk(companyId, {
      attributes: ["id"],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (
      (await TaskBoardColumn.count({ where: { companyId }, transaction })) > 0
    )
      return;
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
  userId,
  profile,
  filterUserId,
  completedFrom,
  completedTo
}: Actor & {
  filterUserId?: number;
  completedFrom?: string;
  completedTo?: string;
}) => {
  await ensureDefaultColumns(companyId);
  const columns = await TaskBoardColumn.findAll({
    where: { companyId },
    order: [
      ["position", "ASC"],
      ["id", "ASC"]
    ]
  });
  if (filterUserId && profile !== "admin")
    throw new AppError("ERR_NO_PERMISSION", 403);
  const viewerId = filterUserId || userId;
  if (filterUserId) {
    const target = await User.findOne({
      where: { id: filterUserId, companyId },
      attributes: ["id"]
    });
    if (!target) throw new AppError("ERR_TASK_BOARD_INVALID_TARGET", 404);
  }
  const from = parseTaskBoardDate(completedFrom);
  const to = parseTaskBoardDate(completedTo);
  assertTaskBoardDateRange(from, to);
  const clauses: WhereOptions[] = [];
  if (profile !== "admin" || filterUserId)
    clauses.push(await taskVisibilityWhere(viewerId));
  const doneColumn = columns.find(column => column.isDone);
  if (doneColumn && (from || to)) {
    const completedAt: Record<symbol, Date> = {};
    if (from) completedAt[Op.gte] = from;
    if (to) completedAt[Op.lte] = to;
    clauses.push({
      [Op.or]: [
        { columnId: { [Op.ne]: doneColumn.id } },
        { columnId: doneColumn.id, completedAt }
      ]
    });
  }
  const tasks = await TaskBoardTask.findAll({
    where: { companyId, ...(clauses.length ? { [Op.and]: clauses } : {}) },
    include: taskInclude,
    order: [
      ["columnId", "ASC"],
      ["position", "ASC"],
      ["id", "ASC"]
    ]
  });
  const counts = tasks.reduce<Record<number, number>>((result, task) => {
    result[task.columnId] = (result[task.columnId] || 0) + 1;
    return result;
  }, {});
  return { columns, tasks, counts };
};

export const showTask = async (
  id: number | string,
  actor: Actor
): Promise<TaskBoardTask> => {
  const task = await getTask(id, actor.companyId);
  await assertVisible(task, actor);
  return TaskBoardTask.findOne({
    where: { id: task.id, companyId: actor.companyId },
    include: [
      ...taskInclude,
      {
        model: TaskBoardEvent,
        as: "events",
        include: [
          { model: User, attributes: ["id", "name"] },
          {
            model: TaskBoardColumn,
            as: "fromColumn",
            attributes: ["id", "title"]
          },
          {
            model: TaskBoardColumn,
            as: "toColumn",
            attributes: ["id", "title"]
          }
        ]
      }
    ],
    order: [[{ model: TaskBoardEvent, as: "events" }, "createdAt", "ASC"]]
  });
};

export const createColumn = async (companyId: number, input: ColumnInput) => {
  await ensureDefaultColumns(companyId);
  return sequelize.transaction(async transaction => {
    const maxPosition = await TaskBoardColumn.max("position", {
      where: { companyId },
      transaction
    });
    return TaskBoardColumn.create(
      {
        title: cleanTaskBoardTitle(input.title, 120),
        color: cleanTaskBoardColor(input.color),
        isDone: false,
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
) =>
  sequelize.transaction(async transaction => {
    const column = await getColumn(id, companyId, transaction);
    const values: ColumnInput = {};
    if (input.title !== undefined)
      values.title = cleanTaskBoardTitle(input.title, 120);
    if (input.color !== undefined)
      values.color = cleanTaskBoardColor(input.color);
    if (input.isDone === false && column.isDone)
      throw new AppError("ERR_TASK_BOARD_DONE_COLUMN_REQUIRED", 409);
    if (input.isDone === true && !column.isDone) {
      const oldDone = await TaskBoardColumn.findOne({
        where: { companyId, isDone: true },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (oldDone) {
        const affectedTasks = await TaskBoardTask.count({
          where: { companyId, columnId: { [Op.in]: [oldDone.id, column.id] } },
          transaction
        });
        if (affectedTasks > 0)
          throw new AppError("ERR_TASK_BOARD_DONE_COLUMN_NOT_EMPTY", 409);
        await oldDone.update({ isDone: false }, { transaction });
      }
      values.isDone = true;
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
      owned.some((id, i) => id !== requested[i])
    )
      throw new AppError("ERR_TASK_BOARD_INVALID_COLUMN_ORDER");
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
    if (column.isDone)
      throw new AppError("ERR_TASK_BOARD_CANNOT_DELETE_DONE_COLUMN", 409);
    if (
      (await TaskBoardTask.count({
        where: { companyId, columnId: column.id },
        transaction
      })) > 0
    )
      throw new AppError("ERR_TASK_BOARD_COLUMN_NOT_EMPTY", 409);
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
  actor: Actor,
  input: TaskInput
): Promise<TaskBoardTask> => {
  await ensureDefaultColumns(actor.companyId);
  return sequelize.transaction(async transaction => {
    const column = await TaskBoardColumn.findOne({
      where: { companyId: actor.companyId },
      order: [
        ["position", "ASC"],
        ["id", "ASC"]
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!column) throw new AppError("ERR_TASK_BOARD_COLUMN_NOT_FOUND", 404);
    const target =
      actor.profile === "admin"
        ? await normalizeTarget(actor.companyId, input, transaction)
        : {
            targetType: "USER" as const,
            assignedUserId: actor.userId,
            assignedQueueId: null
          };
    const maxPosition = await TaskBoardTask.max("position", {
      where: { companyId: actor.companyId, columnId: column.id },
      transaction
    });
    const task = await TaskBoardTask.create(
      {
        title: cleanTaskBoardTitle(input.title, 255),
        description: cleanTaskBoardDescription(input.description),
        ...target,
        dueAt: parseTaskBoardDate(input.dueAt as string) || null,
        companyId: actor.companyId,
        columnId: column.id,
        position: Number(maxPosition ?? -1) + 1,
        completedAt: column.isDone ? new Date() : null,
        completedById: column.isDone ? actor.userId : null,
        createdById: actor.userId,
        version: 0
      },
      { transaction }
    );
    await addEvent(task, actor.userId, "CREATED", transaction, {
      toColumnId: column.id,
      data: { targetType: target.targetType }
    });
    return task;
  });
};

export const updateTask = async (
  id: number | string,
  actor: Actor,
  input: TaskInput
): Promise<TaskBoardTask> =>
  sequelize.transaction(async transaction => {
    const task = await getTask(id, actor.companyId, transaction);
    await assertVisible(task, actor, transaction);
    assertTaskCanBeManaged(task, actor);
    assertVersion(task, input.version);
    const target =
      actor.profile === "admin"
        ? await normalizeTarget(actor.companyId, input, transaction)
        : {
            targetType: "USER" as const,
            assignedUserId: actor.userId,
            assignedQueueId: null
          };
    await task.update(
      {
        title: cleanTaskBoardTitle(input.title, 255),
        description: cleanTaskBoardDescription(input.description),
        ...target,
        dueAt: parseTaskBoardDate(input.dueAt as string) || null,
        version: task.version + 1
      },
      { transaction }
    );
    await addEvent(task, actor.userId, "EDITED", transaction, {
      data: { version: task.version }
    });
    return task;
  });

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
  actor,
  destinationColumnId,
  position,
  version
}: {
  id: number | string;
  actor: Actor;
  destinationColumnId: number | string;
  position: number;
  version?: unknown;
}): Promise<void> => {
  await sequelize.transaction(async transaction => {
    const task = await getTask(id, actor.companyId, transaction);
    await assertVisible(task, actor, transaction);
    assertVersion(task, version);
    const source = await getColumn(task.columnId, actor.companyId, transaction);
    const destination = await getColumn(
      destinationColumnId,
      actor.companyId,
      transaction
    );
    const sameColumn = source.id === destination.id;
    const sourceTasks = await TaskBoardTask.findAll({
      where: { companyId: actor.companyId, columnId: source.id },
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
        where: { companyId: actor.companyId, columnId: destination.id },
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
    const completed = !source.isDone && destination.isDone;
    const reopened = source.isDone && !destination.isDone;
    await task.update(
      {
        columnId: destination.id,
        completedAt: completed
          ? new Date()
          : reopened
            ? null
            : task.completedAt,
        completedById: completed
          ? actor.userId
          : reopened
            ? null
            : task.completedById,
        version: task.version + 1
      },
      { transaction }
    );
    if (!sameColumn) await updatePositions(sourceWithoutTask, transaction);
    await updatePositions(destinationTasks, transaction);
    await addEvent(
      task,
      actor.userId,
      completed ? "COMPLETED" : reopened ? "REOPENED" : "MOVED",
      transaction,
      {
        fromColumnId: source.id,
        toColumnId: destination.id,
        data: { position: targetPosition, version: task.version }
      }
    );
  });
};

export const deleteTask = async (
  id: number | string,
  actor: Actor
): Promise<void> => {
  await sequelize.transaction(async transaction => {
    const task = await getTask(id, actor.companyId, transaction);
    await assertVisible(task, actor, transaction);
    assertTaskCanBeManaged(task, actor);
    const columnId = task.columnId;
    await task.destroy({ transaction });
    const remaining = await TaskBoardTask.findAll({
      where: { companyId: actor.companyId, columnId },
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

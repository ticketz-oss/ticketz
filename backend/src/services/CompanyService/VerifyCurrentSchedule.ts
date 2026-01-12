import { QueryTypes } from "sequelize";
import sequelize from "../../database";
import { checkOpenHours, OpenHoursData } from "../../helpers/checkOpenHours";
import Queue from "../../models/Queue";
import Company from "../../models/Company";

export type ScheduleResult = {
  inActivity: boolean;
};

const VerifyCurrentSchedule = async (
  companyId: string | number,
  queueId?: string | number
): Promise<ScheduleResult> => {
  let schedule: OpenHoursData;
  if (queueId) {
    const queue = await Queue.findOne({ where: { id: queueId, companyId } });
    if (queue) {
      schedule = queue.schedules;
    }
  } else if (companyId) {
    const company = await Company.findOne({ where: { id: companyId } });
    if (company) {
      schedule = company.schedules;
    }
  }

  if (schedule.timezone) {
    return { inActivity: checkOpenHours(schedule) };
  }

  if (queueId === null || queueId === undefined) {
    const sql = `
        select
        s.id,
        s.currentWeekday,
        s.currentSchedule,
          (s.currentSchedule->>'startTimeA') "startTimeA",
          (s.currentSchedule->>'endTimeA') "endTimeA",
          (s.currentSchedule->>'startTimeB') "startTimeB",
          (s.currentSchedule->>'endTimeB') "endTimeB",
          ( (
            case 
            	when s.currentSchedule->>'startTimeA' = '' then now()::time >= '00:00'::time
    			ELSE now()::time >= (s.currentSchedule->>'startTimeA')::time	
            end
 			) and (
            case 
            	when s.currentSchedule->>'endTimeA' = ''then now()::time <= '00:00'::time
    			ELSE now()::time <= (s.currentSchedule->>'endTimeA')::time	
            end ) ) or ( (
            case 
            	when s.currentSchedule->>'startTimeB' = ''then now()::time >= '00:00'::time
    			ELSE now()::time >= (s.currentSchedule->>'startTimeB')::time	
            end
 			) and (
            case 
            	when s.currentSchedule->>'endTimeB' = ''then now()::time <= '00:00'::time
    			ELSE now()::time <= (s.currentSchedule->>'endTimeB')::time	
            end 
          )) "inActivity"
      from (
        SELECT
              c.id,
              to_char(current_date, 'day') currentWeekday,
              (array_to_json(array_agg(s))->>0)::jsonb currentSchedule
        FROM "Companies" c, jsonb_array_elements(c.schedules) s
        WHERE s->>'weekdayEn' like trim(to_char(current_date, 'day')) and c.id = :companyId
        GROUP BY 1, 2
      ) s      
    `;

    const result: ScheduleResult = await sequelize.query(sql, {
      replacements: { companyId },
      type: QueryTypes.SELECT,
      plain: true
    });

    return result;
  }
  const sql = `
      select
        s.id,
        s.currentWeekday,
        s.currentSchedule,
          (s.currentSchedule->>'startTimeA') "startTimeA",
          (s.currentSchedule->>'endTimeA') "endTimeA",
          (s.currentSchedule->>'startTimeB') "startTimeB",
          (s.currentSchedule->>'endTimeB') "endTimeB",
          ( (
            case 
            	when s.currentSchedule->>'startTimeA' = '' then now()::time >= '00:00'::time
    			ELSE now()::time >= (s.currentSchedule->>'startTimeA')::time	
            end
 			) and (
            case 
            	when s.currentSchedule->>'endTimeA' = ''then now()::time <= '00:00'::time
    			ELSE now()::time <= (s.currentSchedule->>'endTimeA')::time	
            end ) ) or ( (
            case 
            	when s.currentSchedule->>'startTimeB' = ''then now()::time >= '00:00'::time
    			ELSE now()::time >= (s.currentSchedule->>'startTimeB')::time	
            end
 			) and (
            case 
            	when s.currentSchedule->>'endTimeB' = ''then now()::time <= '00:00'::time
    			ELSE now()::time <= (s.currentSchedule->>'endTimeB')::time	
            end 
          )) "inActivity"
      from (
        SELECT
              q.id,
              to_char(current_date, 'day') currentWeekday,
              (array_to_json(array_agg(s))->>0)::jsonb currentSchedule
        FROM "Queues" q, jsonb_array_elements(q.schedules) s
        WHERE s->>'weekdayEn' like trim(to_char(current_date, 'day')) and q.id = :queueId
        and q."companyId" = :companyId
        GROUP BY 1, 2
      ) s     
    `;

  const result: ScheduleResult = await sequelize.query(sql, {
    replacements: { companyId, queueId },
    type: QueryTypes.SELECT,
    plain: true
  });

  return result;
};

export default VerifyCurrentSchedule;

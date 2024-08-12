import models from "../../models/index.js";
import { Op } from "sequelize";

export const getPeopleJob = async (peopleId, jobId, status = null) => {
  const condition = { people_id: peopleId, job_id: jobId };
  if (status) {
    condition.status = status;
  } else {
    condition.status = { [Op.ne]: "deleted" };
  }
  const result = await models.peopleJobs.findOne({
    where: condition,
  });
  return result ? result : null;
};

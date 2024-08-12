import models from "../../models/index.js";

export const addPeopleJob = async (data) => {
  const result = await models.peopleJobs.create(data);
  return result && result.id ? result.id : null;
};

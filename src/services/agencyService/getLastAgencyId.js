import model from "../../models/index.js";

export const getLastAgencyId = async (conditions = null) => {
  const result = await model.agency.findOne({
    where: conditions,
    order: [["id", "DESC"]],
  });
  return result;
};

import model from "../../models/index.js";

export const getLastBulkImportId = async (conditions = null) => {
  const result = await model.importData.findOne({
    where: conditions,
    order: [["id", "DESC"]],
  });
  return result;
};

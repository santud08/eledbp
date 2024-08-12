import model from "../../models/index.js";

const { emailTemplate } = model;

export const getTemplate = async (type, language) => {
  const result = await emailTemplate.findOne({
    where: { action: type, site_language: language, status: "active" },
    raw: true,
  });
  return result;
};

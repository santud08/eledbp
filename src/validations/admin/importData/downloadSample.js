import { celebrate, Joi } from "celebrate";

export const downloadSample = celebrate({
  query: Joi.object({
    type: Joi.string().required().allow("xls", "json"),
  }),
});

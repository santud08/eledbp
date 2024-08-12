import { celebrate, Joi } from "celebrate";

export const awardList = celebrate({
  query: Joi.object({
    date: Joi.date().iso().allow(null).allow("").optional(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});

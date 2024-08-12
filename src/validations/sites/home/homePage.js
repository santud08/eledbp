import { celebrate, Joi } from "celebrate";
export const homePage = celebrate({
  query: Joi.object({
    date: Joi.date().allow(null).allow("").optional(),
  }),
});

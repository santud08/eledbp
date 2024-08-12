import { celebrate, Joi } from "celebrate";

export const agencyDelete = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
  }),
});

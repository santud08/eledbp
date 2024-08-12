import { celebrate, Joi } from "celebrate";

export const agencyDetails = celebrate({
  query: Joi.object({
    id: Joi.number().required(),
  }),
});

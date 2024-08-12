import { celebrate, Joi } from "celebrate";

export const seriesList = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
});

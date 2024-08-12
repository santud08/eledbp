import { celebrate, Joi } from "celebrate";

export const tvDetails = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
});

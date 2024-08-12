import { celebrate, Joi } from "celebrate";

export const movieDetails = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
});

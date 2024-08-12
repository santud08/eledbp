import { celebrate, Joi } from "celebrate";

export const tvSeasonDetails = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
    season_id: Joi.number().required(),
  }),
});

import { celebrate, Joi } from "celebrate";

export const webtoonsSeasonDetails = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
    season_id: Joi.number().required(),
  }),
});

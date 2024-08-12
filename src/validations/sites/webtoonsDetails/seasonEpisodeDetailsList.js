import { celebrate, Joi } from "celebrate";

export const seasonEpisodeDetailsList = celebrate({
  query: Joi.object({
    season_id: Joi.number().required(),
  }),
  params: Joi.object({
    id: Joi.number().required(),
  }),
});

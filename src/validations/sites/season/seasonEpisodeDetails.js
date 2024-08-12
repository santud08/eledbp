import { celebrate, Joi } from "celebrate";
export const seasonEpisodeDetails = celebrate({
  query: Joi.object({
    season_id: Joi.number().required(),
  }),
});

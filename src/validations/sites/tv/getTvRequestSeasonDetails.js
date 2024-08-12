import { celebrate, Joi } from "celebrate";
export const getTvRequestSeasonDetails = celebrate({
  query: Joi.object({
    language: Joi.string().required(),
    season_id: Joi.number().optional().allow("", null),
    tmdb_id: Joi.number().optional().allow("", null),
    season_no: Joi.number().optional().allow("", null),
  }),
  params: Joi.object({
    id: Joi.number().required(),
  }),
});

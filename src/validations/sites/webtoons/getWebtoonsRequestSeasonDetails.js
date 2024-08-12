import { celebrate, Joi } from "celebrate";

export const getWebtoonsRequestSeasonDetails = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
  query: Joi.object({
    language: Joi.string().required(),
    season_id: Joi.number().optional().allow("", null),
  }),
});

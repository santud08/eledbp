import { celebrate, Joi } from "celebrate";

export const editGetWtRequestSeasonDetails = celebrate({
  query: Joi.object({
    title_id: Joi.number().required(),
    language: Joi.string().required(),
    season_id: Joi.number().optional().allow("", null),
    draft_request_id: Joi.number().optional().allow("", null),
    draft_season_id: Joi.number().optional().allow("", null),
  }),
});

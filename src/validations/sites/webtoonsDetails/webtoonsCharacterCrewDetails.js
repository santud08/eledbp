import { celebrate, Joi } from "celebrate";

export const webtoonsCharacterCrewDetails = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    season_id: Joi.number().required(),
    type: Joi.string().required().valid("character", "crew"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});

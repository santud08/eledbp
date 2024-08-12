import { celebrate, Joi } from "celebrate";
export const tvCastCrewDetails = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    season_id: Joi.number().required(),
    type: Joi.string().required().valid("cast", "crew"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});

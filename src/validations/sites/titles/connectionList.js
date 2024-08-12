import { celebrate, Joi } from "celebrate";

export const connectionList = celebrate({
  query: Joi.object({
    season_id: Joi.string().allow("").optional(),
  }),
});

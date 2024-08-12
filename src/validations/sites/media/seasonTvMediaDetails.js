import { celebrate, Joi } from "celebrate";
export const seasonTvMediaDetails = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    season_id: Joi.number().required(),
    type: Joi.string().required().valid("video", "image", "poster"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});

import { celebrate, Joi } from "celebrate";

export const onGoingWebtoons = celebrate({
  body: Joi.object({
    search_params: Joi.object({
      category_id: Joi.number().optional().empty(["", null]),
      sub_category_id: Joi.number().optional().empty(["", null]),
      tag_id: Joi.array().items(Joi.number()),
      genre: Joi.number().optional().empty(["", null]),
      certification: Joi.string().optional().empty(["", null]),
      country: Joi.array().items(Joi.number()),
      weekly_upload: Joi.string().optional().empty(["", null]),
      read: Joi.array().items(Joi.number()),
      release_date_from: Joi.date().iso().optional().empty(["", null]),
      release_date_to: Joi.date().iso().optional().empty(["", null]),
    }).optional(),
    date: Joi.date().iso().allow(null).allow("").optional(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});

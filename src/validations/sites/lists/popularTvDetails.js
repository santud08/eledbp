import { celebrate, Joi } from "celebrate";
export const popularTvDetails = celebrate({
  body: Joi.object({
    search_params: Joi.object({
      category_id: Joi.optional().empty(["", null]),
      sub_category_id: Joi.optional().empty(["", null]),
      tag_id: Joi.array().items(Joi.number()),
      genre: Joi.optional().empty(["", null]),
      certification: Joi.optional().empty(["", null]),
      country: Joi.array().items(Joi.number()),
      run_time_from: Joi.optional().empty(["", null]),
      run_time_to: Joi.optional().empty(["", null]),
      watch: Joi.array().items(Joi.number()),
      release_date_from: Joi.optional().empty(["", null]),
      release_date_to: Joi.optional().empty(["", null]),
    }).optional(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    date: Joi.date().allow(null).allow("").optional(),
  }),
});

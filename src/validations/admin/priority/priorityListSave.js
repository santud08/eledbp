import { celebrate, Joi } from "celebrate";

export const priorityListSave = celebrate({
  body: Joi.object({
    list_type: Joi.string().required().valid("movie", "tv", "webtoons", "people"),
    priority: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().required(),
          eleven_db_priority: Joi.number().required().valid(1, 2, 3),
          tmdb_priority: Joi.number().required().valid(1, 2, 3),
          kobis_priority: Joi.number().required().valid(1, 2, 3),
        }),
      )
      .required(),
  }),
});

import { celebrate, Joi } from "celebrate";

export const exportDbContentDownload = celebrate({
  query: Joi.object({
    category: Joi.string()
      .required()
      .valid("all", "movie", "tv", "webtoons", "people", "awards", "video"),
    date_type: Joi.string().when("category", {
      is: Joi.not("all"),
      then: Joi.required().valid("daily", "monthly", "yearly"),
      otherwise: Joi.valid("", null), // Allow empty or null when category is 'all'
    }),
    start_date: Joi.date().iso().optional().allow("", null),
    end_date: Joi.date().iso().optional().allow("", null),
  }),
});

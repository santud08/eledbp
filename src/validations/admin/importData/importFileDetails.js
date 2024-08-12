import { celebrate, Joi } from "celebrate";

export const importFileDetails = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    sort_by: Joi.string()
      .optional()
      .valid("", null, "id", "title_name", "program_code", "tmdb_id", "status"),
    sort_order: Joi.string().optional().valid("", null, "asc", "desc"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});

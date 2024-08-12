import { celebrate, Joi } from "celebrate";
export const searchSuggestion = celebrate({
  query: Joi.object({
    search_text: Joi.string().required(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});

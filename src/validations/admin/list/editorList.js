import { celebrate, Joi } from "celebrate";

export const editorList = celebrate({
  query: Joi.object({
    search_text: Joi.string().optional().allow("", null),
  }),
});

import { celebrate, Joi } from "celebrate";
export const saveUserTheme = celebrate({
  body: Joi.object({
    theme: Joi.string().required().valid("dark", "light"),
  }),
});

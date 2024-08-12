import { celebrate, Joi } from "celebrate";

export const tagCategoryList = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
});

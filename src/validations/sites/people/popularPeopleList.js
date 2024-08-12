import { celebrate, Joi } from "celebrate";
export const popularPeopleList = celebrate({
  body: Joi.object({
    department_type: Joi.array().items(Joi.number()).optional(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});

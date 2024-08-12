import { celebrate, Joi } from "celebrate";
export const communityFamousLine = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    type: Joi.string().required().valid("title", "people"),
  }),
});

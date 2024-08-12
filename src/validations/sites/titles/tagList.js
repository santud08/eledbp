import { celebrate, Joi } from "celebrate";

export const tagList = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
    main_catid: Joi.number().required(),
  }),
});

import { celebrate, Joi } from "celebrate";
export const mediaPreview = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    item_id: Joi.number().required(),
    list_type: Joi.string().required().valid("video", "image", "poster"),
    type: Joi.string().required().valid("title", "people"),
  }),
});

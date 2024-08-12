import { celebrate, Joi } from "celebrate";

export const agencyArtistList = celebrate({
  body: Joi.object({
    artist_name: Joi.string().optional().allow("", null),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
